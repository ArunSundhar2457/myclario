# Clario cinematic landing experience

Evolve only the public `/` page into the selected **Cinematic dark mode** direction: deep-navy product-launch framing, restrained violet/lavender light, tangible Clario product previews, and purposeful scroll storytelling. Preserve existing messaging, routes, CTAs, founder content, legal links, authentication redirect, Supabase behavior, and every authenticated feature.

## What will change

### 1. Landing-page architecture
- Keep `src/routes/index.tsx` as the public route and thin page composition.
- Move the large existing implementation into focused landing components for navigation, hero/product preview, three chapters, trust content, founder story, CTA, and footer.
- Add a landing-only static sample-data module. No authenticated query, private data, or reusable dashboard component will be pulled across the auth boundary.
- Keep the current client-side signed-in redirect to `/dashboard` unchanged.

### 2. Cinematic navigation and hero
- Build a sticky navigation that starts as a restrained translucent layer over the dark opening and gains clearer separation after scrolling.
- Preserve the themeable Clario lockup, “Sign in,” and “Start free,” with accessible focus states and TanStack links.
- Recompose the existing hero around the current “Your money. Your day. Sorted.” message and CTAs.
- Place oversized luminous typography behind/around a static Clario dashboard preview, treated as a dimensional product surface rather than a screenshot.
- Link hero scroll progress to a subtle tilted/scaled-down preview that straightens, enlarges, and settles as the user moves down. Scrolling remains native and reversible.

### 3. Three product-story chapters
- **Noise to clarity:** overlapping static Clario finance/planner layers separate into an organized hierarchy, communicating that Clario brings scattered information together.
- **Information to action:** a sequential static workflow shows financial activity, Clario interpretation, a canonical Lhana explanation, a recommendation, and an existing supported next action. It will not imply transfers, mutations, goals, payday intelligence, persistent memory, or autonomous behavior.
- **Financial visualization:** an authentic sample spending-trend scene progressively reveals its path, points, labels, and supporting values using existing Clario terminology.
- Desktop/tablet may use sticky progress where it earns the space; mobile uses normal flowing scenes with concise, readable final compositions.

### 4. Existing content and visual continuity
- Preserve the current trust claims, audience language, feature messaging, founder story, final CTA copy, contact details, and legal links, reorganizing them around the three chapters without inventing product claims.
- Use the current Clario semantic palette and Urbanist/Epilogue typography. Dark sections use deep navy with restrained violet/lavender illumination; light sections use luminous lavender and clear contrast.
- Use the canonical Lhana asset/component architecture already in the project.
- Keep the themeable inline Clario lockup; do not modify `public/clario-logo.svg` or introduce a competing logo.
- Remove the existing decorative particle field and avoid star fields, green/emerald/teal accents, noisy parallax, excessive glass, and repeated floating cards.

### 5. Motion, accessibility, and performance
- Reuse the installed Framer Motion implementation; add no animation dependency.
- Build a small landing scroll-progress primitive using section refs and motion values/CSS transforms, avoiding React state updates per animation frame.
- Use transform and opacity for the hero settle, card separation, workflow reveal, and chart drawing.
- Apply `prefers-reduced-motion` through Motion’s reduced-motion support and CSS fallbacks so all scenes render immediately in meaningful final states.
- Keep fake preview controls non-interactive and outside the tab order; maintain semantic heading order, visible focus, contrast, and decorative `aria-hidden` treatment.
- Preserve meaningful static content before animation initializes and clean up all listeners/observers.

### 6. Metadata and scope
- Complete the landing route’s page-specific social metadata with `og:type` and `twitter:card` while preserving its current title and description.
- Limit product work to the public landing presentation and any focused landing components/styles it requires.
- Do not alter authentication screens, app shell, dashboard logic, Lhana logic, Supabase clients/queries, schemas, RLS, financial calculations, currency, settings, or authenticated routes.

## Technical notes

- Confirmed stack: TanStack Start, React 19, Tailwind CSS v4 semantic tokens, Framer Motion already used on `/`, Recharts available, Vitest and ESLint configured.
- The current preview is static sample content; the new previews remain explicitly labeled sample data.
- Existing global Clario tokens remain authoritative. Any new cinematic surface or lighting role will be introduced semantically in `src/styles.css`, never as a parallel palette.
- The current landing route is client-rendered and waits for the existing Supabase auth check. This behavior remains unchanged to avoid changing authentication architecture in a presentation-only task.

## Verification

- Inspect `/` at mobile, tablet, desktop, and large-desktop sizes.
- Test slow, fast, forward, reverse, and repeated scrolling; navigation away and return; and CTA destinations.
- Verify hero tilt-to-flat motion, chapter synchronization, layered-card separation, workflow sequence, chart drawing, and no scroll hijacking.
- Verify reduced-motion final states, keyboard order, visible focus, semantic headings, preview tab exclusion, contrast, and no horizontal overflow.
- Check console/runtime/hydration errors and ensure subscriptions clean up after navigation.
- Confirm `/auth` and protected-route redirects still work, with no private requests or real user data on `/`.
- Search landing sources for leftover green/emerald/teal treatment.
- Run TypeScript checking, ESLint, Vitest, and the production build; report existing unrelated failures separately from introduced issues.
