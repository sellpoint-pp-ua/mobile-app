import React from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "@/src/auth/AuthProvider";
import {
  searchProductsByName,
  getProductMediaUrls,
  Product,
} from "@/src/api/productService.mobile";
import TabBar from "@/src/ui/TabBar";

const SHOW_PROMO = true;
const SHOW_CATEGORIES = true;

const BG = "#ffffff";
const CARD = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#3d36feff";

const BANNERS = [
  "https://cloud.sellpoint.pp.ua/media/adds-photos/ad_2.png",
  "https://cloud.sellpoint.pp.ua/media/adds-photos/add_3.png",
  "https://cloud.sellpoint.pp.ua/media/adds-photos/add_4.png",
];
const BANNER_INTERVAL_MS = 3800;
const BANNER_RATIO = 360 / 140;
const RECS_LIMIT = 19;

export default function Home() {
  const { reload } = useAuth();
  const router = useRouter();
  const { ready, me } = useAuth();

  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [err, setErr] = React.useState("");

  const go = (path: string) => () => router.push(path as any);
  const submitSearch = () => {
    const q = query.trim();
    if (q) router.push(`/search?query=${encodeURIComponent(q)}` as any);
  };

  const categories = React.useMemo(
    () => [
      { title: "Смартфони", icon: "mobile", onPress: go("/catalog?c=phones") },
      { title: "Аксесуари", icon: "headphones", onPress: go("/catalog?c=accessories") },
      { title: "Краса", icon: "heart-o", onPress: go("/catalog?c=beauty") },
      { title: "Для дому", icon: "home", onPress: go("/catalog?c=home") },
      { title: "Спорт", icon: "bicycle", onPress: go("/catalog?c=sport") },
    ],
    []
  );

  useFocusEffect(
    React.useCallback(() => {
      reload();
    }, [reload])
  );

  const fetchRecommended = React.useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const seedByLang: Array<{ lang: "uk" | "ru" | "en"; q: string[] }> = [
        { lang: "uk", q: ["телефон", "чохол", "ноутбук", "книга", "одяг", "планшет"] },
        { lang: "ru", q: ["телефон", "чехол", "книга", "одежда", "наушники"] },
        { lang: "en", q: ["phone", "case", "laptop", "book", "headphones", "watch"] },
      ];
      const out: Product[] = [];
      const seen = new Set<string>();

      for (const pack of seedByLang) {
        for (const s of pack.q) {
          const part = await searchProductsByName(s, pack.lang);
          for (const p of part) {
            if (!p?.id || seen.has(p.id)) continue;
            seen.add(p.id);
            out.push(p);
            if (out.length >= RECS_LIMIT) break;
          }
          if (out.length >= RECS_LIMIT) break;
        }
        if (out.length >= 8) break;
      }
      setItems(out.slice(0, RECS_LIMIT));
    } catch (e: any) {
      setItems([]);
      setErr(e?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchRecommended();
    setRefreshing(false);
  }, [fetchRecommended]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        <View style={styles.header}>
          <View style={styles.searchWrap}>
            <TextInput
              placeholder="Я шукаю на SellPoint"
              placeholderTextColor={SUBTEXT}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />
            <Pressable onPress={submitSearch} style={styles.searchIconHitbox}>
              <FontAwesome name="search" size={16} color={SUBTEXT} style={styles.searchIcon} />
            </Pressable>
          </View>
        </View>

        {ready && !me ? (
          <View style={styles.authCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hi}>Вітаємо!</Text>
              <Text style={styles.hiSub}>Увійдіть, щоб отримати вигідні умови доставки</Text>
            </View>
            <View style={styles.authRow}>
              <Pressable onPress={go("/sign-in")} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                <Text style={styles.primaryBtnText}>Увійти</Text>
              </Pressable>
              <Pressable onPress={go("/sign-up")} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                <Text style={styles.secondaryBtnText}>Зареєструватися</Text>
              </Pressable>
            </View>
          </View>
        ) : ready && me ? (
          <View style={styles.welcomeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeHi}>
                Привіт{me.fullName ? `, ${me.fullName.split(" ")[0]}` : ""} 👋
              </Text>
              <Text style={styles.welcomeSub}>
                {me.emailConfirmed
                  ? "Гарного шопінгу на SellPoint!"
                  : "Підтвердіть e-mail, щоб оформляти замовлення"}
              </Text>
            </View>
            <Pressable onPress={go("/cart")} style={styles.chipPrimary}>
              <FontAwesome name="shopping-cart" size={14} color="#fff" />
              <Text style={styles.chipPrimaryText}>Кошик</Text>
            </Pressable>
          </View>
        ) : null}

        {SHOW_PROMO && (
          <View style={styles.section}>
            <BannerCarousel images={BANNERS} intervalMs={BANNER_INTERVAL_MS} />
          </View>
        )}

        {SHOW_CATEGORIES && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Досліджуйте категорії</Text>
            <View style={styles.chipsRow}>
              {categories.map((c) => (
                <Pressable key={c.title} onPress={c.onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <FontAwesome name={c.icon as any} size={14} color={ACCENT} />
                  <Text style={styles.chipText}>{c.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Для тебе</Text>

          {loading ? (
            <View style={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : err ? (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <Text style={{ color: "#dc2626", marginBottom: 10, textAlign: "center" }}>{err}</Text>
              <Pressable onPress={fetchRecommended} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Спробувати ще раз</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {items
                .filter((p) => (p.finalPrice ?? p.discountPrice ?? p.price) > 0)
                .map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    onPress={() => router.push(`/product/id?id=${encodeURIComponent(p.id)}` as any)}
                  />
                ))}
            </View>
          )}
        </View>

        <View style={{ height: 88 }} />
      </ScrollView>

      <TabBar active="home" />
    </View>
  );
}

function BannerCarousel({ images, intervalMs = 4000 }: { images: string[]; intervalMs?: number }) {
  const scrollRef = React.useRef<ScrollView>(null);
  const [w, setW] = React.useState(0);
  const [index, setIndex] = React.useState(0);

  const h = w > 0 ? Math.max(140, Math.round(w / BANNER_RATIO)) : 160;

  React.useEffect(() => {
    if (!w || images.length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % images.length;
        scrollRef.current?.scrollTo({ x: next * w, animated: true });
        return next;
      });
    }, intervalMs);
    return () => clearInterval(t);
  }, [w, images.length, intervalMs]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!w) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    setIndex(i);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width && width !== w) setW(width);
  };

  return (
    <View style={styles.bannerWrap} onLayout={onLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={{ borderRadius: 14 }}
      >
        {images.map((uri, i) => (
          <View key={uri + i} style={{ width: w || 1, height: h, overflow: "hidden" }}>
            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function ProductCard({ p, onPress }: { p: Product; onPress: () => void }) {
  const [img, setImg] = React.useState<string>("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const media = await getProductMediaUrls(p.id);
        const first = media[0]?.url || "";
        if (alive) setImg(first);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [p.id]);

  const price = p.price;
  const discPrice = p.discountPrice ?? null;
  const hasDisc = typeof discPrice === "number" && discPrice > 0 && discPrice < price;
  const showPrice = hasDisc ? discPrice : price;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardItem, pressed && { opacity: 0.95 }]}>
      <View style={styles.thumb}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" }]}>
            <ActivityIndicator />
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>{p.name}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <Text style={styles.price}>{formatPrice(showPrice)} ₴</Text>
        {hasDisc ? <Text style={styles.oldPrice}>{formatPrice(price)} ₴</Text> : null}
      </View>
    </Pressable>
  );
}

function formatPrice(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return Math.round(n).toString();
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 16 },
  header: { paddingHorizontal: 12, paddingTop: 12 },
  searchWrap: {
    position: "relative",
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  search: {
    width: "100%",
    color: TEXT,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingHorizontal: 12,
    paddingLeft: 40,
    fontSize: 14,
  },
  searchIconHitbox: { position: "absolute", left: 0, top: 0, bottom: 0, width: 40, justifyContent: "center", alignItems: "center" },
  searchIcon: { position: "absolute", left: 14, top: "50%", marginTop: Platform.select({ ios: -8, android: -8, default: -8 }) },
  authCard: {
    marginTop: 12,
    marginHorizontal: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  hi: { color: TEXT, fontSize: 18, fontWeight: "800" },
  hiSub: { color: SUBTEXT, marginTop: 4 },
  authRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: { flex: 1, borderWidth: 1.5, borderColor: ACCENT, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { color: ACCENT, fontWeight: "800" },
  welcomeCard: {
    marginTop: 12,
    marginHorizontal: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  welcomeHi: { color: TEXT, fontSize: 18, fontWeight: "800" },
  welcomeSub: { color: SUBTEXT, marginTop: 2 },
  chipPrimary: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: ACCENT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  chipPrimaryText: { color: "#fff", fontWeight: "800" },
  section: { paddingHorizontal: 12, marginTop: 16 },
  bannerWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#f8fafc",
  },
  dotsRow: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#cbd5e1",
  },
  dotActive: { backgroundColor: ACCENT },
  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: "800", marginBottom: 10 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: { color: TEXT, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  skeleton: { width: "48%", aspectRatio: 170 / 220, backgroundColor: "#f3f4f6", borderRadius: 12 },
  cardItem: { width: "48%", backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 10 },
  thumb: { width: "100%", aspectRatio: 170 / 170, borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" },
  name: { color: TEXT, marginTop: 8 },
  price: { color: TEXT, fontWeight: "800" },
  oldPrice: { color: SUBTEXT, textDecorationLine: "line-through" },
  pressed: { opacity: 0.85 },
});
