import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Little Chestnut Things application shell", async () => {
  const [layout, page, workerBundle] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /title:\s*"栗子小事"/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /icon-192\.png/);
  assert.match(page, /<ChestnutApp\s*\/>/);
  assert.ok(workerBundle.length > 1_000);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/i);
});

test("keeps routes, product composition, persistence, and page UI separated", async () => {
  const [page, composition, productPage, browserStorage, accountApi, architecture] =
    await Promise.all([
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/app/ChestnutApp.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/screens/CheckInPage.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/services/persistence/browser-storage.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/services/api/account-api.ts", import.meta.url), "utf8"),
      readFile(new URL("../src/ARCHITECTURE.md", import.meta.url), "utf8"),
    ]);

  assert.match(page, /src\/app\/ChestnutApp/);
  assert.doesNotMatch(page, /pages|localStorage|fetch\(/);
  assert.match(composition, /screens\/CheckInPage/);
  assert.match(productPage, /useAppDataState/);
  assert.doesNotMatch(productPage, /localStorage\./);
  assert.doesNotMatch(productPage, /fetch\("\/api\/account-data/);
  assert.match(browserStorage, /saveBrowserData/);
  assert.match(accountApi, /writeAccountData/);
  assert.match(architecture, /screens\/CheckInPage\.tsx/);

  await assert.rejects(access(new URL("../app/check-in-app.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/globals.css", import.meta.url)));
});

test("ships valid PWA metadata and an explicit cache version", async () => {
  const [manifestSource, serviceWorker] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.equal(manifest.name, "栗子小事");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  assert.match(serviceWorker, /const CACHE_NAME = "lizi-static-v\d+"/);
  assert.match(serviceWorker, /self\.addEventListener\("fetch"/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(serviceWorker, /STATIC_DESTINATIONS/);
  assert.match(serviceWorker, /response\.ok && response\.type === "basic"/);
  assert.doesNotMatch(serviceWorker, /cache\.put\(event\.request/);
});
