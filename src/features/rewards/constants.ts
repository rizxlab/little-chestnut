import type { Reward } from "./types";

export const REWARD_ICON_OPTIONS = [
  "🎁", "🍵", "☕", "🎧", "🍰", "🧁", "🌙", "🎬", "📚", "🎮",
  "🛁", "🌸", "🍜", "🛍️", "🎵", "🌿", "✈️", "🍽️", "🧸", "🎟️",
];

export const DEFAULT_REWARDS: Reward[] = [
  { id: "favorite-drink", name: "喜欢的饮品", description: "认真喝一杯自己喜欢的东西", icon: "🍵", cost: 5 },
  { id: "slow-half-hour", name: "兴趣半小时", description: "留半小时，只做真正想做的事", icon: "🎧", cost: 12 },
];
