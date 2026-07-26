import { env } from "cloudflare:workers";

const COOKIE_NAME = "lizi_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
};

export type SessionUser = {
  id: number;
  username: string;
};

function getRawDb(): D1Database {
  if (!env.DB) throw new Error("Database is unavailable");
  return env.DB;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return new Uint8Array();
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return bytesToHex(new Uint8Array(digest));
}

async function passwordHash(password: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(salt),
      iterations,
    },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

function constantTimeEqual(first: string, second: string) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }
  return difference === 0;
}

function sessionTokenFrom(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  for (const item of cookie.split(";")) {
    const [name, ...parts] = item.trim().split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(parts.join("="));
  }
  return null;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function verifyCredentials(username: string, password: string) {
  const user = await getRawDb()
    .prepare(
      `SELECT id, username, password_hash, password_salt, password_iterations
       FROM users
       WHERE username = ?`,
    )
    .bind(username)
    .first<UserRow>();
  if (!user) return null;

  const candidate = await passwordHash(
    password,
    user.password_salt,
    user.password_iterations,
  );
  if (!constantTimeEqual(candidate, user.password_hash)) return null;
  return { id: user.id, username: user.username } satisfies SessionUser;
}

export async function createSession(userId: number) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToHex(tokenBytes);
  const sessionId = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  const db = getRawDb();
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(new Date().toISOString()),
    db
      .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(sessionId, userId, expiresAt),
  ]);
  return {
    token,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`,
  };
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = sessionTokenFrom(request);
  if (!token) return null;
  const sessionId = await sha256(token);
  const row = await getRawDb()
    .prepare(
      `SELECT users.id, users.username
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.id = ? AND sessions.expires_at > ?`,
    )
    .bind(sessionId, new Date().toISOString())
    .first<SessionUser>();
  return row || null;
}

export async function deleteSession(request: Request) {
  const token = sessionTokenFrom(request);
  if (token) {
    await getRawDb()
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(await sha256(token))
      .run();
  }
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function getAccountDb() {
  return getRawDb();
}
