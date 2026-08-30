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
  assert.match(page, /aria-label=\{tr\("添加临时小事", "Add temporary action"\)\}/);
  assert.doesNotMatch(page, /tr\("小事", "Thing"\)/);
  assert.match(page, /<AppIcon name="add" \/><\/button>/);
  assert.match(page, /className="action-repeatable-badge"><AppIcon name="repeat" \/><\/span>/);
  assert.doesNotMatch(page, /<AppIcon name="repeat" \/> \{tr\("可重复"/);
  assert.doesNotMatch(page, /className="temporary-action-add"[^\n]*<AppIcon name="timer"/);
  assert.match(styles, /\.temporary-action-add[\s\S]*?width: auto;[\s\S]*?min-height: 42px/);
  assert.match(styles, /\.temporary-action-add[\s\S]*?margin: 0 0 10px auto/);
  assert.doesNotMatch(styles, /\.welcome-meta/);
  assert.doesNotMatch(workspace, /global-home-button/);
});
