import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { searchProductsByName, getProductMediaUrls, Product } from "@/src/api/productService.mobile";
import TabBar from "@/src/ui/TabBar";

const BG = "#ffffff";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const BORDER = "#e5e7eb";
const ACCENT = "#5a63d1";
const RED = "#dc2626";

export default function Favorites() {
  const r = useRouter();
  const [item, setItem] = React.useState<Product | null>(null);
  const [img, setImg] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const found = await searchProductsByName("ноутбук", "uk");
        if (found?.length) {
          setItem(found[0]);
          const media = await getProductMediaUrls(found[0].id);
          setImg(media[0]?.url || "");
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[S.root, S.center]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[S.root, S.center]}>
        <View style={S.emptyIcon}>
          <FontAwesome name="heart" size={22} color="#fff" />
        </View>
        <Text style={S.emptyTitle}>Тут поки порожньо</Text>
        <Text style={S.emptySub}>Зберігайте товари в обране — вони з’являться тут</Text>
        <Pressable onPress={() => r.push("/catalog" as any)} style={S.btn}>
          <Text style={S.btnText}>До каталогу</Text>
        </Pressable>
        <TabBar active="favorites" />
      </View>
    );
  }

  const price = item.discountPrice ?? item.finalPrice ?? item.price ?? 0;
  const oldPrice = item.price && price < item.price ? item.price : null;

  return (
    <View style={S.root}>
      <Text style={S.sectionTitle}>Ваші обрані товари</Text>

      <View style={S.card}>
        <Pressable
          style={S.thumbWrap}
          onPress={() => r.push(`/product/id?id=${encodeURIComponent(item.id)}` as any)}
        >
          <Image source={{ uri: img }} style={S.thumb} />
        </Pressable>

        <View style={{ flex: 1, padding: 10 }}>
          <Text numberOfLines={2} style={S.name}>{item.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <Text style={S.price}>{formatPrice(price)} ₴</Text>
            {oldPrice ? <Text style={S.oldPrice}>{formatPrice(oldPrice)} ₴</Text> : null}
          </View>
        </View>

        <Pressable onPress={() => setItem(null)} style={S.heartBtn} hitSlop={10}>
          <FontAwesome name="heart" size={20} color={RED} />
        </Pressable>
      </View>

      <TabBar active="favorites" />
    </View>
  );
}

function formatPrice(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n);
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, padding: 16, paddingBottom: 96 },
  center: { justifyContent: "center", alignItems: "center" },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "800" },
  emptySub: { color: SUBTEXT, marginTop: 6, textAlign: "center" },
  btn: {
    marginTop: 14,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnText: { color: "#fff", fontWeight: "800" },

  sectionTitle: { color: TEXT, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbWrap: { width: 100, height: 100, backgroundColor: "#f3f4f6" },
  thumb: { width: "100%", height: "100%" },
  name: { color: TEXT },
  price: { color: RED, fontWeight: "800" },
  oldPrice: { color: SUBTEXT, textDecorationLine: "line-through" },
  heartBtn: { width: 40, justifyContent: "center", alignItems: "center" },
});
