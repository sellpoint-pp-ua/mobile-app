import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Alert,
  Animated,
  Platform,
  Modal,
  Share,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";
import { getProductMediaUrls } from "@/src/api/productService.mobile";
import { addToCart as addToCartV5, CART_SERVICE_VERSION } from "@/src/api/cartService.mobile";

const BG = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const CARD = "#ffffff";
const ACCENT = "#4563d1";
const GOOD = "#16a34a";
const WARN = "#d97706";
const BAD = "#dc2626";
const RED = "#dc2626";

type ProductDto = {
  id?: string | null;
  name?: string | null;
  price?: number;
  discountPrice?: number | null;
  hasDiscount?: boolean;
  discountPercentage?: number | null;
  description?: string | null;
  categoryPath?: string[] | null;
  quantityStatus?: number | string;
  quantity?: number;
  attributes?: Array<{ name: string; value: string }> | Record<string, string>;
  variations?: Array<{ name: string; values: string[] }> | Record<string, string[]>;
  sellerId?: string | number;
  sellerName?: string;
};

type ReviewSummary = { avg: number; total: number };
type Seller = { id: string; name: string; rating?: number; reviews?: number };
type MiniProduct = {
  id: string;
  name: string;
  price?: number;
  discountPrice?: number | null;
  hasDiscount?: boolean;
  discountPercentage?: number | null;
  firstImage?: string;
};
type FadeInImageProps = {
  uri: string;
  resizeMode?: "contain" | "cover";
};

const W = Dimensions.get("window").width;
const GALLERY_H = Math.max(280, Math.round(W * 0.62));

function priceFmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return Math.round(n).toString();
  }
}
function stockBadge(p?: ProductDto) {
  const qs = p?.quantityStatus;
  const qsStr = typeof qs === "string" ? qs.toLowerCase() : "";
  if (typeof qs === "number") {
    if (qs === 3) return { label: "Немає в наявності", color: BAD, bg: "#fee2e2" };
    if (qs === 2) return { label: "Закінчується", color: WARN, bg: "#ffedd5" };
    return { label: "В наявності", color: GOOD, bg: "#dcfce7" };
  }
  if (typeof p?.quantity === "number") {
    if (p.quantity <= 0) return { label: "Немає в наявності", color: BAD, bg: "#fee2e2" };
    if (p.quantity <= 3) return { label: "Закінчується", color: WARN, bg: "#ffedd5" };
    return { label: "В наявності", color: GOOD, bg: "#dcfce7" };
  }
  if (qsStr.includes("нема") || qsStr.includes("out")) return { label: "Немає в наявності", color: BAD, bg: "#fee2e2" };
  if (qsStr.includes("закінч") || qsStr.includes("low")) return { label: "Закінчується", color: WARN, bg: "#ffedd5" };
  return { label: "В наявності", color: GOOD, bg: "#dcfce7" };
}
const baseUrl = () => (OpenAPI.baseUrl || "").replace(/\/+$/, "");
async function fetchJsonTry(urls: string[], init?: RequestInit) {
  let last: any = null;
  for (const u of urls) {
    try {
      const r = await fetch(u, init);
      if (!r.ok) {
        last = new Error(`HTTP ${r.status}`);
        continue;
      }
      return await r.json();
    } catch (e) {
      last = e;
    }
  }
  throw last || new Error("Request failed");
}
async function fetchProductById(id: string): Promise<ProductDto> {
  const b = baseUrl();
  const j = await fetchJsonTry(
    [
      `${b}/api/Product/GetById?id=${encodeURIComponent(id)}`,
      `${b}/api/Product/get-by-id/${encodeURIComponent(id)}`,
      `${b}/api/Product/get?id=${encodeURIComponent(id)}`,
      `${b}/api/Product/${encodeURIComponent(id)}`,
      `${b}/api/Product/ById/${encodeURIComponent(id)}`,
      `${b}/api/products/${encodeURIComponent(id)}`,
    ],
    { headers: { Accept: "application/json" } }
  );
  const p: ProductDto = (j?.data ?? j?.item ?? j) as ProductDto;
  return p;
}
async function fetchReviewSummary(productId: string): Promise<ReviewSummary> {
  const b = baseUrl();
  try {
    const j = await fetchJsonTry([
      `${b}/api/ProductReview/summary/${encodeURIComponent(productId)}`,
      `${b}/api/products/reviews/summary/${encodeURIComponent(productId)}`,
      `${b}/api/ProductReview/summary?productId=${encodeURIComponent(productId)}`,
    ]);
    const data = j?.data ?? j;
    const avg = Number(data?.avg ?? data?.average ?? data?.rating ?? 0) || 0;
    const total = Number(data?.total ?? data?.count ?? 0) || 0;
    return { avg, total };
  } catch {
    return { avg: 0, total: 0 };
  }
}
async function fetchSellerByProduct(productId: string): Promise<Seller | null> {
  const b = baseUrl();
  try {
    const j = await fetchJsonTry([
      `${b}/api/Seller/by-product/${encodeURIComponent(productId)}`,
      `${b}/api/Store/by-product/${encodeURIComponent(productId)}`,
      `${b}/api/sellers/by-product/${encodeURIComponent(productId)}`,
    ]);
    const d = j?.data ?? j;
    return {
      id: String(d?.id ?? d?.storeId ?? d?.sellerId ?? ""),
      name: String(d?.name ?? d?.storeName ?? d?.sellerName ?? "Магазин"),
      rating: Number(d?.rating ?? d?.avg ?? 0) || undefined,
      reviews: Number(d?.reviews ?? d?.count ?? 0) || undefined,
    };
  } catch {
    return null;
  }
}
async function fetchSimilar(product: ProductDto): Promise<MiniProduct[]> {
  const b = baseUrl();
  const key =
    (product.categoryPath && product.categoryPath[product.categoryPath.length - 1]) ||
    product.name?.split(/\s+/).slice(0, 2).join(" ");
  if (!key) return [];
  try {
    const j = await fetchJsonTry(
      [
        `${b}/api/Product/related?key=${encodeURIComponent(key)}`,
        `${b}/api/products/related?query=${encodeURIComponent(key)}`,
        `${b}/api/Product/get-by-name/${encodeURIComponent(key)}`,
      ],
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 1, pageSize: 16 }),
      }
    );
    const arr: any[] = (j?.data ?? j?.items ?? j) || [];
    return arr.slice(0, 16).map((x) => ({
      id: String(x?.id ?? x?.productId ?? ""),
      name: String(x?.name ?? x?.title ?? "Товар"),
      price: Number(x?.price),
      discountPrice: x?.discountPrice == null ? null : Number(x.discountPrice),
      hasDiscount: Boolean(x?.hasDiscount ?? (x?.discountPrice > 0)),
      discountPercentage: x?.discountPercentage == null ? null : Number(x.discountPercentage),
      firstImage: x?.firstImage || x?.imageUrl || x?.previewUrl,
    }));
  } catch {
    return [];
  }
}
async function toggleFavorite(productId: string, want: boolean) {
  const token = await getToken();
  if (!token) throw new Error("Потрібно увійти");
  const b = baseUrl();
  const calls: Array<{ url: string; init: RequestInit }> = want
    ? [
        {
          url: `${b}/api/Favorites/Add`,
          init: {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId }),
          },
        },
        {
          url: `${b}/api/favorites/add?productId=${encodeURIComponent(productId)}`,
          init: { method: "POST", headers: { Authorization: `Bearer ${token}` } },
        },
      ]
    : [
        {
          url: `${b}/api/Favorites/Delete?productId=${encodeURIComponent(productId)}`,
          init: { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        },
        {
          url: `${b}/api/favorites/${encodeURIComponent(productId)}`,
          init: { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        },
      ];
  for (const c of calls) {
    const r = await fetch(c.url, c.init);
    if (r.ok) return true;
  }
  throw new Error("Не вдалося оновити обране");
}
function Dot({ active }: { active: boolean }) {
  return (
    <View
      style={{
        width: active ? 10 : 6,
        height: 6,
        borderRadius: 4,
        marginHorizontal: 3,
        backgroundColor: active ? ACCENT : "#cbd5e1",
      }}
    />
  );
}
function FadeInImage({ uri, resizeMode = "contain" }: FadeInImageProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = React.useState(false);
  return (
    <View style={S.imgWrap}>
      {!loaded && (
        <View style={S.imgLoader}>
          <ActivityIndicator />
          <Text style={S.imgLoaderText}>Завантаження зображення…</Text>
        </View>
      )}
      <Animated.Image
        source={{ uri }}
        onLoad={() =>
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start(() =>
            setLoaded(true)
          )
        }
        style={[S.img, { opacity }]}
        resizeMode={resizeMode}
      />
    </View>
  );
}
function pseudoRating(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const v = 3.5 + ((h % 140) / 140) * 1.4;
  return Math.round(v * 10) / 10;
}
function pseudoReviewsCount(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 131 + id.charCodeAt(i)) >>> 0;
  return 80 + (h % 160);
}
function mediaKey(u: string) {
  try {
    const url = new URL(u);
    let seg = decodeURIComponent(url.pathname.toLowerCase()).split("/").filter(Boolean).pop() || "";
    seg = seg.split("?")[0];
    seg = seg.replace(/\.[a-z0-9]+$/i, "");
    seg = seg.replace(/_(source|compressed|large|small)$/i, "");
    seg = seg.replace(/[_-]\d+x\d+$/i, "");
    seg = seg
      .replace(/[ _-]copy\d*$/i, "")
      .replace(/[ _-]img\d*$/i, "")
      .replace(/\(\d+\)$/i, "")
      .replace(/[ _-]\d+$/i, "");
    seg = seg.replace(/^(image|img|photo|pic)[ _-]*$/i, "$1");
    return seg || url.pathname.toLowerCase();
  } catch {
    let p = u.split("?")[0].toLowerCase();
    p = p.replace(/^https?:\/\/[^/]+/i, "");
    let seg = decodeURIComponent(p).split("/").filter(Boolean).pop() || "";
    seg = seg.replace(/\.[a-z0-9]+$/i, "");
    seg = seg.replace(/_(source|compressed|large|small)$/i, "");
    seg = seg.replace(/[_-]\d+x\d+$/i, "");
    seg = seg
      .replace(/[ _-]copy\d*$/i, "")
      .replace(/[ _-]img\d*$/i, "")
      .replace(/\(\d+\)$/i, "")
      .replace(/[ _-]\d+$/i, "");
    return seg || p;
  }
}
function dedupeMedia(urls: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const k = mediaKey(u);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
  }
  const compact: string[] = [];
  for (const u of out) {
    if (compact.length && mediaKey(compact[compact.length - 1]) === mediaKey(u)) continue;
    compact.push(u);
  }
  return compact;
}

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pid = (id || "").toString();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string>("");
  const [p, setP] = React.useState<ProductDto | null>(null);
  const [imgs, setImgs] = React.useState<string[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [fullOpen, setFullOpen] = React.useState(false);
  const [resizeMode, setResizeMode] = React.useState<"contain" | "cover">("contain");
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [qty, setQty] = React.useState<number>(1);
  const [adding, setAdding] = React.useState(false);
  const [inFav, setInFav] = React.useState(false);
  const [summary, setSummary] = React.useState<ReviewSummary>({ avg: 0, total: 0 });
  const [seller, setSeller] = React.useState<Seller | null>(null);
  const [similar, setSimilar] = React.useState<MiniProduct[]>([]);

  const onBack = React.useCallback(() => {
    if ((router as any).canGoBack?.()) router.back();
    else router.replace("/home");
  }, [router]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!pid) {
        setErr("Невірний ID товара");
        setLoading(false);
        return;
      }
      setErr("");
      setLoading(true);
      try {
        const [prod, media] = await Promise.all([
          fetchProductById(pid),
          getProductMediaUrls(pid).then((a) => a.map((x) => x.url).filter(Boolean)),
        ]);
        if (!alive) return;
        setP(prod || null);
        setImgs(dedupeMedia(media));
        fetchReviewSummary(pid).then((v) => alive && setSummary(v)).catch(() => {});
        fetchSellerByProduct(pid).then((v) => alive && setSeller(v)).catch(() => {});
        fetchSimilar(prod || {}).then((v) => alive && setSimilar(v)).catch(() => {});
        const vars = normalizeVariations(prod);
        const preselect: Record<string, string> = {};
        vars.forEach((v) => {
          if (v.values[0]) preselect[v.name] = v.values[0];
        });
        setSelected(preselect);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Помилка завантаження");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pid]);

  const discounted =
    typeof p?.price === "number" &&
    typeof p?.discountPrice === "number" &&
    p.discountPrice > 0 &&
    p.price > p.discountPrice;
  const price: number | undefined = discounted
    ? p?.discountPrice ?? undefined
    : typeof p?.price === "number"
    ? p.price
    : undefined;
  const showOld = discounted;
  const percent = discounted
    ? Math.max(1, Math.round((1 - p!.discountPrice! / p!.price!) * 100))
    : p?.discountPercentage
    ? Math.round(p.discountPercentage)
    : 0;
  const badge = stockBadge(p || undefined);

  const onShare = async () => {
    try {
      await Share.share({ message: `${p?.name || "Товар"} — ${priceFmt(price)} ₴`, url: imgs[0] || undefined });
    } catch {}
  };
  const onToggleFav = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Увійдіть", "Щоб зберегти в обране, увійдіть у свій акаунт.", [
          { text: "Скасувати", style: "cancel" },
          { text: "Увійти", onPress: () => router.push("/sign-in") },
        ]);
        return;
      }
      const next = !inFav;
      await toggleFavorite(pid, next);
      setInFav(next);
    } catch (e: any) {
      Alert.alert("Помилка", e?.message || "Не вдалося оновити обране");
    }
  };
  const onAdd = async () => {
    try {
      setAdding(true);
      await addToCartV5(pid, qty);
      Alert.alert("Кошик", "Товар додано у кошик");
    } catch (e: any) {
      if (/Потрібно увійти/i.test(String(e?.message))) {
        Alert.alert("Увійдіть", "Щоб додати до кошика, увійдіть у свій акаунт.", [
          { text: "Скасувати", style: "cancel" },
          { text: "Увійти", onPress: () => router.push("/sign-in") },
        ]);
      } else {
        Alert.alert("Помилка", e?.message || "Не вдалося додати");
      }
    } finally {
      setAdding(false);
    }
  };
  const openReviews = () => router.push(`/product/reviews?id=${encodeURIComponent(pid)}` as any);

  if (loading) return <View style={[S.screen, S.center]}><ActivityIndicator /></View>;
  if (err || !p) {
    return (
      <View style={[S.screen, S.center]}>
        <Text style={{ color: BAD, marginBottom: 10 }}>{err || "Товар не знайдено"}</Text>
        <Pressable onPress={onBack} style={({ pressed }) => [S.backSolo, pressed && { opacity: 0.9 }]}>
          <FontAwesome name="chevron-left" size={16} color={ACCENT} />
          <Text style={S.backSoloText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const variations = normalizeVariations(p);
  const specs = normalizeSpecs(p);

  return (
    <View style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={S.gallery}>
          {imgs.length ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / W);
                  if (i !== idx) setIdx(i);
                }}
                scrollEventThrottle={16}
              >
                {imgs.map((u, i) => (
                  <Pressable key={u + i} onPress={() => setFullOpen(true)} style={{ width: W, height: GALLERY_H }}>
                    <FadeInImage uri={u} resizeMode={resizeMode} />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <View style={[S.gallery, S.center]}>
              <Text style={{ color: SUBTEXT }}>Немає фото</Text>
            </View>
          )}
        </View>

        <View style={S.dotsBelow}>{imgs.map((_, i) => <Dot key={i} active={i === idx} />)}</View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.thumbRow}>
          {imgs.map((u, i) => (
            <Pressable key={"t" + i} onPress={() => setIdx(i)} style={[S.thumb, i === idx && S.thumbActive]}>
              <Image source={{ uri: u }} style={{ width: 60, height: 60, borderRadius: 8 }} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={S.floatBtns}>
          <IconBtn icon="share" onPress={onShare} />
          <IconBtn icon={inFav ? "heart" : "heart-o"} tint={inFav ? "red" : ACCENT} onPress={onToggleFav} />
        </View>

        <View style={S.card}>
          <Text style={S.title} numberOfLines={3}>
            {p.name || "Товар"}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Text style={S.price}>{priceFmt(price)} ₴</Text>
              {showOld ? <Text style={S.oldPrice}>{priceFmt(p.price)} ₴</Text> : null}
              {percent > 0 ? (
                <View style={S.badge}>
                  <Text style={S.badgeText}>-{percent}%</Text>
                </View>
              ) : null}
            </View>

            <View style={[S.stock, { backgroundColor: badge.bg }]}>
              <Text style={[S.stockText, { color: badge.color }]}>{badge.label}</Text>
            </View>

            {(() => {
              const avg = pseudoRating(pid);
              const total = pseudoReviewsCount(pid);
              return (
                <Pressable
                  onPress={openReviews}
                  style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 6 }, pressed && { opacity: 0.85 }]}
                >
                  <FontAwesome name="star" size={16} color="#fbbf24" />
                  <Text style={{ color: TEXT, fontWeight: "800" }}>{avg.toFixed(1)}</Text>
                  <Text style={{ color: SUBTEXT }}>/5 • {total} відгуків</Text>
                </Pressable>
              );
            })()}
          </View>

          {Array.isArray(p.categoryPath) && p.categoryPath.length ? (
            <Text style={S.cat} numberOfLines={2}>
              Категорія: {p.categoryPath.join(" / ")}
            </Text>
          ) : null}
        </View>

        {variations.length ? (
          <View style={S.card}>
            <Text style={S.blockTitle}>Варіації</Text>
            {variations.map((v) => (
              <View key={v.name} style={{ marginBottom: 8 }}>
                <Text style={{ color: SUBTEXT, marginBottom: 6 }}>{v.name}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {v.values.map((val) => {
                    const active = selected[v.name] === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => setSelected((s) => ({ ...s, [v.name]: val }))}
                        style={({ pressed }) => [S.chip, active && S.chipActive, pressed && { opacity: 0.95 }]}
                      >
                        <Text style={[S.chipText, active && S.chipTextActive]}>{val}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={S.card}>
          <Text style={S.blockTitle}>Кількість</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <RoundBtn icon="minus" onPress={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} />
            <Text style={{ minWidth: 36, textAlign: "center", fontWeight: "800", color: TEXT, fontSize: 18 }}>{qty}</Text>
            <RoundBtn icon="plus" onPress={() => setQty((q) => Math.min(999, q + 1))} />
          </View>
        </View>

        {p.description ? (
          <View style={S.card}>
            <Text style={S.blockTitle}>Опис</Text>
            <Text style={S.desc}>{p.description}</Text>
          </View>
        ) : null}

        {seller ? (
          <View style={S.card}>
            <Text style={S.blockTitle}>Продавець</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: TEXT, fontWeight: "800" }}>{seller.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <FontAwesome name="star" size={14} color="#fbbf24" />
                  <Text style={{ color: TEXT, fontWeight: "700" }}>{(seller.rating ?? 0).toFixed(1)}</Text>
                  <Text style={{ color: SUBTEXT }}>({seller.reviews ?? 0})</Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push("/catalog" as any)}
                style={({ pressed }) => [S.linkBtn, pressed && { opacity: 0.95 }]}
              >
                <Text style={{ color: ACCENT, fontWeight: "800" }}>В магазин</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Accordion title="Доставка" body={<Text style={{ color: TEXT }}>Нова Пошта, Укрпошта, курʼєр. Умови та терміни залежать від продавця.</Text>} />
        <Accordion title="Оплата" body={<Text style={{ color: TEXT }}>Онлайн-оплата карткою або при отриманні (якщо доступно).</Text>} />

        {specs.length ? (
          <Accordion
            title="Характеристики"
            body={
              <View style={{ gap: 8 }}>
                {specs.map((s) => (
                  <View key={s.name} style={{ flexDirection: "row", gap: 8 }}>
                    <Text style={{ color: SUBTEXT, width: 140 }}>{s.name}</Text>
                    <Text style={{ color: TEXT, flex: 1 }}>{s.value}</Text>
                  </View>
                ))}
              </View>
            }
          />
        ) : null}

        <View style={S.card}>
          <Text style={S.blockTitle}>Відгуки</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <FontAwesome name="star" size={16} color="#fbbf24" />
              <Text style={{ color: TEXT, fontWeight: "800" }}>{pseudoRating(pid).toFixed(1)}</Text>
              <Text style={{ color: SUBTEXT }}>/ 5</Text>
            </View>
            <Text style={{ color: SUBTEXT }}>{pseudoReviewsCount(pid)} відгуків</Text>
          </View>
          <Pressable onPress={openReviews} style={({ pressed }) => [S.moreBtn, pressed && { opacity: 0.95 }]}>
            <Text style={S.moreText}>Читати всі відгуки</Text>
          </Pressable>
        </View>

        {similar.length ? (
          <View style={S.card}>
            <Text style={S.blockTitle}>Схожі товари</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {similar.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => router.push(`/product/id?id=${encodeURIComponent(it.id)}` as any)}
                  style={({ pressed }) => [S.simCard, pressed && { opacity: 0.95 }]}
                >
                  <View style={{ width: 120, height: 120, backgroundColor: "#f8fafc", borderRadius: 10, overflow: "hidden" }}>
                    {it.firstImage ? (
                      <Image source={{ uri: it.firstImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={[S.center, { flex: 1 }]}>
                        <Text style={{ color: SUBTEXT }}>Фото</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} style={{ color: TEXT, fontSize: 12, marginTop: 6 }}>
                    {it.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                    <Text style={{ color: RED, fontWeight: "800" }}>
                      {priceFmt(it.hasDiscount && it.discountPrice ? it.discountPrice : it.price)} ₴
                    </Text>
                    {it.hasDiscount && it.discountPrice && it.price && it.price > it.discountPrice ? (
                      <Text style={{ color: SUBTEXT, textDecorationLine: "line-through" }}>{priceFmt(it.price)} ₴</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={S.footer}>
        <Pressable onPress={onBack} style={({ pressed }) => [S.backBtn, pressed && { opacity: 0.92 }]}>
          <FontAwesome name="chevron-left" size={16} color={ACCENT} />
          <Text style={S.backText}>Назад</Text>
        </Pressable>

        <Pressable
          onPress={onAdd}
          disabled={adding}
          style={({ pressed }) => [S.buyBtn, pressed && { opacity: 0.92 }, adding && { opacity: 0.7 }]}
        >
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={S.buyText}>Додати у кошик</Text>}
        </Pressable>
      </View>

      <Modal visible={fullOpen} transparent animationType="fade" onRequestClose={() => setFullOpen(false)}>
        <View style={S.modalWrap}>
          <View style={S.modalTop}>
            <Pressable onPress={() => setFullOpen(false)} style={S.modalTopBtn}>
              <FontAwesome name="close" size={18} color="#fff" />
              <Text style={S.modalTopText}>Закрити</Text>
            </Pressable>
            <Pressable
              onPress={() => setResizeMode((m) => (m === "contain" ? "cover" : "contain"))}
              style={S.modalTopBtn}
            >
              <FontAwesome name="arrows-alt" size={18} color="#fff" />
              <Text style={S.modalTopText}>{resizeMode === "contain" ? "Заповнити" : "Вписати"}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / W);
              if (i !== idx) setIdx(i);
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {imgs.map((u, i) => (
              <ScrollView
                key={"F" + i}
                style={{ width: W, height: "100%" }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
              >
                <Image source={{ uri: u }} style={{ width: W, height: W }} resizeMode={resizeMode} />
              </ScrollView>
            ))}
          </ScrollView>
          <View style={[S.dotsBelow, { marginBottom: 12 }]}>{imgs.map((_, i) => <Dot key={"fd" + i} active={i === idx} />)}</View>
        </View>
      </Modal>
    </View>
  );
}

function normalizeVariations(p?: ProductDto): Array<{ name: string; values: string[] }> {
  if (!p) return [];
  if (Array.isArray(p.variations)) return p.variations.filter((v) => v?.name && Array.isArray(v.values) && v.values.length);
  if (p.variations && typeof p.variations === "object") {
    return Object.entries(p.variations)
      .map(([k, v]) => ({ name: k, values: Array.isArray(v) ? v : [] }))
      .filter((v) => v.values.length);
  }
  if (Array.isArray(p.attributes)) {
    const out: Array<{ name: string; values: string[] }> = [];
    p.attributes.forEach((a) => {
      const vals = String(a.value || "")
        .split(/[;,/|]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (a.name && vals.length > 1) out.push({ name: a.name, values: vals });
    });
    return out;
  }
  return [];
}
function normalizeSpecs(p?: ProductDto): Array<{ name: string; value: string }> {
  if (!p) return [];
  if (Array.isArray(p.attributes)) return p.attributes.map((a) => ({ name: a.name, value: a.value }));
  if (p.attributes && typeof p.attributes === "object") {
    return Object.entries(p.attributes).map(([k, v]) => ({ name: String(k), value: String(v) }));
  }
  return [];
}
function IconBtn({ icon, onPress, tint = ACCENT }: { icon: any; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [S.iconBtn, pressed && { opacity: 0.9 }]}>
      <FontAwesome name={icon} size={18} color={tint} />
    </Pressable>
  );
}
function RoundBtn({ icon, onPress, disabled }: { icon: "plus" | "minus"; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [S.roundBtn, pressed && { opacity: 0.9 }, disabled && { opacity: 0.5 }]}
    >
      <FontAwesome name={icon} size={16} color={TEXT} />
    </Pressable>
  );
}
function Accordion({ title, body }: { title: string; body: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={S.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, pressed && { opacity: 0.9 }]}
      >
        <Text style={S.blockTitle}>{title}</Text>
        <FontAwesome name={open ? "chevron-up" : "chevron-down"} size={14} color={SUBTEXT} />
      </Pressable>
      {open ? <View style={{ marginTop: 4 }}>{body}</View> : null}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  linkBtn: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  gallery: { width: "100%", backgroundColor: "#f8fafc" },
  imgWrap: { width: "100%", height: GALLERY_H, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  img: { width: "100%", height: "100%" },
  imgLoader: { position: "absolute", zIndex: 1, top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  imgLoaderText: { marginTop: 8, color: SUBTEXT, fontSize: 12 },
  dotsBelow: { flexDirection: "row", justifyContent: "center", alignItems: "center", height: 20, marginTop: 8 },
  thumbRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  thumb: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderColor: BORDER, overflow: "hidden" },
  thumbActive: { borderColor: ACCENT, borderWidth: 2 },
  floatBtns: { position: "absolute", right: 12, top: 12, gap: 8 },
  iconBtn: { backgroundColor: "#ffffffee", borderRadius: 999, padding: 10, borderWidth: 1, borderColor: BORDER },
  card: {
    marginTop: 12,
    marginHorizontal: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  title: { color: TEXT, fontSize: 20, fontWeight: "800" },
  price: { color: RED, fontSize: 24, fontWeight: "900" },
  oldPrice: { color: SUBTEXT, textDecorationLine: "line-through", marginLeft: 2 },
  badge: { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontWeight: "800" },
  cat: { color: SUBTEXT, marginTop: 8 },
  stock: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  stockText: { fontSize: 12, fontWeight: "800" },
  blockTitle: { color: TEXT, fontWeight: "800", marginBottom: 8 },
  desc: { color: TEXT, lineHeight: 20 },
  chip: { borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: "#eef2ff", borderColor: "#dbeafe" },
  chipText: { color: TEXT, fontWeight: "700" },
  chipTextActive: { color: ACCENT },
  moreBtn: { marginTop: 10, borderWidth: 1, borderColor: "#dbeafe", backgroundColor: "#eef2ff", borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  moreText: { color: ACCENT, fontWeight: "800" },
  simCard: { width: 140, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: BG,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    ...Platform.select({ ios: { paddingBottom: 16 }, android: { paddingBottom: 12 } }),
  },
  backBtn: {
    flex: 1,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
    flexDirection: "row",
    gap: 8,
  },
  backText: { color: ACCENT, fontWeight: "800", fontSize: 16 },
  buyBtn: { flex: 2, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  buyText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  backSolo: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backSoloText: { color: ACCENT, fontWeight: "800" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", alignItems: "center", justifyContent: "center" },
  modalTop: { position: "absolute", top: 24, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", zIndex: 2 },
  modalTopBtn: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  modalTopText: { color: "#fff", fontWeight: "800" },
});
