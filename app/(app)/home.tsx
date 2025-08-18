import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { clearTokens } from "../../src/lib/auth";
import { t } from "../../src/i18n/ua";

const COLORS = {
  bg: "#0B0C10",
  card: "#12161C",
  cardPressed: "#1B222B",
  border: "#2A2F36",
  accent: "#66FCF1",
  accentPressed: "#45A29E",
  text: "#FFFFFF",
  muted: "#C5C6C7",
  danger: "#ef4444",
};

function Card({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.accent, fontSize: 18, fontWeight: "700" }}>
        {title}
      </Text>
      <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function Button({
  label,
  onPress,
  kind = "primary",
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "ghost" | "danger";
}) {
  let bg = COLORS.accent;
  let textColor = COLORS.bg;
  let borderWidth = 0;

  if (kind === "ghost") {
    bg = COLORS.card;
    textColor = COLORS.muted;
    borderWidth = 1;
  }
  if (kind === "danger") {
    bg = COLORS.danger;
    textColor = "#FFFFFF";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: textColor, fontSize: 16, fontWeight: "800" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await clearTokens();
    } finally {
      router.replace("/(auth)/sign-in");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        backgroundColor: COLORS.bg,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: COLORS.accent,
        }}
      >
        {t("nav_home")}
      </Text>
      <Text style={{ marginTop: 8, color: COLORS.muted, fontSize: 14 }}>
        Ласкаво просимо! Оберіть розділ нижче.
      </Text>

      {/* Карточки розділів */}
      <View style={{ gap: 12, marginTop: 20 }}>
        <Card
          title={t("nav_entities")}
          subtitle="Перегляд, створення та редагування даних."
          onPress={() => router.push("/(app)/entities")}
        />
        <Card
          title={t("nav_profile")}
          subtitle="Облікові дані та налаштування."
          onPress={() => router.push("/(app)/profile")}
        />
      </View>

      {/* Дії */}
      <View style={{ marginTop: 28, gap: 10 }}>
        <Button
          label="+ Створити запис"
          onPress={() => router.push("/(app)/entities/create")}
          kind="primary"
        />
        <Button
          label="Відкрити список"
          onPress={() => router.push("/(app)/entities")}
          kind="ghost"
        />
        <Button label="Вийти" onPress={handleLogout} kind="danger" />
      </View>
    </View>
  );
}
