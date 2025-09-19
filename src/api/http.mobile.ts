const API_PRIMARY   = "https://api.sellpoint.pp.ua/api";
const API_FALLBACK  = "https://api.sellpoint.pp.ua";

export type HttpInit = RequestInit & { asJson?: boolean };

export async function httpJson<T>(path: string, init: HttpInit = {}): Promise<T> {
  const { asJson = true, headers, ...rest } = init;
  const h: Record<string,string> = { Accept: "application/json", ...(headers as any) };
  if (asJson && !(rest.body instanceof FormData)) h["Content-Type"] = "application/json";

  const tryOnce = async (base: string) => {
    const r = await fetch(`${base}/${path}`, { ...rest, headers: h });
    return r;
  };

  let res = await tryOnce(API_PRIMARY);
  if (res.status === 404) res = await tryOnce(API_FALLBACK);
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const raw = await res.text();
  try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
}
