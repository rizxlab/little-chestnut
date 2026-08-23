import type { Reward } from "../types";

export function reorderRewards(
  rewards: Reward[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = rewards.findIndex((reward) => reward.id === sourceId);
  const targetIndex = rewards.findIndex((reward) => reward.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rewards;

  const nextRewards = [...rewards];
  const [movedReward] = nextRewards.splice(sourceIndex, 1);
  nextRewards.splice(targetIndex, 0, movedReward);
  return nextRewards;
}

export function prioritizedLockedReward(rewards: Reward[], shellBalance: number) {
  return rewards.find((reward) => reward.cost > shellBalance);
}
