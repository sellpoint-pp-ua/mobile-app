import React from "react";
import { Stack } from "expo-router";
import { Image, StyleSheet, View, LogBox } from "react-native";
import Logo from "@/assets/logo.svg";
import { AuthProvider } from "@/src/auth/AuthProvider";

LogBox.ignoreLogs([/expo-notifications: Android Push notifications/]);

const HEADER_BG = { uri: "https://sellpoint.pp.ua/background.png" };

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        initialRouteName="(main)/home"
        screenOptions={{
          headerBackground: () => (
            <View style={StyleSheet.absoluteFillObject}>
              <Image source={HEADER_BG} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.35)" }]} />
            </View>
          ),
          headerTitle: () => <Logo width={120} height={32} />,
          headerTitleAlign: "center",
          headerTintColor: "#101010",
          headerTitleStyle: { fontWeight: "700", color: "#000" },
          headerStyle: { backgroundColor: "transparent" },
          headerShadowVisible: false,
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      >
        <Stack.Screen name="(main)/home" />
        <Stack.Screen name="(main)/catalog" />
        <Stack.Screen name="(main)/cart" />
        <Stack.Screen name="(main)/favorites" />
        <Stack.Screen name="(main)/profile" />
        <Stack.Screen name="(main)/search" />
        <Stack.Screen name="product/id" />
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/sign-up" />
        <Stack.Screen name="(auth)/verify-email" />
      </Stack>
    </AuthProvider>
  );
}
