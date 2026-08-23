import type { ActionTimeWindow, MicroAction } from "./types";

export const ACTION_ICON_OPTIONS = [
  "🌱", "🌿", "🌳", "🌸", "🌻", "✨", "⭐", "🔥", "💧", "☀️",
  "🌙", "🌈", "🍎", "🍊", "🥗", "🥛", "☕", "🍵", "🥤", "💊",
  "🧘", "💪", "🏃", "🚶", "🚴", "🏊", "🤸", "🏋️", "🫁", "🫀",
  "🧠", "🛏️", "🛁", "🪥", "📖", "📚", "✏️", "📝", "🔤", "💡",
  "🎨", "🖌️", "📷", "🎬", "🎧", "🎵", "🎹", "🎸", "💻", "⌨️",
  "🧹", "🧺", "🪴", "🍳", "🏡", "🗂️", "📅", "⏰", "⏳", "✅", "🎯",
  "💰", "🪙", "💼", "🤝", "💬", "📞", "✉️", "🫶", "😊", "🙏",
  "🧭", "🗺️", "✈️", "🚆", "🌍", "🎁", "🎉", "🧩", "🎮", "🏆",
];

export const ACTION_TIME_OPTIONS: Array<{
  id: ActionTimeWindow;
  label: string;
  icon: string;
  range: string;
}> = [
  { id: "morning", label: "早上", icon: "☀️", range: "建议 05:00–11:59" },
  { id: "noon", label: "中午", icon: "◐", range: "建议 12:00–17:59" },
  { id: "evening", label: "晚上", icon: "🌙", range: "建议 18:00–04:59" },
  { id: "anytime", label: "不限时间", icon: "∞", range: "无需分类" },
];

export const PROFILE_ACTION_TIME_GROUPS: Array<{
  id: ActionTimeWindow;
  label: string;
  icon: string;
}> = [
  { id: "morning", label: "早上", icon: "☀️" },
  { id: "noon", label: "中午", icon: "◐" },
  { id: "evening", label: "晚上", icon: "🌙" },
  { id: "anytime", label: "全天", icon: "∞" },
];

export const DEFAULT_ACTIONS: MicroAction[] = [
  { id: "water", name: "喝一杯水", icon: "💧", repeatable: true, timeWindow: "morning" },
  { id: "stretch", name: "平板支撑 5 秒", icon: "💪", repeatable: true, timerSeconds: 5 },
  { id: "read", name: "阅读一页", icon: "📖", repeatable: true },
  { id: "word", name: "学一个单词", icon: "🔤", repeatable: true },
];

export const PROFILE_ACTION_SWIPE_WIDTH = 132;
