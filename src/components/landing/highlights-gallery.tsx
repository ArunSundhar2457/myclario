import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import {
  BudgetsScreen,
  CurrencyScreen,
  LhanaScreen,
  PhoneFrame,
  PlannerScreen,
  TransactionsScreen,
} from "./mockups";

/**
 * Apple-style "Get the highlights" gallery: pill tabs that auto-advance with a
 * progress bar, pausing on hover, keyboard focus, when off-screen, and for
 * reduced-motion users. Each tab swaps the phone screen with a staggered reveal.
 */

const SLIDE_MS = 6500;
const EASE = [0.16, 1, 0.3, 1] as const;

const TABS = [
  {
    id: "tracking",
    label: "Tracking",
    title: "Every rupee, accounted for.",
    copy: "Log income and expenses in seconds — with categories, recurring entries, search and CSV export.",
    Screen: TransactionsScreen,
  },
  {
    id: "budgets",
    label: "Budgets",
    title: "Limits that keep up with you.",
    copy: "Set a monthly limit per category. Clario tracks progress as you spend and flags it before you go over.",
    Screen: BudgetsScreen,
  },
  {
    id: "planner",
    label: "Planner",
    title: "Your day, in order.",
    copy: "A built-in calendar with tasks, priorities and due times, right next to your money.",
    Screen: PlannerScreen,
  },
  {
    id: "lhana",
    label: "Lhana",
    title: "Ask in plain words.",
    copy: "Lhana answers questions about your own month, computed from your real numbers — never made up.",
    Screen: LhanaScreen,
  },
  {
    id: "currency",
    label: "Currencies",
    title: "Set it once. Everything follows.",
    copy: "Show amounts in INR, USD, EUR or GBP, and use Clario in English, German, Spanish or French.",
    Screen: CurrencyScreen,
  },
] as const;

export function HighlightsGallery() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const progress = useMotionValue(0);

  const paused = !!reduce || hovered || focused || !inView;

  useAnimationFrame((_, delta) => {
    if (paused) return;
    // Clamp delta so returning to a background tab doesn't skip slides.
    const next = progress.get() + Math.min(delta, 100) / SLIDE_MS;
    if (next >= 1) {
      progress.set(0);
      setActive((a) => (a + 1) % TABS.length);
    } else {
      progress.set(next);
    }
  });

  function select(index: number, focus = false) {
    progress.set(0);
    setActive(index);
    if (focus) tabRefs.current[index]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = TABS.length - 1;
    const map: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key], true);
    }
  }

  const tab = TABS[active];
  const ActiveScreen = tab.Screen;

  return (
    <section
      id="highlights"
      ref={sectionRef}
      aria-labelledby="highlights-heading"
      className="bg-background px-4 py-24 text-foreground sm:px-6 sm:py-32"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              02 · The highlights
            </p>
            <h2
              id="highlights-heading"
              className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl"
            >
              Get the highlights.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Five things Clario does every day, so you don't have to think about them.
          </p>
        </div>

        {/* Pills */}
        <div
          role="tablist"
          aria-label="Clario highlights"
          onKeyDown={onKeyDown}
          className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0"
        >
          {TABS.map((t, i) => {
            const selected = i === active;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`highlight-tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="highlight-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected
                    ? "bg-navy text-navy-foreground"
                    : "bg-primary-soft text-foreground/70 hover:text-foreground",
                )}
              >
                <span className="relative z-10">{t.label}</span>
                {selected && !reduce && (
                  <motion.span
                    aria-hidden="true"
                    style={{ scaleX: progress }}
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          id="highlight-panel"
          role="tabpanel"
          aria-labelledby={`highlight-tab-${tab.id}`}
          className="relative mt-6 overflow-hidden rounded-[2rem] bg-navy text-navy-foreground shadow-cinematic"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-30"
          />
          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:py-16">
            <div className="min-h-[170px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                    {String(active + 1).padStart(2, "0")} / {String(TABS.length).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">
                    {tab.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-7 text-navy-foreground/70">
                    {tab.copy}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center">
              <PhoneFrame className="w-[250px] sm:w-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab.id}
                    className="h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ActiveScreen />
                  </motion.div>
                </AnimatePresence>
              </PhoneFrame>
            </div>
          </div>
          <p className="relative pb-6 text-center text-[11px] uppercase tracking-[0.2em] text-navy-foreground/45">
            Illustrative sample data
          </p>
        </div>
      </div>
    </section>
  );
}
