"use client";

import { CheckInWorkspace } from "./check-in/CheckInWorkspace";

/**
 * Stable route-level composition boundary for the check-in experience.
 * Feature state and legacy view orchestration are isolated in CheckInWorkspace
 * so this entry point stays predictable while the remaining editors migrate.
 */
export function CheckInPage() {
  return <CheckInWorkspace />;
}
