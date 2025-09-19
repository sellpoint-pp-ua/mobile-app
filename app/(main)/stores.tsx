import * as React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";
import TabBar from "@/src/ui/TabBar";

const ACCENT = "#4563d1";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const BG = "#ffffff";

type Store = {
  id: string;
  name: string;
  createdAt: string;
  avatar?: { compressedUrl?: string; sourceUrl?: string } | null;
  roles?: Record<string, any>;
};

async function getCurrentUserId(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/User/Current`,
    `${base}/api/User/GetCurrent`,
    `${base}/api/users/current`,
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" as any });
      if (!r.ok) continue;
      const ujson: any = await r.json();
      const uid = ujson?.id || ujson?.userId || ujson?.Id || ujson?.ID || ujson?._id;
      if (uid) return String(uid);
    } catch {}
  }
  return null;
}
async function getMyStores(): Promise<Store[]> {
  const token = await getToken();
  if (!token) throw new Error("no-auth");
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/Store/GetMyStores`,
    `${base}/api/store/get-my`,
    `${base}/api/store/list/me`,
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" as any });
      if (!r.ok) continue;
      const j = await r.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
      return arr as Store[];
    } catch {}
  }
  return [];
}
async function deleteStore(id: string) {
  const token = await getToken();
  if (!token) throw new Error("no-auth");
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const tryCalls: Array<{ url: string; init: RequestInit }> = [
    { url: `${base}/api/Store/Delete/${encodeURIComponent(id)}`, init: { method: "DELETE", headers: { Authorization: `Bearer ${token}` } } },
    { url: `${base}/api/Store/Delete?id=${encodeURIComponent(id)}`, init: { method: "DELETE", headers: { Authorization: `Bearer ${token}` } } },
    { url: `${base}/api/store/${encodeURIComponent(id)}`, init: { method: "DELETE", headers: { Authorization: `Bearer ${token}` } } },
  ];
  for (const c of tryCalls) { const r = await fetch(c.url, c.init); if (r.ok) return; }
  throw new Error("Помилка при видаленні магазину");
}

export default function StoresScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stores, setStores] = React.useState<Store[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { router.replace("/sign-in"); return; }
      try {
        const uid = await getCurrentUserId();
        if (!uid) { setError("Не вдалося завантажити інформацію про користувача"); setLoading(false); return; }
        setCurrentUserId(uid);
        const list = await getMyStores();
        const mine = list.filter(s => s.roles && s.roles[uid] !== undefined);
        if (!mine.length) setError("У вас немає магазинів");
        setStores(mine);
      } catch (e) {
        setError("Помилка завантаження магазину");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onDelete = async (id: string) => {
    Alert.alert("Видалення", "Ви впевнені, що хочете видалити цей магазин?", [
      { text: "Скасувати", style: "cancel" },
      { text: "Видалити", style: "destructive", onPress: async () => {
        try { await deleteStore(id); const list = await getMyStores(); const mine = currentUserId ? list.filter(s => s.roles && s.roles[currentUserId] !== undefined) : []; setStores(mine); Alert.alert("Готово", "Магазин успішно видалено"); }
        catch { Alert.alert("Помилка", "Помилка при видаленні магазину"); }
      } }
    ]);
  };

  if (loading) {
    return (
      <View style={[M.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
        <TabBar active="profile" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={M.screen}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={M.emptyCard}>
            <Text style={{ fontSize: 48, textAlign: "center" }}>🏪</Text>
            <Text style={{ fontWeight: "700", color: TEXT, marginTop: 8, textAlign: "center" }}>Магазин не знайдено</Text>
            <Text style={{ color: SUBTEXT, marginTop: 4, textAlign: "center" }}>{error}</Text>
            <Pressable onPress={() => router.push("/requests")} style={({ pressed }) => [M.linkBtn, pressed && { opacity: 0.95 }]}>
              <Text style={{ color: ACCENT, fontWeight: "800" }}>Перейти до заявок</Text>
            </Pressable>
          </View>
        </ScrollView>
        <TabBar active="profile" />
      </View>
    );
  }

  return (
    <View style={M.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: TEXT, marginBottom: 4 }}>Ваші магазини</Text>
        <Text style={{ color: SUBTEXT, marginBottom: 12 }}>Оберіть магазин для управління</Text>

        {stores.length === 0 ? (
          <View style={M.emptyCard}>
            <Text style={{ fontSize: 48, textAlign: "center" }}>🏪</Text>
            <Text style={{ color: SUBTEXT, marginTop: 6, textAlign: "center" }}>У вас поки немає магазинів</Text>
            <Pressable onPress={() => router.push("/requests")} style={({ pressed }) => [M.linkBtn, pressed && { opacity: 0.95 }]}>
              <Text style={{ color: ACCENT, fontWeight: "800" }}>Подати заявку</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {stores.map(s => (
              <View key={s.id} style={M.item}>
                {s.avatar?.compressedUrl || s.avatar?.sourceUrl ? (
                  <Image source={{ uri: s.avatar.compressedUrl || (s.avatar as any).sourceUrl }} style={{ width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: BORDER }} />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 18 }}>🏪</Text></View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: "700", color: TEXT }}>{s.name}</Text>
                  <Text style={{ color: SUBTEXT, fontSize: 12 }}>Створено: {new Date(s.createdAt).toLocaleDateString("uk-UA")}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => router.push(`/store?id=${encodeURIComponent(s.id)}`)} style={({ pressed }) => [M.manageBtn, pressed && { opacity: 0.95 }]}><Text style={{ color: "#fff", fontWeight: "800" }}>Управляти</Text></Pressable>
                  <Pressable onPress={() => onDelete(s.id)} style={({ pressed }) => [M.deleteBtn, pressed && { opacity: 0.95 }]}><Text style={{ color: "#b91c1c", fontWeight: "800" }}>Видалити</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <TabBar active="profile" />
    </View>
  );
}

const M = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  emptyCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16, alignItems: "center", gap: 8 },
  linkBtn: { marginTop: 8, borderWidth: 2, borderColor: ACCENT, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  manageBtn: { backgroundColor: "#111", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  deleteBtn: { backgroundColor: "#fee2e2", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
