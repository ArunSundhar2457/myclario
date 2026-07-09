## Landing page polish batch

All changes scoped to `src/routes/index.tsx`. No design system, color, or layout changes beyond the items below.

### 1. Logo size — nav bar + footer
- `StickyNav` (line 113): change `<img … className="h-9 w-auto" />` → `h-12 w-auto`, and bump the header row height from `h-16` → `h-20` so the larger logo has breathing room. This roughly matches the `h-12` treatment on `/auth`.
- `Footer` (line 791): change `<img … className="h-8 w-auto" />` → `h-12 w-auto`.
- Sidebar logo (`app-shell.tsx`) is explicitly out of scope and will not be touched.

### 2. "Built from frustration." → "Why Clario exists."
In `About` (lines 673–685):
- Replace the `AnimatedLine` heading text `"Built from frustration."` → `"Why Clario exists."`.
- Replace the `Typewriter` quote body with:
  > "I got tired of switching between to-do apps and banking tools just to keep my finances and my day straight. So I built Clario — one app that connects your money and your tasks, with AI that ties it all together."
- No layout/style changes; the existing italic paragraph, quote marks, and founder card stay identical.

### 3. Final CTA heading
Line 760 in `FinalCTA`: replace heading text `"Take control of your finances today."` → `"Take control of your money and your day."`. Subheading, button, and badge unchanged.

### 4. Hero preview card — count-up animation on numbers
In `MockDashboard` / `StatMock` (lines 244–312):
- Add a small internal `CountUp` helper component (Framer Motion `useMotionValue` + `animate` + `useMotionValueEvent`, no new libraries) that animates from `0` to a target number over ~1.2s with `easeOut` when it enters the viewport (`useInView` from framer-motion, once: true).
- It accepts `value: number`, optional `prefix` (e.g. `"₹"`), optional `suffix` (e.g. `" / 15"`), and formats with `toLocaleString("en-IN")` for the ₹45,200 case.
- Update the three `StatMock` calls:
  - `Saved this month` → `CountUp value={45200} prefix="₹" />` (tone="primary")
  - `Tasks completed` → `CountUp value={12} suffix=" / 15" />`
  - `Budget health` → keep as static text `"On track"` (non-numeric, nothing to count).
- `StatMock` gets a small tweak to render a `ReactNode` for `value` instead of only `string`, so it can accept the `<CountUp />` element. Styling classes unchanged.
- Numbers remain fake marketing values — no Supabase, no data wiring.

### Out of scope
Sidebar logo, real data on landing, any other landing section, design tokens, colors, spacing beyond the small nav height bump needed to accommodate the larger logo.
