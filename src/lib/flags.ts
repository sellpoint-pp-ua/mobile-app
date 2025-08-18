import Constants from "expo-constants";
const extra: any =
  (Constants.expoConfig?.extra as any) ??
  (Constants.manifest2?.extra as any) ?? {};
export const USE_MOCK: boolean = !!extra.USE_MOCK;
