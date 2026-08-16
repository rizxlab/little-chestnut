import type { Reward } from "./types";

export const REWARD_ICON_OPTIONS = [
  "🎁", "🍵", "☕", "🎧", "🍰", "🧁", "🌙", "🎬", "📚", "🎮",
  "🛁", "🌸", "🍜", "🛍️", "🎵", "🌿", "✈️", "🍽️", "🧸", "🎟️",
];

export const REWARD_COST_OPTIONS = [5, 10, 20, 30, 50, 100];

export const DEFAULT_REWARDS: Reward[] = [
  { id: "favorite-drink", name: "喜欢的饮品", description: "认真喝一杯自己喜欢的东西", icon: "🍵", cost: 5 },
  { id: "slow-half-hour", name: "兴趣半小时", description: "留半小时，只做真正想做的事", icon: "🎧", cost: 12 },
  { id: "small-treat", name: "一份小甜点", description: "给今天的自己一点甜", icon: "🍰", cost: 25 },
  { id: "rest-evening", name: "完整休息一晚", description: "今晚不赶进度，安心休息", icon: "🌙", cost: 50 },
];
