import { ACTION_TIME_OPTIONS } from "../constants";
import type { ActionTimeWindow, MicroAction } from "../types";
import { localDay } from "../../statistics/domain/date-ranges";

export function actionTimeWindowFor(
  action?: Pick<MicroAction, "timeWindow"> | null,
): ActionTimeWindow {
  return ACTION_TIME_OPTIONS.some((option) => option.id === action?.timeWindow)
    ? (action?.timeWindow as ActionTimeWindow)
    : "anytime";
}

export function actionTimeOptionFor(
  action?: Pick<MicroAction, "timeWindow"> | null,
) {
  const timeWindow = actionTimeWindowFor(action);
  return ACTION_TIME_OPTIONS.find((option) => option.id === timeWindow)
    ?? ACTION_TIME_OPTIONS[3];
}

export function actionsInTimeOrder(actions: readonly MicroAction[]) {
  return actions
    .map((action, originalIndex) => ({ action, originalIndex }))
    .sort((first, second) => {
      const firstTimeIndex = ACTION_TIME_OPTIONS.findIndex(
        (option) => option.id === actionTimeWindowFor(first.action),
      );
      const secondTimeIndex = ACTION_TIME_OPTIONS.findIndex(
        (option) => option.id === actionTimeWindowFor(second.action),
      );
      return firstTimeIndex - secondTimeIndex
        || first.originalIndex - second.originalIndex;
    })
    .map(({ action }) => action);
}

export function isActionAvailableNow(action: MicroAction, now = new Date()) {
  const timeWindow = actionTimeWindowFor(action);
  const hour = now.getHours();
  if (timeWindow === "morning") return hour >= 5 && hour < 12;
  if (timeWindow === "noon") return hour >= 12 && hour < 18;
  if (timeWindow === "evening") return hour >= 18 || hour < 5;
  return true;
}

export function temporaryActionDays(value: unknown) {
  const numericValue = Number(value);
  return Math.min(
    30,
    Math.max(1, Number.isFinite(numericValue) ? Math.round(numericValue) : 1),
  );
}

export function temporaryExpirationDay(days: number, start = new Date()) {
  const expirationDay = new Date(start);
  expirationDay.setDate(
    expirationDay.getDate() + temporaryActionDays(days) - 1,
  );
  return localDay(expirationDay);
}

export function isTemporaryActionExpired(
  action: MicroAction,
  now = new Date(),
) {
  return Boolean(
    action.temporary
    && action.expiresOn
    && action.expiresOn < localDay(now),
  );
}

export function shellValueFor(
  item: { shellValue?: number } | null | undefined,
) {
  const value = Number(item?.shellValue ?? 1);
  return Math.min(99, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));
}
