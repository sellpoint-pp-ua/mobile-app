import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { OpenAPI } from "@/src/api/client";
import TabBar from "@/src/ui/TabBar";

const BG = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#5a63d1";
const ROW_BG = "#f3f4f6";

type CategoryDto = { id?: string; name?: string | null; parentId?: string | null };

const SECTIONS = [
  { id: "for-you", title: "Для тебе", icon: "gift" as const, re: /(топ|попул|новин|для тебе)/i },
  { id: "energy", title: "Пристрої для енергонезалежності", icon: "battery-3" as const, re: /(генератор|інвертор|акум|аккум|заряд|power|соняч)/i },
  { id: "fashion", title: "Одяг та взуття", icon: "shopping-bag" as const, re: /(одяг|одеж|майк|футболк|куртк|штани|крос|кеди|взут)/i },
  { id: "tech", title: "Техніка та електроніка", icon: "bolt" as const, re: /(технік|ноут|пк|комп|смартф|телефон|планшет|електрон|тв|монітор)/i },
  {
    id: "kids",
    title: "Товари для дітей",
    icon: "child" as const,
    re: /\b(дит|дитяч|дитина|іграш|toy|коляс|пелюш|дитячі|baby|kids)\b/i, // строгое совпадение
  },
];

async function fetchCategories(): Promise<CategoryDto[]> {
  const urls = ["/api/Category", "/api/Category/GetAll", "/api/Category/get-all", "/api/Category/get"];
  for (const path of urls) {
    try {
      const res = await fetch(`${OpenAPI.baseUrl}${path}`, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const json = await res.json();
      const arr: CategoryDto[] = Array.isArray(json) ? json : json?.items ?? json?.data ?? [];
      if (Array.isArray(arr)) return arr;
    } catch {}
  }
  return [];
}

function prettifyName(name?: string | null): string {
  return (name || "").trim().replace(/\s+/g, " ");
}

function normalize(list: CategoryDto[]) {
  return list
    .map((c) => ({ ...c, name: prettifyName(c.name) }))
    .filter((c) => c.name && c.name.length > 1);
}

function bucketize(list: CategoryDto[]) {
  const map = new Map<string, CategoryDto[]>();
  for (const s of SECTIONS) map.set(s.id, []);
  const otherKey = "for-you";
  for (const c of list) {
    const low = (c.name || "").toLowerCase();
    const hit = SECTIONS.find((s) => s.re.test(low));
    map.get(hit ? hit.id : otherKey)!.push(c);
  }
  for (const s of SECTIONS) {
    map.set(
      s.id,
      (map.get(s.id) || []).sort((a, b) =>
        prettifyName(a.name).localeCompare(prettifyName(b.name), "uk")
      )
    );
  }
  return map;
}

export default function CatalogScreen() {
  const r = useRouter();
  const [cats, setCats] = React.useState<CategoryDto[]>([]);
  const [bySection, setBySection] = React.useState<Map<string, CategoryDto[]>>(new Map());
  const [selected, setSelected] = React.useState(SECTIONS[0].id);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchCategories();
      const norm = normalize(list);
      setCats(norm);
      setBySection(bucketize(norm));
    } catch (e: any) {
      setError(e?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const goSearch = (q: string) => r.push(`/search?query=${encodeURIComponent(q)}` as any);
  const rightData = bySection.get(selected) || [];

  if (loading) {
    return (
      <SafeAreaView style={S.screen}>
        <View style={{ flexDirection: "row", flex: 1 }}>
          <View style={S.leftRail}>
            {SECTIONS.map((s, i) => (
              <View key={s.id} style={[S.leftItem, i === 0 && S.leftItemActive]}>
                <View style={[S.leftIconWrap, { backgroundColor: ACCENT }]}>
                  <FontAwesome name={s.icon} size={22} color="#fff" />
                </View>
                <Text style={[S.leftTitleActive]} numberOfLines={2}>{s.title}</Text>
              </View>
            ))}
          </View>
          <View style={S.rightPane}>
            {Array.from({ length: 12 }).map((_, i) => <View key={i} style={S.rowSkeleton} />)}
          </View>
        </View>
        <TabBar active="catalog" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[S.screen, S.center]}>
        <Text style={S.error}>{error}</Text>
        <Pressable onPress={load} style={S.retryBtn}>
          <Text style={S.retryText}>Спробувати знову</Text>
        </Pressable>
        <TabBar active="catalog" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <View style={S.leftRail}>
          <FlatList
            data={SECTIONS}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => {
              const active = item.id === selected;
              return (
                <Pressable
                  onPress={() => setSelected(item.id)}
                  style={[S.leftItem, active && S.leftItemActive]}
                >
                  <View style={[S.leftIconWrap]}>
                    <FontAwesome name={item.icon} size={22} color={active ? ACCENT : "#111"} />
                  </View>
                  <Text style={[active ? S.leftTitleActive : S.leftTitle]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        <FlatList
          style={S.rightPane}
          data={rightData.length ? rightData : cats}
          keyExtractor={(it, i) => it.id ?? String(i)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => goSearch(prettifyName(item.name))} style={S.row}>
              <Text numberOfLines={1} style={S.rowText}>{prettifyName(item.name)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<View style={[S.center, { paddingTop: 40 }]}><Text style={{ color: SUBTEXT }}>Категорій немає</Text></View>}
          contentContainerStyle={{ paddingBottom: 92 }}
        />
      </View>
      <TabBar active="catalog" />
    </SafeAreaView>
  );
}

const LEFT_W = 116;

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { alignItems: "center", justifyContent: "center" },

  leftRail: {
    width: LEFT_W,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    paddingVertical: 8,
  },
  leftItem: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 8,
  },
  leftItemActive: {
    backgroundColor: ACCENT,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  leftIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  leftTitle: { color: TEXT, textAlign: "center", fontSize: 12 },
  leftTitleActive: { color: "#fff", textAlign: "center", fontSize: 12, fontWeight: "700" },

  rightPane: { flex: 1, backgroundColor: ROW_BG },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e9eaee",
    backgroundColor: ROW_BG,
  },
  rowText: { color: TEXT, fontSize: 18, fontWeight: "600" },

  error: { color: "#dc2626", textAlign: "center", paddingHorizontal: 16 },
  retryBtn: {
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "800" },

  rowSkeleton: {
    height: 54,
    backgroundColor: "#edeef3",
    borderBottomWidth: 1,
    borderBottomColor: "#e9eaee",
  },
});
