import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  activityDay,
  DAILY_CYCLE_HOUR,
  isToday,
} from "../src/features/statistics/domain/date-ranges.ts";
import { DEFAULT_ACTIONS } from "../src/features/tasks/constants.ts";

test("starts each activity day at 03:00 local time", () => {
  assert.equal(DAILY_CYCLE_HOUR, 3);
  assert.equal(activityDay(new Date(2026, 7, 23, 2, 59)), "2026-08-22");
  assert.equal(activityDay(new Date(2026, 7, 23, 3, 0)), "2026-08-23");
  assert.equal(
    isToday(new Date(2026, 7, 23, 2, 30), new Date(2026, 7, 22, 22, 0)),
    true,
  );
});

test("uses the activity-day boundary for temporary actions", async () => {
  const taskRules = await readFile(
    new URL("../src/features/tasks/domain/task-rules.ts", import.meta.url),
    "utf8",
  );

  assert.match(taskRules, /new Date\(`\$\{activityDay\(start\)\}T12:00:00`\)/);
  assert.match(taskRules, /action\.expiresOn < activityDay\(now\)/);
});

test("classifies the default water action as a morning reminder", () => {
  const water = DEFAULT_ACTIONS.find((action) => action.id === "water");
  assert.equal(water?.timeWindow, "morning");
});

test("shows anytime actions before timed reminders on the Today page", async () => {
  const taskRules = await readFile(
    new URL("../src/features/tasks/domain/task-rules.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    taskRules,
    /TODAY_TIME_ORDER[\s\S]*anytime:\s*0,[\s\S]*morning:\s*1,[\s\S]*noon:\s*2,[\s\S]*evening:\s*3/,
  );
});
