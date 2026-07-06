
## Goal
Replace mock/placeholder data on the dashboard with real Supabase-backed data, without changing visual design or touching other sections.

## New server functions (`src/lib/dashboard.functions.ts`)
All use `requireSupabaseAuth` (RLS scopes by `auth.uid()`).

1. `getSnapshot({ range: 'month' | 'all' })` → `{ income, spent, balance }`
   - Sums `income.amount` and `expenses.amount`; when `range='month'`, filters `occurred_on` to current calendar month.
2. `getSpendingTrend()` → array of `{ date, income, spent }` for the last 30 days (inclusive of today), zero-filled for days with no activity.
3. `getCategoryBreakdown({ month })` → `[{ category, total }]` for expenses in the given YYYY-MM (uses global `selectedMonth`), excludes zero categories.
4. `getBudgetAlerts()` → For each budget row in the current month, computes `spent` (sum of matching-category expenses this calendar month) and returns only rows with `percent_used >= 80` as `{ id, category, monthly_limit, spent, percent_used }`.
5. `getTodayTodos()` → up to 5 todos where `due_date = today`, ordered by priority desc then created_at; returns `{ id, title, is_completed, priority, has_more, total_count }` (returned as `{ rows, total }`).
6. Reuse existing `toggleTodo` from `todos.functions.ts` for checkbox updates.

## Dashboard component (`src/routes/_authenticated/dashboard.tsx`)
Wire each section via `useQuery` + `useServerFn`; keep existing layout, colors, motion, and shadcn components. Show existing `Skeleton` while loading (no ₹0 flash).

1. **SnapshotCards**
   - Remove "Saved" card → render only Income / Spent / Balance (3-column grid on lg; existing 2-col on mobile stays).
   - Add small dropdown above the grid, right-aligned (shadcn `Select`, `size="sm"`, muted styling): options "This Month" (default) / "All Time"; state local via `useState`.
   - Fetch `getSnapshot` keyed on range; Balance card tone = `success` when `balance >= 0`, else `destructive` (reuses existing tone system, no new colors).

2. **SpendingTrendCard**
   - Fetch `getSpendingTrend`; feed real 30-day array into the existing `AreaChart`. Keep the current single "spent" area; add a second Area for income using `var(--success)` gradient inside the same chart (same styling primitives already in file). If minimizing scope preferred, keep only `spent` real values — but spec says merge both, so include both series with existing chart component.

3. **CategoryDonutCard**
   - Use `useAppStore().selectedMonth`; fetch `getCategoryBreakdown`.
   - Pass slices into existing `PieChart`/`Pie` unchanged. Cycle a small palette of CSS vars (`--primary`, `--success`, `--accent`, `--destructive`, `--muted`) per category name (stable ordering). Empty state text remains as-is when no data.

4. **BudgetAlertStrip** (new section, inserted where a strip already fits — between briefing/tasks row and charts row, matching the app's card pattern)
   - Wait — spec says "do not touch any dashboard section not listed above" but the current dashboard has no budget strip. Since #4 is explicitly listed, add a compact strip using the same `rounded-2xl border bg-card p-5 shadow-card` pattern, only rendered when alerts exist; otherwise shows neutral "You're on track this month".

5. **TasksCard**
   - Replace `listTodayTodos` call with new `getTodayTodos` that filters strictly `due_date = today` and returns count. Keep existing checkbox/toggle mutation and empty state; add "+N more" hint or a `View all` link to `/planner` when `total > 5`.

## Files touched
- Create: `src/lib/dashboard.functions.ts`
- Edit: `src/routes/_authenticated/dashboard.tsx`

## Out of scope
No schema/RLS/migration changes. No new libraries. No restyling of cards/charts. No edits to other routes.
