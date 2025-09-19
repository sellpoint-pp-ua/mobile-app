import React from "react";
import { ImageBackground, StyleSheet, ViewStyle } from "react-native";

export function TopBarBg({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground
      source={{ uri: "https://sellpoint.pp.ua/background.png" }}
      style={[styles.bg, style]}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
