## Phase 1 — Bug Fixes

**1. FAB not opening bottom sheet**
Root cause: `AppShell` renders a global `<Fab />` (with `toast.info("Add flow arrives...")`) at `z-30`. It renders after page children, so it covers the Transactions page's own FAB — clicks hit the shell FAB, not the sheet trigger.
Fix: Remove the global `<Fab />` from `src/components/app-shell.tsx` entirely. Each page that needs a FAB (Transactions, Budgets, Planner) renders its own. Verify Dashboard/Insights render none.

**2. Google OAuth redirect**
`src/routes/auth.tsx` already uses `redirectTo: 'https://myclario.lovable.app/dashboard'`. Grep the codebase for any other `signInWithOAuth` call and align them. No other calls expected; verify only.

**3. Sidebar logo sizing**
Replace the `<img src="/clario-logo.svg" className="h-9">` Brand block in `app-shell.tsx` with a composed layout: 40px C-icon (use `/clario-icon.svg`) + "Clario" wordmark at 22px/700 + tagline "Your money. Your day. Sorted." at 10px muted. Add `px-3 py-2` padding around the logo area. Applied to both desktop sidebar and mobile header.

## Phase 2 — New Pages

**4. Planner page** — new file `src/routes/_authenticated/planner.tsx`
- Uses existing `public.todos` table (no schema changes).
- New server functions in `src/lib/planner.functions.ts`: `listTodosForMonth({ year, month })`, `listTodosForDay({ date })`, `createTodo({...})`, `toggleTodo({id, is_completed})` (reuse existing), `deleteTodo({id})`.
- UI: month calendar (shadcn `Calendar` with custom `DayContent` showing a green dot when that day has todos — data from `listTodosForMonth`), selected day defaults to today, task list below.
- Task rows: checkbox, title + time, priority badge (Low=muted, Medium=warning, High=destructive), delete trash icon; completed → strikethrough + `text-muted-foreground`.
- Quick stats row: "Today: X tasks, Y completed".
- Empty state with "Add task" CTA.
- FAB opens `Sheet` with Title / Notes / Time / Priority pill selector / full-width Save. Optimistic insert.
- Enable `/planner` in `app-shell.tsx` NAV.

**5. AI Insights page** — new file `src/routes/_authenticated/insights.tsx`
- New server function `src/lib/insights.functions.ts` using Lovable AI Gateway (`ai-sdk-lovable-gateway` pattern, `google/gemini-3-flash-preview`, structured output via `Output.object`).
  - `generateInsights()` — aggregates current month expenses/income/budgets for the authed user, calls Gemini, returns 4 sections: `thisMonth`, `whereMoneyWent`, `budgetHealth`, `tips[]` (3 items).
  - `quickTip()` — smaller call, returns 1–2 sentence string.
- UI: full-width "Generate Insights" button → mutation → skeleton loaders → 4 cards. Quick Tip card with refresh button (separate mutation). Graceful fallback message on error.
- Enable `/insights` in `app-shell.tsx` NAV.
- Requires `LOVABLE_API_KEY` — provision via `ai_gateway--create` if missing.

## Phase 3 — Polish

**6. Landing page** — rewrite `src/routes/index.tsx`
- Change from redirect-only to public landing. Signed-in users still redirect to `/dashboard` (check in `beforeLoad`).
- Sections: Hero (headline + subheadline + "Start for free" → `/auth` + mockup image), 4-card Features grid, 3-step "How it works", Stats bar (Free / PWA / AI-powered), Final CTA.
- Use existing design tokens; no new colors. Generate a hero mockup image via `imagegen`.

**7. Remove Lovable badge**
Call `publish_settings--set_badge_visibility` with `hide_badge: true` (requires Pro plan; if the workspace lacks it the tool will return an error and I'll surface it).

**8. Support email**
- Add new routes `src/routes/privacy.tsx` and `src/routes/terms.tsx` (public) with basic policy scaffolding + the support-email line at the bottom. (These are linked from the auth footer but don't exist yet.)
- Add a Settings modal opened from the sidebar/header "Settings" button in `app-shell.tsx` (currently a toast placeholder). Modal shows currency/month picker (already global) + "Need help? myclario.help@gmail.com".

**9. GDPR cookie banner**
New component `src/components/cookie-consent.tsx`, mounted once in `src/routes/__root.tsx`. Fixed bottom banner, `localStorage.getItem('clario-cookie-consent')` gate, Accept/Decline buttons write `'accepted'`/`'declined'` and hide the banner.

## Out of scope
- No DB migrations, no RLS changes.
- No edits to `auth.tsx` styling, dashboard, budgets, transactions pages beyond bug fixes above.
- Design system / colors unchanged.

## Build order
Ship Phase 1 first for verification, then Phase 2, then Phase 3.
