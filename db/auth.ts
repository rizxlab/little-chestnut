const COOKIE_NAME = "lizi_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 100_000;

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

export class UsernameTakenError extends Error {
  constructor() {
    super("这个账号已经存在");
    this.name = "UsernameTakenError";
  }
}

export function validateRegistrationCredentials(
  username: string,
  password: string,
  confirmPassword: string,
) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) return { error: "请输入账号" } as const;
  if (!password) return { error: "请输入密码" } as const;
  if (password !== confirmPassword) return { error: "两次输入的密码不一致" } as const;
  if (normalizedUsername.length > 64 || password.length > 256) {
    return { error: "账号或密码长度超出限制" } as const;
  }
  return { username: normalizedUsername, password } as const;
}

async function getRawDb(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
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

async function derivePasswordHash(password: string, salt: string, iterations: number) {
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

export async function verifyCredentials(
  username: string,
  password: string,
  database?: D1Database,
) {
  const db = database ?? (await getRawDb());
  const user = await db
    .prepare(
      `SELECT id, username, password_hash, password_salt, password_iterations
       FROM users
       WHERE username = ?`,
    )
    .bind(username)
    .first<UserRow>();
  if (!user) return null;

  const candidate = await derivePasswordHash(
    password,
    user.password_salt,
    user.password_iterations,
  );
  if (!constantTimeEqual(candidate, user.password_hash)) return null;
  return { id: user.id, username: user.username } satisfies SessionUser;
}

function isUsernameConflict(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed:\s*users\.username/i.test(message);
}

export async function createUser(
  username: string,
  password: string,
  database?: D1Database,
) {
  const db = database ?? (await getRawDb());
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  try {
    const user = await db
      .prepare(
        `INSERT INTO users (username, password_hash, password_salt, password_iterations)
         VALUES (?, ?, ?, ?)
         RETURNING id, username`,
      )
      .bind(username, hash, salt, PASSWORD_ITERATIONS)
      .first<SessionUser>();
    if (!user) throw new Error("User could not be created");
    return user;
  } catch (error) {
    if (isUsernameConflict(error)) throw new UsernameTakenError();
    throw error;
  }
}

export async function createSession(userId: number, database?: D1Database) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToHex(tokenBytes);
  const sessionId = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  const db = database ?? (await getRawDb());
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

export async function registerUser(
  username: string,
  password: string,
  database?: D1Database,
) {
  const db = database ?? (await getRawDb());
  const user = await createUser(username, password, db);
  const session = await createSession(user.id, db);
  return { user, session };
}

type Register = typeof registerUser;

export async function handleRegister(request: Request, register: Register = registerUser) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
    confirmPassword?: string;
  } | null;
  const username = typeof payload?.username === "string" ? payload.username : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  const confirmPassword = typeof payload?.confirmPassword === "string"
    ? payload.confirmPassword
    : "";
  const validation = validateRegistrationCredentials(username, password, confirmPassword);
  if ("error" in validation) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const registration = await register(validation.username, validation.password);
    return Response.json(
      { account: { username: registration.user.username } },
      { status: 201, headers: { "Set-Cookie": registration.session.cookie } },
    );
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return Response.json({ error: "暂时无法创建账号" }, { status: 500 });
  }
}

export async function getSessionUser(
  request: Request,
  database?: D1Database,
): Promise<SessionUser | null> {
  const token = sessionTokenFrom(request);
  if (!token) return null;
  const sessionId = await sha256(token);
  const db = database ?? (await getRawDb());
  const row = await db
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
    const db = await getRawDb();
    await db
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(await sha256(token))
      .run();
  }
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getAccountDb() {
  return getRawDb();
}
