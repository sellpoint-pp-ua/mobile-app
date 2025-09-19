import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { apiLogin } from "@/src/auth/authService.mobile";
import { useAuth } from "@/src/auth/AuthProvider";
import {
  registerForPushNotificationsAsync,
  notifyWelcome,
  sendPushTokenToBackend,
} from "@/src/notifications/push";

const BG = "#ffffff";
const TEXT = "#111111";
const MUTED = "#6b7280";
const ACCENT = "#4563d1";
const BORDER = "#e5e7eb";
const ERROR = "#dc2626";

export default function SignInScreen() {
  const router = useRouter();

  const auth = useAuth() as any;
  const reload = auth?.reload;
  const setTokenAndReload = auth?.setTokenAndReload;

  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!login.trim()) e.login = "Введіть e-mail або логін";
    if (!password) e.password = "Введіть пароль";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setErr("");
    if (!validate()) return;

    setLoading(true);
    try {
      await apiLogin({ login: login.trim(), password });

      if (typeof setTokenAndReload === "function") {
        await setTokenAndReload();
      } else if (typeof reload === "function") {
        await reload();
      }

      try {
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) await sendPushTokenToBackend(expoToken);
      } catch {}

      await notifyWelcome();

      router.replace("/home" as any);
    } catch (e: any) {
      const m =
        typeof e?.message === "string" && e.message.trim().length > 0
          ? e.message
          : "Не вдалося увійти. Перевірте дані.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text style={S.title}>Вхід</Text>
          <Text style={S.subtitle}>Увійдіть до свого акаунту</Text>
        </View>

        <View style={S.field}>
          <Text style={S.label}>E-mail або логін</Text>
          <TextInput
            value={login}
            onChangeText={(t) => {
              setLogin(t);
              if (errors.login) setErrors((p) => ({ ...p, login: "" }));
              if (err) setErr("");
            }}
            placeholder="name@example.com або username"
            placeholderTextColor={MUTED}
            style={[S.input, errors.login && S.inputError]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />
          {errors.login ? <Text style={S.errText}>{errors.login}</Text> : null}
        </View>

        <View style={S.field}>
          <Text style={S.label}>Пароль</Text>
          <TextInput
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
              if (err) setErr("");
            }}
            placeholder="Ваш пароль"
            placeholderTextColor={MUTED}
            style={[S.input, errors.password && S.inputError]}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={() => !loading && onSubmit()}
          />
          {errors.password ? <Text style={S.errText}>{errors.password}</Text> : null}
        </View>

        {err ? (
          <View style={S.alert}>
            <Text style={S.alertText}>{err}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => [
            S.primaryBtn,
            pressed && { opacity: 0.9 },
            loading && { opacity: 0.6 },
          ]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryText}>Увійти</Text>}
        </Pressable>

        <Pressable
          onPress={() => router.push("/sign-up" as any)}
          style={({ pressed }) => [S.linkBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={S.linkText}>Немає акаунта? Зареєструватися</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [S.secondaryBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={S.secondaryText}>Назад</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: BG,
    flexGrow: 1,
  },
  title: { color: TEXT, fontSize: 24, fontWeight: "800" },
  subtitle: { color: MUTED, marginTop: 6, textAlign: "center" },

  field: { marginTop: 14 },
  label: { color: TEXT, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    backgroundColor: "#fff",
    color: TEXT,
  },
  inputError: { borderColor: "#fecaca", backgroundColor: "#fff" },
  errText: { color: ERROR, marginTop: 6 },

  alert: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  alertText: { color: ERROR },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  linkBtn: { marginTop: 12, alignItems: "center" },
  linkText: { color: ACCENT, fontWeight: "700" },

  secondaryBtn: {
    marginTop: 12,
    borderColor: BORDER,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: TEXT, fontWeight: "700" },
});
