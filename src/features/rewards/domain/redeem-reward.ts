import { createRuntimeId } from "../../../shared/utils/runtime";
import type { Reward, RewardClaim } from "../types";

export function createRewardClaim(
  reward: Reward,
  createdAt = new Date(),
): RewardClaim {
  return {
    id: createRuntimeId("reward"),
    rewardId: reward.id,
    rewardName: reward.name,
    icon: reward.icon,
    cost: reward.cost,
    createdAt: createdAt.toISOString(),
  };
}
