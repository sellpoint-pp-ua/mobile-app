import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import TabBar from "@/src/ui/TabBar";

const BG = "#ffffff";
const CARD = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#3d36feff";

export default function Favorites() {
  const r = useRouter();
  const items: any[] = [];

  return (
    <View style={S.root}>
      {items.length === 0 ? (
        <View style={S.empty}>
          <View style={S.heartBadge}>
            <FontAwesome name="heart" size={22} color="#fff" />
          </View>
          <Text style={S.title}>Тут поки порожньо</Text>
          <Text style={S.sub}>
            Зберігайте товари в обране — вони з’являться тут
          </Text>
          <Pressable onPress={() => r.push("/catalog" as any)} style={S.btn}>
            <Text style={S.btnText}>До каталогу</Text>
          </Pressable>
        </View>
      ) : (
        <View />
      )}

      <TabBar active="favorites" />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, padding: 16, paddingBottom: 96 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  heartBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: ACCENT, alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: "800" },
  sub: { color: SUBTEXT, marginTop: 6, textAlign: "center" },
  btn: {
    marginTop: 14,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnText: { color: "#fff", fontWeight: "800" },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
  },
});
