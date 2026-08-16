import type { Tab } from "./types";

export const STORAGE_KEY = "lizi-growth-v3";
export const GUEST_STORAGE_KEY = `${STORAGE_KEY}:guest`;
export const DEFAULT_CARD_MILESTONE_FIRST = 5;
export const DEFAULT_CARD_MILESTONE_SECOND = 10;

export const NAV_ITEMS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "today", label: "今日", icon: "◉" },
  { id: "growth", label: "成长", icon: "⌁" },
  { id: "profile", label: "我的", icon: "○" },
];
