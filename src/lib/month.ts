/** Shared month-window helpers. `ym` is always "YYYY-MM". */

export const MONTH_REGEX = /^\d{4}-\d{2}$/;

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** First day of the month and first day of the following month (exclusive upper bound). */
export function monthBounds(ym?: string): {
  first: string;
  nextFirst: string;
  monthDate: string;
} {
  const now = new Date();
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
export function monthDayRange(ym?: string): { start: string; end: string; days: number } {
  const now = new Date();
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
