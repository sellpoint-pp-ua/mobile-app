import { useState } from "react";
import { Platform } from "react-native";
import { saveTokens, clearTokens } from "../lib/auth";

type SignInDto = { login: string; password: string };

type Phase = "network" | "http" | "no-token" | "parse";
class AttemptError extends Error {
  url: string;
  method: string;
  phase: Phase;
  status?: number;
  statusText?: string;
  bodySnippet?: string;
  constructor(opts: {
    url: string;
    method: string;
    phase: Phase;
    message: string;
    status?: number;
    statusText?: string;
    bodySnippet?: string;
  }) {
    super(opts.message);
    this.url = opts.url;
    this.method = opts.method;
    this.phase = opts.phase;
    this.status = opts.status;
    this.statusText = opts.statusText;
    this.bodySnippet = opts.bodySnippet;
  }
}

function snippet(x: unknown, max = 300): string {
  try {
    if (x == null) return "";
    if (typeof x === "string") return x.slice(0, max);
    return JSON.stringify(x).slice(0, max);
  } catch {
    return "";
  }
}

async function readBody(res: Response): Promise<any> {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  try {
    if (ct.includes("application/json")) return await res.json();
    const txt = await res.text();
    return txt || null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function pickToken(x: any): string | null {
  if (!x) return null;
  if (typeof x === "string") return x.trim() || null;
  return (
    (typeof x.accessToken === "string" && x.accessToken) ||
    (typeof x.token === "string" && x.token) ||
    (typeof x?.data?.accessToken === "string" && x.data.accessToken) ||
    (typeof x?.data?.token === "string" && x.data.token) ||
    null
  );
}

function buildTargets() {
  const DIRECT_BASE = "https://api.sellpoint.pp.ua";
  const PATHS = ["/api/Auth/login", "/api/auth/login", "/api/Auth/Login"];
  if (Platform.OS !== "web") {
    return PATHS.map((p) => ({ url: `${DIRECT_BASE}${p}`, headers: {} as Record<string, string> }));
  }
  const PROXIES = [
    { prefix: "https://cors.isomorphic-git.org/", extra: {} as Record<string, string> },
    { prefix: "https://proxy.cors.sh/", extra: { "x-cors-api-key": "test" } }, // fallback
  ];
  const targets: { url: string; headers: Record<string, string> }[] = [];
  for (const p of PATHS) {
    for (const pr of PROXIES) {
      targets.push({ url: `${pr.prefix}${DIRECT_BASE}${p}`, headers: pr.extra });
    }
  }
  return targets;
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn({ login, password }: SignInDto): Promise<boolean> {
    if (loading) return false;
    setLoading(true);
    setError(null);

    const Login = (login || "").trim();
    const Password = password || "";

    const makeForm = () => {
      const fd = new FormData();
      fd.append("Login", String(Login));
      fd.append("Password", String(Password));
      fd.append("DeviceInfo", "mobile-expo");
      return fd;
    };

    const attempts: AttemptError[] = [];
    const targets = buildTargets();

    try {
      for (const t of targets) {
        try {
          const res = await fetchWithTimeout(
            t.url,
            {
              method: "POST",
              headers: { Accept: "application/json, text/plain, */*", ...t.headers },
              body: makeForm(),
            },
            12000
          );

          const body = await readBody(res);

          if (res.status === 401) {
            throw new AttemptError({
              url: t.url,
              method: "POST",
              phase: "http",
              status: res.status,
              statusText: res.statusText,
              bodySnippet: snippet(body),
              message: "Невірний логін або пароль",
            });
          }

          if (!res.ok) {
            attempts.push(
              new AttemptError({
                url: t.url,
                method: "POST",
                phase: "http",
                status: res.status,
                statusText: res.statusText,
                bodySnippet: snippet(body),
                message: `HTTP ${res.status} ${res.statusText}`,
              })
            );
            continue;
          }

          const token = pickToken(body);
          if (!token) {
            attempts.push(
              new AttemptError({
                url: t.url,
                method: "POST",
                phase: "no-token",
                status: res.status,
                statusText: res.statusText,
                bodySnippet: snippet(body),
                message: "Сервер відповів 2xx, але не повернув токен",
              })
            );
            continue;
          }

          await saveTokens(token);
          return true;
        } catch (e: any) {
          if (e instanceof AttemptError && e.status === 401) {
            throw e;
          }
          attempts.push(
            e instanceof AttemptError
              ? e
              : new AttemptError({
                  url: t.url,
                  method: "POST",
                  phase: "network",
                  message: e?.message || "Network error",
                })
          );
          continue;
        }
      }

      const lines: string[] = [];
      for (const a of attempts) {
        const base = `${a.method} ${a.url}`;
        if (a.phase === "network") {
          lines.push(`• ${base} → Мережева помилка: ${a.message}`);
        } else if (a.phase === "http") {
          lines.push(
            `• ${base} → ${a.message}${a.status ? ` (${a.status})` : ""}${a.bodySnippet ? ` :: ${a.bodySnippet}` : ""}`
          );
        } else if (a.phase === "no-token") {
          lines.push(`• ${base} → ${a.message}${a.bodySnippet ? ` :: ${a.bodySnippet}` : ""}`);
        } else {
          lines.push(`• ${base} → ${a.message}`);
        }
      }

      const hintWeb =
        Platform.OS === "web"
          ? "\nПорада (web): це схоже на CORS. Спробуй інший проксі або включи нативну збірку (Android/iOS), де CORS немає."
          : "";
      const hintNative =
        Platform.OS !== "web"
          ? "\nПорада (native): перевір час/дату на пристрої, онови системні сертифікати/Chrome WebView, вимкни VPN/фільтри."
          : "";

      throw new Error(`Помилка входу:\n${lines.join("\n")}${hintWeb || hintNative}`);
    } catch (finalErr: any) {
      await clearTokens();
      setError(finalErr?.message || "Помилка входу");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
