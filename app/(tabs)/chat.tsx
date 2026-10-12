import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BlissLogo } from "@/components/bliss-logo";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { startBlissCall, type CallMode } from "@/lib/rtc";

const conversations = [
  { name: "Study Circle", preview: "Maya shared a new focus reel", time: "2m", count: "3", tone: "#244A64", letter: "S" },
  { name: "Maya Chen", preview: "That idea is so good — saving it.", time: "18m", count: "", tone: "#3C255B", letter: "M" },
  { name: "Aarav Singh", preview: "See you in the deep work room", time: "1h", count: "", tone: "#21463D", letter: "A" },
  { name: "Focus Friends", preview: "You completed the 20 min session", time: "3h", count: "", tone: "#463A26", letter: "F" },
];

export default function ChatScreen() {
  const [query, setQuery] = useState("");
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const beginCall = async (mode: CallMode) => {
    const result = await startBlissCall({
      conversationId: "study-circle",
      mode,
      participantIds: [],
    });
    setCallStatus(result.status === "started" ? `${mode === "audio" ? "Audio" : "Video"} call ready` : result.message);
  };

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BlissLogo size={38} />
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">stay connected</Text>
              <Text className="mt-0.5 text-2xl font-bold text-foreground">Messages</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity accessibilityLabel="Start audio call" onPress={() => beginCall("audio")} className="h-10 w-10 items-center justify-center rounded-full border border-[#294A65] bg-[#0E1C2C]">
              <IconSymbol name="phone.fill" size={19} color="#6EDBFF" />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Start video call" onPress={() => beginCall("video")} className="h-10 w-10 items-center justify-center rounded-full border border-[#34275A] bg-[#171126]">
              <IconSymbol name="video.fill" size={20} color="#B98CFF" />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="New message" className="h-10 w-10 items-center justify-center rounded-full bg-[#6EA8FF]">
              <Text className="text-xl font-semibold text-[#050506]">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {callStatus ? <View className="mt-4 rounded-2xl border border-[#294A65] bg-[#0E1C2C] px-4 py-3"><Text className="text-sm font-semibold text-[#6EDBFF]">{callStatus}</Text></View> : null}

        <View className="mt-7 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3">
          <Text className="mr-3 text-lg text-muted">⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search conversations"
            placeholderTextColor="#777486"
            className="flex-1 text-base text-foreground"
          />
        </View>

        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-foreground">Your conversations</Text>
          <Text className="text-sm font-semibold text-primary">Mark all read</Text>
        </View>

        <View className="mt-4 overflow-hidden rounded-[26px] border border-border bg-surface">
          {conversations.filter(item => item.name.toLowerCase().includes(query.toLowerCase())).map((conversation, index, items) => (
            <TouchableOpacity key={conversation.name} className={index < items.length - 1 ? "flex-row items-center border-b border-border px-4 py-4" : "flex-row items-center px-4 py-4"}>
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: conversation.tone }}>
                <Text className="text-lg font-bold text-[#F4EEFF]">{conversation.letter}</Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-bold text-foreground">{conversation.name}</Text>
                  <Text className="text-xs text-muted">{conversation.time}</Text>
                </View>
                <Text numberOfLines={1} className="mt-1 text-sm text-muted">{conversation.preview}</Text>
              </View>
              {conversation.count ? <View className="ml-3 h-6 min-w-6 items-center justify-center rounded-full bg-[#6EA8FF] px-1.5"><Text className="text-xs font-bold text-[#050506]">{conversation.count}</Text></View> : null}
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-7 rounded-[26px] border border-[#34275A] bg-[#171126] p-5">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-[#B98CFF]">bliss note</Text>
          <Text className="mt-3 text-xl font-bold leading-7 text-foreground">Share the energy, not the noise.</Text>
          <Text className="mt-2 text-sm leading-5 text-[#AAA0BF]">Your chats are a softer place to learn, create and keep each other moving.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
