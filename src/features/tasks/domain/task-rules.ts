import { ACTION_TIME_OPTIONS } from "../constants";
import type { ActionTimeWindow, MicroAction } from "../types";
import { activityDay, localDay } from "../../statistics/domain/date-ranges";

const TODAY_TIME_ORDER: Record<ActionTimeWindow, number> = {
  anytime: 0,
  morning: 1,
  noon: 2,
  evening: 3,
};

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
      const firstTimeIndex = TODAY_TIME_ORDER[actionTimeWindowFor(first.action)];
      const secondTimeIndex = TODAY_TIME_ORDER[actionTimeWindowFor(second.action)];
      return firstTimeIndex - secondTimeIndex
        || first.originalIndex - second.originalIndex;
    })
    .map(({ action }) => action);
}

export function temporaryActionDays(value: unknown) {
  const numericValue = Number(value);
  return Math.min(
    30,
    Math.max(1, Number.isFinite(numericValue) ? Math.round(numericValue) : 1),
  );
}

export function temporaryExpirationDay(days: number, start = new Date()) {
  const expirationDay = new Date(`${activityDay(start)}T12:00:00`);
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
    && action.expiresOn < activityDay(now),
  );
}

export function shellValueFor(
  item: { shellValue?: number } | null | undefined,
) {
  const value = Number(item?.shellValue ?? 1);
  return Math.min(99, Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1));
}
