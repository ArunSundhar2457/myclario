# Multi-Language Support (English / German / Spanish)

A per-user language preference stored on the profile, changed only in Settings. Currency and language stay fully independent.

## What changes for you

- Settings gains a **Language** select (English / Deutsch / Español) right below Currency.
- Saving a new language shows a toast: "Language updated — refresh to see Clario in Deutsch." with a **Refresh** button. Nothing reloads on its own.
- Currency keeps applying instantly; only language waits for a refresh.
- Translated in this first pass: navigation labels, Settings modal, header greeting, empty states, and the main button labels on Dashboard, Transactions, Budgets, Planner, and Insights.
- Missing translations quietly fall back to English — never a blank or a raw key.
- AI briefings/insights stay English for now.

## Technical plan

**Migration**
- `profiles.language text not null default 'en'` with a check constraint limiting values to `en`, `de`, `es`.

**Dictionaries — `src/lib/i18n/`**
- `en.ts`, `de.ts`, `es.ts`: flat `Record<string, string>` maps with identical key sets (`nav.*`, `settings.*`, `dashboard.*`, `transactions.*`, `budgets.*`, `planner.*`, `insights.*`, `common.*`). English is the source of truth.
- `index.ts`: exports `Language`, `LANGUAGES` (code + native label), and `dictionaries`.

**Provider — `src/components/language-provider.tsx`**
- Mirrors `currency-provider.tsx`: same `getProfile` server-fn query, `staleTime: 5 * 60 * 1000`, `queryKey: ["profile"]`.
- Context value `{ language, t }`; `t(key) = dictionaries[language][key] ?? dictionaries.en[key] ?? key`.
- Mounted in `src/components/app-shell.tsx` wrapping the existing `CurrencyProvider` subtree (line 231), so both share the cached profile query.

**Profile write**
- `updateProfile` in `src/lib/profile.functions.ts` gains `language: z.enum(["en","de","es"]).optional()`; `getProfile` selects `language`.

**Settings — `src/components/settings-modal.tsx`**
- Local `language` state hydrated from the profile, a Select matching the Currency block, included in the save mutation payload.
- On success: invalidate `["profile"]` as today; if language changed, `toast.success(...)` with `duration: Infinity` and `action: { label: "Refresh", onClick: () => window.location.reload() }`.

**String swap**
- `app-shell.tsx` nav/sidebar/bottom-nav labels, Settings/Sign out.
- `dashboard.tsx` greeting + card titles + empty states, `transactions.tsx`, `budgets.tsx`, `planner.tsx`, `insights.tsx` scoped strings and primary button labels — all via `useLanguage().t`. Structure and styling untouched.

**Version**
- `src/lib/version.ts` → `1.0.6`, `2026-08-07`.
