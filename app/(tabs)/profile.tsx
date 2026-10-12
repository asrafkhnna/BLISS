import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";

const interests = ["Deep work", "Design", "Mindset", "Reading", "Study tips"];

export default function ProfileScreen() {
  const router = useRouter();
  const [following, setFollowing] = useState(false);

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">your space</Text>
          <TouchableOpacity onPress={() => router.push("/auth" as never)} className="rounded-full border border-border bg-surface px-4 py-2"><Text className="text-sm font-semibold text-foreground">Log in / Sign up</Text></TouchableOpacity>
        </View>

        <View className="mt-8 items-center">
          <View className="h-28 w-28 items-center justify-center rounded-full border-2 border-[#6EA8FF] bg-[#1D2A46]">
            <Text className="text-4xl font-bold text-[#F4EEFF]">R</Text>
          </View>
          <Text className="mt-4 text-3xl font-bold text-foreground">Riya Sharma</Text>
          <Text className="mt-1 text-base text-muted">@riyafindsherhythm</Text>
          <Text className="mt-4 max-w-[300px] text-center text-base leading-6 text-[#B1ACBC]">Building a quieter mind, one good idea at a time.</Text>
          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity onPress={() => setFollowing(value => !value)} className={following ? "rounded-full border border-[#6EA8FF] px-6 py-3" : "rounded-full bg-[#6EA8FF] px-6 py-3"}>
              <Text className={following ? "font-bold text-[#6EA8FF]" : "font-bold text-[#050506]"}>{following ? "Following" : "Edit profile"}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="rounded-full border border-border bg-surface px-5 py-3"><Text className="font-semibold text-foreground">Share</Text></TouchableOpacity>
          </View>
        </View>

        <View className="mt-8 flex-row rounded-[24px] border border-border bg-surface px-4 py-5">
          <View className="flex-1 items-center border-r border-border"><Text className="text-xl font-bold text-foreground">24</Text><Text className="mt-1 text-xs uppercase tracking-wider text-muted">reels</Text></View>
          <View className="flex-1 items-center border-r border-border"><Text className="text-xl font-bold text-foreground">1.8k</Text><Text className="mt-1 text-xs uppercase tracking-wider text-muted">followers</Text></View>
          <View className="flex-1 items-center"><Text className="text-xl font-bold text-foreground">342</Text><Text className="mt-1 text-xs uppercase tracking-wider text-muted">following</Text></View>
        </View>

        <Text className="mt-8 text-xl font-bold text-foreground">Your interests</Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          {interests.map(interest => <View key={interest} className="rounded-full border border-[#34275A] bg-[#171126] px-4 py-3"><Text className="font-semibold text-[#C5B8DD]">{interest}</Text></View>)}
        </View>

        <View className="mt-8 overflow-hidden rounded-[26px] border border-[#294A65] bg-[#0E1C2C] p-5">
          <View className="flex-row items-center justify-between"><Text className="text-xs font-bold uppercase tracking-[2px] text-[#6EDBFF]">this week</Text><Text className="text-xs font-semibold text-[#93A9BD]">+18% energy</Text></View>
          <Text className="mt-3 text-xl font-bold text-foreground">You showed up 5 days in a row.</Text>
          <Text className="mt-2 text-sm leading-5 text-[#93A9BD]">Keep the rhythm going. Your next focus session is waiting.</Text>
          <View className="mt-5 flex-row items-end gap-2">
            {[35, 58, 44, 82, 68, 92, 48].map((height, index) => <View key={index} className="flex-1 rounded-t-lg bg-[#3E9ED9]" style={{ height }} />)}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
