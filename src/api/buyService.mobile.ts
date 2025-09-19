import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";

export type DeliveryTo = { address?: string; settlement?: string; region?: string };
export type BuyOptions = {
  deliveryPayment?: number;
  deliveryTo?: DeliveryTo;
};

const baseRaw = () => (OpenAPI.baseUrl || "").replace(/\/+$/, "");
const baseNoApi = () => baseRaw().replace(/\/api$/i, "");
const withApi = (p: string) => {
  const b = baseRaw();
  const hasApi = /\/api$/i.test(b);
  const path = p.replace(/^\/+/, "").replace(/^api\/?/i, "");
  return hasApi ? `${b}/${path}` : `${b}/api/${path}`;
};
const withoutApi = (p: string) =>
  `${baseNoApi()}/${p.replace(/^\/+/, "").replace(/^api\/?/i, "")}`;
const bothPaths = (p: string) => {
  const a = withApi(p), b = withoutApi(p);
  return a === b ? [a] : [a, b];
};
const ok = (r: Response) => r.ok || r.status === 204;

export async function buyProduct(productId: string, opts: BuyOptions = {}): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error("Потрібно увійти");

  const urls = bothPaths("Buy/BuyProduct");

  const body = {
    productId,
    ...(opts.deliveryPayment != null ? { deliveryPayment: opts.deliveryPayment } : {}),
    ...(opts.deliveryTo ? { deliveryTo: opts.deliveryTo } : {}),
  };
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      if (ok(r)) return;
    } catch {}
  }

  for (const url of urls) {
    const fd = new FormData();
    fd.append("ProductId", productId);
    if (opts.deliveryPayment != null) fd.append("DeliveryPayment", String(opts.deliveryPayment));
    if (opts.deliveryTo) fd.append("DeliveryTo", JSON.stringify(opts.deliveryTo));
    try {
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd as any });
      if (ok(r)) return;
    } catch {}
  }

  throw new Error("Не вдалося оформити замовлення");
}

export async function buyMany(productIds: string[], opts: BuyOptions = {}): Promise<void> {
  for (const pid of productIds) {
    await buyProduct(pid, opts);
  }
}
