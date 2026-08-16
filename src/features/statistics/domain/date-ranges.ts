import type { GrowthRecord } from "../../growth/types";

export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function isToday(date: Date, now = new Date()) {
  return localDay(date) === localDay(now);
}

export function startOfWeek(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
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
  return records.filter((record) => {
    const date = new Date(record.createdAt);
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth();
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
