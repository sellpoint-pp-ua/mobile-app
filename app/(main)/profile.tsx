import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import TabBar from "@/src/ui/TabBar";
import { useAuth } from "@/src/auth/AuthProvider";

const BG = "#ffffff";
const CARD = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#3d36feff";
const GREEN = "#10b981";

export default function ProfileScreen() {
  const r = useRouter();
  const { ready, me, signOut, reload } = useAuth() as any;

  useFocusEffect(
    React.useCallback(() => {
      reload?.();
    }, [reload])
  );

  const handleLogout = async () => {
    try {
      if (typeof signOut === "function") await signOut();
    } catch {}
    r.replace("/home" as any);
  };

  if (ready && !me) {
    return (
      <View style={S.screen}>
        <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
          <View style={S.authCard}>
            <View style={S.authIcon}>
              <FontAwesome name="user-o" size={26} color="#fff" />
            </View>
            <Text style={S.authTitle}>Увійдіть або зареєструйтесь</Text>
            <Text style={S.authSub}>Щоб керувати замовленнями, обраним та знижками</Text>

            <Pressable
              onPress={() => r.push("/sign-in" as any)}
              style={({ pressed }) => [S.authPrimaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={S.authPrimaryText}>Увійти</Text>
            </Pressable>

            <Pressable
              onPress={() => r.push("/sign-up" as any)}
              style={({ pressed }) => [S.authSecondaryBtn, pressed && { opacity: 0.95 }]}
            >
              <Text style={S.authSecondaryText}>Зареєструватися</Text>
            </Pressable>
          </View>
        </ScrollView>

        <TabBar active="profile" />
      </View>
    );
  }

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={S.headerCard}>
          <View style={S.avatar}>
            <Text style={S.avatarText}>
              {initials(me?.fullName || me?.username || "")}
            </Text>
            {me?.emailConfirmed ? (
              <View style={S.verifiedBadge}>
                <FontAwesome name="check" size={10} color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.name}>{me?.fullName || "Stepan Bandera"}</Text>
            {!!me?.username && <Text style={S.username}>@{me.username}</Text>}
            {!!me?.email && <Text style={S.username}>{me.email}</Text>}
          </View>
        </View>

        {me && me.emailConfirmed === false ? (
          <Pressable
            onPress={() => r.push("/verify-email" as any)}
            style={({ pressed }) => [S.banner, pressed && { opacity: 0.95 }]}
          >
            <FontAwesome name="envelope" size={14} color={ACCENT} />
            <Text style={S.bannerText}>Підтвердьте e-mail, щоб оформляти замовлення</Text>
            <FontAwesome
              name="angle-right"
              size={16}
              color={ACCENT}
              style={{ marginLeft: "auto" }}
            />
          </Pressable>
        ) : null}

        <View style={S.list}>
          <Row icon="shopping-bag" label="Мої замовлення" onPress={() => Alert.alert("Мої замовлення", "Розділ у розробці")} />
          <Row icon="truck" label="Відстеження замовлення" onPress={() => Alert.alert("Відстеження", "Розділ у розробці")} />
          <Row icon="heart-o" label="Обране" onPress={() => r.push("/favorites" as any)} />
          <Row icon="comment-o" label="Відгуки" onPress={() => Alert.alert("Відгуки", "Розділ у розробці")} />
          <Row icon="credit-card" label="Мій гаманець" onPress={() => Alert.alert("Гаманець", "Розділ у розробці")} />
          <Row icon="gift" label="Знижки та бонуси" onPress={() => Alert.alert("Знижки та бонуси", "Розділ у розробці")} />
          <Row icon="shopping-basket" label="Створити магазин на SellPoint" onPress={() => r.push("/entities/create" as any)} />
          <Row icon="cog" label="Налаштування" onPress={() => Alert.alert("Налаштування", "Розділ у розробці")} />
          <Row icon="headphones" label="Sell Point-підтримка" onPress={() => Alert.alert("Підтримка", "support@sellpoint.pp.ua")} />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert("Вийти з акаунта?", "", [
              { text: "Скасувати", style: "cancel" },
              { text: "Вийти", style: "destructive", onPress: handleLogout },
            ])
          }
          style={({ pressed }) => [S.logout, pressed && { opacity: 0.9 }]}
        >
          <FontAwesome name="sign-out" size={18} color="#fff" />
          <Text style={S.logoutText}>Вийти</Text>
        </Pressable>
      </ScrollView>

      <TabBar active="profile" />
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.row, pressed && { opacity: 0.92 }]}>
      <View style={S.rowIcon}>
        <FontAwesome name={icon} size={16} color={ACCENT} />
      </View>
      <Text style={S.rowLabel}>{label}</Text>
      <FontAwesome name="angle-right" size={18} color={SUBTEXT} style={{ marginLeft: "auto" }} />
    </Pressable>
  );
}

function initials(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const [a, b] = [parts[0]?.[0], parts[1]?.[0]];
  return (a || "?").toUpperCase() + (b ? b.toUpperCase() : "");
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, padding: 12 },
  authCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginTop: 12,
  },
  authIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  authTitle: { color: TEXT, fontSize: 18, fontWeight: "800" },
  authSub: { color: SUBTEXT, marginTop: 4, marginBottom: 12 },
  authPrimaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  authPrimaryText: { color: "#fff", fontWeight: "800" },
  authSecondaryBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  authSecondaryText: { color: TEXT, fontWeight: "800" },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    position: "relative",
  },
  avatarText: { color: ACCENT, fontWeight: "800", fontSize: 18 },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: CARD,
  },
  name: { color: TEXT, fontSize: 18, fontWeight: "800" },
  username: { color: SUBTEXT, marginTop: 2 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: { color: TEXT, fontWeight: "700" },
  list: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { color: TEXT, fontSize: 16, fontWeight: "700" },
  logout: {
    marginTop: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: "#fff", fontWeight: "800" },
});
