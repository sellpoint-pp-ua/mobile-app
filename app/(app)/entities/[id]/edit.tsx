import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { productsCrud } from "../../../../src/features/products/hooks";
import { t } from "../../../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  border: "#2A2F36",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  secondary: "#9aa0a6",
  accent: "#66FCF1",
  accentPressed: "#45A29E",
};

export default function EntityEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const idStr = String(id ?? "");

  const { data, isLoading, isError } = productsCrud.useItem(idStr);
  const updateMutation = productsCrud.useUpdate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name ?? "");
      setPrice(data.price != null ? String(data.price) : "");
      setDescription(data.description ?? "");
    }
  }, [data]);

  if (!idStr) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "tomato", fontWeight: "700" }}>{t("entities_invalid_id")}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>{t("entities_edit")}</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: "tomato", fontWeight: "700" }}>{t("entities_load_error")}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace(`/(app)/entities/${idStr}`)}
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

  function onSave() {
    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: price !== "" ? Number(price) : undefined,
    };

    if (!payload.name) {
      Alert.alert("Помилка", "Заповніть поле «Назва»");
      return;
    }

    updateMutation.mutate(
      { id: idStr, payload },
      {
        onSuccess: () => {
          Alert.alert(t("done"), "Запис оновлено", [
            { text: t("ok"), onPress: () => router.replace(`/(app)/entities/${idStr}`) },
          ]);
        },
        onError: (e: any) => {
          Alert.alert("Не вдалось зберегти", e?.message ?? "Unknown error");
        },
      }
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Карточка форми */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "800" }}>
            {t("entities_edit")}
          </Text>
          <Text style={{ color: COLORS.secondary, marginTop: 4 }}>
            Внесіть зміни та натисніть «{t("entities_save")}».
          </Text>

          {/* Назва */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>{t("entities_name")}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Назва"
              placeholderTextColor={COLORS.secondary}
              style={{
                backgroundColor: "#14181F",
                color: COLORS.text,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          {/* Ціна */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>{t("entities_price")}</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.secondary}
              style={{
                backgroundColor: "#14181F",
                color: COLORS.text,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          </View>

          {/* Опис */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>{t("entities_description")}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Короткий опис"
              placeholderTextColor={COLORS.secondary}
              multiline
              style={{
                backgroundColor: "#14181F",
                color: COLORS.text,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
          </View>
        </View>

        {/* Кнопки дій */}
        <View style={{ gap: 10, marginTop: 16 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSave}
            disabled={updateMutation.isPending || !name.trim()}
            style={{
              backgroundColor:
                updateMutation.isPending || !name.trim() ? "#2d3a45" : COLORS.accent,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.bg, fontSize: 16, fontWeight: "800" }}>
              {updateMutation.isPending ? "Збереження..." : t("entities_save")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace(`/(app)/entities/${idStr}`)}
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
              Назад до деталей
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
