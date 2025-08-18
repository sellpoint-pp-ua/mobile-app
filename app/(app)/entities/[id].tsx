import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { productsCrud } from "../../../src/features/products/hooks";
import { t } from "../../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  border: "#2A2F36",
  accent: "#66FCF1",
  accentPressed: "#45A29E",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  secondary: "#9aa0a6",
  danger: "#ef4444",
};

export default function EntityDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const idStr = String(id ?? "");
  const { data, isLoading, isError } = productsCrud.useItem(idStr);
  const removeMutation = productsCrud.useRemove();

  if (!idStr) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "tomato", fontWeight: "700" }}>
          {t("entities_invalid_id")}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>{t("entities_title")}</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "tomato", fontWeight: "700" }}>
          {t("entities_load_error")}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace("/(app)/entities")}
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

  function confirmDelete() {
    Alert.alert(
      t("confirm_delete_title"),
      t("confirm_delete_text"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("entities_delete"),
          style: "destructive",
          onPress: () => {
            removeMutation.mutate(idStr, {
              onSuccess: () => router.replace("/(app)/entities"),
            });
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* Карточка з даними */}
      <View
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: 16,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "800" }} numberOfLines={2}>
          {data.name || "—"}
        </Text>

        {data.price != null && (
          <Text style={{ color: COLORS.muted, marginTop: 6 }}>
            {t("entities_price")}: {data.price}
          </Text>
        )}

        {!!data.description && (
          <Text style={{ color: COLORS.secondary, marginTop: 10 }}>
            {data.description}
          </Text>
        )}
      </View>

      {/* Кнопки дій */}
      <View style={{ gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push(`/(app)/entities/${idStr}/edit`)}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.bg, fontSize: 16, fontWeight: "800" }}>
            {t("entities_edit")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={confirmDelete}
          style={{
            backgroundColor: COLORS.danger,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
            {t("entities_delete")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace("/(app)/entities")}
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
            На список
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
