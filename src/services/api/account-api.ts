import type { Account } from "../../features/profile/types";
import type { AppDataSnapshot } from "../persistence/app-data";

async function readResponseError(response: Response, fallback: string) {
  const result = await response.json().catch(() => null) as { error?: string } | null;
  return result?.error || fallback;
}

export async function getSessionAccount(): Promise<Account | null> {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const result = await response.json() as { account: Account };
  return result.account;
}

export async function loginAccount(username: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await readResponseError(response, "暂时无法登录"));
  }
  const result = await response.json() as { account?: Account };
  if (!result.account) throw new Error("暂时无法登录");
  return result.account;
}

export async function logoutAccount() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).catch(() => null);
}

export async function readAccountData() {
  const response = await fetch("/api/account-data", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) throw new Error("登录状态已失效");
  if (!response.ok) throw new Error("账号数据暂时无法读取");
  const result = await response.json() as { data?: unknown };
  return result.data ?? null;
}

export async function writeAccountData(data: AppDataSnapshot) {
  const response = await fetch("/api/account-data", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await readResponseError(response, "账号数据暂时无法保存"));
  }
}
