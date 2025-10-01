import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";
import { DeviceEventEmitter } from "react-native";

export const CART_EVENTS = { Changed: "cart:changed" } as const;
export const CART_SERVICE_VERSION = "cart-v5-LOOKUP";

type CandidateCall = { url: string; init: RequestInit; describe: string };
let cachedWorking: CandidateCall | null = null;

const ok = (r: Response) => r.ok || r.status === 204;

const baseRaw = () => (OpenAPI.baseUrl || "").replace(/\/+$/, "");
const baseNoApi = () => baseRaw().replace(/\/api$/i, "");
const withApi = (p: string) => {
  const b = baseRaw();
  const hasApi = /\/api$/i.test(b);
  const path = p.replace(/^\/+/, "").replace(/^api\/?/i, "");
  return hasApi ? `${b}/${path}` : `${b}/api/${path}`;
};
const withoutApi = (p: string) => `${baseNoApi()}/${p.replace(/^\/+/, "").replace(/^api\/?/i, "")}`;
const bothPaths = (p: string) => {
  const a = withApi(p), b = withoutApi(p);
  return a === b ? [a] : [a, b];
};

const HAuth = (t: string) => ({ Authorization: `Bearer ${t}` });
const HJson = (t: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${t}` });

function emitChanged() { try { DeviceEventEmitter.emit(CART_EVENTS.Changed); } catch {} }

export async function addToCart(productId: string, pcs = 1): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error("Потрібно увійти");

  console.log("[cart:add] service =", CART_SERVICE_VERSION);

  if (cachedWorking) {
    const r = await fetch(cachedWorking.url, patchAuthAndJson(cachedWorking.init, token, productId, pcs));
    if (ok(r)) { emitChanged(); return; }
    cachedWorking = null;
  }

  const fd1 = new FormData();
  fd1.append("ProductId", productId);
  fd1.append("Pcs", String(pcs));

  const fd2 = new FormData();
  fd2.append("productId", productId);
  fd2.append("pcs", String(pcs));

  const addCandidates: CandidateCall[] = [];
  for (const u of bothPaths("Cart/AddToCart")) {
    addCandidates.push({ url: u, init: { method: "POST", headers: HAuth(token), body: fd1 as any }, describe: `POST multipart ${u} (ProductId,Pcs)` });
    addCandidates.push({ url: u, init: { method: "POST", headers: HAuth(token), body: fd2 as any }, describe: `POST multipart ${u} (productId,pcs)` });
  }

  const changeByProductId: CandidateCall[] = [];
  for (const u of bothPaths("Cart/ChangeCartPcs")) {
    const q = new URLSearchParams({ id: productId, pcs: String(pcs) }).toString();
    changeByProductId.push({ url: `${u}?${q}`, init: { method: "PUT", headers: HAuth(token) }, describe: `PUT ${u}?${q} (id=productId)` });
  }

  const runAll = async (cands: CandidateCall[]) => {
    let last: any = null;
    for (const c of cands) {
      try {
        console.log("[cart:add] try:", c.describe);
        const r = await fetch(c.url, c.init);
        if (r.status === 401 || r.status === 403) throw new Error("Потрібно увійти");
        if (ok(r)) { cachedWorking = c; emitChanged(); return true; }
        last = new Error(`${c.describe} → HTTP ${r.status}`);
      } catch (e) { last = e; }
    }
    if (last) throw last;
    return false;
  };

  try {
    const ok1 = await runAll(addCandidates);
    if (ok1) return;
  } catch (e: any) {
    if (!String(e?.message || "").includes("HTTP 400") && !String(e?.message || "").includes("HTTP 409")) {
      throw e;
    }
  }

  try {
    const ok2 = await runAll(changeByProductId);
    if (ok2) return;
  } catch {}

  const cartItemId = await findCartItemIdByProductId(productId, token);
  if (!cartItemId) throw new Error("Не вдалося додати у кошик (позиція не знайдена)");

  const inc = String(pcs);
  const changeByCartItemId: CandidateCall[] = bothPaths("Cart/ChangeCartPcs").map(u => ({
    url: `${u}?${new URLSearchParams({ id: cartItemId, pcs: inc }).toString()}`,
    init: { method: "PUT", headers: HAuth(token) },
    describe: `PUT ${u}?id=${cartItemId}&pcs=${inc} (id=cartItemId)`,
  }));

  const ok3 = await runAll(changeByCartItemId);
  if (ok3) return;

  throw new Error("Не вдалося додати у кошик");
}

function patchAuthAndJson(init: RequestInit, token: string, productId: string, pcs: number) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  let body = init.body;
  if (headers.get("Content-Type")?.includes("application/json") && typeof body === "string") {
    try {
      const j = JSON.parse(body);
      body = JSON.stringify({ id: j.id ?? productId, productId: j.productId ?? productId, pcs: j.pcs ?? pcs });
    } catch {}
  }
  return { ...init, headers, body };
}

async function findCartItemIdByProductId(productId: string, token: string): Promise<string | null> {
  for (const u of bothPaths("Cart/GetByMyId")) {
    try {
      console.log("[cart:add] lookup cart:", u);
      const r = await fetch(u, { headers: HAuth(token) });
      if (!ok(r)) continue;

      let data: any = null;
      try { data = await r.json(); } catch {}

      const list: any[] =
        Array.isArray(data) ? data :
        Array.isArray(data?.data) ? data.data :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.list) ? data.list :
        [];

      for (const it of list) {
        if (it?.id && (it?.productId === productId)) return String(it.id);
        if (it?.id && it?.product?.id === productId) return String(it.id);
        if (it?.cartItemId && it?.productId === productId) return String(it.cartItemId);
      }
    } catch {}
  }
  return null;
}
