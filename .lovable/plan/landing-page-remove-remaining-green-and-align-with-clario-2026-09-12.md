# Landing page: remove remaining green and align with Clario

- Visual-only update to the landing page. Keep all wording, sections, links, responsive layout, motion, and behavior unchanged.

## Changes

1. **Header and footer branding**
  - Replace the legacy green baked-color logo rendering with the same Clario mark treatment used on the updated authentication page.
  - Render the mark in the existing primary violet token and retain the current Clario wordmark/tagline proportions and placement.
  - Use theme-aware foreground and muted text so the lockup remains readable in light and dark modes.
2. **Hero color cleanup**
  - Replace the remaining emerald ambient glow with restrained lavender/violet illumination.
  - Replace the violet-to-emerald “Sorted.” treatment with a Clario-only violet/lavender treatment.
  - Preserve hero copy, positioning, animation, mock dashboard, and CTA labels exactly.
3. **Final CTA visual treatment**
  - Replace the hardcoded dark-green rounded panel behind “Take control of your money and your day.” with a deep-navy foundation, subtle violet/lavender lighting, restrained glass depth, and a softened token-based grid.
  - Keep the panel dimensions, content order, wording, CTA, and motion unchanged.
  - Restyle the CTA button and supporting text with semantic Clario tokens for accessible contrast.
4. **Remaining decorative green cleanup**
  - Replace the legacy green feature-card hover shadow with the existing violet/Lhana shadow treatment.
  - Remove all green, emerald, and teal styling from the landing-page source while leaving unrelated status semantics elsewhere untouched.

## Technical details

- Limit implementation to `src/routes/index.tsx`.
- Use existing semantic tokens such as `primary`, `primary-soft`, `navy`, `navy-foreground`, `background`, and `shadow-lhana`; do not add a new palette.
- Reuse a single local Clario mark/lockup component for the header and footer so both remain visually consistent.
- Preserve the existing Framer Motion behavior and reduced-motion support.

## Verification

- Inspect `/` at desktop and mobile widths in light and dark themes.
- Confirm the header mark, hero accents, final CTA panel, hover styling, and footer mark contain no green/emerald/teal treatment.
- Check contrast, overflow, CTA readability, and unchanged navigation behavior.
- Run typecheck after the visual update.