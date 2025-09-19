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
import { apiRegister, apiSendVerificationCode } from "@/src/auth/authService.mobile";
import { setToken } from "@/src/auth/token";

const BG = "#ffffff";
const TEXT = "#111111";
const MUTED = "#6b7280";
const ACCENT = "#4563d1";
const BORDER = "#e5e7eb";
const ERROR = "#dc2626";

export default function SignUpScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName]   = React.useState("");
  const [email, setEmail]         = React.useState("");
  const [password, setPassword]   = React.useState("");
  const [confirm, setConfirm]     = React.useState("");
  const [agree, setAgree]         = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Вкажіть імʼя";
    if (!lastName.trim())  e.lastName  = "Вкажіть прізвище";
    if (!email.trim())     e.email     = "Вкажіть e-mail";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Некоректний e-mail";
    if (!password)         e.password  = "Вкажіть пароль";
    else if (password.length < 8) e.password = "Мінімум 8 символів";
    if (!confirm)          e.confirm   = "Повторіть пароль";
    else if (confirm !== password) e.confirm = "Паролі не співпадають";
    if (!agree)            e.agree     = "Необхідно погодитися з умовами";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setErr("");
    if (!validate()) return;

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      const regResult = await apiRegister({
        fullName,
        email: email.trim(),
        password,
      });

      const token = typeof regResult === "string" ? regResult : (regResult as any)?.token;
      if (token) {
        await setToken(token);
      } else {
        throw new Error("Токен не отримано після реєстрації");
      }

      try {
        await apiSendVerificationCode("uk");
      } catch {}

      router.replace("/verify-email" as any);
    } catch (e: any) {
      const m =
        typeof e?.message === "string" && e.message.trim().length > 0
          ? e.message
          : "Не вдалося зареєструватися.";
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
          <Text style={S.subtitle}>Створіть новий акаунт</Text>
        </View>

        <View style={S.row2}>
          <View style={{ flex: 1 }}>
            <Text style={S.label}>Імʼя</Text>
            <TextInput
              value={firstName}
              onChangeText={(t) => {
                setFirstName(t);
                if (errors.firstName) setErrors((p) => ({ ...p, firstName: "" }));
                if (err) setErr("");
              }}
              placeholder="Ваше імʼя"
              placeholderTextColor={MUTED}
              style={[S.input, errors.firstName && S.inputError]}
              autoCapitalize="words"
            />
            {errors.firstName ? <Text style={S.errText}>{errors.firstName}</Text> : null}
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={S.label}>Прізвище</Text>
            <TextInput
              value={lastName}
              onChangeText={(t) => {
                setLastName(t);
                if (errors.lastName) setErrors((p) => ({ ...p, lastName: "" }));
                if (err) setErr("");
              }}
              placeholder="Ваше прізвище"
              placeholderTextColor={MUTED}
              style={[S.input, errors.lastName && S.inputError]}
              autoCapitalize="words"
            />
            {errors.lastName ? <Text style={S.errText}>{errors.lastName}</Text> : null}
          </View>
        </View>

        <View style={S.field}>
          <Text style={S.label}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              if (err) setErr("");
            }}
            placeholder="name@example.com"
            placeholderTextColor={MUTED}
            style={[S.input, errors.email && S.inputError]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {errors.email ? <Text style={S.errText}>{errors.email}</Text> : null}
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
            placeholder="Мінімум 8 символів"
            placeholderTextColor={MUTED}
            style={[S.input, errors.password && S.inputError]}
            secureTextEntry
          />
          {errors.password ? <Text style={S.errText}>{errors.password}</Text> : null}
        </View>

        <View style={S.field}>
          <Text style={S.label}>Повторіть пароль</Text>
          <TextInput
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
              if (err) setErr("");
            }}
            placeholder="Повторіть пароль"
            placeholderTextColor={MUTED}
            style={[S.input, errors.confirm && S.inputError]}
            secureTextEntry
          />
          {errors.confirm ? <Text style={S.errText}>{errors.confirm}</Text> : null}
        </View>

        <Pressable
          onPress={() => {
            setAgree((v) => !v);
            if (errors.agree) setErrors((p) => ({ ...p, agree: "" }));
          }}
          style={({ pressed }) => [S.checkboxRow, pressed && { opacity: 0.9 }]}
        >
          <View style={[S.checkbox, agree && S.checkboxOn]} />
          <Text style={S.checkboxLabel}>
            Я погоджуюсь з умовами використання та політикою конфіденційності
          </Text>
        </Pressable>
        {errors.agree ? <Text style={S.errText}>{errors.agree}</Text> : null}

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
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={S.primaryText}>Створити акаунт</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/sign-in" as any)}
          style={({ pressed }) => [S.linkBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={S.linkText}>Вже є акаунт? Увійти</Text>
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
  subtitle: { color: MUTED, fontSize: 16, textAlign: "center" },

  row2: { flexDirection: "row", marginTop: 14 },
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

  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BORDER,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  checkboxLabel: { color: TEXT, flex: 1 },

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
