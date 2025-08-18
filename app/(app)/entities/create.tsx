import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { productsCrud } from "../../../src/features/products/hooks";
import { t } from "../../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  border: "#2A2F36",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  secondary: "#9aa0a6",
  accent: "#66FCF1",
  accentPressed: "#45A29E",
  danger: "#ef4444",
};

export default function CreateEntity() {
  const router = useRouter();
  const createMutation = productsCrud.useCreate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");

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
    createMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert("Готово", "Запис створено", [
          { text: t("ok"), onPress: () => router.replace("/(app)/entities") },
        ]);
      },
      onError: (e: any) => {
        Alert.alert("Не вдалось створити", e?.message ?? "Unknown error");
      },
    });
  }

  const isSaving = createMutation.isPending;

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
            {t("entities_create")}
          </Text>
          <Text style={{ color: COLORS.secondary, marginTop: 4 }}>
            Заповніть поля нижче і натисніть «{t("entities_save")}».
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
          <Pressable
            onPress={onSave}
            disabled={isSaving || !name.trim()}
            style={({ pressed }) => ({
              backgroundColor: isSaving || !name.trim() ? "#2d3a45" : pressed ? COLORS.accentPressed : COLORS.accent,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            })}
          >
            <Text style={{ color: COLORS.bg, fontSize: 16, fontWeight: "800" }}>
              {isSaving ? "Збереження..." : t("entities_save")}
            </Text>
          </Pressable>

          <Link asChild href="/(app)/entities">
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: pressed ? COLORS.card : "transparent",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
              })}
            >
              <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: "700" }}>
                На список
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
