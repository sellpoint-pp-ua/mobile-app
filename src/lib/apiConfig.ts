import { Platform } from "react-native";
import Constants from "expo-constants";
import { OpenAPI } from "../services/api/core/OpenAPI";
import { getAccessToken } from "./auth";

const RAW_API =
  (Constants.expoConfig?.extra as any)?.API_URL ??
  (Constants.manifest2?.extra as any)?.API_URL ??
  "https://api.sellpoint.pp.ua";

const norm = (u: string) => (u.endsWith("/") ? u.slice(0, -1) : u);

const WEB_PROXY = "https://cors.isomorphic-git.org/";

const API_URL =
  Platform.OS === "web" ? `${WEB_PROXY}${norm(RAW_API)}` : norm(RAW_API);

OpenAPI.BASE = API_URL;
OpenAPI.TOKEN = async () => (await getAccessToken()) ?? "";
OpenAPI.WITH_CREDENTIALS = false;

if (__DEV__) {
  console.log("[API BASE]", OpenAPI.BASE);
}
