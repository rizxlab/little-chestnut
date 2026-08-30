import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses floating icon-only tabs without whole-page swipe navigation", async () => {
  const [navigation, workspace, gestures, constants, styles] = await Promise.all([
    readFile(new URL("../src/components/layout/BottomNavigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/screens/check-in/CheckInWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/shared/hooks/useGesture.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/constants.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/components.css", import.meta.url), "utf8"),
  ]);

  assert.match(navigation, /aria-label=/);
  assert.match(navigation, /<AppIcon name=\{item\.icon\} \/>\s*<\/button>/);
  assert.doesNotMatch(workspace, /onTouchStart=\{handleTouchStart\}|dragOffset|isDraggingTabs/);
  assert.doesNotMatch(gestures, /handleTouchStart|handleTouchEnd|NAV_ITEMS/);
  assert.doesNotMatch(constants, /id: "growth"/);
  assert.match(constants, /id: "today"[\s\S]*id: "profile"/);
  assert.match(styles, /\.bottom-nav \{[\s\S]*?position: absolute;[\s\S]*?bottom:[\s\S]*?left: 50%;[\s\S]*?transform: translateX\(-50%\);/);
  assert.match(styles, /\.bottom-nav \{[\s\S]*?border-radius: var\(--radius-pill\);[\s\S]*?box-shadow: var\(--shadow-floating\);/);
  assert.match(styles, /\.bottom-nav button,[\s\S]*?border-radius: 50%;/);
  const bottomNavRule = styles.match(/\.bottom-nav \{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(bottomNavRule, /grid-template-columns/);
});

test("removes the Growth page while keeping its records in Calendar", async () => {
  const [workspace, profile, calendar] = await Promise.all([
    readFile(new URL("../src/screens/check-in/CheckInWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/screens/ProfilePage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/screens/CalendarPage.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(workspace, /GrowthPage|data-tab="growth"/);
  assert.match(profile, /profile-account-button[\s\S]*?profile-calendar-button[\s\S]*?settings-entry-button/);
  assert.match(profile, /onClick=\{onOpenCalendar\}/);
  assert.match(calendar, /calendar-stat-grid/);
  assert.match(calendar, /growth-period-tabs/);
  assert.match(calendar, /calendar-timeline/);
});
