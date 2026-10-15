import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, View, Text } from "react-native";
import "@/lib/core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { BlissLogo } from "@/components/bliss-logo";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime } from "@/lib/core/manus-runtime";

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    try { initManusRuntime(); } catch {}
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="oauth-callback" />
              </Stack>
              <StatusBar style="light" />
              {showSplash? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050506' }}>
                  <BlissLogo size={112} />
                  <Text style={{ marginTop: 24, fontSize: 24, fontWeight: 'bold', color: '#F4EEFF' }}>BLISS</Text>
                </View>
              ) : null}
            </QueryClientProvider>
          </trpc.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
      }
