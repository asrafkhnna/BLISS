import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { BlissLogo } from "@/components/bliss-logo";
import { ScreenContainer } from "@/components/screen-container";

const topics = ["All", "Focus", "Memory", "Creative", "Wellbeing"];

export default function StudyZoneScreen() {
  const [activeTopic, setActiveTopic] = useState(topics[0]);

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BlissLogo size={38} />
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">slow learning</Text>
              <Text className="mt-0.5 text-2xl font-bold text-foreground">Study Zone</Text>
            </View>
          </View>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
            <Text className="text-base text-primary">⌁</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 rounded-[28px] border border-[#294A65] bg-[#0E1C2C] p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-[2px] text-[#6EDBFF]">today&apos;s momentum</Text>
              <Text className="mt-3 text-3xl font-bold text-[#F4EEFF]">18 min</Text>
              <Text className="mt-1 text-sm text-[#93A9BD]">of your 30 min focus goal</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full border-4 border-[#3E9ED9]">
              <Text className="text-sm font-bold text-[#F4EEFF]">60%</Text>
            </View>
          </View>
          <View className="mt-6 h-2 overflow-hidden rounded-full bg-[#1C3850]">
            <View className="h-2 w-3/5 rounded-full bg-[#6EDBFF]" />
          </View>
          <TouchableOpacity className="mt-6 self-start rounded-full bg-[#F4EEFF] px-5 py-3">
            <Text className="font-bold text-[#0B1420]">Continue focus</Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-2xl font-bold text-foreground">Choose your path</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerStyle={{ gap: 9 }}>
          {topics.map(topic => {
            const active = activeTopic === topic;
            return (
              <TouchableOpacity
                key={topic}
                onPress={() => setActiveTopic(topic)}
                className={active ? "rounded-full bg-[#6EA8FF] px-4 py-3" : "rounded-full border border-border bg-surface px-4 py-3"}
              >
                <Text className={active ? "font-bold text-[#050506]" : "font-semibold text-muted"}>{topic}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View className="mt-6 gap-3">
          <View className="rounded-[24px] border border-[#34275A] bg-[#171126] p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-[2px] text-[#B98CFF]">7 day path</Text>
              <Text className="text-xs font-semibold text-[#AAA0BF]">2 / 7 complete</Text>
            </View>
            <Text className="mt-3 text-xl font-bold text-foreground">Make focus feel natural</Text>
            <Text className="mt-2 text-sm leading-5 text-[#AAA0BF]">Short lessons for building a calmer, more consistent study rhythm.</Text>
            <View className="mt-5 flex-row items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(day => <View key={day} className={day < 3 ? "h-2 flex-1 rounded-full bg-[#B98CFF]" : "h-2 flex-1 rounded-full bg-[#352A50]"} />)}
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-[24px] border border-border bg-surface p-4">
              <Text className="text-2xl">◒</Text>
              <Text className="mt-5 text-lg font-bold text-foreground">Memory lab</Text>
              <Text className="mt-1 text-sm text-muted">12 lessons</Text>
            </View>
            <View className="flex-1 rounded-[24px] border border-border bg-surface p-4">
              <Text className="text-2xl text-[#6EDBFF]">⌁</Text>
              <Text className="mt-5 text-lg font-bold text-foreground">Deep work</Text>
              <Text className="mt-1 text-sm text-muted">8 lessons</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
