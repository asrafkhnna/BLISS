import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";

import { createAuthSession, deleteAuthSession, getUserBySessionTokenHash } from "../db";
import { BLISS_SESSION_COOKIE, currentBlissSessionCookie, getBlissSessionCookieOptions } from "./cookies";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_COST = 12;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeUserHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export async function hashBlissPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_COST);
}

export async function verifyBlissPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signInBlissUser(userId: number, req: Request, res: Response) {
  const rawToken = randomBytes(32).toString("hex");
  await createAuthSession({
    tokenHash: hashSessionToken(rawToken),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  res.cookie(BLISS_SESSION_COOKIE, rawToken, {
    ...getBlissSessionCookieOptions(req),
    maxAge: SESSION_TTL_MS,
  });
}

export async function authenticateBlissRequest(req: Request) {
  const rawToken = currentBlissSessionCookie(req);
  if (!rawToken) return null;
  return getUserBySessionTokenHash(hashSessionToken(rawToken));
}

export async function signOutBlissUser(req: Request, res: Response) {
  const rawToken = currentBlissSessionCookie(req);
  if (rawToken) await deleteAuthSession(hashSessionToken(rawToken));
  res.clearCookie(BLISS_SESSION_COOKIE, getBlissSessionCookieOptions(req));
}
