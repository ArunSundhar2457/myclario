/** Shared month-window helpers. `ym` is always "YYYY-MM". */
import { z } from "zod";

/** "YYYY-MM" with a real month (01-12). "2026-13" or "2026-00" are rejected. */
export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Shape check only ("YYYY-MM-DD"). It lets 2026-02-31 through, so use isRealDate to validate. */
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * True only for a date that exists on the calendar: rejects 2026-02-31, 2026-04-31,
 * and 2026-02-29 (not a leap year), but accepts 2028-02-29 and 2000-02-29.
 */
export function isRealDate(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  // Date.UTC rolls an impossible day into the next month, so a mismatch means it didn't exist.
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Zod schema for a real calendar date written as "YYYY-MM-DD". */
export const dateString = z.string().refine(isRealDate, { message: "Invalid date" });

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Parses "YYYY-MM-DD" as a local-time date at midnight. */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** First day of the month and first day of the following month (exclusive upper bound). */
export function monthBounds(
  ym?: string,
  today?: string,
): {
  first: string;
  nextFirst: string;
  monthDate: string;
} {
  const now = today && isRealDate(today) ? parseLocalDate(today) : new Date();
  const [y, m] =
    ym && MONTH_REGEX.test(ym)
      ? ym.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
  const first = new Date(y, m - 1, 1);
  const next = new Date(y, m, 1);
  return { first: isoDate(first), nextFirst: isoDate(next), monthDate: isoDate(first) };
}

/**
 * Inclusive day range for a month, capped at today when the month is the
 * current calendar month (future days have no data).
 */
export function monthDayRange(
  ym?: string,
  today?: string,
): { start: string; end: string; days: number } {
  // `today` is the caller's local date (YYYY-MM-DD). Servers run in UTC, so a
  // server-side `new Date()` can be a day off for the user; prefer what they send.
  const now = today && isRealDate(today) ? parseLocalDate(today) : new Date();
  const [y, m] =
    ym && MONTH_REGEX.test(ym)
      ? ym.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
  const start = new Date(y, m - 1, 1);
  const lastOfMonth = new Date(y, m, 0);
  const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;
  const end = isCurrent && now < lastOfMonth ? new Date(y, m - 1, now.getDate()) : lastOfMonth;
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return { start: isoDate(start), end: isoDate(end), days };
}
