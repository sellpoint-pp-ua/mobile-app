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
import { apiSendVerificationCode, apiVerifyEmailCode, apiGetMe } from "@/src/auth/authService.mobile";

const BG = "#ffffff";
const TEXT = "#111111";
const MUTED = "#6b7280";
const ACCENT = "#4563d1";
const ACCENT_DARK = "#364ea8";
const BORDER = "#e5e7eb";
const ERROR = "#dc2626";
const OK = "#16a34a";

export default function VerifyEmailScreen() {
  const router = useRouter();

  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [ok, setOk] = React.useState<string>("");
  const [cooldown, setCooldown] = React.useState(0);
  const [userEmail, setUserEmail] = React.useState<string>("");

  React.useEffect(() => {
    // Загружаем e-mail текущего пользователя
    apiGetMe()
      .then((me) => {
        if (me?.email) setUserEmail(me.email);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function onVerify() {
    setErr("");
    setOk("");
    const c = code.trim();
    if (!c || c.length < 4) {
      setErr("Введіть код підтвердження з листа");
      return;
    }
    setLoading(true);
    try {
      const res = await apiVerifyEmailCode(c);
      if (res.alreadyVerified) {
        setOk("Пошта вже підтверджена");
      } else {
        setOk("E-mail успішно підтверджено");
      }
      setTimeout(() => router.replace("/home" as any), 600);
    } catch (e: any) {
      const m =
        typeof e?.message === "string" && e.message.trim().length > 0
          ? e.message
          : "Невірний або прострочений код";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    setErr("");
    setOk("");
    setResending(true);
    try {
      await apiSendVerificationCode("uk");
      setOk("Код надіслано повторно");
      setCooldown(30);
    } catch (e: any) {
      const m =
        typeof e?.message === "string" && e.message.trim().length > 0
          ? e.message
          : "Не вдалося надіслати код";
      setErr(m);
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
        {/* Логотип */}
        <Text style={S.logo}>sell <Text style={{ color: ACCENT }}>point.</Text></Text>

        <Text style={S.subtitle}>
          Введіть код, який ми відправили на пошту{" "}
          <Text style={{ color: ACCENT }}>{userEmail || "вашу пошту"}</Text>, щоб підтвердити свою особу
        </Text>

        <View style={S.field}>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t);
              if (err) setErr("");
              if (ok) setOk("");
            }}
            placeholder="Введіть код"
            placeholderTextColor={MUTED}
            style={S.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.select({
              ios: "ascii-capable",
              android: "visible-password",
              default: "default",
            })}
            maxLength={12}
          />
        </View>

        {err ? (
          <View style={[S.alert, S.alertError]}>
            <Text style={S.alertTextError}>{err}</Text>
          </View>
        ) : null}
        {ok ? (
          <View style={[S.alert, S.alertOk]}>
            <Text style={S.alertTextOk}>{ok}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onVerify}
          disabled={loading || code.trim().length === 0}
          style={({ pressed }) => [
            S.primaryBtn,
            pressed && { opacity: 0.9 },
            (loading || code.trim().length === 0) && { opacity: 0.6 },
          ]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryText}>Підтвердити</Text>}
        </Pressable>

        <Pressable
          onPress={onResend}
          disabled={resending || cooldown > 0}
          style={({ pressed }) => [
            S.linkBtn,
            pressed && { opacity: 0.8 },
            (resending || cooldown > 0) && { opacity: 0.6 },
          ]}
        >
          {resending ? (
            <ActivityIndicator />
          ) : (
            <Text style={S.linkText}>
              {cooldown > 0 ? `Надіслати код ще раз (${cooldown} с)` : "Надіслати повторно код"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: BG,
    flexGrow: 1,
  },
  logo: {
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    color: TEXT,
    marginBottom: 16,
  },
  subtitle: {
    color: TEXT,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    backgroundColor: "#fff",
    color: TEXT,
    fontSize: 16,
    letterSpacing: 2,
  },
  alert: { borderWidth: 1, padding: 10, borderRadius: 10, marginTop: 14 },
  alertError: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  alertTextError: { color: ERROR },
  alertOk: { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" },
  alertTextOk: { color: OK },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { marginTop: 18, alignItems: "center" },
  linkText: { color: ACCENT, fontWeight: "600" },
});
