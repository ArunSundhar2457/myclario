## Auth page: validation, password toggle, strength checklist, reset toast

**File:** `src/routes/auth.tsx` (only)

### 1. Sign-in inline field errors
Add `emailError` / `passwordError` state to `SignInForm`. On submit:
- Empty email → set email error "Please enter your email.", do not call Supabase.
- Email present, empty password → set password error "Please enter your password.", do not call Supabase.
- Clear each error as the user types in that field.
- Remove `required` from those inputs so our messages show instead of the browser's.

Errors render as small destructive-colored text directly under the matching input (no layout shift beyond the message line).

### 2. Wrong credentials
When `signInWithPassword` returns an error, show a single generic toast: `toast.error("Incorrect email or password.")` instead of the raw Supabase message. No field-level hint.

### 3. Password show/hide toggle
On both sign-in and sign-up password inputs: a button inside the input's right edge with lucide `Eye` / `EyeOff`, toggling `type` between `password` and `text`. Implemented by wrapping the input in a `relative` container, adding `pr-10` to the input, and absolutely positioning the icon button — no styling changes to the Input component itself. Includes an `aria-label` ("Show password" / "Hide password").

### 4. Sign-up password strength checklist
Replace the "At least 6 characters" helper text with a live 4-item checklist computed on each keystroke:
- At least 6 characters
- At least 1 number
- At least 1 letter
- At least 1 special character

Each row shows a lucide `Check` in the primary/green token when met, and a muted `Circle`/dash icon when not, with muted text. The "Create account" button is disabled until all four pass (in addition to the existing loading state).

### 5. Forgot password toasts
In `ForgotForm`, on success show `toast.success("Password reset link sent. Check your email.")`; on error show `toast.error("Couldn't send reset link. Please try again.")`.

### Notes
Reuses the existing `sonner` toast pattern and existing color tokens. No changes to Supabase auth calls, Google OAuth, right-panel design, or overall layout.
