
# Clario — Outstanding Fixes: Bugs + Categories

Ship Phase 1 first and verify, then Phase 2. No design system, color, or layout changes beyond what each item requires. No new libraries.

---

## Phase 1 — App bug fixes

### 1. Edit flows for Tasks, Transactions, Budgets

**Tasks (Planner + Dashboard "Today's tasks" card, same `todos` table)**
- Add `updateTodo({ id, title, notes, due_date, due_time, priority })` in `src/lib/planner.functions.ts` and `src/lib/todos.functions.ts` (RLS-scoped via `requireSupabaseAuth`, `UPDATE ... where id = ...`).
- Refactor `AddTaskSheet` in `src/routes/_authenticated/planner.tsx` into a shared add/edit sheet accepting an optional `todo` prop; when present, prefill fields, call `updateTodo`, and title/CTA switch to "Edit task" / "Save changes".
- Add a pencil `Edit` icon (lucide `Pencil`) to each `TaskRow` next to the trash icon; clicking opens the sheet in edit mode.
- Dashboard "Today's tasks" card gets the same pencil icon opening the same shared sheet (import it or a small local variant reusing the same server fn). Checkbox toggle + delete unchanged.

**Transactions (Transactions page)**
- Add `updateTransaction({ id, kind, amount, category, description, occurred_on, is_recurring })` in `src/lib/transactions.functions.ts` (branches on `kind` to update `income` or `expenses`; RLS-scoped).
- Refactor the existing "New transaction" modal into an add/edit modal taking an optional `transaction` prop; prefill and switch CTA to "Save changes".
- Add a pencil icon to each transaction row; opens modal in edit mode. Delete unchanged.

**Budgets (Budgets page)**
- Add `updateBudget({ id, monthly_limit })` in `src/lib/budgets.functions.ts` (RLS-scoped). Category stays fixed on edit.
- Add a pencil icon to each `BudgetCard` in `src/routes/_authenticated/budgets.tsx`. Clicking sets the card into inline edit mode (or scrolls/focuses `CreateBudgetForm` in edit mode).
- `CreateBudgetForm` accepts optional `editing: { id, category, monthly_limit }`; when set: category select is disabled and shows the fixed category, limit input prefilled, button reads "Update" and calls `updateBudget`. Cancel button clears edit mode.
- Delete unchanged.

No visual redesign — reuse existing form/modal/sheet components.

### 2. Budget Alert Strip — neutral state

In `src/routes/_authenticated/dashboard.tsx`, when `getBudgetAlerts()` returns zero rows, render a card with the same `rounded-2xl border border-border bg-card p-5 shadow-card` pattern containing "You're on track this month." (with a subtle success icon). Only replaces the current empty render — no other dashboard changes.

### 3. AI Insights — currency formatting + category naming

In `src/routes/_authenticated/insights.tsx` and `src/lib/insights.functions.ts`:
- Route all numeric values in insight text through the existing `formatMoney(value, currency)` helper (`src/lib/app-store.ts`). Where numbers come from the LLM string, either (a) instruct the model to return structured numbers + a template we format client-side, or (b) post-process by matching numeric tokens and replacing with `formatMoney`. Prefer (a): update the server fn to return `{ text, values: { key: number } }` and render with formatted substitution.
- Ensure the category breakdown passed to the LLM uses the user's category names from the new `categories` table (Phase 2). Until Phase 2 lands, keep passing existing names but never emit "Other" in prompts — use "Miscellaneous".

### 4. Sidebar logo alignment

In `src/components/app-shell.tsx`, change the sidebar logo/wordmark container from centered to left-aligned, flush with the nav items' left padding — mirror the treatment used on `src/routes/auth.tsx`. Size unchanged.

---

## Phase 2 — Fully custom categories

### 1. Migration: `categories` table

Create `public.categories` (`id`, `user_id → auth.users on delete cascade`, `name`, `sort_order`, `is_default`, `created_at`), unique `(user_id, name)`. Grants: `authenticated` (SELECT/INSERT/UPDATE/DELETE), `service_role` ALL. RLS on with a single "manage own" policy scoped to `auth.uid()`.

### 2. Seed defaults

- Update `handle_new_user()` trigger to also insert the 8 defaults (`Food, Transport, Entertainment, Utilities, Health, Shopping, Education, Miscellaneous`) with `sort_order 0..7` and `is_default = true` for the new user.
- One-time backfill: insert the same 8 defaults for the existing user(s) that don't have them yet (idempotent via `ON CONFLICT (user_id, name) DO NOTHING`).
- Rename any existing `"Other"` rows in `expenses.category` / `budgets.category` to `"Miscellaneous"` in the same migration.
- Miscellaneous is the permanent fallback — enforced in server fns below (not via a DB constraint, to keep schema simple).

### 3. Server functions — `src/lib/categories.functions.ts`

All `requireSupabaseAuth`:
- `listCategories()` → ordered by `sort_order asc, created_at asc`.
- `createCategory({ name })` → inserts with `sort_order = max+1`. Rejects duplicates (unique constraint) with a friendly message.
- `renameCategory({ id, name })` → loads old name, updates row, then updates `expenses.category` and `budgets.category` rows where `category = old_name` to the new name (all RLS-scoped to the user). Rejects renaming a row whose current name is "Miscellaneous".
- `deleteCategory({ id })` → rejects if name is "Miscellaneous"; otherwise updates matching `expenses.category` and `budgets.category` rows to "Miscellaneous", then deletes the row.

### 4. Replace hardcoded category lists

Replace `EXPENSE_CATEGORIES` usages in the UI with `useQuery(['categories'], listCategories)`:
- Transactions add/edit modal category select
- Budgets `CreateBudgetForm` available-categories source (still filter out categories that already have a budget for the month)
- Transactions page category filter dropdown
- Category donut chart on Dashboard — keep the same CSS-var color cycle, keyed by category index
- AI Insights category breakdown

`src/lib/categories.ts` stays for the icon map only; unknown names fall back to `Package` (already the default). `INCOME_CATEGORIES` remains as-is (out of scope).

### 5. Category management UI

Add a lightweight manager reachable from the Transactions page category filter dropdown (a "Manage categories" footer item that opens a small dialog/sheet), listing each category with:
- Pencil → inline rename (input + save/cancel), calls `renameCategory`. Hidden for Miscellaneous.
- X → delete with a confirmation ("Transactions in this category will be moved to Miscellaneous"), calls `deleteCategory`. Hidden for Miscellaneous.
- "+ Add category" input row at the bottom calling `createCategory`.

Invalidate `['categories']`, `['transactions']`, `['budgets']`, and dashboard queries on any mutation.

---

## Out of scope
Google OAuth redirect, landing page changes, any schema/RLS changes beyond the `categories` table, new libraries, or visual redesign beyond items listed.

## Technical notes
- All new/updated server fns use `requireSupabaseAuth` and rely on RLS.
- Edit mutations use `UPDATE` (never insert-then-delete).
- Query invalidation keys reused from existing code (`['budgets']`, `['planner-day', iso]`, `['planner-month', y, m]`, `['transactions']`, `['today-todos']`, `['snapshot']`, `['category-breakdown']`, `['budget-alerts']`).
- Insights formatting prefers structured values from the server fn to avoid regex fragility on LLM output.
