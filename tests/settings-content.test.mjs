import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps utility information in Settings and reward choices in management", async () => {
  const settings = await readFile(
    new URL("../src/screens/SettingsPage.tsx", import.meta.url),
    "utf8",
  );
  const profile = await readFile(
    new URL("../src/screens/ProfilePage.tsx", import.meta.url),
    "utf8",
  );
  const rewardEditors = await readFile(
    new URL("../src/features/rewards/components/RewardEditors.tsx", import.meta.url),
    "utf8",
  );

  assert.match(settings, /关于栗子小事/);
  assert.match(settings, /设备本地数据/);
  assert.match(settings, /onClick=\{props\.onResetData\}/);
  assert.doesNotMatch(profile, /关于栗子小事/);
  assert.doesNotMatch(profile, /设备本地数据/);
  assert.doesNotMatch(profile, /className="shell-reward-list"/);
  assert.match(profile, /给自己的奖励/);
  assert.match(profile, /onClick=\{onOpenRewardManager\}/);
  assert.match(rewardEditors, /onRedeem\(editingReward\)/);
});
