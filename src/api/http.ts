// src/http.ts
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${OpenAPI.baseUrl}${path}`, { ...init, headers });
}
