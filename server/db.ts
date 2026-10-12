import { and, count, desc, eq, inArray, like } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  authSessions,
  interests,
  InsertUser,
  userFollows,
  userInterests,
  userPreferences,
  users,
  reels,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch {
      console.warn("[Database] Failed to connect");
      _db = null;
    }
  }
  return _db;
}

function requireDb<T>(db: T | null): T {
  if (!db) {
    throw new Error("Database is not available");
  }
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user");
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBlissProfile(userId: number) {
  const db = requireDb(await getDb());
  const [user] = await db
    .select({
      id: users.id,
      userHandle: users.userHandle,
      name: users.name,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      onboardingComplete: users.onboardingComplete,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return undefined;

  const [preference] = await db
    .select({
      preferredFeed: userPreferences.preferredFeed,
      studyLevel: userPreferences.studyLevel,
      notificationsEnabled: userPreferences.notificationsEnabled,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const selectedInterests = await db
    .select({ id: interests.id, slug: interests.slug, label: interests.label, kind: interests.kind })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));

  const [followers] = await db
    .select({ value: count() })
    .from(userFollows)
    .where(eq(userFollows.followingId, userId));
  const [following] = await db
    .select({ value: count() })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));

  return {
    ...user,
    preferences: preference ?? null,
    interests: selectedInterests,
    followerCount: Number(followers?.value ?? 0),
    followingCount: Number(following?.value ?? 0),
  };
}

export async function updateBlissProfile(
  userId: number,
  input: {
    name?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    onboardingComplete?: boolean;
    preferredFeed?: "social" | "study";
    studyLevel?: string | null;
    notificationsEnabled?: boolean;
    interestIds?: number[];
  },
) {
  const db = requireDb(await getDb());

  await db.transaction(async tx => {
    const userUpdate: Partial<typeof users.$inferInsert> = {};
    if (input.name !== undefined) userUpdate.name = input.name;
    if (input.avatarUrl !== undefined) userUpdate.avatarUrl = input.avatarUrl;
    if (input.bio !== undefined) userUpdate.bio = input.bio;
    if (input.onboardingComplete !== undefined) {
      userUpdate.onboardingComplete = input.onboardingComplete;
    }
    if (Object.keys(userUpdate).length > 0) {
      await tx.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    const preferenceUpdate = {
      preferredFeed: input.preferredFeed,
      studyLevel: input.studyLevel,
      notificationsEnabled: input.notificationsEnabled,
    };
    const hasPreferenceUpdate = Object.values(preferenceUpdate).some(value => value !== undefined);
    if (hasPreferenceUpdate) {
      await tx
        .insert(userPreferences)
        .values({ userId, ...preferenceUpdate })
        .onDuplicateKeyUpdate({ set: preferenceUpdate });
    }

    if (input.interestIds !== undefined) {
      await tx.delete(userInterests).where(eq(userInterests.userId, userId));
      if (input.interestIds.length > 0) {
        await tx.insert(userInterests).values(
          input.interestIds.map(interestId => ({ userId, interestId })),
        );
      }
    }
  });

  return getBlissProfile(userId);
}

export async function listInterests(kind?: "social" | "study" | "both") {
  const db = requireDb(await getDb());
  return db
    .select({ id: interests.id, slug: interests.slug, label: interests.label, kind: interests.kind })
    .from(interests)
    .where(kind ? inArray(interests.kind, [kind, "both"]) : undefined)
    .orderBy(interests.label);
}

export async function getInterestIds(ids: number[]) {
  if (ids.length === 0) return [];
  const db = requireDb(await getDb());
  const rows = await db.select({ id: interests.id }).from(interests).where(inArray(interests.id, ids));
  return rows.map(row => row.id);
}

export async function followUser(followerId: number, followingId: number, value: boolean) {
  if (followerId === followingId) throw new Error("Users cannot follow themselves");
  const db = requireDb(await getDb());

  if (value) {
    await db.insert(userFollows).values({ followerId, followingId }).onDuplicateKeyUpdate({
      set: { followerId },
    });
  } else {
    await db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));
  }

  return { following: value };
}


export async function getUserByHandle(userHandle: string) {
  const db = requireDb(await getDb());
  const [user] = await db.select().from(users).where(eq(users.userHandle, userHandle)).limit(1);
  return user;
}

export async function searchUsersByHandle(query: string) {
  const db = requireDb(await getDb());
  const normalized = query.trim().replace(/^@/, "").toLowerCase();
  if (!normalized) return [];
  return db
    .select({ id: users.id, userHandle: users.userHandle, name: users.name, avatarUrl: users.avatarUrl, bio: users.bio })
    .from(users)
    .where(like(users.userHandle, `${normalized}%`))
    .limit(20);
}

export async function createCredentialUser(input: { userHandle: string; passwordHash: string; name: string }) {
  const db = requireDb(await getDb());
  const openId = `bliss_${randomUUID()}`;
  await db.insert(users).values({
    openId,
    userHandle: input.userHandle,
    passwordHash: input.passwordHash,
    name: input.name,
    loginMethod: "bliss_password",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(openId);
}

export async function createAuthSession(input: { tokenHash: string; userId: number; expiresAt: Date }) {
  const db = requireDb(await getDb());
  await db.insert(authSessions).values(input);
}

export async function getUserBySessionTokenHash(tokenHash: string) {
  const db = requireDb(await getDb());
  const [row] = await db
    .select({ user: users, expiresAt: authSessions.expiresAt })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(eq(authSessions.tokenHash, tokenHash))
    .limit(1);
  if (!row || row.expiresAt <= new Date()) return undefined;
  return row.user;
}

export async function deleteAuthSession(tokenHash: string) {
  const db = requireDb(await getDb());
  await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}

export async function createReel(input: {
  authorId: number;
  kind: "entertainment" | "study";
  storageKey: string;
  mediaUrl: string;
  contentType: string;
  caption?: string | null;
  fileSize: number;
}) {
  const db = requireDb(await getDb());
  const result = await db.insert(reels).values({
    authorId: input.authorId,
    kind: input.kind,
    storageKey: input.storageKey,
    mediaUrl: input.mediaUrl,
    contentType: input.contentType,
    caption: input.caption ?? null,
    fileSize: input.fileSize,
  });
  const reelId = Number(result[0].insertId);
  return getReelById(reelId);
}

export async function getReelById(reelId: number) {
  const db = requireDb(await getDb());
  const [row] = await db
    .select({
      id: reels.id,
      kind: reels.kind,
      mediaUrl: reels.mediaUrl,
      contentType: reels.contentType,
      caption: reels.caption,
      fileSize: reels.fileSize,
      createdAt: reels.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorHandle: users.userHandle,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(reels)
    .innerJoin(users, eq(reels.authorId, users.id))
    .where(eq(reels.id, reelId))
    .limit(1);
  return row;
}

export async function listReels(kind?: "entertainment" | "study") {
  const db = requireDb(await getDb());
  return db
    .select({
      id: reels.id,
      kind: reels.kind,
      mediaUrl: reels.mediaUrl,
      contentType: reels.contentType,
      caption: reels.caption,
      fileSize: reels.fileSize,
      createdAt: reels.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorHandle: users.userHandle,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(reels)
    .innerJoin(users, eq(reels.authorId, users.id))
    .where(kind ? eq(reels.kind, kind) : undefined)
    .orderBy(desc(reels.createdAt), desc(reels.id))
    .limit(100);
}
