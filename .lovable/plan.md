# Fix: global month selector must filter every screen

The month dropdown updates the shared store, but almost every data function computes its own "this month" from today's date, and several queries don't include the selected month in their cache key. So changing the dropdown changes nothing. Fix: pass the selected month explicitly from every screen into every month-scoped server function, and include it in each query key.

## What changes per screen

**Dashboard**
- Snapshot cards: `getSnapshot` takes `{ range, month }`. `range: "month"` means the selected month (not today's month); `"all"` stays unfiltered. Query key gains the month.
- Spending trend: becomes month-scoped instead of a rolling 30 days. Selected month = current calendar month → day 1 through today. Past month → day 1 through last day of that month. Zero-fill behaviour unchanged. Query key gains the month.
- Category donut: already passes the month and keys on it — verify only.
- Budget alert strip: `getBudgetAlerts` takes `{ month }` and compares budgets/expenses within that month. Query key gains the month.
- AI Daily Briefing: keeps its existing behaviour (it is a "today" briefing, already keyed on the month label). Its open-task count stays date-based.
- Today's Tasks stays today-scoped — it is a daily list, not month data.

**Budgets page**
- `listBudgets`, `listAvailableCategories`, `createBudget`, `updateBudget` all take the month instead of deriving it from `new Date()`, so the list, Spent/Remaining, available-category list, and new budgets all belong to the selected month.
- The month label above the list shows the selected month rather than the current one.
- Query keys for `budgets` / `budgets-available` gain the month; invalidations updated to match.

**AI Insights page**
- `generateInsights` takes `{ currency, month }` and computes income, expenses, category split, and budget health for that month. Quick tip is generic and unchanged.
- Section copy that says "this month" reads from the selected month.

**Transactions page**
- The list is only filtered by the explicit From/To/category/search filters — there is no hidden month filter to fix, so the list behaviour stays as-is (no silent month clamp added). The "add transaction" default date stays today.

## Technical notes

- Add a shared month-bounds helper (accepting `YYYY-MM`, returning first day, next first day, and an end date capped at today for the current month) and use it in `dashboard.functions.ts`, `budgets.functions.ts`, and `insights.functions.ts` instead of three local `new Date()` variants.
- Every touched server function validates `month` as `/^\d{4}-\d{2}$/` via its existing zod validator; GET-only functions that gain input change to accept it.
- Files: `src/lib/dashboard.functions.ts`, `src/lib/budgets.functions.ts`, `src/lib/insights.functions.ts`, `src/routes/_authenticated/dashboard.tsx`, `budgets.tsx`, `insights.tsx`, plus a small shared date helper.

## Verification

Typecheck plus a Playwright pass on the signed-in app: switch the dropdown to a past month with data and confirm snapshot cards, category donut, budget alert strip, budgets list (Spent/Remaining), spending trend range, and Insights all reflect that month — each checked individually, not just that the build passes.

## Out of scope

No changes to the dropdown's UI or styling, no changes to Planner or Today's Tasks scoping.
