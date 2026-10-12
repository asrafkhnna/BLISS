import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";

import { BlissLogo } from "@/components/bliss-logo";
import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

type FeedFilter = "For you" | "Following" | "Reels" | "Posts" | "Study";
const filters: FeedFilter[] = ["For you", "Following", "Reels", "Posts", "Study"];

type LiveReel = {
  id: number;
  kind: "entertainment" | "study";
  mediaUrl: string;
  caption: string | null;
  createdAt: Date;
  authorName: string | null;
  authorHandle: string | null;
};

function ReelMedia({ item }: { item: LiveReel }) {
  const player = useVideoPlayer(item.mediaUrl, currentPlayer => {
    currentPlayer.loop = true;
  });

  return <VideoView player={player} contentFit="cover" nativeControls style={{ height: 310, width: "100%" }} />;
}

function formatTime(value: Date) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>(filters[0]);
  const [liked, setLiked] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const userSearch = trpc.search.users.useQuery({ query: searchQuery }, { enabled: searchQuery.trim().length >= 2 });
  const liveFeed = trpc.reels.feed.useQuery({}, { refetchOnMount: "always", refetchOnReconnect: true });
  const feedItems = useMemo(() => (liveFeed.data ?? []) as LiveReel[], [liveFeed.data]);
  const visibleItems = useMemo(
    () => feedItems.filter(item => activeFilter !== "Posts" && (activeFilter !== "Study" || item.kind === "study")),
    [activeFilter, feedItems],
  );

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-3"><BlissLogo size={42} /><View><Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">your signal</Text><Text className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">BLISS</Text></View></View><TouchableOpacity accessibilityLabel="Create Reel or Post" onPress={() => router.push("/create" as never)} className="h-10 w-10 items-center justify-center rounded-full bg-[#6EA8FF]"><Text className="text-xl font-semibold text-[#050506]">+</Text></TouchableOpacity></View>
        <View className="mt-6 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-3"><Text className="mr-3 text-lg text-muted">⌕</Text><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search User IDs, e.g. @maya" placeholderTextColor="#777486" autoCapitalize="none" autoCorrect={false} className="flex-1 text-base text-foreground" /></View>
        {searchQuery.trim().length >= 2 ? <View className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface">{userSearch.isLoading ? <Text className="px-4 py-4 text-sm text-muted">Searching BLISS IDs…</Text> : userSearch.data?.length ? userSearch.data.map(user => <TouchableOpacity key={user.id} onPress={() => router.push(`/profile/${user.id}` as never)} className="flex-row items-center border-b border-border px-4 py-3"><View className="h-10 w-10 items-center justify-center rounded-full bg-[#1D2A46]"><Text className="font-bold text-[#6EDBFF]">{(user.name ?? user.userHandle ?? "B").charAt(0).toUpperCase()}</Text></View><View className="ml-3"><Text className="font-bold text-foreground">{user.name ?? "BLISS creator"}</Text><Text className="text-sm text-[#B98CFF]">@{user.userHandle}</Text></View></TouchableOpacity>) : <Text className="px-4 py-4 text-sm text-muted">No matching User IDs yet.</Text>}</View> : null}
        <View className="mt-8 flex-row items-end justify-between"><View><Text className="text-4xl font-bold leading-tight text-foreground">Your feed.</Text><Text className="mt-2 text-base text-muted">Fresh Reels, newest first.</Text></View><View className="rounded-full border border-border bg-surface px-3 py-2"><Text className="text-xs font-bold uppercase tracking-wider text-primary">LIVE</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6" contentContainerStyle={{ gap: 9 }}>{filters.map(filter => <TouchableOpacity key={filter} onPress={() => setActiveFilter(filter)} className={activeFilter === filter ? "rounded-full bg-[#6EA8FF] px-4 py-3" : "rounded-full border border-border bg-surface px-4 py-3"}><Text className={activeFilter === filter ? "font-bold text-[#050506]" : "font-semibold text-muted"}>{filter}</Text></TouchableOpacity>)}</ScrollView>
        <View className="mt-7 gap-5">
          {liveFeed.isLoading ? <View className="items-center rounded-[24px] border border-border bg-surface p-8"><Text className="text-lg font-bold text-foreground">Loading live Reels…</Text><Text className="mt-2 text-center text-sm text-muted">Fetching the newest videos from BLISS Storage.</Text></View> : null}
          {liveFeed.isError ? <View className="items-center rounded-[24px] border border-[#5B2535] bg-[#2A111A] p-8"><Text className="text-lg font-bold text-[#FFB2BD]">Feed temporarily unavailable</Text><Text className="mt-2 text-center text-sm text-[#E3A8B3]">Pull to refresh and try again.</Text></View> : null}
          {!liveFeed.isLoading && !liveFeed.isError && activeFilter === "Posts" ? <View className="items-center rounded-[24px] border border-border bg-surface p-8"><Text className="text-lg font-bold text-foreground">Posts are coming next</Text><Text className="mt-2 text-center text-sm text-muted">The live Reel pipeline is connected. Photo and text Posts remain local for now.</Text></View> : null}
          {!liveFeed.isLoading && !liveFeed.isError && activeFilter !== "Posts" && visibleItems.map(item => {
            const isLiked = liked.includes(item.id);
            const apiBase = getApiBaseUrl();
            const mediaUrl = item.mediaUrl.startsWith("http") ? item.mediaUrl : `${apiBase}${item.mediaUrl}`;
            const creator = item.authorName ?? "BLISS creator";
            const handle = item.authorHandle ? `@${item.authorHandle}` : "@blisscreator";
            const accent = item.kind === "study" ? "#21463D" : "#172B45";
            const accentText = item.kind === "study" ? "#B5FFDB" : "#6EDBFF";
            return <View key={item.id} className="overflow-hidden rounded-[28px] border border-border bg-surface"><View className="bg-black"><ReelMedia item={{ ...item, mediaUrl } as LiveReel} /></View><View className="p-5" style={{ backgroundColor: accent }}><View className="flex-row items-center justify-between"><View className="rounded-full bg-black/25 px-3 py-1.5"><Text className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: accentText }}>{item.kind === "study" ? "STUDY REEL" : "ENTERTAINMENT"}</Text></View><Text className="text-xs text-white/60">{formatTime(item.createdAt)}</Text></View><Text className="mt-5 text-2xl font-bold leading-8 text-[#F4EEFF]">{item.caption || (item.kind === "study" ? "A fresh study idea from the BLISS community." : "A fresh moment from the BLISS community.")}</Text><View className="mt-5 flex-row items-center gap-2"><View className="h-9 w-9 items-center justify-center rounded-full bg-white/15"><Text className="font-bold text-white">{creator.charAt(0).toUpperCase()}</Text></View><View><Text className="font-semibold text-[#F4EEFF]">{creator}</Text><Text className="text-xs text-white/60">{handle}</Text></View></View></View><View className="flex-row items-center justify-between px-5 py-4"><View className="flex-row gap-5"><TouchableOpacity onPress={() => setLiked(current => isLiked ? current.filter(value => value !== item.id) : [...current, item.id])}><Text className={isLiked ? "font-bold text-[#6EA8FF]" : "font-semibold text-muted"}>{isLiked ? "♥" : "♡"} {isLiked ? "Liked" : "Like"}</Text></TouchableOpacity><TouchableOpacity><Text className="font-semibold text-muted">◌ Comment</Text></TouchableOpacity></View><TouchableOpacity><Text className="text-lg text-muted">↗</Text></TouchableOpacity></View></View>;
          })}
          {!liveFeed.isLoading && !liveFeed.isError && activeFilter !== "Posts" && visibleItems.length === 0 ? <View className="items-center rounded-[24px] border border-border bg-surface p-8"><Text className="text-lg font-bold text-foreground">No Reels yet</Text><Text className="mt-2 text-center text-sm text-muted">Record or upload the first Reel and it will appear here at the top.</Text></View> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
