
# Clario — Phase 1 Plan

Auth, app shell, and Home (Dashboard). Transactions, Budgets, Planner, Insights, Settings, and GDPR pages come in later phases.

## Stack notes (vs. your spec)

- This project is **TanStack Start + React 19 + Tailwind v4**, not CRA/Vite-React. All routing uses file-based routes under `src/routes/`. No `react-router-dom`.
- **Framer Motion** → install `motion` (the current package). **Recharts** added as-is.
- **PWA**: spec asks for installable PWA. We'll do **manifest-only** (installable, app icon, standalone). No service worker in Phase 1 — Lovable preview blocks SW registration and offline isn't a Phase 1 need. We can add the generated SW later if you want true offline.
- **Fonts**: Inter (body) + DM Sans (headings) via Google Fonts in the root head.
- **Theme**: light-only, premium fintech feel. I'll pick a distinctive palette (deep ink + a single accent, soft neutrals, 12px radius, subtle borders + soft shadow) and codify it in `src/styles.css` design tokens — no hardcoded colors in components.

## Backend setup (your Supabase project)

You'll be prompted to connect your Supabase project via the connector. Once connected:

1. **Migration** adds only the missing `todos` table + RLS + GRANTs (existing tables left alone). Also adds `currency` and `consent_at` columns to `profiles` if missing.
2. **Auth**: email/password + Google OAuth (via Lovable's broker) + password reset (`/reset-password` route).
3. **Server boundary**: TanStack `createServerFn` for AI calls. Gemini key stored as a server secret `GEMINI_API_KEY` (you'll paste the rotated key into the secure prompt — never in chat).
4. **Route gating**: integration-managed `_authenticated/route.tsx`. All app pages live under `_authenticated/`. `/auth`, `/reset-password`, `/privacy`, `/terms` are public.

## Routes (Phase 1)

```
src/routes/
  __root.tsx                       # fonts, manifest link, providers, auth listener
  index.tsx                        # redirects: signed-in → /dashboard, else → /auth
  auth.tsx                         # split-screen login + signup tabs + forgot pw
  reset-password.tsx               # set new password after recovery link
  _authenticated/
    route.tsx                      # ssr:false gate, redirect to /auth
    dashboard.tsx                  # Home
```

## App shell

- `AppShell` component renders inside `_authenticated/route.tsx`:
  - **Mobile (<768px)**: top header (greeting, month picker, currency, settings icon) + bottom tab bar (5 tabs, only Home active in Phase 1, others render "Coming soon" stubs so nav works) + FAB.
  - **Desktop (≥768px)**: left sidebar 240px sticky + top header + centered 1200px content + FAB inside content.
- Global state via a small Zustand store: `selectedMonth`, `currency`. Persisted to `profiles.currency`.

## Dashboard (Home)

- Greeting + date + month picker + currency selector.
- Snapshot cards (2×2 / 4×1): Income, Spent, Net Savings, Savings Rate — color-coded, count-up animation, staggered entrance.
- **AI Daily Briefing card** — calls `getDailyBriefing` server fn → Gemini (`gemini-2.0-flash` via Lovable AI Gateway *if* you'd rather use it, otherwise direct Gemini REST with your key). Skeleton while loading, graceful fallback message.
- Spending Trend AreaChart (last 30d, income + expenses, gradient fills).
- Category Donut PieChart for the selected month.
- Budget Alert Strip — only renders if any budget ≥80% used.
- Today's Tasks Preview — top 5 todos for today with checkbox toggle; "View all" link disabled in Phase 1.

Data loading: `createServerFn` per query (`getMonthlySummary`, `getDailyBriefing`, `getSpendingTrend`, `getCategoryBreakdown`, `getBudgetAlerts`, `getTodayTasks`), called from the component via TanStack Query + `useSuspenseQuery`, with route loader prefetch.

## AI integration

One `createServerFn` `getDailyBriefing` that:

1. Reads user via `requireSupabaseAuth`.
2. Pulls today's todos + month income/expense aggregates from Supabase (RLS-scoped).
3. POSTs to Gemini `generateContent` with a Clario system prompt (calm, encouraging, plain language, 2–3 sentences).
4. Returns `{ text }`. Errors surface a friendly fallback in the UI.

Gemini key never leaves the server. If you'd rather use Lovable AI Gateway (no key mgmt, billed by Lovable), say the word and I'll swap providers — code structure is identical.

## Out of Phase 1 (next phases)

- Transactions, Budgets, Planner, Insights pages
- Settings modal
- Privacy/Terms pages + cookie banner
- CSV export
- Service worker / offline
- Other-tab placeholders will say "Coming next" so nothing is broken

## Open questions I'll resolve in build mode

- Connect your Supabase project (you'll do this through the connector prompt).
- Add `GEMINI_API_KEY` as a secret (after you rotate the leaked one).
- Confirm: stick with **direct Gemini REST** using your key, or switch to **Lovable AI Gateway** (Gemini, no key mgmt)?

Reply "go" (or with any tweaks) and I'll switch to build mode and execute.
