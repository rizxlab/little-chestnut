"use client";

import { useState } from "react";
import type { GrowthRecord } from "../features/growth/types";
import { DEFAULT_REWARDS } from "../features/rewards/constants";
import type { Reward, RewardClaim } from "../features/rewards/types";
import type { Language } from "../features/settings/types";
import { DEFAULT_ACTIONS } from "../features/tasks/constants";
import type { MicroAction } from "../features/tasks/types";

/**
 * Authoritative product data only. Page navigation, dialogs, gestures and form
 * drafts intentionally remain local to their owning UI.
 */
export function useAppDataState() {
  const [nickname, setNickname] = useState("");
  const [actions, setActions] = useState<MicroAction[]>(DEFAULT_ACTIONS);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [language, setLanguage] = useState<Language>("zh");
  const [shellBalance, setShellBalance] = useState(0);
  const [shellsEarned, setShellsEarned] = useState(0);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);

  return {
    nickname,
    setNickname,
    actions,
    setActions,
    records,
    setRecords,
    language,
    setLanguage,
    shellBalance,
    setShellBalance,
    shellsEarned,
    setShellsEarned,
    rewardClaims,
    setRewardClaims,
    rewards,
    setRewards,
  };
}
