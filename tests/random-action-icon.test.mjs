import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  ACTION_ICON_OPTIONS,
  randomActionIcon,
} from "../src/features/tasks/constants.ts";

test("selects a random icon from the existing action icon options", () => {
  assert.equal(randomActionIcon(() => 0), ACTION_ICON_OPTIONS[0]);
  assert.equal(
    randomActionIcon(() => 0.999999),
    ACTION_ICON_OPTIONS[ACTION_ICON_OPTIONS.length - 1],
  );
});

test("randomizes only new custom actions while preserving existing icons", async () => {
  const workspace = await readFile(
    new URL("../src/screens/check-in/CheckInWorkspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(workspace, /setDraftIcon\(action\?\.icon \|\| randomActionIcon\(\)\)/);
  assert.match(workspace, /function startCustomAction\(\)[\s\S]*?setDraftIcon\(randomActionIcon\(\)\)/);
  assert.match(workspace, /function openTemporaryActionEditor\(\)[\s\S]*?setDraftIcon\("⏳"\)/);
});

test("renders every action-picker option through the unified SVG icon system", async () => {
  const contentIcon = await readFile(
    new URL("../src/components/ui/ContentIcon.tsx", import.meta.url),
    "utf8",
  );

  for (const icon of ACTION_ICON_OPTIONS) {
    assert.ok(contentIcon.includes(`"${icon}":`), `${icon} needs an AppIcon mapping`);
  }
});

test("ships every SVG resource registered by AppIcon", async () => {
  const appIcon = await readFile(
    new URL("../src/components/ui/AppIcon.tsx", import.meta.url),
    "utf8",
  );
  const paths = [...appIcon.matchAll(/"(\/icons\/[^\"]+\.svg)"/g)]
    .map((match) => match[1]);

  await Promise.all(paths.map((path) => access(new URL(`../public${path}`, import.meta.url))));
});
