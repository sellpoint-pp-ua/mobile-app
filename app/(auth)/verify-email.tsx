import React, { useEffect, useState } from "react";
import { View, Text, Alert, KeyboardAvoidingView, Platform, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { t } from "../../src/i18n/ua";
import { useSendEmailCode, useVerifyEmailCode } from "../../src/features/auth/register";

/** Бело-фиолетовая палитра */
const UI = {
  bg: "#ffffff",
  text: "#111827",
  sub: "#6b7280",
  border: "#e5e7eb",
  primary: "#7C3AED",
  primaryText: "#ffffff",
  danger: "#ef4444",
};

export default function VerifyEmail() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const verify = useVerifyEmailCode();
  const resend = useSendEmailCode();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function onSubmit() {
    try {
      if (!code.trim()) throw new Error(t("err_code") || "Введіть код з листа");
      await verify.mutateAsync(code.trim());
      Alert.alert("OK", "Email підтверджено. Увійдіть у систему.");
      router.replace("/(auth)/sign-in");
    } catch (e: any) {
      Alert.alert(t("error") || "Помилка", String(e?.message || "Невірний або протермінований код"));
    }
  }

  async function onResend() {
    try {
      if (cooldown > 0) return;
      await resend.mutateAsync("uk");
      setCooldown(60);
    } catch (e: any) {
      Alert.alert(t("error") || "Помилка", String(e?.message || "Не вдалося надіслати код"));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: UI.bg, padding: 16 }}
    >
      <Text style={{ color: UI.text, fontSize: 28, fontWeight: "800", marginBottom: 8 }}>
        {t("verify_title") || "Підтвердження email"}
      </Text>
      <Text style={{ color: UI.sub, marginBottom: 16 }}>
        {t("verify_code_label") || "Код з листа"}
      </Text>

      <View style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#fff" }}>
        <TextInput
          placeholder={t("verify_code_label") || "Код з листа"}
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          onChangeText={setCode}
          value={code}
          style={{ height: 48, color: UI.text }}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        style={{
          marginTop: 18,
          backgroundColor: UI.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: UI.primaryText, fontWeight: "800" }}>
          {t("verify_submit") || "Підтвердити"}
        </Text>
      </Pressable>

      <Pressable
        onPress={onResend}
        disabled={cooldown > 0 || resend.isPending}
        style={{ marginTop: 14, alignItems: "center" }}
      >
        <Text style={{ color: cooldown > 0 ? "#9CA3AF" : UI.primary, fontWeight: "700" }}>
          {cooldown > 0
            ? (t("verify_resend_in") || "Надіслати повторно через {s} сек.").replace("{s}", String(cooldown))
            : (t("verify_resend") || "Надіслати код ще раз")}
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
