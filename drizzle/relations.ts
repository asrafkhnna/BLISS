import { relations } from "drizzle-orm";

import {
  authSessions,
  interests,
  userFollows,
  userInterests,
  userPreferences,
  users,
  reels,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  sessions: many(authSessions),
  interests: many(userInterests),
  followers: many(userFollows, { relationName: "followers" }),
  following: many(userFollows, { relationName: "following" }),
  reels: many(reels),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const interestsRelations = relations(interests, ({ many }) => ({
  users: many(userInterests),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
  interest: one(interests, {
    fields: [userInterests.interestId],
    references: [interests.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const reelsRelations = relations(reels, ({ one }) => ({
  author: one(users, {
    fields: [reels.authorId],
    references: [users.id],
  }),
}));
