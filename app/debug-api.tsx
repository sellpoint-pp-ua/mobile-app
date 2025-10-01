import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { OpenAPI, apiPingLoginCheck, apiRegister, ApiError } from "@/src/api/client";

const ACCENT = "#7C3AED";
const WHITE = "#FFFFFF";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const DANGER = "#DC2626";
const OK = "#065F46";

export default function DebugApi() {
  const router = useRouter();
  const [loading, setLoading] = useState<null | "ping" | "register">(null);
  const [result, setResult] = useState<string>("");

  // Поля для пробной регистрации
  const [fullName, setFullName] = useState("Test User");
  const [email, setEmail] = useState("test+" + Math.floor(Math.random()*100000) + "@example.com");
  const [password, setPassword] = useState("Password123!");
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const show = (obj: unknown) => {
    try {
      setResult(JSON.stringify(obj, null, 2));
    } catch {
      setResult(String(obj));
    }
  };

  const onPing = useCallback(async () => {
    setLoading("ping");
    setResult("");
    try {
      const res = await apiPingLoginCheck();
      show({ ok: true, endpoint: "/api/Auth/check-login", response: res });
    } catch (e) {
      if (e instanceof ApiError) {
        show({
          ok: false,
          endpoint: "/api/Auth/check-login",
          status: e.status,
          message: e.message,
          details: e.details,
        });
      } else {
        show({ ok: false, error: String(e) });
      }
    } finally {
      setLoading(null);
    }
  }, []);

  const onTryRegister = useCallback(async () => {
    setLoading("register");
    setResult("");
    try {
      const res = await apiRegister({ FullName: fullName.trim(), Email: email.trim(), Password: password });
      show({ ok: true, endpoint: "/api/Auth/register", response: res });
    } catch (e) {
      if (e instanceof ApiError) {
        show({
          ok: false,
          endpoint: "/api/Auth/register",
          status: e.status,
          message: e.message,
          details: e.details,
        });
      } else {
        show({ ok: false, error: String(e) });
      }
    } finally {
      setLoading(null);
    }
  }, [fullName, email, password]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>API Debug</Text>
      <Text style={styles.sub}>
        Платформа: <Text style={styles.mono}>{Platform.OS}</Text> | База API: <Text style={styles.mono}>{OpenAPI.baseUrl}</Text>
      </Text>
      <Text style={[styles.sub, { marginTop: 4 }]}>
        Якщо у Web бачиш CORS — це налаштування сервера. Якщо 502 — це nginx/upstream на сервері.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Швидка перевірка доступності</Text>
        <Pressable
          onPress={onPing}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          disabled={loading !== null}
        >
          {loading === "ping" ? <ActivityIndicator /> : <Text style={styles.buttonText}>GET /api/Auth/check-login</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Тестова реєстрація (multipart)</Text>

        <Text style={styles.label}>Повне імʼя</Text>
        <TextInput value={fullName} onChangeText={setFullName} style={styles.input} />

        <Text style={[styles.label, { marginTop: 10 }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={[styles.input, email.length > 0 && !emailValid ? styles.inputInvalid : undefined]}
          placeholder="you@example.com"
          placeholderTextColor={GRAY}
        />

        <Text style={[styles.label, { marginTop: 10 }]}>Пароль</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="мінімум 8 символів"
          placeholderTextColor={GRAY}
        />

        <Pressable
          onPress={onTryRegister}
          disabled={loading !== null || !emailValid || fullName.trim().length < 2 || password.length < 6}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, { marginTop: 12 }]}
        >
          {loading === "register" ? <ActivityIndicator /> : <Text style={styles.buttonText}>POST /api/Auth/register</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Результат</Text>
        <View style={styles.outputBox}>
          <Text style={styles.output}>{result || "Натисни одну з кнопок вище…"}</Text>
        </View>
      </View>

      <Pressable onPress={() => router.replace("/home" as unknown as any)} style={({ pressed }) => [styles.link, pressed && { opacity: 0.8 }]}>
        <Text style={styles.linkText}>⬅ Повернутися на головну</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  container: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 24, fontWeight: "800", color: ACCENT },
  sub: { marginTop: 6, color: GRAY },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    color: "#111827",
  },

  card: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: ACCENT, marginBottom: 8 },

  label: { fontSize: 13, color: GRAY, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: WHITE,
  },
  inputInvalid: { borderColor: DANGER },

  button: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.9 },
  buttonText: { color: WHITE, fontWeight: "700" },

  outputBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F9FAFB",
  },
  output: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    color: "#111827",
  },

  link: { marginTop: 18, alignItems: "center" },
  linkText: { color: ACCENT, fontWeight: "700" },
});
