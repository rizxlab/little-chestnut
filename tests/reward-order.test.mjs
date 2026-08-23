import assert from "node:assert/strict";
import test from "node:test";

import {
  prioritizedLockedReward,
  reorderRewards,
} from "../src/features/rewards/domain/reward-order.ts";

const rewards = [
  { id: "drink", name: "饮品", description: "", icon: "🍵", cost: 5 },
  { id: "rest", name: "休息", description: "", icon: "🎧", cost: 12 },
  { id: "trip", name: "出游", description: "", icon: "🧭", cost: 30 },
];

test("reorders rewards without changing their contents", () => {
  const reordered = reorderRewards(rewards, "trip", "drink");

  assert.deepEqual(reordered.map((reward) => reward.id), ["trip", "drink", "rest"]);
  assert.deepEqual(rewards.map((reward) => reward.id), ["drink", "rest", "trip"]);
});

test("uses saved reward order when selecting the next locked target", () => {
  const reordered = reorderRewards(rewards, "trip", "drink");

  assert.equal(prioritizedLockedReward(reordered, 0)?.id, "trip");
  assert.equal(prioritizedLockedReward(reordered, 10)?.id, "trip");
  assert.equal(prioritizedLockedReward(reordered, 35), undefined);
});
