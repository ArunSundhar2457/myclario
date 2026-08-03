# Dashboard greeting: interpolate display name

## Goal
Update the Dashboard header greeting from the generic "Good to see you." to "Good to see you, {displayName}." when a `display_name` exists, falling back to the generic text when empty/null.

## Changes
1. **Data fetch**: In `src/routes/_authenticated/dashboard.tsx`, update the `Header` component to fetch the authenticated user's profile using the existing `getProfile` server function from `src/lib/profile.functions.ts` (the same function the Settings page uses).
2. **Greeting text**: Change the `<h1>` text so it renders:
   - `"Good to see you, {displayName}."` when `display_name` is non-empty.
   - `"Good to see you."` when `display_name` is empty/null.
3. **Loading state**: Keep the current heading rendering during load (no extra skeleton or layout shift). The greeting can appear as soon as the profile resolves.

## Out of scope
- No changes to Settings page or profile editing.
- No styling, layout, color, or other dashboard component changes.
- No new server functions; reuse `getProfile`.
