import type { GrowthRecord } from "../../features/growth/types";

function sampleDate(daysAgo: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function buildSampleRecords(): GrowthRecord[] {
  return [
    { id: "sample-history-water", actionId: "water", actionName: "喝一杯水", icon: "💧", tagIds: ["body"], value: 1, source: "主动记录", createdAt: sampleDate(2, 9, 20) },
    { id: "sample-history-read", actionId: "read", actionName: "阅读一页", icon: "📖", tagIds: ["wisdom"], value: 1, source: "主动记录", createdAt: sampleDate(4, 21, 10) },
    { id: "sample-history-idea", actionId: "idea", actionName: "记录一个灵感", icon: "💡", tagIds: ["create"], value: 1, source: "主动记录", createdAt: sampleDate(4, 15, 35) },
    { id: "sample-history-stretch", actionId: "stretch", actionName: "拉伸 5 秒", icon: "🙆", tagIds: ["body"], value: 1, source: "主动记录", createdAt: sampleDate(7, 8, 45) },
    { id: "sample-history-word", actionId: "word", actionName: "学一个单词", icon: "🔤", tagIds: ["wisdom"], value: 1, source: "主动记录", createdAt: sampleDate(12, 12, 15) },
    { id: "sample-history-sketch", actionId: "sketch", actionName: "画一个草图", icon: "✏️", tagIds: ["create"], value: 1, source: "主动记录", createdAt: sampleDate(18, 18, 30) },
    { id: "sample-history-last-month", actionId: "water", actionName: "喝一杯水", icon: "💧", tagIds: ["body"], value: 1, source: "主动记录", createdAt: sampleDate(31, 10, 5) },
  ];
}
