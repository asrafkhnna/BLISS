import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { BlissLogo } from "@/components/bliss-logo";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const filters = ["For you", "Following", "Reels", "Posts", "Study"];
const feedItems = [
  { kind: "reel", creator: "Maya Chen", handle: "@mayamakes", title: "Make space for the idea before you make it perfect.", tag: "CREATIVE FLOW", accent: "#172B45", accentText: "#6EDBFF", likes: "12.8k", comments: "482" },
  { kind: "post", creator: "Riya Sharma", handle: "@riyafindsherhythm", title: "A small reminder: consistency can be quiet and still count.", tag: "COMMUNITY NOTE", accent: "#171126", accentText: "#B98CFF", likes: "4.2k", comments: "128" },
  { kind: "reel", creator: "Aarav Singh", handle: "@aaravlearns", title: "The 20-minute reset that makes studying feel lighter.", tag: "STUDY METHOD", accent: "#21463D", accentText: "#6EDBFF", likes: "8.4k", comments: "196" },
] as const;

type FeedFilter = typeof filters[number];

export default function HomeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>(filters[0]);
  const [liked, setLiked] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const userSearch = trpc.search.users.useQuery({ query: searchQuery }, { enabled: searchQuery.trim().length >= 2 });
  const visibleItems = useMemo(() => feedItems.filter(item => activeFilter === "For you" || activeFilter === "Following" || (activeFilter === "Reels" && item.kind === "reel") || (activeFilter === "Posts" && item.kind === "post") || (activeFilter === "Study" && item.tag === "STUDY METHOD")), [activeFilter]);

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-3"><BlissLogo size={42} /><View><Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">your signal</Text><Text className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">BLISS</Text></View></View><TouchableOpacity accessibilityLabel="Create Reel or Post" onPress={() => router.push("/create" as never)} className="h-10 w-10 items-center justify-center rounded-full bg-[#6EA8FF]"><Text className="text-xl font-semibold text-[#050506]">+</Text></TouchableOpacity></View>
        <View className="mt-6 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3"><Text className="mr-3 text-lg text-muted">⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search User IDs, e.g. @maya" placeholderTextColor="#777486" autoCapitalize="none" autoCorrect={false} className="flex-1 text-base text-foreground" /></View>
        {searchQuery.trim().length >= 2 ? <View className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface">{userSearch.isLoading ? <Text className="px-4 py-4 text-sm text-muted">Searching BLISS IDs…</Text> : userSearch.data?.length ? userSearch.data.map(user => <TouchableOpacity key={user.id} onPress={() => router.push(`/profile/${user.id}` as never)} className="flex-row items-center border-b border-border px-4 py-3"><View className="h-10 w-10 items-center justify-center rounded-full bg-[#1D2A46]"><Text className="font-bold text-[#6EDBFF]">{(user.name ?? user.userHandle ?? "B").charAt(0).toUpperCase()}</Text></View><View className="ml-3"><Text className="font-bold text-foreground">{user.name ?? "BLISS creator"}</Text><Text className="text-sm text-[#B98CFF]">@{user.userHandle}</Text></View></TouchableOpacity>) : <Text className="px-4 py-4 text-sm text-muted">No matching User IDs yet.</Text>}</View> : null}
        <View className="mt-8 flex-row items-end justify-between"><View><Text className="text-4xl font-bold leading-tight text-foreground">Your feed.</Text><Text className="mt-2 text-base text-muted">Good energy, useful ideas.</Text></View><View className="rounded-full border border-border bg-surface px-3 py-2"><Text className="text-xs font-bold uppercase tracking-wider text-primary">LIVE</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6" contentContainerStyle={{ gap: 9 }}>{filters.map(filter => <TouchableOpacity key={filter} onPress={() => setActiveFilter(filter)} className={activeFilter === filter ? "rounded-full bg-[#6EA8FF] px-4 py-3" : "rounded-full border border-border bg-surface px-4 py-3"}><Text className={activeFilter === filter ? "font-bold text-[#050506]" : "font-semibold text-muted"}>{filter}</Text></TouchableOpacity>)}</ScrollView>
        <View className="mt-7 gap-5">
          {visibleItems.map((item, index) => { const isLiked = liked.includes(index); return <View key={`${item.creator}-${item.kind}`} className="overflow-hidden rounded-[28px] border border-border bg-surface"><View className="h-[310px] justify-between p-5" style={{ backgroundColor: item.accent }}><View className="flex-row items-center justify-between"><View className="rounded-full bg-black/25 px-3 py-1.5"><Text className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: item.accentText }}>{item.tag}</Text></View><Text className="text-2xl text-white/70">⋯</Text></View><View>{item.kind === "post" ? <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><Text className="text-3xl text-[#B98CFF]">✦</Text></View> : <View className="mb-5 h-9 w-9 items-center justify-center rounded-full bg-white/15"><Text className="text-lg text-[#6EDBFF]">▶</Text></View>}<Text className="text-3xl font-bold leading-9 text-[#F4EEFF]">{item.title}</Text><View className="mt-5 flex-row items-center gap-2"><View className="h-9 w-9 items-center justify-center rounded-full bg-white/15"><Text className="font-bold text-white">{item.creator.charAt(0)}</Text></View><View><Text className="font-semibold text-[#F4EEFF]">{item.creator}</Text><Text className="text-xs text-white/60">{item.handle}</Text></View></View></View></View><View className="flex-row items-center justify-between px-5 py-4"><View className="flex-row gap-5"><TouchableOpacity onPress={() => setLiked(current => isLiked ? current.filter(value => value !== index) : [...current, index])}><Text className={isLiked ? "font-bold text-[#6EA8FF]" : "font-semibold text-muted"}>{isLiked ? "♥" : "♡"} {item.likes}</Text></TouchableOpacity><TouchableOpacity><Text className="font-semibold text-muted">◌ {item.comments}</Text></TouchableOpacity></View><TouchableOpacity><Text className="text-lg text-muted">↗</Text></TouchableOpacity></View></View>; })}
          {visibleItems.length === 0 ? <View className="items-center rounded-[24px] border border-border bg-surface p-8"><Text className="text-lg font-bold text-foreground">Nothing here yet</Text><Text className="mt-2 text-center text-sm text-muted">Be the first to share a {activeFilter === "Posts" ? "Post" : "Reel"}.</Text></View> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
