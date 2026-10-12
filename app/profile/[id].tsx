import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function FriendProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const profile = trpc.profiles.byId.useQuery({ userId }, { enabled: Number.isInteger(userId) && userId > 0 });

  if (profile.isLoading) return <ScreenContainer className="items-center justify-center"><Text className="text-muted">Loading profile…</Text></ScreenContainer>;
  if (profile.error || !profile.data) return <ScreenContainer className="items-center justify-center px-6"><Text className="text-xl font-bold text-foreground">Profile unavailable</Text><Text className="mt-2 text-center text-muted">This BLISS profile could not be found.</Text><TouchableOpacity onPress={() => router.back()} className="mt-6 rounded-full bg-[#6EA8FF] px-6 py-3"><Text className="font-bold text-[#050506]">Go back</Text></TouchableOpacity></ScreenContainer>;

  const user = profile.data;
  return <ScreenContainer className="px-5 pt-3"><ScrollView contentContainerStyle={{ paddingBottom: 32 }}><TouchableOpacity onPress={() => router.back()}><Text className="text-base font-semibold text-muted">‹ Back to search</Text></TouchableOpacity><View className="mt-10 items-center"><View className="h-28 w-28 items-center justify-center rounded-full border-2 border-[#6EA8FF] bg-[#1D2A46]"><Text className="text-4xl font-bold text-[#F4EEFF]">{(user.name ?? user.userHandle ?? "B").charAt(0).toUpperCase()}</Text></View><Text className="mt-5 text-3xl font-bold text-foreground">{user.name ?? "BLISS creator"}</Text><Text className="mt-1 text-base text-[#B98CFF]">@{user.userHandle ?? "bliss-user"}</Text><Text className="mt-5 max-w-[300px] text-center text-base leading-6 text-muted">{user.bio ?? "Sharing useful ideas and good energy on BLISS."}</Text></View><View className="mt-8 rounded-[26px] border border-border bg-surface p-5"><Text className="text-xs font-bold uppercase tracking-[2px] text-[#6EDBFF]">BLISS profile</Text><Text className="mt-3 text-lg font-bold text-foreground">{user.followerCount} followers</Text><Text className="mt-1 text-sm text-muted">{user.followingCount} following · member since {new Date(user.createdAt).getFullYear()}</Text></View><TouchableOpacity className="mt-6 items-center rounded-full bg-[#6EA8FF] py-4"><Text className="font-bold text-[#050506]">Follow @{user.userHandle}</Text></TouchableOpacity></ScrollView></ScreenContainer>;
}
