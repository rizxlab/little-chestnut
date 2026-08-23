import type { GrowthRecord } from "../../features/growth/types";
import { DEFAULT_REWARDS } from "../../features/rewards/constants";
import type { Reward, RewardClaim } from "../../features/rewards/types";
import type { AppPreferences, Language, Theme } from "../../features/settings/types";
import { DEFAULT_ACTIONS } from "../../features/tasks/constants";
import { actionTimeWindowFor, isTemporaryActionExpired, shellValueFor, temporaryActionDays } from "../../features/tasks/domain/task-rules";
import type { MicroAction } from "../../features/tasks/types";

export type AppDataSnapshot = {
  schemaVersion: number;
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
  };
};

export type AppDataInput = Omit<AppDataSnapshot, "schemaVersion"> & {
  accountUsername?: string | null;
};

export function createAppDataSnapshot(input: AppDataInput): AppDataSnapshot {
  return {
    schemaVersion: 2,
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
  const storedActions = Array.isArray(stored?.actions)
    ? stored.actions as MicroAction[]
    : [];
  const actions = storedActions.length
      ? storedActions.map((action) => {
        const defaultAction = DEFAULT_ACTIONS.find((item) => item.id === action.id);
        const actionWithoutGrowth = { ...action } as MicroAction & {
          tagIds?: unknown;
          value?: unknown;
        };
        delete actionWithoutGrowth.tagIds;
        delete actionWithoutGrowth.value;
        return {
          ...actionWithoutGrowth,
          shellValue: shellValueFor(action),
          repeatable: action.repeatable !== false,
          timeWindow: actionTimeWindowFor({
            timeWindow: action.timeWindow ?? defaultAction?.timeWindow,
          }),
          timerSeconds: action.timerSeconds ?? defaultAction?.timerSeconds,
          temporary: action.temporary === true,
          temporaryDays: action.temporary
            ? temporaryActionDays(action.temporaryDays)
            : undefined,
        };
      }).filter((action) => !isTemporaryActionExpired(action))
    : DEFAULT_ACTIONS;

  const storedRecords = Array.isArray(stored?.records)
    ? (stored.records as GrowthRecord[]).map((record) => {
        const recordWithoutGrowth = { ...record } as GrowthRecord & {
          tagIds?: unknown;
          value?: unknown;
        };
        delete recordWithoutGrowth.tagIds;
        delete recordWithoutGrowth.value;
        return {
          ...recordWithoutGrowth,
          shellValue: shellValueFor(record),
        };
      })
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
  return {
    schemaVersion: 2,
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
    },
  };
}
