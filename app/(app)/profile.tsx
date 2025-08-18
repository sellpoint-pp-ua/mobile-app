import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { clearTokens, getAccessToken } from "../../src/lib/auth";
import { useEffect, useState } from "react";
import { t } from "../../src/i18n/ua";

export default function Profile() {
  const router = useRouter();
  const [tokenShort, setTokenShort] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (typeof token === "string" && token.length > 12) {
        setTokenShort(`${token.slice(0, 6)}…${token.slice(-4)}`);
      } else if (token) {
        setTokenShort(token);
      } else {
        setTokenShort(null);
      }
    })();
  }, []);

  async function handleLogout() {
    try {
      await clearTokens();
    } finally {
      router.replace("/(auth)/sign-in");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0C10", padding: 16 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: "#66FCF1",
          letterSpacing: 0.5,
        }}
      >
        {t("nav_profile")}
      </Text>

      <View
        style={{
          marginTop: 16,
          backgroundColor: "#14181F",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#1F2833",
          padding: 16,
        }}
      >
        <Text style={{ color: "#C5C6C7" }}>Статус: <Text style={{ color: "#66FCF1", fontWeight: "700" }}>авторизовано</Text></Text>
        <Text style={{ color: "#C5C6C7", marginTop: 8 }}>
          Токен: <Text style={{ color: "white", fontFamily: "monospace" }}>{tokenShort ?? "—"}</Text>
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 24 }}>
        <Pressable
          onPress={() => router.replace("/(app)/home")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#1F2833" : "#14181F",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#1F2833",
          })}
        >
          <Text style={{ color: "#C5C6C7", fontSize: 16, fontWeight: "700" }}>
            На головну
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#b91c1c" : "#ef4444",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          })}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
            Вийти
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
