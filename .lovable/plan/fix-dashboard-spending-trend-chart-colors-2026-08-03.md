# Fix Dashboard Spending Trend Chart Colors

## Goal
Make the Dashboard "Spending trend" AreaChart visually distinguish Income from Spent by using the app's existing semantic color tokens, and add a clear legend.

## Current state
In `src/routes/_authenticated/dashboard.tsx` the `SpendingTrendCard` renders:
- `income` series with `var(--success)` stroke and green gradient fill (correct).
- `spent` series with `var(--primary)` stroke and emerald-teal gradient fill (incorrect — expenses are represented by `var(--destructive)` elsewhere in the app).
- No legend explaining the two colors.

## Changes
1. **Update Spent series colors**
   - Change `spent` Area `stroke` from `var(--primary)` to `var(--destructive)`.
   - Change the `spendFill` linear gradient stops from `var(--primary)` to `var(--destructive)`.
   - Keep opacity values identical so only the hue changes.

2. **Keep Income series unchanged**
   - `income` stroke remains `var(--success)`.
   - `incomeFill` gradient remains green.

3. **Add a compact legend**
   - Insert a small legend row under the chart header (above the chart area).
   - Render two items: a green dot + "Income", and a red/destructive dot + "Spent".
   - Use Tailwind semantic classes (`bg-success`, `bg-destructive`) and text-muted-foreground styling so it matches the existing design system.

## Out of scope
- No changes to chart data, axes, tooltips, tooltips formatting, or card layout.
- No changes to other dashboard sections.

## Verification
- Build the project and confirm no TypeScript errors.
- Open the Dashboard preview and confirm:
  - Spent line/area appears in the destructive/red tone.
  - Income line/area remains green.
  - The legend is visible and labels are correct.
