import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses natural dividers instead of nested cards on the Profile page", async () => {
  const [screens, profile] = await Promise.all([
    readFile(new URL("../src/styles/screens.css", import.meta.url), "utf8"),
    readFile(new URL("../src/screens/ProfilePage.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(screens, /\.profile-actions[\s\S]*?border-top: 1px solid var\(--line\)[\s\S]*?background: transparent/);
  assert.match(screens, /\.profile-actions \.profile-action-card[\s\S]*?border: 0;[\s\S]*?border-radius: 0/);
  assert.match(screens, /\.profile-action-swipe-actions[\s\S]*?opacity: 0;[\s\S]*?visibility: hidden/);
  assert.match(screens, /\.profile-action-swipe-actions\.is-visible[\s\S]*?opacity: 1/);
  assert.match(screens, /\.profile-actions \.profile-action-card:active[\s\S]*?background: var\(--surface-card\)/);
  assert.match(screens, /\.philosophy[\s\S]*?border-radius: 0;[\s\S]*?box-shadow: none/);
  assert.doesNotMatch(profile, /MY SPACE/);
  assert.match(profile, /profile-heading-row[\s\S]*?profile-account-button[\s\S]*?profile-calendar-button[\s\S]*?settings-entry-button/);
  assert.doesNotMatch(profile, /我的栗子|My Chestnuts/);
});
