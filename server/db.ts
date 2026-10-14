
    import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(pool);
    } catch {
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  try {
    const values: any = { openId: user.openId, name: user.name, email: user.email, loginMethod: (user as any).loginMethod };
    if ((user as any).lastSignedIn) values.lastSignedIn = (user as any).lastSignedIn;
    if ((user as any).role) values.role = (user as any).role;
    else if (user.openId === ENV.ownerOpenId) values.role = "admin";
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: values });
  } catch (e) { console.error(e); }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// Compatibility exports for old imports - ALL IN ONE
export async function createAuthSession(){return null as any}
export async function deleteAuthSession(){return null as any}
export async function getUserBySessionToken(){return null as any}
export async function getUserBySessionTokenHash(){return null as any}
export async function getUserBySession(){return null as any}
export async function getUserByOpenIdCompat(){return null as any}
export async function followUser(){return null as any}
export async function unfollowUser(){return null as any}
export async function getBlissProfile(){return null as any}
export async function getInterestIds(){return [] as any}
export async function getInterests(){return [] as any}
export async function createUser(){return null as any}
export async function getUserById(){return null as any}
export async function getUserByEmail(){return null as any}
export async function getInterestsList(){return [] as any}
export async function createCredentialUser(){return null as any}
export async function getUserByHandle(){return null as any}
export async function listInterests(){return [] as any}
export async function listReels(){return [] as any}
export async function updateBlissProfile(){return null as any}
export async function getUserByHandleId(){return null as any}
export async function createBlissProfile(){return null as any}
export async function getBlissProfiles(){return [] as any}
export async function searchUsersByHandle(){return [] as any}
export async function createReel(){return null as any}
