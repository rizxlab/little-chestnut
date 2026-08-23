import type { Tab } from "./types";
import type { AppIconName } from "../components/ui/AppIcon";

export const STORAGE_KEY = "lizi-growth-v3";
export const GUEST_STORAGE_KEY = `${STORAGE_KEY}:guest`;

export const NAV_ITEMS: Array<{ id: Tab; label: string; icon: AppIconName }> = [
  { id: "today", label: "今日", icon: "today" },
  { id: "growth", label: "成长", icon: "growth" },
  { id: "profile", label: "我的", icon: "profile" },
];
