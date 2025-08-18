import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { productsCrud } from "../../../src/features/products/hooks";
import { t } from "../../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  cardPressed: "#1B222B",
  border: "#2A2F36",
  accent: "#66FCF1",
  accentPressed: "#45A29E",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  secondary: "#9aa0a6",
  danger: "#ef4444",
};

type Item = {
  id: string;
  name: string;
  price?: number | null;
  description?: string | null;
};

export default function EntitiesIndex() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = productsCrud.useList();
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo<Item[]>(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const HeaderBar = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text style={{ color: COLORS.accent, fontSize: 22, fontWeight: "800" }}>
        {t("entities_title")}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(app)/entities/create")}
        style={{
          backgroundColor: COLORS.accent,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ color: COLORS.bg, fontWeight: "800" }}>
          + {t("entities_add")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const Card = ({ item }: { item: Item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/(app)/entities/${item.id}`)}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}
        numberOfLines={1}
      >
        {item.name || "—"}
      </Text>

      {item.price != null && (
        <Text style={{ color: COLORS.muted, marginTop: 4 }}>
          {t("entities_price")}: {item.price}
        </Text>
      )}

      {!!item.description && (
        <Text style={{ color: COLORS.secondary, marginTop: 6 }} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <ActivityIndicator />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>
          {t("entities_title")}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 16 }}>
          {t("entities_load_error")}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => refetch()}
          style={{
            marginTop: 12,
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.bg, fontWeight: "800" }}>{t("ok")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Empty = () => (
    <View style={{ alignItems: "center", marginTop: 40 }}>
      <Text style={{ color: COLORS.muted }}>Поки що пусто.</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(app)/entities/create")}
        style={{
          marginTop: 12,
          backgroundColor: COLORS.accent,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: COLORS.bg, fontWeight: "800" }}>
          + {t("entities_create")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16 }}>
      <HeaderBar />

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => <Card item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={Empty}
        refreshControl={
          <RefreshControl
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListFooterComponent={
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.replace("/(app)/home")}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: "700" }}>
                На головну
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
