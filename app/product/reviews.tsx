import * as React from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { OpenAPI } from "@/src/api/client";
import { getToken } from "@/src/auth/token";

const BG = "#f3f4f6";
const CARD = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#4563d1";
const BADGE_GREEN = { bg: "#dcfce7", text: "#166534" };
const BADGE_ORANGE = { bg: "#ffedd5", text: "#9a3412" };
const BADGE_RED = { bg: "#fee2e2", text: "#991b1b" };

type Product = {
  id?: string;
  name?: string;
  price?: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  finalPrice?: number;
  discountPercentage?: number;
  quantityStatus?: number | string;
  quantity?: number;
};

type Review = {
  rating: number;
  userId: string;
  comment: string;
  createdAt: string;
  reactions?: Record<string, boolean>;
  positiveCount?: number;
  negativeCount?: number;
};

function priceFmt(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try { return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n); }
  catch { return Math.round(n).toString(); }
}
function dateFmt(iso?: string) {
  try { const d = new Date(iso || ""); const dd = String(d.getDate()).padStart(2,"0"); const mm = String(d.getMonth()+1).padStart(2,"0"); const yy = d.getFullYear(); return `${dd}.${mm}.${yy}`; }
  catch { return ""; }
}

async function fetchProduct(productId: string): Promise<Product | null> {
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/Product/get-by-id/${encodeURIComponent(productId)}`,
    `${base}/api/Product/GetById?id=${encodeURIComponent(productId)}`,
    `${base}/api/Product/${encodeURIComponent(productId)}`,
  ];
  for (const u of urls) {
    try { const r = await fetch(u); if (!r.ok) continue; const j = await r.json(); return (j?.data ?? j?.item ?? j) as Product; }
    catch {}
  }
  return null;
}
async function fetchReviews(productId: string): Promise<Review[]> {
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/ProductReview/list/${encodeURIComponent(productId)}`,
    `${base}/api/products/reviews/${encodeURIComponent(productId)}`,
  ];
  for (const u of urls) {
    try { const r = await fetch(u, { cache: "no-store" as any }); if (!r.ok) continue; const j = await r.json(); const list = Array.isArray(j?.comments) ? j.comments : (Array.isArray(j) ? j : []); return list as Review[]; }
    catch {}
  }
  return [];
}
async function setReaction(productId: string, commentUserId: string, reaction: boolean) {
  const token = await getToken(); if (!token) throw new Error("Потрібно увійти");
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/products/reviews/set-reaction?productId=${encodeURIComponent(productId)}&commentUserId=${encodeURIComponent(commentUserId)}&reaction=${reaction}`,
    `${base}/api/ProductReview/react?productId=${encodeURIComponent(productId)}&commentUserId=${encodeURIComponent(commentUserId)}&reaction=${reaction}`,
  ];
  for (const u of urls) {
    const r = await fetch(u, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) return;
  }
  throw new Error("Не вдалося відправити реакцію");
}
async function deleteReaction(productId: string, commentUserId: string) {
  const token = await getToken(); if (!token) throw new Error("Потрібно увійти");
  const base = (OpenAPI.baseUrl || "").replace(/\/+$/,"");
  const urls = [
    `${base}/api/products/reviews/delete-reaction?productId=${encodeURIComponent(productId)}&commentUserId=${encodeURIComponent(commentUserId)}`,
    `${base}/api/ProductReview/delete-reaction?productId=${encodeURIComponent(productId)}&commentUserId=${encodeURIComponent(commentUserId)}`,
  ];
  for (const u of urls) {
    const r = await fetch(u, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) return;
  }
  throw new Error("Не вдалося скасувати реакцію");
}

export default function ProductReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pid = (id || "").toString();

  const [loading, setLoading] = React.useState(true);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [showAll, setShowAll] = React.useState(false);

  const primaryPrice = React.useMemo(() => {
    if (!product) return undefined;
    const base = product.hasDiscount ? (product.finalPrice ?? product.discountPrice ?? product.price) : product.price;
    return base;
  }, [product]);

  const stockState: "in" | "low" | "out" = React.useMemo(() => {
    const qs = product?.quantityStatus;
    const qsStr = typeof qs === "string" ? qs.toLowerCase() : "";
    if (typeof qs === "number") {
      if (qs === 3) return "out";
      if (qs === 2) return "low";
      return "in";
    }
    if (typeof product?.quantity === "number") {
      if (product.quantity <= 0) return "out";
      if (product.quantity <= 3) return "low";
      return "in";
    }
    if (qsStr.includes("нема") || qsStr.includes("відсут") || qsStr.includes("out")) return "out";
    if (qsStr.includes("закінч") || qsStr.includes("low")) return "low";
    return "in";
  }, [product]);

  const badge = stockState === "in"
    ? { bg: BADGE_GREEN.bg, text: BADGE_GREEN.text, label: "В наявності" }
    : stockState === "low"
      ? { bg: BADGE_ORANGE.bg, text: BADGE_ORANGE.text, label: "Закінчується" }
      : { bg: BADGE_RED.bg, text: BADGE_RED.text, label: "Немає в наявності" };

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!pid) { setLoading(false); return; }
      try {
        setLoading(true);
        const [p, r] = await Promise.all([fetchProduct(pid), fetchReviews(pid)]);
        if (!alive) return;
        setProduct(p);
        setReviews(r);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [pid]);

  const distribution = React.useMemo(() => {
    const buckets = [0,0,0,0,0];
    for (const r of reviews) {
      const i = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      buckets[i] += 1;
    }
    return buckets;
  }, [reviews]);

  const total = reviews.length;
  const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
  const avg = total ? (sum / total) : 0;
  const visible = showAll ? reviews : reviews.slice(0, 10);

  const onBack = () => {
    // @ts-ignore
    if ((router as any).canGoBack?.()) router.back(); else router.replace("/home");
  };

  return (
    <View style={R.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={R.header}>
          <Pressable onPress={onBack} style={({ pressed }) => [R.back, pressed && { opacity: 0.9 }]}>
            <FontAwesome name="chevron-left" size={16} color={ACCENT} />
            <Text style={R.backText}>Назад</Text>
          </Pressable>
          <Text style={R.h1} numberOfLines={2}>Відгуки покупців про {product?.name || "…"}</Text>
          <Text style={R.sub}>{total} відгуків</Text>
        </View>

        <View style={R.card}>
          <Text style={R.pname} numberOfLines={2}>{product?.name || "Товар"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
            <Text style={R.price}>{primaryPrice ? `${priceFmt(primaryPrice)} ₴` : "—"}</Text>
            {product?.hasDiscount && product?.discountPercentage
              ? <View style={R.badge}><Text style={R.badgeText}>-{Math.round(product.discountPercentage)}%</Text></View>
              : null}
            <View style={[R.stock, { backgroundColor: badge.bg }]}><Text style={[R.stockText, { color: badge.text }]}>{badge.label}</Text></View>
          </View>
        </View>

        <View style={R.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <FontAwesome name="star" size={18} color="#fbbf24" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: TEXT }}>{avg.toFixed(1)}</Text>
            <Text style={{ color: SUBTEXT }}>/ 5</Text>
          </View>
          <View style={{ marginTop: 10, gap: 6 }}>
            {[5,4,3,2,1].map(star => {
              const count = distribution[star - 1] || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <View key={star} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <FontAwesome name="star" size={14} color="#fbbf24" />
                  <Text style={{ width: 18, color: TEXT }}>{star}</Text>
                  <View style={{ flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                    <View style={{ width: `${pct}%`, height: "100%", backgroundColor: "#fbbf24" }} />
                  </View>
                  <Text style={{ width: 28, textAlign: "right", color: SUBTEXT }}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10, paddingHorizontal: 12, marginTop: 8 }}>
          {loading ? (
            <View style={[R.card, { height: 120 }]}><ActivityIndicator /></View>
          ) : visible.length === 0 ? (
            <View style={R.card}><Text style={{ color: SUBTEXT }}>Відгуки поки що відсутні.</Text></View>
          ) : (
            visible.map((rev, i) => (
              <ReviewItem
                key={`${rev.userId}-${rev.createdAt}-${i}`}
                review={rev}
                productId={pid}
              />
            ))
          )}
        </View>

        {total > 10 ? (
          <View style={{ padding: 12 }}>
            <Pressable onPress={() => setShowAll(v => !v)} style={({ pressed }) => [R.more, pressed && { opacity: 0.95 }]}>
              <Text style={R.moreText}>{showAll ? "Показати менше" : "Показати ще"}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ReviewItem({ review, productId }: { review: Review; productId: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState<number>(review.positiveCount ?? 0);
  const [dislikeCount, setDislikeCount] = React.useState<number>(review.negativeCount ?? 0);
  const [myReaction, setMyReaction] = React.useState<null | "like" | "dislike">(null);

  const toggleReaction = async (wantLike: boolean) => {
    try {
      if ((wantLike && myReaction === "like") || (!wantLike && myReaction === "dislike")) {
        await deleteReaction(productId, review.userId);
        if (wantLike) setLikeCount(v => Math.max(0, v - 1)); else setDislikeCount(v => Math.max(0, v - 1));
        setMyReaction(null);
        return;
      }
      if (myReaction) {
        await deleteReaction(productId, review.userId);
        if (myReaction === "like") setLikeCount(v => Math.max(0, v - 1));
        if (myReaction === "dislike") setDislikeCount(v => Math.max(0, v - 1));
      }
      await setReaction(productId, review.userId, wantLike);
      if (wantLike) { setLikeCount(v => v + 1); setMyReaction("like"); }
      else { setDislikeCount(v => v + 1); setMyReaction("dislike"); }
    } catch (e: any) {
      Alert.alert("Помилка", e?.message || "Не вдалося надіслати реакцію");
    }
  };

  return (
    <View style={R.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={{ fontWeight: "700", color: TEXT }}>Користувач</Text>
          <Text style={{ color: SUBTEXT, fontSize: 12 }}>{dateFmt(review.createdAt)}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FontAwesome key={i} name="star" size={16} color={i < Math.round(review.rating) ? "#4563d1" : "#e5e7eb"} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text numberOfLines={expanded ? undefined : 3} style={{ color: TEXT }}>{review.comment}</Text>
        {!expanded ? (
          <Pressable onPress={() => setExpanded(true)} style={{ marginTop: 6 }}>
            <Text style={{ color: ACCENT, fontWeight: "700" }}>Детальніше</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setExpanded(false)} style={{ marginTop: 6 }}>
            <Text style={{ color: ACCENT, fontWeight: "700" }}>Згорнути</Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 18 }}>
        <Pressable onPress={() => toggleReaction(true)} style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 6 }, pressed && { opacity: 0.9 }]}>
          <FontAwesome name="thumbs-up" size={18} color={myReaction === "like" ? ACCENT : SUBTEXT} />
          <Text style={{ color: myReaction === "like" ? ACCENT : SUBTEXT }}>{likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => toggleReaction(false)} style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 6 }, pressed && { opacity: 0.9 }]}>
          <FontAwesome name="thumbs-down" size={18} color={myReaction === "dislike" ? ACCENT : SUBTEXT} />
          <Text style={{ color: myReaction === "dislike" ? ACCENT : SUBTEXT }}>{dislikeCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const R = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", borderWidth: 1, borderColor: "#dbeafe", backgroundColor: "#eef2ff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  backText: { color: ACCENT, fontWeight: "800" },
  h1: { marginTop: 8, fontSize: 18, fontWeight: "800", color: TEXT },
  sub: { color: SUBTEXT, marginTop: 2 },

  card: { marginTop: 10, marginHorizontal: 12, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14 },
  pname: { color: TEXT, fontWeight: "800" },
  price: { color: TEXT, fontWeight: "900", fontSize: 20 },
  badge: { backgroundColor: "#fde2e2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#E53935", fontWeight: "800" },

  stock: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  stockText: { fontSize: 12, fontWeight: "700" },

  more: { backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#dbeafe", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  moreText: { color: ACCENT, fontWeight: "800" },
});
