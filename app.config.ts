import { ExpoConfig } from "@expo/config";

export default (): ExpoConfig => ({
  name: "SellPoint",
  slug: "sellpoint-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "sellpoint",
  plugins: ["expo-router"],
  experiments: { typedRoutes: true },
  newArchEnabled: true,
  ios: { supportsTablet: false },
  android: { package: "com.sellpoint.app" },
  web: { bundler: "metro" }
});
