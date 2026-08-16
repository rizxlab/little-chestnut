import { DEFAULT_CARD_MILESTONE_FIRST, DEFAULT_CARD_MILESTONE_SECOND } from "../../app/constants";
import { DEFAULT_AREAS } from "../../features/growth/constants";
import { normalizedTagIds } from "../../features/growth/domain/growth-rules";
import type { GrowthArea, GrowthRecord } from "../../features/growth/types";
import { DEFAULT_REWARDS } from "../../features/rewards/constants";
import type { Reward, RewardClaim } from "../../features/rewards/types";
import type { AppPreferences, Language, Theme } from "../../features/settings/types";
import { DEFAULT_ACTIONS } from "../../features/tasks/constants";
import { actionTimeWindowFor, isTemporaryActionExpired, shellValueFor, temporaryActionDays } from "../../features/tasks/domain/task-rules";
import type { MicroAction } from "../../features/tasks/types";
import { milestoneThreshold } from "../../shared/utils/presentation";

export type AppDataSnapshot = {
  schemaVersion: number;
  areas: GrowthArea[];
  actions: MicroAction[];
  records: GrowthRecord[];
  shellBalance: number;
  shellsEarned: number;
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  profile: { nickname: string };
  preferences: {
    language: Language;
    theme: Theme;
    cardMilestoneFirst: number;
    cardMilestoneSecond: number;
  };
};

export type AppDataInput = Omit<AppDataSnapshot, "schemaVersion"> & {
  accountUsername?: string | null;
};

export function createAppDataSnapshot(input: AppDataInput): AppDataSnapshot {
  return {
    schemaVersion: 1,
    areas: input.areas,
    actions: input.actions,
    records: input.records,
    shellBalance: input.shellBalance,
    shellsEarned: input.shellsEarned,
    rewards: input.rewards,
    rewardClaims: input.rewardClaims,
    profile: {
      nickname: input.accountUsername ? input.profile.nickname.trim() : "",
    },
    preferences: input.preferences,
  };
}

export function normalizeAppData(
  value: unknown,
): AppDataSnapshot {
  const stored = value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
  const storedAreas = Array.isArray(stored?.areas) ? stored.areas as GrowthArea[] : [];
  const areas = storedAreas.length ? storedAreas : DEFAULT_AREAS;

  const storedActions = Array.isArray(stored?.actions)
    ? stored.actions as MicroAction[]
    : [];
  const actions = storedActions.length
      ? storedActions.map((action) => {
        const defaultAction = DEFAULT_ACTIONS.find((item) => item.id === action.id);
        return {
          ...action,
          tagIds: normalizedTagIds(action).length
            ? normalizedTagIds(action)
            : defaultAction?.tagIds || [],
          shellValue: shellValueFor(action),
          repeatable: action.repeatable !== false,
          timeWindow: actionTimeWindowFor(action),
          timerSeconds: action.timerSeconds ?? defaultAction?.timerSeconds,
          temporary: action.temporary === true,
          temporaryDays: action.temporary
            ? temporaryActionDays(action.temporaryDays)
            : undefined,
        };
      }).filter((action) => !isTemporaryActionExpired(action))
    : DEFAULT_ACTIONS;

  const storedRecords = Array.isArray(stored?.records)
    ? (stored.records as GrowthRecord[]).map((record) => ({
        ...record,
        tagIds: normalizedTagIds(record),
        shellValue: shellValueFor(record),
      }))
    : [];
  const records = storedRecords;
  const earnedFromRecords = records.reduce(
    (total, record) => total + shellValueFor(record),
    0,
  );
  const preferences = stored?.preferences && typeof stored.preferences === "object"
    ? stored.preferences as AppPreferences
    : null;
  const profile = stored?.profile && typeof stored.profile === "object"
    ? stored.profile as { nickname?: string }
    : null;
  const cardMilestoneFirst = milestoneThreshold(
    preferences?.cardMilestoneFirst,
    DEFAULT_CARD_MILESTONE_FIRST,
    1,
    98,
  );

  return {
    schemaVersion: 1,
    areas,
    actions,
    records,
    shellBalance: typeof stored?.shellBalance === "number"
      ? Math.max(0, stored.shellBalance)
      : earnedFromRecords,
    shellsEarned: typeof stored?.shellsEarned === "number"
      ? Math.max(0, stored.shellsEarned)
      : earnedFromRecords,
    rewards: Array.isArray(stored?.rewards) ? stored.rewards as Reward[] : DEFAULT_REWARDS,
    rewardClaims: Array.isArray(stored?.rewardClaims)
      ? stored.rewardClaims as RewardClaim[]
      : [],
    profile: {
      nickname: typeof profile?.nickname === "string" ? profile.nickname.slice(0, 16) : "",
    },
    preferences: {
      language: preferences?.language === "en" ? "en" : "zh",
      theme: preferences?.theme === "dark" ? "dark" : "light",
      cardMilestoneFirst,
      cardMilestoneSecond: milestoneThreshold(
        preferences?.cardMilestoneSecond,
        DEFAULT_CARD_MILESTONE_SECOND,
        cardMilestoneFirst + 1,
        99,
      ),
    },
  };
}
