import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { OpenAPI } from "@/src/api/client";
import TabBar from "@/src/ui/TabBar";

const BG = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#4563d1";
const CARD = "#ffffff";

function withTimeout<T>(p: Promise<T>, ms = 8000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Запит перевищив час очікування")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

type CategoryDto = { id?: string; name?: string | null; parentId?: string | null };

async function fetchCategories(): Promise<{ list: CategoryDto[]; usedUrl: string; status: number }> {
  const candidates = [
    "/api/Category",
    "/api/Category/GetAll",
    "/api/Category/get-all",
    "/api/Category/get",
  ];

  let lastErr: any = null;
  for (const path of candidates) {
    const url = `${OpenAPI.baseUrl}${path}`;
    try {
      const res = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }));
      const status = res.status;
      if (!res.ok) throw new Error(`HTTP ${status}`);
      const json = await res.json();
      const list: CategoryDto[] = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
      if (Array.isArray(list)) return { list, usedUrl: url, status };
      throw new Error("Невідомий формат відповіді");
    } catch (e) {
      lastErr = { e, path };
    }
  }
  throw new Error(
    `Не вдалося отримати категорії (усі варіанти повернули помилку). Остання: ${lastErr?.e?.message ?? lastErr}`
  );
}

const FORCE_FIX: Record<string, string> = {
  "Дім i сад": "Дім і сад",
  "Авто-, мото": "Авто та мото",
  "Комплектуючі для окулярів": "Комплектуючі для комп'ютера",
  "Комплектующие для очков": "Комплектуючі для комп'ютера",
};

function replaceLatinI(s: string) {
  return s.replace(/([А-Яа-яЇїІіЄєҐґ])[iI]([А-Яа-яЇїІіЄєҐґ])/g, (_, a, b) => `${a}і${b}`);
}

function prettifyName(name: string): string {
  let s = (name || "").trim().replace(/\s+/g, " ");
  s = replaceLatinI(s);
  s = s.replace(/авто-?,?\s*мото/gi, "Авто та мото");
  if (FORCE_FIX[name]) return FORCE_FIX[name];
  return s;
}

function curateTop10(list: CategoryDto[]): CategoryDto[] {
  const buckets = [
    /(смартф|телефон|phone|iphone|android)/i,
    /(ноут|laptop|macbook|комп|пк|computer)/i,
    /(аксес|науш|headphone|гарнітур|accessor)/i,
    /(одяг|одеж|fashion|взут|обув|clothes)/i,
    /(краса|beauty|космет|make)/i,
    /(дім|дом|home|інтер|кух|посуда|house)/i,
    /(спорт|sport|fitness|вел)/i,
    /(дит|дет|kids|toys|іграш)/i,
    /(побут|бытов|applian|технік)/i,
    /(авто|auto|car|шини|шины|запчаст)/i,
  ];

  const norm = (c?: CategoryDto) => replaceLatinI((c?.name || "").toLowerCase());
  const used = new Set<string>();
  const keyOf = (c: CategoryDto) => c.id || norm(c);

  const pickFor = (re: RegExp) => list.find((c) => !used.has(keyOf(c)) && re.test(norm(c))) || null;

  const curated: CategoryDto[] = [];
  for (const re of buckets) {
    const hit = pickFor(re);
    if (hit) {
      used.add(keyOf(hit));
      curated.push(hit);
    }
    if (curated.length >= 10) break;
  }

  if (curated.length < 10) {
    const rest = list
      .filter((c) => !used.has(keyOf(c)))
      .sort((a, b) => prettifyName(a.name || "").localeCompare(prettifyName(b.name || ""), "uk"));
    curated.push(...rest.slice(0, 10 - curated.length));
  }

  return curated.slice(0, 10);
}

function pickIconByName(name: string): React.ComponentProps<typeof FontAwesome>["name"] {
  const n = replaceLatinI(name.toLowerCase());
  if (/(смартф|телефон|phone|iphone|android)/.test(n)) return "mobile";
  if (/(ноут|laptop|macbook|комп|пк|computer)/.test(n)) return "laptop";
  if (/(аксес|науш|headphone|гарнітур|accessor)/.test(n)) return "headphones";
  if (/(одяг|одеж|fashion|взут|обув|clothes)/.test(n)) return "shopping-bag";
  if (/(краса|beauty|космет|make)/.test(n)) return "heart-o";
  if (/(дім|дом|home|інтер|кух|посуда|house)/.test(n)) return "home";
  if (/(спорт|sport|fitness|вел)/.test(n)) return "bicycle";
  if (/(дит|дет|kids|toys|іграш)/.test(n)) return "child";
  if (/(побут|бытов|applian|технік)/.test(n)) return "bolt";
  if (/(авто|auto|car|шини|шины|запчаст)/.test(n)) return "car";
  return "folder";
}

export default function CatalogScreen() {
  const r = useRouter();
  const [cats, setCats] = React.useState<CategoryDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [debugUrl, setDebugUrl] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { list, usedUrl } = await fetchCategories();
        if (!alive) return;
        setDebugUrl(usedUrl);
        setCats(curateTop10(list ?? []));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Помилка завантаження");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const goSearchByCat = (name?: string | null) => () => {
    const q = prettifyName(name || "").trim();
    r.push(`/search?query=${encodeURIComponent(q)}` as any);
  };

  if (loading) {
    return (
      <View style={[S.screen, S.center]}>
        <ActivityIndicator />
        <Text style={{ color: SUBTEXT, marginTop: 8 }}>Завантаження категорій…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[S.screen, S.center]}>
        <Text style={{ color: "#dc2626", textAlign: "center", marginHorizontal: 16 }}>{error}</Text>
        {debugUrl ? <Text style={{ color: SUBTEXT, marginTop: 8, fontSize: 12 }}>URL: {debugUrl}</Text> : null}
      </View>
    );
  }

  return (
    <View style={S.screen}>
      <Text style={S.title}>Каталог</Text>

      {cats.length === 0 ? (
        <View style={[S.center, { flex: 1 }]}>
          <Text style={{ color: SUBTEXT }}>Категорій немає</Text>
        </View>
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(it, i) => it.id ?? String(i)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingBottom: 96, paddingTop: 6, gap: 12 }}
          renderItem={({ item }) => <CategoryCard item={item} onPress={goSearchByCat(item.name)} />}
        />
      )}

      <TabBar active="catalog" />
    </View>
  );
}

function CategoryCard({ item, onPress }: { item: CategoryDto; onPress: () => void }) {
  const name = prettifyName(item.name || "—");
  const icon = pickIconByName(name);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.card, pressed && { opacity: 0.92 }]}>
      <View style={S.iconBadge}>
        <FontAwesome name={icon} size={16} color="#fff" />
      </View>
      <Text numberOfLines={2} style={S.cardTitle}>{name}</Text>
      <View style={S.cardFooter}>
        <Text style={S.link}>Переглянути</Text>
        <FontAwesome name="angle-right" size={16} color={ACCENT} />
      </View>
    </Pressable>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 12, paddingTop: 12 },
  center: { alignItems: "center", justifyContent: "center" },

  title: { color: TEXT, fontWeight: "800", fontSize: 20, marginBottom: 8 },

  card: {
    flex: 1,
    minHeight: 110,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconBadge: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    color: TEXT,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    includeFontPadding: false,
  },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  link: { color: ACCENT, fontWeight: "700" },
});
