
## Landing Page Additions

All edits scoped to `src/routes/index.tsx` + a few keyframes in `src/styles.css`. No design tokens, fonts, or existing sections change.

### 1. Trust Bar copy update
Update items array in `TrustBar` to:
`["Free to use", "Made in India 🇮🇳", "AI-powered", "PWA installable", "GDPR compliant", "Secure"]`
Add per-item `motion.span` with `initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}` staggered by index. Flag emoji wrapped in a `motion.span` with a one-shot scale pop (1 → 1.3 → 1) on mount.

### 2. `<AudienceTicker />` — inserted after `<TrustBar />`
- Full-width section, `overflow-hidden`, vertical padding matching other section rhythm.
- CSS mask: `maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'` for edge fade.
- Inner flex row with the 10-item array rendered twice back-to-back, animated via Framer Motion `animate={{ x: ['0%', '-50%'] }}` with `repeat: Infinity, ease: 'linear', duration: 40`.
- Pause on hover via `whileHover={{ animationPlayState: 'paused' }}` fallback: use state to toggle `duration` between 40 and a very large number.
- Text: `text-muted-foreground`, `text-sm uppercase tracking-widest`, dot separators already in strings.

### 3. `<Comparison />` — inserted after ticker
- Section wrapper matching existing padding (`px-4 py-24 md:py-32`).
- H2: "Everything scattered. Now everything sorted." — reuse existing `font-display text-3xl md:text-4xl` style.
- Two `motion.div` cards in a `grid md:grid-cols-2 gap-6` using existing `rounded-2xl border border-border bg-card p-6` styles.
  - Left: `initial={{ x: -60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}`.
  - Right: `initial={{ x: 60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}`, adds `ring-1 ring-primary/30 shadow-[0_0_40px_-10px_rgba(42,122,106,0.35)]` and a subtle `animate-glow-pulse` keyframe.
  - Both: `whileHover={{ y: -6 }}` spring `{ stiffness: 300, damping: 20 }`.
- Items list: each row is a `motion.li` with `staggerChildren: 0.1`.
  - Left uses red `XCircle` icon (`text-red-500`) with tiny shake variant (`x: [-2, 2, -2, 0]`).
  - Right uses `CheckCircle2` (`text-primary`) with bounce (`y: [8, -3, 0]`).
- All `whileInView` calls use `viewport={{ once: true, margin: '-100px' }}`.

### 4. `<About />` — inserted between `<Features />` and `<FinalCTA />`
- Section with centered max-w-3xl content.
- Title "Built from frustration." reuses the existing `AnimatedLine` word-reveal component.
- Quote: typewriter — split into chars, `motion.span` per char with staggered `opacity 0 → 1` (~0.02s each) triggered `whileInView`.
- Founder card:
  - Warm soft bg (`bg-secondary/60`), `rounded-2xl`, `border-l-[3px] border-primary`, existing border/shadow tokens otherwise.
  - Left border height animates 0 → 100% via a wrapping `motion.div` with `initial={{ height: 0 }} whileInView={{ height: '100%' }}`.
  - Oval photo: `<img src="/arun.jpg">`, `w-24 h-32 rounded-[50%] object-cover`, wrapped in `motion.div` with infinite float `y: [0, -6, 0]` over 3s ease.
  - Name (Arun Sundhar N), role (Founder & Creator of Clario).
  - LinkedIn: `lucide-react` `Linkedin` icon in a pill button with a `::before` shimmer gradient sweep on hover (CSS keyframe added to styles.css). `target="_blank" rel="noopener noreferrer"`.
  - Card entrance: `whileInView={{ opacity: 1, scale: 1 }}` from `{ opacity: 0, scale: 0.95 }` after quote.

Note: user must drop `arun.jpg` into `public/`; page will render a broken img otherwise. I will call this out but not add a placeholder.

### 5. Page-level polish
- **Scroll progress bar**: `motion.div` fixed top, `h-0.5 bg-primary origin-left`, `scaleX={useScroll().scrollYProgress}`. Added inside `LandingPage` root, above `<StickyNav />`.
- **Initial fade-in**: root wrapper gets `motion.div` with `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}`.
- **Hero floating particles**: add 12 absolutely-positioned dots (`w-1 h-1 rounded-full bg-primary/20`) inside Hero's existing `-z-10` background layer with individual Framer Motion drifts (`y: [0, -40, 0], x: [0, 20, 0]`, 8–14s, staggered). Existing hero blobs untouched.
- **Section parallax**: light `useScroll` + `useTransform` giving each new section a small `y` offset (max ±20px) — applied only to the three new sections, not existing ones.

### 6. `src/styles.css` additions
Append (does not touch existing tokens):
```
@keyframes glow-pulse { 0%,100% { box-shadow: 0 0 30px -12px rgba(42,122,106,0.30);} 50% { box-shadow: 0 0 45px -8px rgba(42,122,106,0.50);} }
.animate-glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }
@keyframes shimmer-sweep { 0% { transform: translateX(-120%);} 100% { transform: translateX(120%);} }
.shimmer-on-hover { position: relative; overflow: hidden; }
.shimmer-on-hover::before { content:''; position:absolute; inset:0; background:linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%); transform: translateX(-120%); }
.shimmer-on-hover:hover::before { animation: shimmer-sweep 0.9s ease; }
```

### Files touched
- `src/routes/index.tsx` — add `AudienceTicker`, `Comparison`, `About` components, mount them in `LandingPage`, add scroll progress + fade-in wrapper, add hero particles, update `TrustBar` copy/animations.
- `src/styles.css` — append glow-pulse + shimmer keyframes/utilities.

### Out of scope
Hero (except added particles in existing bg layer), Features, Final CTA, Footer, Sticky Nav, color tokens, fonts, existing card/shadow/radius styles.
