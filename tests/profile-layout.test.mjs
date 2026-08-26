import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses natural dividers instead of nested cards on the Profile page", async () => {
  const screens = await readFile(
    new URL("../src/styles/screens.css", import.meta.url),
    "utf8",
  );
  const themes = await readFile(
    new URL("../src/styles/themes.css", import.meta.url),
    "utf8",
  );

  assert.match(screens, /\.profile-actions[\s\S]*?border-top: 1px solid var\(--line\)[\s\S]*?background: transparent/);
  assert.match(screens, /\.profile-actions \.profile-action-card[\s\S]*?border: 0;[\s\S]*?border-radius: 0/);
  assert.match(screens, /\.philosophy[\s\S]*?border-radius: 0;[\s\S]*?box-shadow: none/);
  assert.match(themes, /html\[data-theme="dark"\] \.profile-actions[\s\S]*?background: transparent/);
});
