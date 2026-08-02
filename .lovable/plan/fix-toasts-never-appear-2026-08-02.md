## Fix: toasts never appear

### Cause (verified)

The app's root layout `src/routes/__root.tsx` contains no `Toaster` render at all. The only reference to a toast container in the codebase is the unused wrapper component at `src/components/ui/sonner.tsx`. Without a mounted container, every `toast.error(...)` / `toast.success(...)` call succeeds silently and renders nothing.

### Change

**File:** `src/routes/__root.tsx` (only)

- Import the project's existing wrapper: `import { Toaster } from "@/components/ui/sonner"`.
- Render `<Toaster richColors position="top-center" />` once in the root layout, as a sibling of the route outlet so it is present on every route.

No z-index work is planned up front, since the container is missing rather than hidden.

### Verification

Load the app, trigger an existing toast (e.g. submit the sign-in form on `/auth` with an empty email, which already calls a toast), and confirm the toast is visible on screen and not covered by the sidebar, FAB, or the Lovable badge. If it renders but sits behind fixed UI, add a z-index bump to the Toaster only.

### Out of scope

No changes to toast message text, validation logic, styling, layout, or any other component.
