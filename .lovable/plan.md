# Phase 3 — Polish, Landing Page & GDPR

Ship the remaining Clario surfaces without touching existing working pages (Dashboard, Transactions, Budgets, Planner, Insights, Auth) or the design tokens in `src/styles.css`.

---

## 1. Settings modal (fix sidebar gear)

Create `src/components/settings-modal.tsx` using shadcn `Dialog` + `AlertDialog`. Wire it up in `src/components/app-shell.tsx` — replace the `toast.info(...)` stub on the Settings button (and add a matching entry in the mobile bottom nav overflow if needed) with a state-controlled open handler.

Contents:
- **Display name** — text input, prefilled from `profiles.display_name` (add column if missing via migration).
- **Currency** — select (INR/USD/EUR/GBP), synced with `useAppStore` + `profiles.currency`.
- **Save** — updates the `profiles` row via a new `updateProfile` server fn (`src/lib/profile.functions.ts`, `requireSupabaseAuth`).
- **Export my data** — calls new `exportUserData` server fn that returns `{ profile, expenses, income, budgets, todos }`; client triggers download of `clario-data-export.json`.
- **Delete Account** — destructive button opens `AlertDialog` confirming permanent deletion. On confirm calls `deleteAccount` server fn: deletes rows from `todos, budgets, expenses, income, profiles` for `auth.uid()`, then client signs out and navigates to `/auth`. (Auth user row deletion requires service role — do inside handler with `supabaseAdmin` after `requireSupabaseAuth`.)
- Footer: `Need help? myclario.help@gmail.com`.

Migration: add `display_name text` to `profiles` if not present (safe `add column if not exists`).

## 2. GDPR pages

- `src/routes/privacy.tsx` — public route, full copy from spec, semantic headings, `head()` meta.
- `src/routes/terms.tsx` — public route, full copy from spec, `head()` meta.

Both use existing typography classes, no new colors.

## 3. Cookie consent banner

`src/components/cookie-banner.tsx`: fixed bottom, checks `localStorage.getItem('clario-cookie-consent')`; if null, renders banner with copy + Accept/Decline. Both actions write to localStorage and hide. Mount in `src/routes/__root.tsx` inside `RootComponent` so it shows on all routes.

## 4. Landing page `/` (animated, public)

Rewrite `src/routes/index.tsx`:
- Keep `beforeLoad` redirect: signed-in → `/dashboard`. Signed-out → render landing component (remove the current `throw redirect` to `/auth`).
- Install `framer-motion` (already used in Transactions per earlier phases — verify; add if missing).

Sections built as small components in `src/components/landing/`:
- **StickyNav** — logo + Sign in / Start free; scroll-direction hide/show via `useScroll` + `useMotionValueEvent`; backdrop blur once `scrollY > 20`.
- **Hero** — 3-line headline with per-word stagger (`whileInView` + variants), subtitle fade-up, CTA scale-in. Below: mocked dashboard card (static styled div with fake ₹45,200 / 12 tasks / budget bars / AI briefing) with parallax via `useScroll` + `useTransform` on `y`.
- **TrustBar** — pill row with dot separators, slide from left.
- **HowItWorks** — 3 numbered steps with an SVG connecting line animated via `pathLength` on `whileInView`.
- **Features** — 4 cards, staggered `whileInView`, hover uses Tailwind `hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(14,124,102,0.35)]`.
- **FinalCTA** — dark emerald bg (`#1a3a2a`) with subtle SVG grid pattern, zoom-in on view.
- **Footer** — logo + tagline, links to `/privacy`, `/terms`, mailto, copyright.

All motion uses `viewport={{ once: true }}`. `html { scroll-behavior: smooth }` added to `styles.css` if not present.

## 5. Non-goals / guardrails

- No changes to Dashboard, Transactions, Budgets, Planner, Insights, Auth pages.
- No changes to color tokens, fonts, or shared UI primitives.
- Existing FAB / sheets untouched.

---

## Technical notes

- Server functions: profile update, export, delete — all `.middleware([requireSupabaseAuth])`. Delete uses dynamic `import('@/integrations/supabase/client.server')` inside handler for admin auth deletion.
- Landing route stays `ssr: false` so the auth-based redirect works without leaking sessions to SSR.
- `framer-motion` — check `package.json`; `bun add framer-motion` if absent.
- Migration only if `profiles.display_name` missing.

Ready to build on approval.