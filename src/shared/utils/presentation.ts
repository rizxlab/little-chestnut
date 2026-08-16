import type { Language } from "../../features/settings/types";

export function milestoneThreshold(
  value: unknown,
  fallback: number,
  min = 1,
  max = 99,
) {
  const numericValue = Number(value);
  const candidate = Number.isFinite(numericValue) ? numericValue : fallback;
  return Math.min(max, Math.max(min, Math.round(candidate)));
}

export function greeting(language: Language, now = new Date()) {
  const hour = now.getHours();
  if (language === "en") {
    if (hour < 6) return "Good night";
    if (hour < 11) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}
