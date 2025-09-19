import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getToken, setToken as saveToken } from "./token";
import { apiCheckLogin, apiGetMe } from "./authService.mobile";

type User = any;

type AuthCtx = {
  ready: boolean;
  me: User | null;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
  setTokenAndReload: (token: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<User | null>(null);

  const reload = useCallback(async () => {
    try {
      const t = await getToken();
      if (!t) {
        setMe(null);
        setReady(true);
        return;
      }
      try {
        await apiCheckLogin();
      } catch {
        setMe(null);
        setReady(true);
        return;
      }
      const profile = await apiGetMe();
      setMe(profile ?? null);
    } catch {
      setMe(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const signOut = useCallback(async () => {
    await saveToken("");
    setMe(null);
  }, []);

  const setTokenAndReload = useCallback(
    async (token: string) => {
      await saveToken(token);
      await reload();
    },
    [reload]
  );

  return (
    <Ctx.Provider value={{ ready, me, reload, signOut, setTokenAndReload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider/>");
  return v;
}
