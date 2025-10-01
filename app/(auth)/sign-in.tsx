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
  Alert,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
const ACCENT = "#5a63d1";
const BORDER = "#e5e7eb";
const ERROR = "#dc2626";

export default function SignInScreen() {
  const router = useRouter();

  const auth = useAuth() as any;
  const reload = auth?.reload;
  const setTokenAndReload = auth?.setTokenAndReload;

  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isValid = login.trim().length > 0 && password.length > 0;

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

  function onForgot() {
    Alert.alert("Незабаром", "Скидання пароля зʼявиться найближчим часом.");
  }
  function onApple() {
    Alert.alert("Незабаром", "Вхід через Apple у розробці.");
  }
  function onGoogle() {
    Alert.alert("Незабаром", "Вхід через Google у розробці.");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
          <View style={S.topBar}>
            <Pressable onPress={() => router.back()} style={S.backBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={26} color={TEXT} />
            </Pressable>
          </View>

          <Text style={S.logo}>
            sell <Text style={{ color: ACCENT }}>point.</Text>
          </Text>
          <Text style={S.subtitle}>
            Вітаємо у Sell Point!{"\n"}Увійдіть до свого профілю, щоб розпочати.
          </Text>

          <View style={S.card}>
            <View style={S.inputRow}>
              <Ionicons name="mail-outline" size={18} color={MUTED} style={S.leftIcon} />
              <TextInput
                value={login}
                onChangeText={(t) => {
                  setLogin(t);
                  if (errors.login) setErrors((p) => ({ ...p, login: "" }));
                  if (err) setErr("");
                }}
                placeholder="E-mail або логін"
                placeholderTextColor={MUTED}
                style={[S.input, errors.login && S.inputError]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
            {errors.login ? <Text style={S.errText}>{errors.login}</Text> : null}

            <View style={S.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={S.leftIcon} />
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                  if (err) setErr("");
                }}
                placeholder="Пароль"
                placeholderTextColor={MUTED}
                style={[S.input, errors.password && S.inputError]}
                secureTextEntry={!showPass}
                returnKeyType="go"
                onSubmitEditing={() => !loading && onSubmit()}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} style={S.rightIconBtn} hitSlop={8}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={MUTED} />
              </Pressable>
            </View>
            {errors.password ? <Text style={S.errText}>{errors.password}</Text> : null}

            <Pressable onPress={onForgot} style={S.forgotBtn} hitSlop={6}>
              <Text style={S.forgotText}>Забули пароль?</Text>
            </Pressable>

            {err ? (
              <View style={S.alert}>
                <Ionicons name="warning-outline" size={18} color={ERROR} />
                <Text style={S.alertText}>{err}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={loading || !isValid}
              style={({ pressed }) => [
                S.primaryBtn,
                pressed && { opacity: 0.9 },
                (loading || !isValid) && { opacity: 0.6 },
              ]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryText}>Увійти</Text>}
            </Pressable>

            <View style={S.dividerRow}>
              <View style={S.line} />
              <Text style={S.dividerText}>Або</Text>
              <View style={S.line} />
            </View>

            <Pressable onPress={onApple} style={S.appleBtn}>
              <Ionicons name="logo-apple" size={18} color="#fff" />
              <Text style={S.appleText}>Продовжити через Apple</Text>
            </Pressable>
            <Pressable onPress={onGoogle} style={S.googleBtn}>
              <Ionicons name="logo-google" size={18} color="#111" />
              <Text style={S.googleText}>Продовжити через Google</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("/sign-up" as any)}
            style={({ pressed }) => [S.linkBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={S.linkText}>
              Немає акаунта? <Text style={{ color: ACCENT, fontWeight: "800" }}>Зареєструватися</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { padding: 20, paddingTop: 10, backgroundColor: BG, flexGrow: 1 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { padding: 4 },
  logo: { color: TEXT, fontSize: 40, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  subtitle: { color: TEXT, marginTop: 4, textAlign: "center", marginBottom: 16, fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  leftIcon: { marginLeft: 10 },
  rightIconBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  input: {
    flex: 1,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    paddingHorizontal: 10,
    color: TEXT,
    fontSize: 16,
  },
  inputError: { borderColor: "#fecaca" },
  errText: { color: ERROR, marginTop: 6, marginLeft: 2 },
  forgotBtn: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { color: ACCENT, fontWeight: "600" },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  alertText: { color: ERROR, flex: 1 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, marginBottom: 8 },
  line: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { color: MUTED, fontWeight: "600" },
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  appleText: { color: "#fff", fontWeight: "700" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  googleText: { color: TEXT, fontWeight: "700" },
  linkBtn: { marginTop: 14, alignItems: "center" },
  linkText: { color: TEXT, fontSize: 15 },
});
