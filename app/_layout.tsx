import "../src/lib/apiConfig";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAccessToken } from "../src/lib/auth";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      const inAuth = segments[0] === "(auth)";
      if (!token && !inAuth) router.replace("/(auth)/sign-in");
      if (token && inAuth) router.replace("/(app)/home");
    })();
  }, [segments.join("/")]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
