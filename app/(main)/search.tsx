import * as React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OpenAPI } from "@/src/api/client";
import TabBar from "@/src/ui/TabBar";
import { getProductMediaUrls } from "@/src/api/productService.mobile";

type ProductDto = {
  id?: string | null;
  name?: string | null;
  price?: number;
  discountPrice?: number | null;
  hasDiscount?: boolean;
  discountPercentage?: number | null;
  categoryPath?: string[] | null;
};

type ProductFilterResponseDto = {
  pages?: number;
  products?: ProductDto[] | null;
};

const BG = "#ffffff";
const CARD = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT = "#111111";
const SUBTEXT = "#6b7280";
const ACCENT = "#4563d1";

const thumbCache = new Map<string, string | null>();

async function fetchThumb(productId: string): Promise<string | null> {
  if (!productId) return null;
  if (thumbCache.has(productId)) return thumbCache.get(productId)!;
  try {
    const media = await getProductMediaUrls(productId);
    const first = media[0]?.url || null;
    thumbCache.set(productId, first);
    return first;
  } catch {
    thumbCache.set(productId, null);
    return null;
  }
}

function formatPrice(n?: number | null) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return Math.round(n).toString();
  }
}

function ProductCard({
  item,
  onPress,
}: {
  item: ProductDto;
  onPress: (id?: string | null) => void;
}) {
  const id = item.id ?? undefined;
  const hasDiscount = !!item.hasDiscount && item.discountPrice != null;
  const price = hasDiscount ? item.discountPrice! : item.price;

  const [thumb, setThumb] = React.useState<string | null>(id ? (thumbCache.get(id) ?? null) : null);

  React.useEffect(() => {
    let alive = true;
    if (!id) return;
    if (thumbCache.has(id)) {
      setThumb(thumbCache.get(id) ?? null);
    } else {
      fetchThumb(id).then((t) => alive && setThumb(t));
    }
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <Pressable onPress={() => onPress(item.id)} style={({ pressed }) => [S.card, pressed && { opacity: 0.9 }]}>
      <View style={S.row}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={S.thumb} resizeMode="cover" />
        ) : (
          <View style={[S.thumb, S.thumbPlaceholder]}>
            <Text style={{ color: SUBTEXT, fontSize: 10 }}>немає фото</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={S.title} numberOfLines={2}>{item.name || "Товар"}</Text>
          <View style={S.priceRow}>
            <Text style={S.price}>{formatPrice(price)} ₴</Text>
            {hasDiscount ? (
              <>
                {typeof item.price === "number" ? (
                  <Text style={S.oldPrice}>{formatPrice(item.price)} ₴</Text>
                ) : null}
                {item.discountPercentage != null ? (
                  <Text style={S.discountBadge}>-{Math.round(item.discountPercentage)}%</Text>
                ) : null}
              </>
            ) : null}
          </View>
          {Array.isArray(item.categoryPath) && item.categoryPath.length > 0 ? (
            <Text style={S.cat} numberOfLines={1}>{item.categoryPath.join(" / ")}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { query } = useLocalSearchParams<{ query?: string }>();
  const q = (query ?? "").toString().trim();

  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState<number | null>(null);
  const [items, setItems] = React.useState<ProductDto[]>([]);

  const load = React.useCallback(
    async (mode: "reset" | "more" | "refresh" = "reset") => {
      if (!q) return;
      const nextPage = mode === "more" ? page + 1 : 1;
      mode === "refresh" ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const url = `${OpenAPI.baseUrl}/api/Product/get-by-name/${encodeURIComponent(q)}`;
        const body = { page: nextPage, pageSize: 20 };
        const res = await fetch(url, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ProductFilterResponseDto;
        const list = json.products ?? [];
        setPages(json.pages ?? null);
        if (mode === "more") {
          setItems((prev) => [...prev, ...list]);
          setPage(nextPage);
        } else {
          setItems(list);
          setPage(1);
        }
      } catch (e: any) {
        setError(e?.message || "Помилка запиту");
      } finally {
        mode === "refresh" ? setRefreshing(false) : setLoading(false);
      }
    },
    [q, page]
  );

  React.useEffect(() => {
    load("reset");
  }, [q]);

  const goDetails = (id?: string | null) => {
    if (!id) return;
    router.push(`/product/id?id=${encodeURIComponent(id)}` as any);
  };

  const canLoadMore = pages == null ? false : page < pages;

  return (
    <View style={S.root}>
      <Text style={S.header}>Результати: {q || "—"}</Text>

      {loading && items.length === 0 ? (
        <View style={S.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={S.center}>
          <Text style={{ color: "#dc2626" }}>Помилка: {error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={S.center}>
          <Text style={{ color: SUBTEXT }}>Нічого не знайдено</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => it.id ?? String(i)}
          renderItem={({ item }) => <ProductCard item={item} onPress={goDetails} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} tintColor={ACCENT} />}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (!loading && canLoadMore) load("more");
          }}
          ListFooterComponent={
            canLoadMore ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}

      <TabBar />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  row: { flexDirection: "row", gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#fff" },
  thumbPlaceholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: TEXT, fontWeight: "700", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  price: { color: TEXT, fontSize: 16, fontWeight: "800" },
  oldPrice: { color: SUBTEXT, textDecorationLine: "line-through" },
  discountBadge: { color: ACCENT, fontWeight: "800" },
  cat: { color: SUBTEXT, fontSize: 12 },
});
