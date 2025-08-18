import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

export default function AppLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0B0C10" },
          headerTintColor: "#66FCF1",
          headerTitleStyle: { fontWeight: "800" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#0B0C10" },
          animation: Platform.select({ ios: "default", android: "fade_from_bottom" }),
        }}
      >
        <Stack.Screen name="home" options={{ title: "Головна" }} />
        <Stack.Screen name="entities/index" options={{ title: "Сутності" }} />
        <Stack.Screen name="entities/create" options={{ title: "Створити" }} />
        <Stack.Screen name="entities/[id]" options={{ title: "Деталі" }} />
        <Stack.Screen name="entities/[id]/edit" options={{ title: "Редагувати" }} />
        <Stack.Screen name="profile" options={{ title: "Профіль" }} />
      </Stack>
    </>
  );
}
