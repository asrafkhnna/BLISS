export type RtcProvider = "none" | "agora" | "videosdk";
export type CallMode = "audio" | "video";

/**
 * Browser-safe RTC configuration only. Never place provider secrets in Expo code.
 * Set these public values when an RTC provider is selected, and issue short-lived
 * room tokens from the authenticated server endpoint below.
 */
export const RTC_CONFIG = {
  provider: (process.env.EXPO_PUBLIC_RTC_PROVIDER as RtcProvider | undefined) ?? "none",
  appId: process.env.EXPO_PUBLIC_RTC_APP_ID ?? "",
  tokenEndpoint: process.env.EXPO_PUBLIC_RTC_TOKEN_ENDPOINT ?? "/api/rtc/token",
} as const;

export type RtcCallRequest = {
  conversationId: string;
  mode: CallMode;
  participantIds: number[];
};

export type RtcCallResult =
  | { status: "started"; provider: Exclude<RtcProvider, "none">; mode: CallMode }
  | { status: "not-configured"; provider: "none"; message: string };

/**
 * Integration seam for Agora / VideoSDK.
 * Replace this implementation with the selected SDK adapter after adding the
 * provider package, token exchange route and permission handling.
 */
export async function startBlissCall(request: RtcCallRequest): Promise<RtcCallResult> {
  if (RTC_CONFIG.provider === "none" || !RTC_CONFIG.appId) {
    return {
      status: "not-configured",
      provider: "none",
      message: "Live calling will be available after an RTC provider is configured.",
    };
  }

  // TODO: POST to RTC_CONFIG.tokenEndpoint for a short-lived room token, then:
  // - Agora: initialize Agora engine, join the channel and publish mic/camera tracks.
  // - VideoSDK: create a meeting, join with the token and publish mic/camera tracks.
  // Keep this function as the single UI-facing call entry point.
  void request;
  return {
    status: "started",
    provider: RTC_CONFIG.provider,
    mode: request.mode,
  };
}
