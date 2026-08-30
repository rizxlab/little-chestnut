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
  assert.match(settings, /每日重置时间/);
  assert.match(settings, /每天凌晨 3:00 开始新的一天/);
  assert.doesNotMatch(settings, /外观模式|theme-choice-grid|setTheme/);
  assert.ok(settings.lastIndexOf("关于栗子小事") > settings.indexOf("设备本地数据"));
  assert.match(settings, /设备本地数据/);
  assert.match(settings, /onClick=\{props\.onResetData\}/);
  assert.doesNotMatch(profile, /关于栗子小事/);
  assert.doesNotMatch(profile, /设备本地数据/);
  assert.doesNotMatch(profile, /className="shell-reward-list"/);
  assert.doesNotMatch(profile, /<span>给自己的奖励<\/span>/);
  assert.match(profile, /onClick=\{onOpenRewardManager\}/);
  assert.match(rewardEditors, /onRedeem\(editingReward\)/);
  assert.match(rewardEditors, /className="reward-manager-redeem"[\s\S]*?onRedeem\(reward\)/);
  assert.match(rewardEditors, /className="action-icon-trigger"[\s\S]*?ContentIcon value=\{draftIcon\}/);
  assert.match(rewardEditors, /aria-expanded=\{showRewardIconPicker\}/);
  assert.doesNotMatch(rewardEditors, /<IconPicker label="选择图标"/);
  assert.match(rewardEditors, /showRewardIconPicker &&[\s\S]*?reward-icon-dialog-title[\s\S]*?onDraftIconChange\(icon\)/);
  assert.doesNotMatch(rewardEditors, /REWARD_COST_OPTIONS|reward-cost-options|reward-cost-custom/);
  assert.match(rewardEditors, /className="action-shell-stepper reward-cost-stepper"/);
  assert.match(rewardEditors, /aria-label="所需栗壳减一"[\s\S]*?value=\{draftCost\}[\s\S]*?aria-label="所需栗壳加一"/);
  assert.match(rewardEditors, /栗壳与心愿/);
  assert.match(rewardEditors, /reward-wallet-stats[\s\S]*?\{shellBalance\}[\s\S]*?\{shellsEarned\}[\s\S]*?\{claimedCount\}/);
  assert.match(rewardEditors, /可用栗壳[\s\S]*?累计栗壳[\s\S]*?已兑换/);
  assert.match(rewardEditors, /<span aria-hidden="true">🌰<\/span>/);
  assert.doesNotMatch(rewardEditors, /光芒/);
});
