import assert from "node:assert/strict";
import test from "node:test";

import {
  getSessionUser,
  handleRegister,
  registerUser,
  UsernameTakenError,
  validateRegistrationCredentials,
  verifyCredentials,
} from "../db/auth.ts";

function normalizedSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

class FakeStatement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = normalizedSql(sql);
    this.values = values;
  }

  bind(...values) {
    return new FakeStatement(this.database, this.sql, values);
  }

  async first() {
    if (this.sql.startsWith("INSERT INTO users")) {
      const [username, passwordHash, passwordSalt, passwordIterations] = this.values;
      if (this.database.users.some((user) => user.username === username)) {
        throw new Error("D1_ERROR: UNIQUE constraint failed: users.username: SQLITE_CONSTRAINT");
      }
      const user = {
        id: this.database.users.length + 1,
        username,
        password_hash: passwordHash,
        password_salt: passwordSalt,
        password_iterations: passwordIterations,
      };
      this.database.users.push(user);
      return { id: user.id, username: user.username };
    }

    if (this.sql.includes("FROM users") && this.sql.includes("WHERE username = ?")) {
      return this.database.users.find((user) => user.username === this.values[0]) || null;
    }

    if (this.sql.includes("INNER JOIN users")) {
      const [sessionId, now] = this.values;
      const session = this.database.sessions.find(
        (item) => item.id === sessionId && item.expires_at > now,
      );
      if (!session) return null;
      const user = this.database.users.find((item) => item.id === session.user_id);
      return user ? { id: user.id, username: user.username } : null;
    }

    throw new Error(`Unhandled first(): ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("DELETE FROM sessions WHERE expires_at")) {
      const [now] = this.values;
      this.database.sessions = this.database.sessions.filter((item) => item.expires_at > now);
      return { success: true };
    }
    if (this.sql.startsWith("INSERT INTO sessions")) {
      const [id, userId, expiresAt] = this.values;
      this.database.sessions.push({ id, user_id: userId, expires_at: expiresAt });
      return { success: true };
    }
    throw new Error(`Unhandled run(): ${this.sql}`);
  }
}

class FakeD1Database {
  constructor() {
    this.users = [];
    this.sessions = [];
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }

  async batch(statements) {
    return Promise.all(statements.map((statement) => statement.run()));
  }
}

test("registers an account without exposing password material and creates a valid session", async () => {
  const database = new FakeD1Database();
  const registration = await registerUser("chestnut", "quiet-password", database);

  assert.deepEqual(registration.user, { id: 1, username: "chestnut" });
  assert.equal(database.users.length, 1);
  assert.notEqual(database.users[0].password_hash, "quiet-password");
  assert.match(database.users[0].password_hash, /^[0-9a-f]{64}$/);
  assert.match(database.users[0].password_salt, /^[0-9a-f]{32}$/);
  assert.equal(database.users[0].password_iterations, 100_000);
  assert.doesNotMatch(JSON.stringify(registration.user), /password|hash|salt/i);

  const cookie = registration.session.cookie.split(";")[0];
  const request = new Request("https://little-chestnut.example/api/auth/session", {
    headers: { cookie },
  });
  assert.deepEqual(await getSessionUser(request, database), registration.user);
  assert.match(registration.session.cookie, /HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=2592000/);
});

test("rejects a duplicate username and preserves existing login verification", async () => {
  const database = new FakeD1Database();
  await registerUser("same-name", "first-password", database);
  await assert.rejects(
    registerUser("same-name", "second-password", database),
    UsernameTakenError,
  );
  assert.equal(database.users.length, 1);
  assert.deepEqual(
    await verifyCredentials("same-name", "first-password", database),
    { id: 1, username: "same-name" },
  );
  assert.equal(await verifyCredentials("same-name", "wrong-password", database), null);
});

test("validates registration credentials without changing username case", () => {
  assert.deepEqual(validateRegistrationCredentials("   ", "secret", "secret"), {
    error: "请输入账号",
  });
  assert.deepEqual(validateRegistrationCredentials("person", "", ""), {
    error: "请输入密码",
  });
  assert.deepEqual(validateRegistrationCredentials("person", "one", "two"), {
    error: "两次输入的密码不一致",
  });
  assert.deepEqual(validateRegistrationCredentials("  Alice  ", "secret", "secret"), {
    username: "Alice",
    password: "secret",
  });
});

function registerRequest(payload, origin = "https://little-chestnut.example") {
  return new Request(`${origin}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(payload),
  });
}

test("register API returns a sanitized account and session cookie", async () => {
  const response = await handleRegister(
    registerRequest({
      username: "  Chestnut  ",
      password: "quiet-password",
      confirmPassword: "quiet-password",
    }),
    async (username) => ({
      user: { id: 7, username },
      session: {
        token: "private-token",
        cookie: "lizi_session=cookie-token; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000",
      },
    }),
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.deepEqual(body, { account: { username: "Chestnut" } });
  assert.match(response.headers.get("set-cookie") || "", /HttpOnly; Secure; SameSite=Lax/);
  assert.doesNotMatch(JSON.stringify(body), /password|hash|salt|token/i);
});

test("register API maps duplicate usernames to 409", async () => {
  const response = await handleRegister(
    registerRequest({ username: "taken", password: "secret", confirmPassword: "secret" }),
    async () => { throw new UsernameTakenError(); },
  );
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "这个账号已经存在" });
});

test("register API rejects empty credentials and mismatched confirmation", async () => {
  const cases = [
    [{ username: "  ", password: "secret", confirmPassword: "secret" }, "请输入账号"],
    [{ username: "person", password: "", confirmPassword: "" }, "请输入密码"],
    [{ username: "person", password: "one", confirmPassword: "two" }, "两次输入的密码不一致"],
  ];
  for (const [payload, error] of cases) {
    const response = await handleRegister(registerRequest(payload), async () => {
      throw new Error("registration should not run");
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error });
  }
});
