import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { t } from "../../src/i18n/ua";

// Бело-фиолетовая палитра под Prom
const UI = {
  bg: "#ffffff",
  text: "#111827",
  sub: "#6b7280",
  border: "#e5e7eb",
  primary: "#7C3AED",
  primaryText: "#ffffff",
  danger: "#ef4444",
};

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState<{[k:string]:boolean}>({});

  const errors = useMemo(() => {
    const e: Record<string, string | undefined> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = t("err_name") || "Вкажіть ім’я";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) e.email = t("err_email") || "Невірний email";
    if (password.length < 6) e.password = t("err_password") || "Мінімум 6 символів";
    if (!agree) e.agree = t("err_agree") || "Потрібна згода";
    return e;
  }, [fullName, email, password, agree]);

  const isValid = Object.keys(errors).length === 0;

  function onSubmit() {
    if (!isValid) {
      // пометим поля как touched, чтобы увидеть ошибки
      setTouched({ fullName: true, email: true, password: true, agree: true });
      return;
    }
    Alert.alert(
      t("verify_check_inbox_title") || "Перевірте пошту",
      (t("verify_check_inbox_msg") || "Ми надіслали код підтвердження на ваш email.") +
        "\n\n(На наступному кроці підключимо реальний API)"
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: UI.bg }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: UI.text, fontSize: 28, fontWeight: "800", marginBottom: 8 }}>
          {t("sign_up_title") || "Реєстрація"}
        </Text>
        <Text style={{ color: UI.sub, marginBottom: 16 }}>
          {t("sign_up_subtitle") || "Створіть акаунт, щоб продовжити"}
        </Text>

        {/* Ім’я */}
        <Label>{t("label_name") || "Ім’я"}</Label>
        <Field>
          <Input
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => setTouched((s) => ({ ...s, fullName: true }))}
            placeholder="Іван Іваненко"
          />
        </Field>
        {!!touched.fullName && errors.fullName && <Err>{errors.fullName}</Err>}

        {/* Email */}
        <Label style={{ marginTop: 12 }}>{t("label_email") || "Email"}</Label>
        <Field>
          <Input
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched((s) => ({ ...s, email: true }))}
            placeholder="name@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>
        {!!touched.email && errors.email && <Err>{errors.email}</Err>}

        {/* Пароль */}
        <Label style={{ marginTop: 12 }}>{t("label_password") || "Пароль"}</Label>
        <Field>
          <Input
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched((s) => ({ ...s, password: true }))}
            placeholder="••••••••"
            secureTextEntry
          />
        </Field>
        {!!touched.password && errors.password && <Err>{errors.password}</Err>}

        {/* Згода */}
        <Pressable
          onPress={() => { setAgree((a) => !a); setTouched((s)=>({ ...s, agree: true })); }}
          style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}
        >
          <Text style={{ fontSize: 18 }}>{agree ? "☑" : "☐"}</Text>
          <Text style={{ color: UI.text, marginLeft: 8 }}>
            {t("agree_text") || "Погоджуюсь з умовами та політикою"}
          </Text>
        </Pressable>
        {!!touched.agree && errors.agree && <Err>{errors.agree}</Err>}

        {/* CTA */}
        <Pressable
          onPress={onSubmit}
          disabled={!isValid}
          style={{
            marginTop: 18,
            backgroundColor: isValid ? UI.primary : "#C4B5FD",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: UI.primaryText, fontWeight: "800" }}>
            {t("sign_up_cta") || "Зареєструватись"}
          </Text>
        </Pressable>

        {/* Лінк назад на вхід */}
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Link href="/sign-in">
            <Text style={{ color: UI.primary, fontWeight: "700" }}>
              {t("go_to_sign_in") || "Увійти"}
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Мелкие атомарные компоненты для читабельности */
function Label({ children, style }: any) {
  return <Text style={[{ color: UI.sub, marginBottom: 6 }, style]}>{children}</Text>;
}
function Field({ children }: any) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: UI.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: "#fff",
      }}
    >
      {children}
    </View>
  );
}
function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#9CA3AF"
      style={{ height: 48, color: UI.text }}
      {...props}
    />
  );
}
function Err({ children }: any) {
  return <Text style={{ color: UI.danger, marginTop: 6 }}>{children}</Text>;
}
