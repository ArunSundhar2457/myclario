## Phase 2 — Planner + AI Insights

### 1. Planner page (`/planner`)

Uses existing `public.todos` table — no schema changes.

**New server functions** — `src/lib/planner.functions.ts`:
- `listTodosForMonth({ year, month })` — returns todos with `due_date` in that month; used to render calendar dots.
- `listTodosForDay({ date })` — todos for the selected day (plus undated if selected day is today).
- `createTodo({ title, notes?, due_date, due_time?, priority })` — insert scoped to `auth.uid()`.
- `toggleTodo({ id, is_completed })` — reuse existing in `todos.functions.ts` (already implemented).
- `deleteTodo({ id })` — hard delete.

**Route** — `src/routes/_authenticated/planner.tsx`:
- Header row: month label + "Today" quick jump.
- shadcn `Calendar` (single mode). Custom `DayButton` (or `modifiers`) shows a small emerald dot under any date that has todos in the month query.
- Selected day defaults to today; below the calendar render:
  - Quick stats: "Today: X tasks · Y completed".
  - Task list. Each row: checkbox (toggle), title + optional time, priority pill (Low=muted, Medium=amber, High=destructive), trash icon. Completed → line-through + muted.
  - Empty state with "Add task" CTA.
- FAB (bottom-right, same pattern as Transactions) opens a `Sheet`:
  - Fields: Title (required), Notes (textarea), Time (input type="time"), Priority pill selector (Low / Medium / High), full-width Save.
  - Optimistic insert via react-query mutation → invalidate month + day queries.
- Enable `/planner` link in `src/components/app-shell.tsx` nav.

### 2. AI Insights page (`/insights`)

**New server function** — `src/lib/insights.functions.ts`:
- Uses Lovable AI Gateway (`LOVABLE_API_KEY` already provisioned) with `google/gemini-3-flash-preview`.
- `generateInsights()` — aggregates current-month expenses / income / budgets for the authed user (via `requireSupabaseAuth`), sends a compact summary to Gemini, returns structured JSON:
  - `thisMonth`: 1–2 sentence overview of income vs expenses + net.
  - `whereMoneyWent`: top 3 categories with % share and a short note.
  - `budgetHealth`: per-budget status summary.
  - `tips`: array of 3 short actionable tips.
- `quickTip()` — small call, returns single 1–2 sentence tip string.
- Graceful fallback string on error (no raw provider errors surfaced).

**Route** — `src/routes/_authenticated/insights.tsx`:
- Full-width "Generate insights" primary button → mutation → skeleton loaders → 4 cards (This Month, Where Your Money Went, Budget Health, Smart Tips).
- Quick Tip card at top with refresh icon (separate mutation).
- Empty state before first generation. Error state with retry.
- Enable `/insights` link in `src/components/app-shell.tsx` nav.

### Out of scope this phase
- No DB migrations, no RLS changes.
- No edits to Dashboard, Transactions, Budgets, Auth beyond adding the two nav entries.
- Landing page, GDPR banner, badge removal, Settings modal, /privacy, /terms — deferred to Phase 3.

### Build order
1. `planner.functions.ts` + `planner.tsx` + nav link → verify calendar + add/toggle/delete.
2. `insights.functions.ts` + `insights.tsx` + nav link → verify Generate produces 4 cards.
