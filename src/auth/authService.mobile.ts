import { getToken, setToken, deleteToken } from "@/src/auth/token";

const API = "https://api.sellpoint.pp.ua/api";

export type LoginRequest = { login: string; password: string };

export type RegisterRequest = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  password: string;
};

type AuthResponse = { token?: string } | string;

type VerifyResult = { success: true; alreadyVerified?: boolean };

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const hasFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!hasFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}/${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      if (j?.errors && typeof j.errors === "object") {
        const flat = Object.values(j.errors).flat().map(String).join(" ");
        throw new Error(flat || `HTTP ${res.status}`);
      }
      if (j?.message) throw new Error(String(j.message));
    } catch {}
    throw new Error(text || `HTTP ${res.status}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function extractToken(resp: AuthResponse): string {
  if (typeof resp === "string") return resp;
  const t = (resp as any)?.token;
  if (typeof t === "string" && t.length > 0) return t;
  throw new Error("Неочікувана відповідь: токен відсутній.");
}

export async function apiRegister(body: RegisterRequest): Promise<string> {
  // Нормализация имени
  let first = (body.firstName ?? "").trim();
  let last = (body.lastName ?? "").trim();

  if ((!first || !last) && body.fullName) {
    const parts = body.fullName.trim().split(/\s+/);
    first = first || (parts[0] ?? "");
    last = last || (parts.slice(1).join(" ") || "");
  }

  if (!first || !last) {
    throw new Error("Вкажіть ім'я та прізвище окремо.");
  }

  const form = new FormData();
  form.append("FirstName", first);
  form.append("LastName", last);
  form.append("Email", body.email);
  form.append("Password", body.password);

  const r = await http<AuthResponse>("Auth/register", { method: "POST", body: form });
  const token = extractToken(r);
  await setToken(token, "auth_token");
  return token;
}

export async function apiLogin(body: LoginRequest): Promise<string> {
  const form = new FormData();
  form.append("Login", body.login);
  form.append("Password", body.password);

  const r = await http<AuthResponse>("Auth/login", { method: "POST", body: form });
  const token = extractToken(r);
  await setToken(token, "auth_token");
  return token;
}

export async function apiLogout() {
  try {
    await http<void>("Auth/logout", { method: "POST" });
  } finally {
    await deleteToken();
  }
}

export type MeResponse = {
  id?: number | string;
  email?: string;
  emailConfirmed?: boolean;
  [k: string]: any;
};

export async function apiGetMe(): Promise<MeResponse | null> {
  try {
    return await http<MeResponse>("User/GetUserByMyId", { method: "GET" });
  } catch {
    return null;
  }
}

export async function apiCheckLogin(): Promise<boolean> {
  try {
    await http<void>("Auth/check-login", { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

export async function apiCheckAdmin(): Promise<boolean> {
  try {
    const r = await http<any>("Auth/check-admin", { method: "GET" });
    return !!(r && typeof r === "object" && (r.isAdmin === true || r.success === true));
  } catch {
    return false;
  }
}

export async function apiSendVerificationCode(language: "uk" | "ru" | "en" = "uk") {
  await http<void>(`Auth/send-email-verification-code?language=${encodeURIComponent(language)}`, {
    method: "POST",
  });
}

export async function apiVerifyEmailCode(code: string): Promise<{ success: true; alreadyVerified?: boolean }> {
  const normalized = code.trim();
  const token = await getToken();

  const headersGET: Record<string, string> = { Accept: "*/*" };
  if (token) headersGET.Authorization = `Bearer ${token}`;

  const headersPOST: Record<string, string> = {};
  if (token) headersPOST.Authorization = `Bearer ${token}`;

  let res = await fetch(
    `${API}/Auth/verify-email-code?code=${encodeURIComponent(normalized)}`,
    { method: "GET", headers: headersGET, cache: "no-store" }
  );

  if (res.status === 405) {
    const form = new FormData();
    form.append("code", normalized);
    res = await fetch(`${API}/Auth/verify-email-code`, {
      method: "POST",
      headers: headersPOST,
      body: form,
      cache: "no-store",
    });
  }

  if (res.status === 400) {
    const me = await apiGetMe();
    if (me?.emailConfirmed === true) {
      return { success: true, alreadyVerified: true };
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const j = JSON.parse(text);
      throw new Error(j?.message || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  return { success: true };
}
