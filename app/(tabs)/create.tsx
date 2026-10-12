import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BlissLogo } from "@/components/bliss-logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenContainer } from "@/components/screen-container";

type ReelType = "entertainment" | "study";
type ContentKind = "reel" | "post";
type CreateStep = "choose" | "camera" | "reelPreview" | "published";

export default function CreateScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraViewType>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [step, setStep] = useState<CreateStep>("choose");
  const [contentKind, setContentKind] = useState<ContentKind>("reel");
  const [reelType, setReelType] = useState<ReelType>("entertainment");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCamera = async () => {
    setError(null);
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) {
      setError("Camera access is needed to record a Reel.");
      return;
    }
    setStep("camera");
  };

  const pickVideo = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Gallery access is needed to choose a video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], allowsEditing: true, videoMaxDuration: 60, quality: 0.85 });
    if (!result.canceled && result.assets[0]?.uri) {
      setVideoUri(result.assets[0].uri);
      setStep("reelPreview");
    }
  };

  const pickPostImage = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Gallery access is needed to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.9 });
    if (!result.canceled && result.assets[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const recordVideo = async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    setError(null);
    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (result?.uri) {
        setVideoUri(result.uri);
        setStep("reelPreview");
      }
    } catch {
      setError("We could not record that Reel. Please try again.");
    } finally {
      setIsRecording(false);
    }
  };

  const publish = () => {
    if (contentKind === "post" && !postText.trim() && !imageUri) {
      setError("Add a photo or write something before publishing.");
      return;
    }
    setStep("published");
  };

  if (step === "camera") {
    return (
      <View className="flex-1 bg-[#050506]">
        <CameraView ref={cameraRef} className="flex-1" facing="back" mode="video">
          <View className="flex-1 justify-between bg-black/20 px-5 pb-10 pt-14">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setStep("choose")} className="h-11 w-11 items-center justify-center rounded-full bg-black/40"><Text className="text-2xl text-white">‹</Text></TouchableOpacity>
              <View className="rounded-full bg-black/40 px-4 py-2"><Text className="text-xs font-bold uppercase tracking-[2px] text-white">{reelType === "study" ? "Study Reel" : "Entertainment"}</Text></View>
              <View className="h-11 w-11" />
            </View>
            <View className="items-center">
              <Text className="mb-5 text-sm font-semibold text-white/80">Keep it under 60 seconds</Text>
              <TouchableOpacity accessibilityLabel={isRecording ? "Stop recording" : "Start recording"} onPress={isRecording ? () => cameraRef.current?.stopRecording() : recordVideo} className={isRecording ? "h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#FF5F70]" : "h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#6EA8FF]"}><View className={isRecording ? "h-7 w-7 rounded-md bg-white" : "h-14 w-14 rounded-full border-2 border-[#050506]"} /></TouchableOpacity>
              <Text className="mt-4 text-xs font-semibold text-white/80">{isRecording ? "Tap to stop" : "Tap to record"}</Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === "published") {
    const label = contentKind === "post" ? "Post" : reelType === "study" ? "Study Reel" : "Entertainment Reel";
    return <ScreenContainer className="items-center justify-center px-7"><BlissLogo size={112} /><Text className="mt-7 text-3xl font-bold text-foreground">Published to BLISS</Text><Text className="mt-3 text-center text-base leading-6 text-muted">Your {label} is ready for the community.</Text><TouchableOpacity onPress={() => router.replace("/(tabs)")} className="mt-8 rounded-full bg-[#6EA8FF] px-7 py-4"><Text className="font-bold text-[#050506]">Back to Feed</Text></TouchableOpacity></ScreenContainer>;
  }

  if (step === "reelPreview") {
    return <ScreenContainer className="px-5 pt-3"><ScrollView contentContainerStyle={{ paddingBottom: 32 }}><View className="flex-row items-center justify-between"><TouchableOpacity onPress={() => setStep("choose")}><Text className="text-base font-semibold text-muted">Cancel</Text></TouchableOpacity><Text className="text-lg font-bold text-foreground">New Reel</Text><TouchableOpacity onPress={publish}><Text className="text-base font-bold text-[#6EA8FF]">Publish</Text></TouchableOpacity></View><View className="mt-7 h-[390px] items-center justify-center overflow-hidden rounded-[30px] border border-[#294A65] bg-[#0E1C2C]"><View className="h-20 w-20 items-center justify-center rounded-full bg-[#1B3650]"><IconSymbol name="play.circle.fill" size={48} color="#6EDBFF" /></View><Text className="mt-5 text-lg font-bold text-foreground">Your video is ready</Text><Text className="mt-2 max-w-[250px] text-center text-sm leading-5 text-[#93A9BD]">Preview playback will appear here once the media upload pipeline is connected.</Text></View><Text className="mt-3 text-center text-xs text-muted">{videoUri ? "Video selected from your device" : "Video captured in BLISS"}</Text><Text className="mt-8 text-xl font-bold text-foreground">Choose your Reel type</Text><View className="mt-4 gap-3"><TouchableOpacity onPress={() => setReelType("entertainment")} className={reelType === "entertainment" ? "rounded-[24px] border border-[#6EA8FF] bg-[#172B45] p-5" : "rounded-[24px] border border-border bg-surface p-5"}><Text className="text-lg font-bold text-foreground">Entertainment Reel</Text><Text className="mt-1 text-sm text-muted">Share moments, trends and good energy.</Text></TouchableOpacity><TouchableOpacity onPress={() => setReelType("study")} className={reelType === "study" ? "rounded-[24px] border border-[#B98CFF] bg-[#171126] p-5" : "rounded-[24px] border border-border bg-surface p-5"}><Text className="text-lg font-bold text-foreground">Study Reel</Text><Text className="mt-1 text-sm text-muted">Share methods, notes and learning wins.</Text></TouchableOpacity></View><TouchableOpacity onPress={publish} className="mt-7 items-center rounded-full bg-[#6EA8FF] py-4"><Text className="font-bold text-[#050506]">Publish to BLISS</Text></TouchableOpacity></ScrollView></ScreenContainer>;
  }

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-3"><BlissLogo size={38} /><View><Text className="text-[10px] font-bold uppercase tracking-[3px] text-muted">make your mark</Text><Text className="mt-0.5 text-2xl font-bold text-foreground">Create</Text></View></View><TouchableOpacity onPress={() => router.back()}><Text className="text-base font-semibold text-muted">Close</Text></TouchableOpacity></View>
        <View className="mt-8 flex-row rounded-full border border-border bg-surface p-1"><TouchableOpacity onPress={() => setContentKind("reel")} className={contentKind === "reel" ? "flex-1 items-center rounded-full bg-[#6EA8FF] py-3" : "flex-1 items-center rounded-full py-3"}><Text className={contentKind === "reel" ? "font-bold text-[#050506]" : "font-semibold text-muted"}>Reel</Text></TouchableOpacity><TouchableOpacity onPress={() => setContentKind("post")} className={contentKind === "post" ? "flex-1 items-center rounded-full bg-[#B98CFF] py-3" : "flex-1 items-center rounded-full py-3"}><Text className={contentKind === "post" ? "font-bold text-[#050506]" : "font-semibold text-muted"}>Post</Text></TouchableOpacity></View>
        {contentKind === "reel" ? <>
          <View className="mt-7 rounded-[28px] border border-[#34275A] bg-[#171126] p-6"><Text className="text-3xl font-bold leading-9 text-foreground">What will you share?</Text><Text className="mt-3 text-base leading-6 text-[#AAA0BF]">Make something useful, joyful or both. Reels on BLISS are short by design.</Text></View>
          <Text className="mt-8 text-xl font-bold text-foreground">Choose a Reel type</Text>
          <View className="mt-4 gap-3"><TouchableOpacity onPress={() => setReelType("entertainment")} className={reelType === "entertainment" ? "rounded-[24px] border border-[#6EA8FF] bg-[#172B45] p-5" : "rounded-[24px] border border-border bg-surface p-5"}><Text className="text-lg font-bold text-foreground">Entertainment Reel</Text><Text className="mt-1 text-sm text-muted">Trends, moments and creative energy.</Text></TouchableOpacity><TouchableOpacity onPress={() => setReelType("study")} className={reelType === "study" ? "rounded-[24px] border border-[#B98CFF] bg-[#171126] p-5" : "rounded-[24px] border border-border bg-surface p-5"}><Text className="text-lg font-bold text-foreground">Study Reel</Text><Text className="mt-1 text-sm text-muted">Focus, learning and ideas that stick.</Text></TouchableOpacity></View>
          <View className="mt-8 flex-row gap-3"><TouchableOpacity onPress={openCamera} className="flex-1 items-center rounded-[24px] border border-[#294A65] bg-[#0E1C2C] p-5"><IconSymbol name="video.fill" size={32} color="#6EDBFF" /><Text className="mt-3 font-bold text-foreground">Record video</Text><Text className="mt-1 text-center text-xs text-muted">Use camera</Text></TouchableOpacity><TouchableOpacity onPress={pickVideo} className="flex-1 items-center rounded-[24px] border border-[#34275A] bg-[#171126] p-5"><IconSymbol name="photo.fill" size={32} color="#B98CFF" /><Text className="mt-3 font-bold text-foreground">Upload video</Text><Text className="mt-1 text-center text-xs text-muted">From gallery</Text></TouchableOpacity></View>
        </> : <>
          <View className="mt-7 rounded-[28px] border border-[#34275A] bg-[#171126] p-6"><Text className="text-3xl font-bold leading-9 text-foreground">Share a thought.</Text><Text className="mt-3 text-base leading-6 text-[#AAA0BF]">Post a photo, a note or a small win to your BLISS feed.</Text></View>
          <TextInput value={postText} onChangeText={setPostText} multiline placeholder="Write something worth sharing..." placeholderTextColor="#777486" className="mt-6 min-h-[150px] rounded-[24px] border border-border bg-surface p-5 text-base leading-6 text-foreground" textAlignVertical="top" />
          {imageUri ? <View className="mt-4 overflow-hidden rounded-[24px] border border-border"><Image source={{ uri: imageUri }} className="h-56 w-full" resizeMode="cover" /></View> : <TouchableOpacity onPress={pickPostImage} className="mt-4 items-center rounded-[24px] border border-[#34275A] bg-[#171126] p-6"><IconSymbol name="photo.fill" size={32} color="#B98CFF" /><Text className="mt-3 font-bold text-foreground">Add a photo</Text><Text className="mt-1 text-xs text-muted">Optional — share an image with your thought</Text></TouchableOpacity>}
          <TouchableOpacity onPress={publish} className="mt-7 items-center rounded-full bg-[#B98CFF] py-4"><Text className="font-bold text-[#050506]">Publish Post</Text></TouchableOpacity>
        </>}
        {error ? <Text className="mt-4 text-center text-sm font-semibold text-[#FF7187]">{error}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
