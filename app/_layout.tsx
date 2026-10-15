import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/lib/theme-provider";
import { BlissLogo } from "@/components/bliss-logo";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="oauth-callback" />
        </Stack>
        <StatusBar style="light" />
        {showSplash ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050506' }}>
            <BlissLogo size={112} />
            <Text style={{ marginTop: 24, fontSize: 24, fontWeight: 'bold', color: '#F4EEFF' }}>BLISS</Text>
            <Text style={{ marginTop: 8, fontSize: 12, color: '#A095AA' }}>find your signal</Text>
          </View>
        ) : null}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
              }
