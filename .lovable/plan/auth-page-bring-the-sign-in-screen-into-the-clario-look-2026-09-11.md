# Auth page: bring the sign-in screen into the Clario look

Visual-only correction of `/auth`. No changes to sign-in, Google, sign-up, reset, validation, or routes.

## What changes

**1. Brand lockup**
Today the lockup is a single flat image whose "Clario" text is baked in dark ink, so it disappears on dark backgrounds. Rebuild the lockup from the existing Clario mark plus live text:
- keep the existing Clario icon exactly as-is (violet accent preserved)
- "Clario" wordmark rendered as text in the display font, near-white / very light lavender on dark, deep navy on light
- tagline "Your money. Your day. Sorted." in muted lavender
- same size, spacing and proportions as now

**2. Right panel — remove the green/teal gradient**
Replace the blue-to-teal-to-green background with a restrained deep-navy foundation lit by violet, with soft-lavender illumination and a single luminous-lavender highlight. Calm and cinematic, not a bright purple wall. All three ambient glow blobs (currently emerald and teal) get repalettedto violet / soft lavender. After the change, no green, teal, turquoise or emerald value remains anywhere on this screen.

**3. Floating metric cards**
Same three cards, same sample figures, same float positions. Restyled as glass over navy: translucent surface, subtle lavender border, soft blur, restrained violet glow, bright near-white figures with muted-lavender labels.

**4. Typography contrast**
Headline near-white, supporting copy muted lavender, figures bright, labels subdued but readable — all meeting normal contrast expectations. No font or size architecture changes.

**5. Motion**
Keeps the existing gentle float and gradient drift, plus a soft entrance fade for the form column. Existing reduced-motion handling already covers these animations and stays in force.

**6. Responsive**
Split screen on desktop, single focused column on mobile — unchanged. Checked for overflow and form spacing.

## Technical notes

- Colors come from the tokens already in `src/styles.css` (`--navy`, `--primary`, `--lhana-soft`, `--background`, `--muted-foreground`); no new palette values are introduced. If the panel needs one gradient stop not covered by an existing token, it is added as a token rather than inlined.
- Files touched: `src/routes/auth.tsx`, and `src/styles.css` only if a gradient/glow utility is worth naming there. `public/clario-logo.svg` stays in the repo and in use elsewhere; the auth page composes the mark + text so it can theme.
- Existing animation utilities (`animate-float-slow`, `animate-float-slower`, `animate-card-float`, `animate-gradient-shift`) are reused, not duplicated.
- Verification: load `/auth` in light and dark, screenshot desktop and mobile widths, and grep the route for any leftover teal/emerald/green literal.
