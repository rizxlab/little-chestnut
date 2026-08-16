import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("uses a fresh browser storage namespace without legacy fallbacks", async () => {
  const [constants, browserStorage, appData, growthRules] = await Promise.all([
    readFile(new URL("../src/app/constants.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/persistence/browser-storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/persistence/app-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/features/growth/domain/growth-rules.ts", import.meta.url), "utf8"),
  ]);

  assert.match(constants, /STORAGE_KEY = "lizi-growth-v3"/);
  assert.doesNotMatch(constants, /SAMPLE_HISTORY/);
  assert.doesNotMatch(browserStorage, /123456|readJson\(STORAGE_KEY\)|sample/i);
  assert.doesNotMatch(appData, /areaSchemaVersion|seedSampleHistory|LEGACY_|migratedTagIds/);
  assert.doesNotMatch(growthRules, /areaId|LEGACY_|migratedTagIds/);
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
  ];

  await Promise.all(
    removedFiles.map((path) => assert.rejects(access(new URL(path, import.meta.url)))),
  );
});
