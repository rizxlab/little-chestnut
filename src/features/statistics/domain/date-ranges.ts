import type { GrowthRecord } from "../../growth/types";

export const DAILY_CYCLE_HOUR = 3;

export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function activityDay(date: Date) {
  const shiftedDate = new Date(date);
  shiftedDate.setHours(shiftedDate.getHours() - DAILY_CYCLE_HOUR);
  return localDay(shiftedDate);
}

export function startOfActivityDay(now = new Date()) {
  const [year, month, day] = activityDay(now).split("-").map(Number);
  return new Date(year, month - 1, day, DAILY_CYCLE_HOUR);
}

export function isToday(date: Date, now = new Date()) {
  return activityDay(date) === activityDay(now);
}

export function startOfWeek(now = new Date()) {
  const date = startOfActivityDay(now);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

export function recordsForToday(records: GrowthRecord[], now = new Date()) {
  return records.filter((record) => isToday(new Date(record.createdAt), now));
}

export function recordsForWeek(records: GrowthRecord[], now = new Date()) {
  const start = startOfWeek(now).getTime();
  return records.filter((record) => new Date(record.createdAt).getTime() >= start);
}

export function recordsForMonth(records: GrowthRecord[], now = new Date()) {
  const activityMonth = new Date(`${activityDay(now)}T12:00:00`);
  return records.filter((record) => {
    const date = new Date(`${activityDay(new Date(record.createdAt))}T12:00:00`);
    return date.getFullYear() === activityMonth.getFullYear()
      && date.getMonth() === activityMonth.getMonth();
  });
}

export function formatRecordDate(value: string, locale = "zh-CN") {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    ...(isToday(date) ? {} : { month: "numeric", day: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
