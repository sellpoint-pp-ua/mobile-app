import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_BASE = "https://api.sellpoint.pp.ua";
const TOKEN_KEY = "authToken";

export interface OpenAPIConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  timeoutMs?: number;
}

export const OpenAPI: OpenAPIConfig = {
  baseUrl: API_BASE,
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  timeoutMs: 20000,
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
  method: HttpMethod;
  url: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  formData?: Record<string, unknown> | FormData;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export interface ApiErrorData {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(d: ApiErrorData) {
    super(d.message);
    this.name = "ApiError";
    this.status = d.status;
    this.details = d.details;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === null || v === undefined) continue;
    sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function toFormData(input: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      for (const it of v) {
        if (it === null || it === undefined) continue;
        fd.append(k, it as any);
      }
    } else {
      fd.append(k, v as any);
    }
  }
  return fd;
}

function withTimeout<T>(p: Promise<T>, ms: number, url: string): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new ApiError({ status: 0, message: `Timeout ${ms}ms: ${url}` })), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

export async function request(config: OpenAPIConfig, opts: RequestOptions): Promise<unknown> {
  const { method, url, query, formData, body, headers, skipAuth, signal } = opts;

  const fullUrl = `${config.baseUrl.replace(/\/+$/, "")}${url}${buildQuery(query)}`;

  const finalHeaders: Record<string, string> = {
    ...(headers || {}),
  };

  if (!skipAuth) {
    const token = await config.getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let fetchBody: BodyInit | undefined;
  if (formData) {
    fetchBody = formData instanceof FormData ? formData : toFormData(formData);
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    fetchBody = JSON.stringify(body);
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
  }

  let resp: Response;
  try {
    const fetchPromise = fetch(fullUrl, {
      method,
      headers: finalHeaders,
      body: fetchBody,
      signal,
    });
    resp = await withTimeout(fetchPromise, config.timeoutMs ?? 20000, url);
  } catch (err: unknown) {
    const msg = (err instanceof Error && err.message) ? err.message : String(err);
    if (Platform.OS === "web") {
      throw new ApiError({
        status: 0,
        message:
          "CORS блокирует запрос з браузера. Запустіть на пристрої/емуляторі (Expo Go) або увімкніть CORS на сервері.",
        details: msg,
      });
    }
    throw new ApiError({ status: 0, message: "Мережевий збій під час запиту.", details: msg });
  }

  if (resp.status === 502 || resp.status === 503 || resp.status === 504) {
    const text = await resp.text().catch(() => "");
    throw new ApiError({
      status: resp.status,
      message: `${resp.status} на сервері (Bad Gateway/Service Unavailable)`,
      details: text || "Сервер тимчасово недоступний або є проблема з upstream.",
    });
  }

  const ctype = resp.headers.get("content-type") || "";
  const isJson = ctype.includes("application/json");

  if (!resp.ok) {
    let details: unknown = undefined;
    let message = `HTTP ${resp.status}`;
    try {
      details = isJson ? await resp.json() : await resp.text();
      if (typeof details === "object" && details && "message" in (details as any)) {
        message = String((details as any).message);
      } else if (typeof details === "string" && details.trim()) {
        message = details;
      }
    } catch {}
    throw new ApiError({ status: resp.status, message, details });
  }

  if (resp.status === 204) return null;
  try {
    return isJson ? await resp.json() : await resp.text();
  } catch {
    return await resp.text();
  }
}

export interface LoginResponse {
  token?: string;
  [k: string]: unknown;
}

export async function apiLogin(data: {
  Login: string;
  Password: string;
  DeviceInfo?: string;
}): Promise<LoginResponse> {
  const res = await request(OpenAPI, {
    method: "POST",
    url: "/api/Auth/login",
    formData: {
      Login: data.Login,
      Password: data.Password,
      DeviceInfo: data.DeviceInfo ?? "SellPoint Mobile",
    },
    skipAuth: true,
  });
  return res as LoginResponse;
}

export async function apiRegister(data: {
  FullName: string;
  Email: string;
  Password: string;
}): Promise<unknown> {
  return await request(OpenAPI, {
    method: "POST",
    url: "/api/Auth/register",
    formData: data,
    skipAuth: true,
  });
}

export async function apiSendEmailCode(language: "uk" | "en" | "ru" = "uk") {
  return await request(OpenAPI, {
    method: "POST",
    url: "/api/Auth/send-email-verification-code",
    query: { language },
  });
}

export async function apiVerifyEmailCode(code: string) {
  return await request(OpenAPI, {
    method: "GET",
    url: "/api/Auth/verify-email-code",
    query: { code },
  });
}

export async function apiPingLoginCheck() {
  return await request(OpenAPI, {
    method: "GET",
    url: "/api/Auth/check-login",
  });
}
