// All dates are interpreted in Belgrade time, and a "day" starts at 06:00,
// so late-night messages stay with the evening they belong to.

export const TIME_ZONE = "Europe/Belgrade";
const DAY_START_HOUR = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function belgradeParts(ts: number): DateParts {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(ts)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

/** Timestamp for a wall-clock time in Belgrade. */
export function belgradeTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const p = belgradeParts(guess);
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess;
  return guess - offset;
}

export type LogicalDay = { year: number; month: number; day: number };

/** The day a moment belongs to, with days starting at 06:00. */
export function logicalDay(ts: number): LogicalDay {
  const p = belgradeParts(ts);
  if (p.hour >= DAY_START_HOUR) {
    return { year: p.year, month: p.month, day: p.day };
  }
  // Step back one calendar day on the date itself, not by subtracting hours,
  // so DST changes can't shift the result.
  const prev = new Date(Date.UTC(p.year, p.month - 1, p.day) - DAY_MS);
  return {
    year: prev.getUTCFullYear(),
    month: prev.getUTCMonth() + 1,
    day: prev.getUTCDate(),
  };
}

/** "MM-DD" key used to match the same day across years. */
export function dayKey(d: { month: number; day: number }): string {
  return `${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function parseDayKey(key: string): { month: number; day: number } | null {
  const m = /^(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

export function todayKey(now: number = Date.now()): string {
  return dayKey(logicalDay(now));
}

export function formatDayKey(key: string, year?: number): string {
  const d = parseDayKey(key);
  if (!d) return key;
  const base = `${d.day}. ${MONTHS[d.month - 1]}`;
  return year ? `${base} ${year}.` : base;
}

const WEEKDAYS = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"];

/** "subota, 15. oktobar 2018." */
export function formatLongDate(key: string, year: number): string {
  const d = parseDayKey(key);
  if (!d) return key;
  const weekday = WEEKDAYS[new Date(Date.UTC(year, d.month - 1, d.day)).getUTCDay()];
  return `${weekday}, ${formatDayKey(key, year)}`;
}

export function formatTime(ts: number): string {
  const p = belgradeParts(ts);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}
