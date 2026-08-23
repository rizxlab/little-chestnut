import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("uses a fresh browser storage namespace without legacy fallbacks", async () => {
  const [constants, browserStorage, appData] = await Promise.all([
    readFile(new URL("../src/app/constants.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/persistence/browser-storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/persistence/app-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(constants, /STORAGE_KEY = "lizi-growth-v3"/);
  assert.doesNotMatch(constants, /SAMPLE_HISTORY/);
  assert.doesNotMatch(browserStorage, /123456|readJson\(STORAGE_KEY\)|sample/i);
  assert.doesNotMatch(appData, /areaSchemaVersion|seedSampleHistory|LEGACY_|migratedTagIds|DEFAULT_AREAS|normalizedTagIds/);
});

test("removes growth areas, scores, experience, and levels from the product", async () => {
  const files = await Promise.all([
    readFile(new URL("../src/screens/check-in/CheckInWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/screens/GrowthPage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/tasks/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/features/growth/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/persistence/app-data.ts", import.meta.url), "utf8"),
  ]);
  const productSource = files.join("\n");

  assert.doesNotMatch(productSource, /GrowthArea|DEFAULT_AREAS|growthLevelFor|tagIds:|value: number|Lv\.|领域等级|成长值|领域经验/);
  assert.match(productSource, /schemaVersion: 2/);
});

test("ships one credential-free initial D1 migration", async () => {
  const migrationNames = (await readdir(new URL("../drizzle/", import.meta.url)))
    .filter((name) => name.endsWith(".sql"));

  assert.equal(migrationNames.length, 1);
  const migration = await readFile(
    new URL(`../drizzle/${migrationNames[0]}`, import.meta.url),
    "utf8",
  );

  assert.match(migration, /CREATE TABLE `users`/);
  assert.match(migration, /CREATE TABLE `sessions`/);
  assert.match(migration, /CREATE TABLE `account_data`/);
  assert.match(migration, /sessions_user_id_idx/);
  assert.match(migration, /sessions_expires_at_idx/);
  assert.doesNotMatch(migration, /INSERT(?: OR IGNORE)? INTO `users`/i);
  assert.doesNotMatch(migration, /123456|0112/);
});

test("removes confirmed starter assets and retired source modules", async () => {
  const removedFiles = [
    "../public/favicon.svg",
    "../public/file.svg",
    "../public/globe.svg",
    "../public/window.svg",
    "../db/index.ts",
    "../src/features/shells/types.ts",
    "../src/services/migrations/sample-history.ts",
    "../src/features/growth/constants.ts",
    "../src/features/growth/domain/growth-rules.ts",
    "../src/features/growth/hooks/useGrowthEditorState.ts",
    "../src/features/growth/components/GrowthEditors.tsx",
    "../src/features/growth/components/GrowthDetailDialog.tsx",
  ];

  await Promise.all(
    removedFiles.map((path) => assert.rejects(access(new URL(path, import.meta.url)))),
  );
});
