import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEYS = ["auth_token", "accessToken", "token", "jwt"] as const;

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window?.localStorage) {
        for (const k of KEYS) {
          const v = window.localStorage.getItem(k);
          if (v) return v;
        }
      }
    } catch {}
    return null;
  }

  for (const k of KEYS) {
    try {
      const v = await SecureStore.getItemAsync(k);
      if (v) return v;
    } catch {}
  }
  return null;
}

export async function setToken(
  value: string,
  key: (typeof KEYS)[number] = "auth_token"
) {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

export async function deleteToken(keys: readonly string[] = KEYS) {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        keys.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch {}
    return;
  }
  for (const k of keys) {
    try {
      await SecureStore.deleteItemAsync(k);
    } catch {}
  }
}
