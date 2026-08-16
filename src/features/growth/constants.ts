import type { GrowthArea } from "./types";

export const DEFAULT_AREAS: GrowthArea[] = [
  { id: "body", name: "身体", icon: "🌱", color: "#5f8065", isDefault: true },
  { id: "wisdom", name: "智慧", icon: "📖", color: "#56748a", isDefault: true },
  { id: "create", name: "创造", icon: "🎨", color: "#8a6478", isDefault: true },
  { id: "soul", name: "心灵", icon: "🌙", color: "#78698f", isDefault: true },
  { id: "wealth", name: "财富", icon: "💰", color: "#a37845", isDefault: true },
  { id: "relationships", name: "关系", icon: "🤝", color: "#9b6a62", isDefault: true },
  { id: "explore", name: "探索", icon: "🧭", color: "#527d86", isDefault: true },
];

export const AREA_INTRODUCTIONS: Record<string, { zh: string; en: string }> = {
  body: {
    zh: "照顾身体的能量、力量与日常节律，让每一次行动都成为更稳固的基础。",
    en: "Care for your energy, strength, and daily rhythm—small actions that build a steadier foundation.",
  },
  wisdom: {
    zh: "通过阅读、学习与思考积累理解，让新知识一点点沉淀为自己的能力。",
    en: "Build understanding through reading, learning, and reflection, turning knowledge into lasting ability.",
  },
  create: {
    zh: "把想法变成看得见的表达，在一次次尝试中留下属于自己的作品。",
    en: "Turn ideas into visible expression and leave behind work that is distinctly yours.",
  },
  soul: {
    zh: "留意内心的感受与需要，为平静、觉察和自我关怀留出空间。",
    en: "Notice what you feel and need, making space for calm, awareness, and self-care.",
  },
  wealth: {
    zh: "关注资源的积累与使用，通过微小而持续的选择建立更从容的生活。",
    en: "Build and use resources mindfully through small, consistent choices that create more ease.",
  },
  relationships: {
    zh: "用真诚的交流与陪伴滋养连接，让重要的人在日常中被看见。",
    en: "Nurture connection through honest communication and presence, helping important people feel seen.",
  },
  explore: {
    zh: "保持好奇，主动接触新的地方、体验与可能，让生活不断打开。",
    en: "Stay curious and meet new places, experiences, and possibilities as life keeps opening up.",
  },
};

export const AREA_ICON_OPTIONS = [
  "🌿", "💚", "🌱", "📖", "📚", "🎨", "🌙", "💰", "🤝", "🧭",
  "☀️", "💼", "🏡", "🎯", "💡", "🌸", "🫶", "✨", "🧠", "💪",
];

export const AREA_COLORS = [
  "#5f8065", "#56748a", "#8a6478", "#78698f", "#a37845", "#9b6a62", "#527d86",
];

export const GROWTH_LEVEL_THRESHOLDS = [0, 10, 25, 45, 70, 100, 140, 190, 250, 320];
export const MAX_GROWTH_LEVEL = GROWTH_LEVEL_THRESHOLDS.length;
