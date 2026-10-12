import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BlissLogo } from "@/components/bliss-logo";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [userHandle, setUserHandle] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const login = trpc.auth.login.useMutation({
    onSuccess: () => router.replace("/(tabs)"),
    onError: cause => setError(cause.message),
  });
  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: () => router.replace("/(tabs)"),
    onError: cause => setError(cause.message),
  });

  const submit = () => {
    setError(null);
    if (mode === "login") login.mutate({ userHandle, password });
    else signUp.mutate({ userHandle, password, name });
  };
  const loading = login.isPending || signUp.isPending;

  return (
    <ScreenContainer className="px-6 pt-3">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between"><TouchableOpacity onPress={() => router.back()}><Text className="text-base font-semibold text-muted">Back</Text></TouchableOpacity><Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">BLISS account</Text><View className="w-10" /></View>
          <View className="mt-12 items-center"><BlissLogo size={86} /><Text className="mt-6 text-3xl font-bold tracking-tight text-foreground">Find your signal.</Text><Text className="mt-2 text-center text-base leading-6 text-muted">Your feed, your friends and your focus — in one place.</Text></View>
          <View className="mt-9 flex-row rounded-full border border-border bg-surface p-1"><TouchableOpacity onPress={() => { setMode("login"); setError(null); }} className={mode === "login" ? "flex-1 items-center rounded-full bg-[#6EA8FF] py-3" : "flex-1 items-center rounded-full py-3"}><Text className={mode === "login" ? "font-bold text-[#050506]" : "font-semibold text-muted"}>Log in</Text></TouchableOpacity><TouchableOpacity onPress={() => { setMode("signup"); setError(null); }} className={mode === "signup" ? "flex-1 items-center rounded-full bg-[#B98CFF] py-3" : "flex-1 items-center rounded-full py-3"}><Text className={mode === "signup" ? "font-bold text-[#050506]" : "font-semibold text-muted"}>Sign up</Text></TouchableOpacity></View>
          <View className="mt-7 gap-4">
            {mode === "signup" ? <View><Text className="mb-2 text-sm font-semibold text-foreground">Display name</Text><TextInput value={name} onChangeText={setName} placeholder="How should friends see you?" placeholderTextColor="#777486" autoCapitalize="words" className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground" /></View> : null}
            <View><Text className="mb-2 text-sm font-semibold text-foreground">Unique User ID</Text><View className="flex-row items-center rounded-2xl border border-border bg-surface px-4"><Text className="text-base text-[#B98CFF]">@</Text><TextInput value={userHandle} onChangeText={setUserHandle} placeholder="yourhandle" placeholderTextColor="#777486" autoCapitalize="none" autoCorrect={false} className="flex-1 px-2 py-4 text-base text-foreground" /></View>{mode === "signup" ? <Text className="mt-2 text-xs text-muted">3–32 characters: letters, numbers and underscores.</Text> : null}</View>
            <View><Text className="mb-2 text-sm font-semibold text-foreground">Password</Text><TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor="#777486" secureTextEntry autoCapitalize="none" autoCorrect={false} className="rounded-2xl border border-border bg-surface px-4 py-4 text-base text-foreground" /></View>
          </View>
          {error ? <Text className="mt-4 text-sm font-semibold text-[#FF7187]">{error}</Text> : null}
          <TouchableOpacity disabled={loading} onPress={submit} className={loading ? "mt-7 items-center rounded-full bg-[#5B6280] py-4" : "mt-7 items-center rounded-full bg-[#6EA8FF] py-4"}><Text className="font-bold text-[#050506]">{loading ? "Please wait…" : mode === "login" ? "Log in to BLISS" : "Create my BLISS ID"}</Text></TouchableOpacity>
          <Text className="mt-5 text-center text-xs leading-5 text-muted">Passwords are hashed on the server. BLISS never stores your plain-text password.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
