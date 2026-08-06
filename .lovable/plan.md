# Multi-Currency Display — Set Once in Settings

Amounts stay entered and stored in INR. The Settings preference only changes what currency the numbers are *displayed* in, converted with daily cached rates.

## Two notes on your spec before we build

1. **No new profile column needed.** Your profile already has a `currency` field (default `INR`), and the Settings modal already saves to it. I'll use that as the preferred currency instead of adding `preferred_currency` — same behaviour, no duplicate column.
2. **Rate fetching won't use a Supabase Edge Function.** This app runs on TanStack Start, so the daily fetch lives in an app server route (`/api/public/hooks/fetch-rates`). **The daily schedule will be configured for you** — I set it up with a `pg_cron` job via SQL, no manual step in the Supabase dashboard. I'll confirm the job is registered after it runs.

## What changes for you

- The currency dropdown disappears from the top header on every page (Dashboard, Transactions, Budgets, Insights, Planner).
- Settings keeps the only currency selector: INR / USD / EUR / GBP. Saving it re-renders every screen in that currency.
- Every money figure converts: snapshot cards, transaction rows, budget cards, trend tooltips, category donut, AI Insights.
- If no rate data exists yet, or the chosen currency is missing from the cached row, that display falls back to INR rather than showing a broken number.
- Version bumps to 1.0.5.

## Technical plan

**Migration**
- `exchange_rates` table: `id`, `base_currency` (default `'INR'`), `rate_date` date, `rates` jsonb, `fetched_at`, unique on `(base_currency, rate_date)`.
- Grants: `SELECT` to `anon` + `authenticated`, `ALL` to `service_role`. RLS enabled with a read-only public SELECT policy (shared reference data); writes only via service role.
- Enable `pg_cron` + `pg_net`.

**Rate fetch job**
- `src/routes/api/public/hooks/fetch-rates.ts` — POST handler, verifies the Supabase anon key in the `apikey` header, calls `https://api.frankfurter.dev/v2/latest?base=INR&symbols=USD,EUR,GBP`, merges `INR: 1` into the payload, upserts today's row via the admin client (loaded inside the handler). On fetch failure or a malformed payload it returns an error and writes nothing, leaving the last good row intact.
- `pg_cron` job scheduled daily (06:00 UTC) posting to the stable preview/production URL. Registered via SQL by me.

**Server function**
- `src/lib/currency.functions.ts` → `getLatestRates()`, public (no auth middleware), reads the newest `exchange_rates` row with a server publishable-key client. Returns `{ rate_date, rates } | null`.

**Shared helper**
- `src/lib/currency.ts` → `convertAndFormat(amountInINR, target, rates)`: multiplies by `rates[target]`, formats with `Intl.NumberFormat` using locale map `INR→en-IN, USD→en-US, GBP→en-GB, EUR→de-DE`. Missing rate or null `rates` ⇒ format as INR.

**Currency context**
- New `src/components/currency-provider.tsx` mounted in `AppShell`: one `useQuery(["profile"])` for the preference plus one `useQuery(["exchange-rates"])` with a long `staleTime` (session-cached). Exposes a `useCurrency()` hook returning `{ currency, rates, fmt }` where `fmt(inr)` is the bound formatter.
- `useAppStore` keeps `selectedMonth`; its `currency` / `setCurrency` state is removed along with the header select, so page-level code can't diverge from the profile.

**Display surfaces updated to `fmt()`**
- `src/components/app-shell.tsx` (remove the select, wrap children in the provider)
- `src/routes/_authenticated/dashboard.tsx` — snapshot cards, budget alert strip, trend tooltip, donut
- `src/routes/_authenticated/transactions.tsx` — rows, totals, sheet labels
- `src/routes/_authenticated/budgets.tsx` — budget cards and progress labels
- `src/routes/_authenticated/insights.tsx` + `src/lib/insights.functions.ts` / `src/lib/briefing.functions.ts` — pass the profile currency and a rate multiplier so AI-formatted amounts match the rest of the UI
- `src/components/settings-modal.tsx` — reads/writes the profile currency, invalidates the profile query on save
- `src/lib/app-store.ts` — drop currency state; keep `formatMoney` as an internal used by the new helper

**Version**
- `src/lib/version.ts` → `1.0.5`, `2026-08-06`.
