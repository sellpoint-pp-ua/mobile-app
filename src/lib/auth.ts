import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string) {
  if (isWeb) {
    try { localStorage.setItem(key, value); } catch {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}
async function getItem(key: string) {
  if (isWeb) {
    try { return localStorage.getItem(key) ?? null; } catch { return null; }
  } else {
    return SecureStore.getItemAsync(key);
  }
}
async function delItem(key: string) {
  if (isWeb) {
    try { localStorage.removeItem(key); } catch {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveTokens(access: string, refresh?: string) {
  await setItem(ACCESS, access);
  if (refresh) await setItem(REFRESH, refresh);
}

export async function getAccessToken() { return getItem(ACCESS); }
export async function getRefreshToken() { return getItem(REFRESH); }

export async function clearTokens() {
  await delItem(ACCESS);
  await delItem(REFRESH);
}
