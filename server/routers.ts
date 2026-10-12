import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  followUser,
  getBlissProfile,
  getInterestIds,
  createCredentialUser,
  getUserByHandle,
  getUserByOpenId,
  listInterests,
  listReels,
  updateBlissProfile,
  searchUsersByHandle,
} from "./db";
import { hashBlissPassword, normalizeUserHandle, signInBlissUser, signOutBlissUser, verifyBlissPassword } from "./_core/bliss-auth";
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const profileInput = z.object({
  name: z.string().trim().min(1).max(120).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  onboardingComplete: z.boolean().optional(),
  preferredFeed: z.enum(["social", "study"]).optional(),
  studyLevel: z.string().trim().max(32).nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
  interestIds: z.array(z.number().int().positive()).max(50).optional(),
});

function databaseError(error: unknown): never {
  console.error("[BLISS] Database operation failed", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "BLISS data is temporarily unavailable",
    cause: error,
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signUp: publicProcedure
      .input(z.object({
        userHandle: z.string().trim().regex(/^[a-zA-Z0-9_]{3,32}$/, "User ID must be 3–32 letters, numbers or underscores"),
        name: z.string().trim().min(1).max(120),
        password: z.string().min(8).max(72),
      }))
      .mutation(async ({ ctx, input }) => {
        const userHandle = normalizeUserHandle(input.userHandle);
        if (await getUserByHandle(userHandle)) throw new TRPCError({ code: "CONFLICT", message: "That User ID is already taken" });
        try {
          const user = await createCredentialUser({ userHandle, name: input.name.trim(), passwordHash: await hashBlissPassword(input.password) });
          if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account could not be created" });
          await signInBlissUser(user.id, ctx.req, ctx.res);
          return { id: user.id, userHandle: user.userHandle, name: user.name };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[BLISS] Sign-up failed", error);
          throw new TRPCError({ code: "CONFLICT", message: "That User ID is already taken" });
        }
      }),
    login: publicProcedure
      .input(z.object({ userHandle: z.string().trim().min(3).max(32), password: z.string().min(1).max(72) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByHandle(normalizeUserHandle(input.userHandle));
        const valid = Boolean(user?.passwordHash) && await verifyBlissPassword(input.password, user?.passwordHash ?? "");
        if (!user || !valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid User ID or password" });
        await signInBlissUser(user.id, ctx.req, ctx.res);
        return { id: user.id, userHandle: user.userHandle, name: user.name };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      return signOutBlissUser(ctx.req, ctx.res).then(() => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(getSessionCookieName(ctx.req), { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
      });
    }),
  }),

  search: router({
    users: publicProcedure
      .input(z.object({ query: z.string().trim().min(1).max(32) }))
      .query(async ({ input }) => searchUsersByHandle(input.query)),
  }),

  profiles: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      try {
        const profile = await getBlissProfile(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }
        return profile;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),

    byId: publicProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ input }) => {
        try {
          const profile = await getBlissProfile(input.userId);
          if (!profile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
          }
          return profile;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          return databaseError(error);
        }
      }),

    update: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
      try {
        if (input.interestIds !== undefined) {
          const validIds = await getInterestIds(input.interestIds);
          if (validIds.length !== input.interestIds.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "One or more selected interests do not exist",
            });
          }
        }
        const profile = await updateBlissProfile(ctx.user.id, input);
        if (!profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
        }
        return profile;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        return databaseError(error);
      }
    }),
  }),

  interests: router({
    list: publicProcedure
      .input(z.object({ kind: z.enum(["social", "study", "both"]).optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await listInterests(input?.kind);
        } catch (error) {
          return databaseError(error);
        }
      }),

    mine: protectedProcedure.query(async ({ ctx }) => {
      try {
        const profile = await getBlissProfile(ctx.user.id);
        return profile?.interests ?? [];
      } catch (error) {
        return databaseError(error);
      }
    }),
  }),

  social: router({
    follow: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), value: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const target = await getBlissProfile(input.userId);
          if (!target) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
          }
          return await followUser(ctx.user.id, input.userId, input.value);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          if (error instanceof Error && error.message.includes("cannot follow")) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
          }
          return databaseError(error);
        }
      }),
  }),

  reels: router({
    feed: publicProcedure
      .input(z.object({ kind: z.enum(["entertainment", "study"]).optional() }).optional())
      .query(async ({ input }) => {
        try {
          return await listReels(input?.kind);
        } catch (error) {
          return databaseError(error);
        }
      }),
  }),

  // Kept as a small helper endpoint for server-side account/profile flows.
  users: router({
    byOpenId: protectedProcedure
      .input(z.object({ openId: z.string().min(1).max(64) }))
      .query(async ({ input }) => {
        try {
          const user = await getUserByOpenId(input.openId);
          if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
          return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            onboardingComplete: user.onboardingComplete,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          return databaseError(error);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
