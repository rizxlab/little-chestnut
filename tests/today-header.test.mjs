import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the Today header quiet and the temporary-action entry compact", async () => {
  const page = await readFile(
    new URL("../src/screens/TodayPage.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../src/styles/screens.css", import.meta.url),
    "utf8",
  );
  const workspace = await readFile(
    new URL("../src/screens/check-in/CheckInWorkspace.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(page, /greeting\(/);
  assert.doesNotMatch(page, /welcome-meta/);
  assert.doesNotMatch(page, /calendar-entry-button/);
  assert.doesNotMatch(page, /day-phase-icon/);
  assert.doesNotMatch(page, /添加临时小事/);
  assert.match(page, /tr\("小事", "Thing"\)/);
  assert.match(styles, /\.temporary-action-add[\s\S]*?width: auto;[\s\S]*?min-height: 42px/);
  assert.doesNotMatch(styles, /\.welcome-meta/);
  assert.match(workspace, /\{\(tab !== "today"[\s\S]*?className="global-home-button"/);
});
