import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the task editor stable while reserving keyboard scroll space", async () => {
  const hook = await readFile(
    new URL("../src/features/tasks/hooks/useTaskEditorKeyboard.ts", import.meta.url),
    "utf8",
  );
  const editor = await readFile(
    new URL("../src/features/tasks/components/TaskEditors.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../src/styles/dialogs.css", import.meta.url),
    "utf8",
  );

  assert.match(hook, /window\.visualViewport/);
  assert.match(hook, /scrollBeforeKeyboardRef/);
  assert.match(hook, /editorRef\.current\.scrollTop = preservedScrollTop/);
  assert.match(hook, /--editor-keyboard-inset/);
  assert.match(hook, /activeElement\.blur\(\)/);
  assert.match(editor, /onFocusCapture=\{handleActionEditorFocus\}/);
  assert.match(editor, /onPointerDownCapture=\{handleActionEditorPointerDown\}/);
  assert.match(styles, /var\(--editor-keyboard-inset, 0px\)/);
});
