# Month sync follow-up + task title validation

Four independent items.

## 1. AI Insights — month scoping

Current state (read): the Insights route does pass `month: selectedMonth` into `generateInsights`, and the server function windows expenses/income/budgets on that month. Insights is a **mutation**, not a query, so there is no query key — results only change when the user clicks Generate/Regenerate, and a `reset()` effect clears them when the month changes. So the exact cause of "not working" is unconfirmed from code alone.

First step is verification, then fix:
- Log the resolved month window inside `generateInsights` and confirm which month the handler actually receives on a past-month run.
- Regardless of outcome, restructure the page to be genuinely month-reactive: replace the mutation with a TanStack Query keyed on `["insights", currency, selectedMonth]`, kept disabled until the user first clicks Generate, with Regenerate mapped to `refetch()`. Changing the dropdown then refetches for the new month instead of silently blanking.
- If verification shows the month is not reaching the handler (or the window is computed from today), fix that in `insights.functions.ts` / `month.ts` too.

Verify by switching the dropdown to a past month with known data and checking the summary, category breakdown, and budget health all reflect that month.

## 2. Transactions — follow the global month

- When `selectedMonth` changes, set the page's `from`/`to` search params to that month's bounds: day 1 → last day, or → today when it's the current calendar month.
- Track a "user edited the range" flag: once the user changes From or To manually, stop auto-snapping until the dropdown changes again (a dropdown change resets the flag and re-applies bounds).
- List refetch is automatic — `from`/`to` are already part of the query key. Category/search/kind/paging behaviour unchanged.

## 3. Planner — follow the global month

- When `selectedMonth` changes, move the calendar to that month and set the selected day to today (current month) or the 1st (past month).
- Planner's own arrows / day clicks keep working locally and do **not** write back to the global dropdown.
- Implemented by giving the Calendar a controlled `month` value synced from `selectedMonth` and updated locally by the arrows.

## 4. Task modal — inline title error

In `AddTaskSheet` (used by both Planner and Dashboard):
- On submit with an empty title, don't call the mutation; render red helper text under the Title input with a lucide `Info` icon: "Title is required", using the destructive token.
- Clear the error as soon as the title becomes non-empty; reset it when the sheet opens/closes.
- Remove the toast for this validation only; success/error toasts for saving stay.
- Notes / Time / Priority unchanged.

## Technical notes

Files: `src/routes/_authenticated/insights.tsx`, `src/lib/insights.functions.ts`, `src/routes/_authenticated/transactions.tsx`, `src/routes/_authenticated/planner.tsx` (`AddTaskSheet` lives there and is imported by `dashboard.tsx`).

## Out of scope

No other page's filtering, no delete-confirmation work, no changes to the month dropdown itself.
