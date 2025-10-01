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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiRegister } from "@/src/auth/authService.mobile";
import { useAuth } from "@/src/auth/AuthProvider";

const BG = "#ffffff";
const TEXT = "#111111";
const MUTED = "#6b7280";
const ACCENT = "#5a63d1";
const BORDER = "#e5e7eb";
const ERROR = "#dc2626";

export default function SignUpScreen() {
  const router = useRouter();
  const auth = useAuth() as any;
  const reload = auth?.reload;
  const setTokenAndReload = auth?.setTokenAndReload;

  const [lastName, setLastName] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [showPassConfirm, setShowPassConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [agree, setAgree] = React.useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!lastName.trim()) e.lastName = "Введіть прізвище";
    if (!firstName.trim()) e.firstName = "Введіть ім’я";
    if (!email.trim()) e.email = "Введіть e-mail";
    if (!password) e.password = "Введіть пароль";
    if (password && password.length < 6) e.password = "Пароль має бути мінімум 6 символів";
    if (password !== confirmPassword) e.confirmPassword = "Паролі не співпадають";
    if (!agree) e.agree = "Потрібно прийняти політику конфіденційності";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setErr("");
    if (!validate()) return;
    setLoading(true);
    try {
      const fullName = `${lastName.trim()} ${firstName.trim()}`;
      await apiRegister({ fullName, email: email.trim(), password });
      if (typeof setTokenAndReload === "function") {
        await setTokenAndReload();
      } else if (typeof reload === "function") {
        await reload();
      }
      router.replace("/verify-email" as any);
    } catch (e: any) {
      const m =
        typeof e?.message === "string" && e.message.trim().length > 0
          ? e.message
          : "Не вдалося зареєструватися. Спробуйте ще раз.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  }

  function onApple() {
    Alert.alert("Незабаром", "Реєстрація через Apple у розробці.");
  }

  function onGoogle() {
    Alert.alert("Незабаром", "Реєстрація через Google у розробці.");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
        <View style={S.topBar}>
          <Pressable onPress={() => router.replace("/home")} style={S.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={26} color={TEXT} />
          </Pressable>
        </View>

        <Text style={S.logo}>
          sell <Text style={{ color: ACCENT }}>point.</Text>
        </Text>
        <Text style={S.subtitle}>Створіть новий акаунт, щоб розпочати покупки</Text>

        <View style={S.card}>
          <View style={S.inputRow}>
            <Ionicons name="person-outline" size={18} color={MUTED} style={S.leftIcon} />
            <TextInput
              value={lastName}
              onChangeText={(t) => {
                setLastName(t);
                if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
                if (err) setErr("");
              }}
              placeholder="Прізвище"
              placeholderTextColor={MUTED}
              style={[S.input, errors.lastName && S.inputError]}
            />
          </View>
          {errors.lastName ? <Text style={S.errText}>{errors.lastName}</Text> : null}

          <View style={S.inputRow}>
            <Ionicons name="person-outline" size={18} color={MUTED} style={S.leftIcon} />
            <TextInput
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
                if (err) setErr("");
              }}
              placeholder="Ім’я"
              placeholderTextColor={MUTED}
              style={[S.input, errors.firstName && S.inputError]}
            />
          </View>
          {errors.firstName ? <Text style={S.errText}>{errors.firstName}</Text> : null}

          <View style={S.inputRow}>
            <Ionicons name="mail-outline" size={18} color={MUTED} style={S.leftIcon} />
            <TextInput
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                if (err) setErr("");
              }}
              placeholder="Ел.пошта"
              placeholderTextColor={MUTED}
              style={[S.input, errors.email && S.inputError]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {errors.email ? <Text style={S.errText}>{errors.email}</Text> : null}

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
            />
            <Pressable onPress={() => setShowPass((v) => !v)} style={S.rightIconBtn} hitSlop={8}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={MUTED} />
            </Pressable>
          </View>
          {errors.password ? <Text style={S.errText}>{errors.password}</Text> : null}

          <View style={S.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={S.leftIcon} />
            <TextInput
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                if (err) setErr("");
              }}
              placeholder="Повторити пароль"
              placeholderTextColor={MUTED}
              style={[S.input, errors.confirmPassword && S.inputError]}
              secureTextEntry={!showPassConfirm}
            />
            <Pressable
              onPress={() => setShowPassConfirm((v) => !v)}
              style={S.rightIconBtn}
              hitSlop={8}
            >
              <Ionicons
                name={showPassConfirm ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={MUTED}
              />
            </Pressable>
          </View>
          {errors.confirmPassword ? <Text style={S.errText}>{errors.confirmPassword}</Text> : null}

          <Pressable style={S.checkboxWrap} onPress={() => setAgree((p) => !p)}>
            <View style={[S.checkbox, agree && S.checkboxChecked]}>
              {agree && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={S.checkboxText}>
              Я погоджуюся з <Text style={{ color: ACCENT }}>політикою конфіденційності</Text>
            </Text>
          </Pressable>
          {errors.agree ? <Text style={[S.errText, { marginTop: -8 }]}>{errors.agree}</Text> : null}

          {err ? (
            <View style={S.alert}>
              <Ionicons name="warning-outline" size={18} color={ERROR} />
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
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={S.primaryText}>Зареєструватися</Text>
            )}
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
          onPress={() => router.push("/sign-in" as any)}
          style={({ pressed }) => [S.linkBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={S.linkText}>
            Вже маєте профіль? <Text style={{ color: ACCENT, fontWeight: "800" }}>Увійти</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: BG,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
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
  checkboxWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BORDER,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
  checkboxText: { color: TEXT, fontSize: 14, flex: 1 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  alertText: { color: ERROR, flex: 1 },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
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
