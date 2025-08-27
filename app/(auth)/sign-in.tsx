import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { t } from "../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  field: "#14181F",
  border: "#2A2F36",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  secondary: "#9aa0a6",
  accent: "#66FCF1",
  danger: "#ef4444",
};

export default function SignIn() {
  const router = useRouter();
  const { signIn, loading, error } = useAuth();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const canSubmit = login.trim().length > 0 && password.length > 0 && !loading;

  async function onSubmit() {
    if (!canSubmit) return;
    const ok = await signIn({ login, password });
    if (ok) router.replace("/home"); // БЕЗ групп в URL
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 36 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: COLORS.accent }}>
          {t("auth_title")}
        </Text>
        <Text style={{ color: COLORS.muted, marginTop: 6 }}>
          {t("auth_subtitle")}
        </Text>

        {error ? (
          <View
            style={{
              backgroundColor: "#251313",
              borderColor: COLORS.danger,
              borderWidth: 1,
              padding: 12,
              borderRadius: 12,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "#ff9e9e", fontWeight: "600" }}>
              {String(error)}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 18, gap: 14 }}>
          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>
              {t("auth_login")}
            </Text>
            <TextInput
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t("auth_login_placeholder")}
              placeholderTextColor={COLORS.secondary}
              style={{
                backgroundColor: COLORS.field,
                color: COLORS.text,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              returnKeyType="next"
            />
          </View>

          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>
              {t("auth_password")}
            </Text>
            <View
              style={{
                backgroundColor: COLORS.field,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                paddingRight: 8,
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth_password_placeholder")}
                placeholderTextColor={COLORS.secondary}
                secureTextEntry={!showPass}
                style={{ flex: 1, color: COLORS.text, padding: 12 }}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowPass((v) => !v)}
                style={{ paddingVertical: 6, paddingHorizontal: 8 }}
              >
                <Text style={{ color: COLORS.accent, fontWeight: "700" }}>
                  {showPass ? t("hide") : t("show")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 18,
            backgroundColor: canSubmit ? COLORS.accent : "#2d3a45",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: COLORS.bg, fontSize: 16, fontWeight: "800" }}>
              {t("auth_submit")}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: COLORS.secondary, marginTop: 10, fontSize: 12 }}>
          {t("auth_hint")}
        </Text>

        {/* Ссылка на регистрацию — БЕЗ групп в URL */}
        <View style={{ marginTop: 18, alignItems: "center" }}>
          <Link href="/sign-up" asChild>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={{ color: COLORS.accent, fontWeight: "800" }}>
                {t("auth_sign_up_link") || "Зареєструватись"}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
