## Budget form validation fix

**File:** `src/routes/_authenticated/budgets.tsx` (only)

**Change:** Update the `submit()` function inside `CreateBudgetForm` and the Create button's `disabled` condition.

### Current issue
1. In create mode, the button is `disabled` when `available.length === 0`. While `listAvailableCategories` is still loading, `available ?? []` is `[]`, so the button appears clickable-looking but the click can be silently swallowed / feel unresponsive.
2. Validation order checks the limit before the category, and the messages don't match the spec.

### Fix
1. In `submit()` (create mode only — edit mode unchanged):
   - If `!category` → `toast.error("Please select a category.")` and return.
   - Else if `limit.trim() === ""` or `Number(limit)` is `NaN` or `<= 0` → `toast.error("Please enter a monthly limit greater than 0.")` and return.
   - Only then call `create.mutate({ data: { category, monthly_limit: num } })`.
2. Keep edit-mode branch as-is (it doesn't need a category check, only the limit check — reuse the same limit message).
3. Tighten the Create button's `disabled` prop so it only disables on `pending` or (in create mode) when the available-categories query has resolved AND is empty. Use `available` presence (not just length) so the button remains clickable during load and the new toasts can fire.

Reuses the existing `sonner` `toast.error` pattern already used elsewhere in the form. No new components, no styling changes, no changes to the edit flow, categories source, or layout.
