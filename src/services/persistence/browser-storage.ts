import { GUEST_STORAGE_KEY, SAMPLE_HISTORY_KEY, STORAGE_KEY } from "../../app/constants";
import type { AppDataSnapshot } from "./app-data";

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function readAccountFallback(username: string) {
  return readJson(`${STORAGE_KEY}:${username}`)
    ?? (username === "123456" ? readJson(STORAGE_KEY) : null);
}

export function readGuestData() {
  return readJson(GUEST_STORAGE_KEY) ?? readJson(STORAGE_KEY);
}

export function saveBrowserData(
  accountUsername: string | null,
  data: AppDataSnapshot,
) {
  localStorage.setItem(
    accountUsername ? `${STORAGE_KEY}:${accountUsername}` : GUEST_STORAGE_KEY,
    JSON.stringify(data),
  );
}

export function hasSeededSampleHistory(username: string) {
  return localStorage.getItem(`${SAMPLE_HISTORY_KEY}:${username}`) === "done";
}

export function markSampleHistorySeeded(username: string) {
  localStorage.setItem(`${SAMPLE_HISTORY_KEY}:${username}`, "done");
}
