import type { Language } from "../../settings/types";
import { AREA_INTRODUCTIONS, GROWTH_LEVEL_THRESHOLDS, LEGACY_AREA_ID_MAP, MAX_GROWTH_LEVEL } from "../constants";
import type { GrowthArea, GrowthRecord } from "../types";

type TaggedEntity = { tagIds?: string[]; areaId?: string };

export function growthLevelFor(experience: number) {
  const safeExperience = Math.max(0, Math.floor(experience));
  let level = 1;
  for (let index = 1; index < GROWTH_LEVEL_THRESHOLDS.length; index += 1) {
    if (safeExperience < GROWTH_LEVEL_THRESHOLDS[index]) break;
    level = index + 1;
  }
  const currentThreshold = GROWTH_LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = level < MAX_GROWTH_LEVEL
    ? GROWTH_LEVEL_THRESHOLDS[level]
    : currentThreshold;
  const progress = level === MAX_GROWTH_LEVEL
    ? 100
    : ((safeExperience - currentThreshold)
      / Math.max(1, nextThreshold - currentThreshold)) * 100;
  return {
    level,
    experience: safeExperience,
    currentThreshold,
    nextThreshold,
    progress: Math.min(100, Math.max(0, progress)),
    remaining: Math.max(0, nextThreshold - safeExperience),
    isMax: level === MAX_GROWTH_LEVEL,
  };
}

export function areaIntroduction(area: GrowthArea, language: Language) {
  const introduction = AREA_INTRODUCTIONS[area.id];
  if (introduction) return introduction[language];
  return language === "zh"
    ? `记录与“${area.name}”有关的小小行动，看见这个方向如何在日常里慢慢生长。`
    : `Collect small actions related to “${area.name}” and watch this area grow through everyday life.`;
}

export function normalizedTagIds(value: TaggedEntity) {
  if (value.tagIds?.length) return value.tagIds;
  return value.areaId ? [value.areaId] : [];
}

export function migratedTagIds(value: TaggedEntity) {
  return Array.from(
    new Set(normalizedTagIds(value).map((id) => LEGACY_AREA_ID_MAP[id] || id)),
  );
}

export function growthTotals(areas: GrowthArea[], records: GrowthRecord[]) {
  return areas.map((area) => ({
    ...area,
    total: records
      .filter((record) => normalizedTagIds(record).includes(area.id))
      .reduce((sum, record) => sum + record.value, 0),
  }));
}
