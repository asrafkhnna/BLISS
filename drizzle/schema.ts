import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const preferredFeedEnum = pgEnum("preferredFeed", ["social", "study"]);
export const kindEnum = pgEnum("kind", ["social", "study", "both"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  userHandle: varchar("userHandle", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  avatarUrl1: text("avatarUrl1"),
  bio: text("bio"),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const authSessions = pgTable("authSessions", {
  id: serial("id").primaryKey(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;

export const userPreferences = pgTable("userPreferences", {
  userId: integer("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  preferredFeed: preferredFeedEnum("preferredFeed").default("social").notNull(),
  studyLevel: varchar("studyLevel", { length: 32 }),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  kind: kindEnum("kind").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interest = typeof interests.$inferSelect;
export type InsertInterest = typeof interests.$inferInsert;

export const userInterests = pgTable("userInterests", {
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: integer("interestId").notNull().references(() => interests.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.interestId] })
}));

export const userFollows = pgTable("userFollows", {
  followerId: integer("followerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("followingId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.followerId, t.followingId] })
}));

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  authorId: integer("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
  caption: text("caption"),
  videoUrl: text("videoUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
