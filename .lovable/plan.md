## Phase 2 — Transactions & Budgets

### Database (single migration)

Three new tables, all user-scoped with RLS (`auth.uid() = user_id`), GRANTs to `authenticated` + `service_role`, `updated_at` triggers via existing `set_updated_at()`.

- `public.expenses` — `user_id`, `amount numeric(12,2) > 0`, `category text`, `description text`, `occurred_on date`, `is_recurring bool`, `recurrence text` (`daily|weekly|monthly|null`).
- `public.income` — same shape (category from income list).
- `public.budgets` — `user_id`, `category text`, `monthly_limit numeric(12,2) > 0`, `month date` (first of month). Unique `(user_id, category, month)` so "only categories without an existing budget" can be enforced.

### Server functions (`src/lib/`)

`transactions.functions.ts` (uses `requireSupabaseAuth`):
- `listTransactions({ kind: 'income'|'expense', page, pageSize=10, from?, to?, category?, search? })` → `{ rows, total }`
- `createTransaction({ kind, amount, category, description, occurred_on, is_recurring, recurrence })`
- `deleteTransaction({ kind, id })`
- `exportTransactionsCsv({ kind, filters })` → CSV string

`budgets.functions.ts`:
- `listBudgets()` → budgets for current month + computed `spent` (sum of expenses in same category/month)
- `createBudget({ category, monthly_limit })` (current month)
- `deleteBudget({ id })`
- `listAvailableCategories()` → expense categories minus ones with a current-month budget

Zod validation on every input; amount > 0, category in allowed set.

### Routes

`src/routes/_authenticated/transactions.tsx`:
- Header + segmented `Income | Expenses` toggle (URL search param `kind`, defaults to `expense`).
- Collapsible filter bar (date range, category, search) — `validateSearch` + `useNavigate`.
- Paginated list (10/page) with category icon, name, description, signed amount (green/red), date.
- Desktop: trash button. Mobile: swipe-to-delete via framer-motion drag.
- Empty state with CTA opening the sheet.
- "Export CSV" button below list — calls server fn, triggers download.
- Floating FAB (bottom-right) opens shadcn `Sheet` (`side="bottom"`) with the add form:
  - kind toggle, large amount input, horizontal scrollable category pills, description, date picker, recurring switch + recurrence select, full-width Save.
  - Inline zod error messages.
  - Optimistic insert via React Query `onMutate`, rollback on error, toast.

`src/routes/_authenticated/budgets.tsx`:
- Inline create form: category select (only available cats) + monthly limit + Create.
- Grid of cards per budget: title + current month, animated progress bar (motion `width` 0 → pct, 0.8s), spent/remaining, status badge (`On Track <80%`, `Warning 80-100%`, `Over Budget >100%`), bar color tied to status, ghost delete button.
- Empty state with CTA focusing the form.

Both routes:
- `loader` calls `context.queryClient.ensureQueryData(...)`, components use `useSuspenseQuery`.
- Define `errorComponent` and `notFoundComponent`.
- `head()` with unique title/description.

### Shared

- `src/lib/categories.ts` — exported `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, icon map (lucide).
- Reuse existing shadcn `Sheet`, `Select`, `Switch`, `Calendar`/`Popover`, `Badge`, `Progress` (add via shadcn if missing).
- `formatMoney` from `@/lib/app-store`.

### Out of scope

No edits to dashboard, auth, styles, or existing components. Dashboard placeholders stay as-is.
