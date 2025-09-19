import { getToken } from "@/src/auth/token";

export async function getProductByIdSmart(id: string) { /* возьми тело из fetchProductById */ }
export async function addToCartSmart(productId: string, pcs = 1) { /* возьми тело из addToCart */ }

export const API_ROOT = "https://api.sellpoint.pp.ua";
const API = `${API_ROOT}/api`;

const CLOUD_ROOT = "https://cloud.sellpoint.pp.ua";

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken().catch(() => null);

  const base: Record<string, string> = { Accept: "*/*" };
  if (token) base.Authorization = `Bearer ${token}`;

  const headers: HeadersInit = {
    ...base,
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      if (j?.errors) {
        const flat = Object.values(j.errors as Record<string, unknown>)
          .flat()
          .map(String)
          .join(" ");
        throw new Error(flat || `HTTP ${res.status}`);
      }
      if (j?.message) throw new Error(String(j.message));
    } catch {}
    throw new Error(text || `HTTP ${res.status}`);
  }

  const raw = await res.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  hasDiscount?: boolean;
  discountPercentage?: number | null;
  finalPrice: number;
}
type ProductDto = {
  id?: string | null;
  name?: string | null;
  price?: number;
  discountPrice?: number | null;
  hasDiscount?: boolean;
};

type ProductFilterResponseDto = {
  products?: ProductDto[] | null;
  count?: number;
  pages?: number;
};

function mapProductDto(p: ProductDto): Product | null {
  const id = (p.id ?? "").toString();
  const name = (p.name ?? "").toString();

  const price = typeof p.price === "number" ? p.price : 0;
  const rawDisc = typeof p.discountPrice === "number" ? p.discountPrice : null;

  const inferred = typeof rawDisc === "number" && rawDisc > 0 && rawDisc < price;
  const hasDiscount = inferred || !!p.hasDiscount;

  const finalPrice = inferred ? (rawDisc as number) : price;

  const discountPercentage =
    inferred
      ? Math.round((1 - (rawDisc as number) / (price || 1)) * 100)
      : typeof (p as any).discountPercentage === "number"
      ? (p as any).discountPercentage
      : null;

  if (!id || !name) return null;
  return {
    id,
    name,
    price,
    discountPrice: rawDisc ?? undefined,
    hasDiscount,
    discountPercentage,
    finalPrice,
  };
}

export async function searchProductsByName(
  name: string,
  _lang: "uk" | "ru" | "en" = "uk"
): Promise<Product[]> {
  const q = name.trim();
  if (!q) return [];

  const url = `${API}/Product/get-by-name/${encodeURIComponent(q)}`;
  const body = {
    page: 1,
    pageSize: 24,
    sort: 0,
  };

  const json = await http<ProductFilterResponseDto>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const list = Array.isArray(json?.products) ? json!.products! : [];
  const mapped: Product[] = [];
  for (const p of list) {
    const m = mapProductDto(p);
    if (m) mapped.push(m);
  }
  return mapped;
}

function resolveMediaUrl(input?: string): string {
  if (!input) return "";
  let u = String(input).trim();
  if (!u) return "";

  try {
    u = decodeURIComponent(u);
  } catch {}

  try {
    if (u.includes("/_next/image")) {
      const obj = new URL(u, API_ROOT);
      const inner = obj.searchParams.get("url");
      if (inner) u = decodeURIComponent(inner);
    }
  } catch {}

  if (u.startsWith("//")) u = "https:" + u;
  if (/^https?:\/\//i.test(u)) return u;

  if (u.startsWith("/media")) return CLOUD_ROOT + u;
  if (/^(media|uploads)\//i.test(u)) return `${CLOUD_ROOT}/${u}`;

  return `${CLOUD_ROOT}/${u.replace(/^\/+/, "")}`;
}

function extractUrlsFromItem(item: any): string[] {
  const out: string[] = [];
  if (item == null) return out;

  if (typeof item === "string") {
    out.push(item);
    return out;
  }

  const pushStr = (v: any) => {
    if (typeof v === "string" && v.trim().length > 0) out.push(v);
  };

  const directKeys = ["url", "fileUrl", "mediaUrl", "path", "source", "image", "src", "href", "thumbnail"];
  for (const k of directKeys) pushStr((item as any)[k]);

  const f = (item as any).files;
  if (f && typeof f === "object") {
    pushStr(f.sourceUrl);
    pushStr(f.compressedUrl);
    const fileName: string =
      (typeof f.compressedFileName === "string" && f.compressedFileName.trim().length > 0
        ? f.compressedFileName
        : typeof f.sourceFileName === "string"
        ? f.sourceFileName
        : "") || "";
    if (fileName) out.push(`/media/products-images/${fileName}`);
  }

  const candidates: any[] = [];
  if (Array.isArray((item as any).urls)) candidates.push(...(item as any).urls);
  if (Array.isArray((item as any).images)) candidates.push(...(item as any).images);
  if (Array.isArray((item as any).files)) candidates.push(...(item as any).files);

  for (const c of candidates) {
    if (typeof c === "string") pushStr(c);
    else if (c && typeof c === "object") {
      const nested = extractUrlsFromItem(c);
      for (const n of nested) pushStr(n);
    }
  }

  return out;
}

export async function getProductMediaUrls(productId: string): Promise<{ url: string }[]> {
  if (!productId) return [];
  const url = `${API}/ProductMedia/by-product-id/${encodeURIComponent(productId)}`;

  const raw: unknown = await http<unknown>(url, { method: "GET" });

  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw as any[];
  } else if (raw && typeof raw === "object") {
    const o: any = raw;
    if (Array.isArray(o.items)) arr = o.items as any[];
    else if (Array.isArray(o.data)) arr = o.data as any[];
    else arr = [o];
  } else if (raw != null) {
    arr = [raw];
  }

  const gathered: string[] = [];
  for (const item of arr) {
    const urls = extractUrlsFromItem(item);
    for (const u of urls) {
      const resolved = resolveMediaUrl(u);
      if (resolved && gathered.indexOf(resolved) === -1) {
        gathered.push(resolved);
      }
    }
  }

  if (__DEV__ && gathered.length === 0) {
    let preview = "";
    try {
      preview = JSON.stringify(raw)?.slice(0, 220) ?? "";
    } catch {
      preview = String(raw).slice(0, 220);
    }
    console.warn(`[media] empty for productId=${productId}; raw preview:`, preview);
  }

  return gathered.map((u) => ({ url: u }));
}
