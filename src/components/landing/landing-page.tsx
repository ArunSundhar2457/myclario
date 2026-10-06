import { Link } from "@tanstack/react-router";
import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Linkedin,
  Sparkles,
} from "lucide-react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClarioBrand } from "./clario-brand";
import { HighlightsGallery } from "./highlights-gallery";
import { LhanaSection } from "./lhana-section";
import { DashboardScreen, PhoneFrame } from "./mockups";
import { ScatteredToSorted } from "./scattered-to-sorted";
import { TrendChapter } from "./trend-chapter";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Smooth, eased scrolling for mouse wheels and trackpads on the landing page only.
 * Touch devices keep native scrolling. Skipped for reduced-motion users, and
 * destroyed when leaving the page so the logged-in app is unaffected.
 */
function useSmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });

    // Smooth-scroll in-page links like "See how it works", clearing the fixed nav.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!hash || hash === "#" || !document.querySelector(hash)) return;
      e.preventDefault();
      lenis.scrollTo(hash, { offset: -80 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, [reduce]);
}

export function LandingPageContent() {
  useSmoothScroll();
  return (
    // reducedMotion="user": framer-motion skips transform animations for users who
    // turned off animations in their system settings. Scroll-linked pieces also
    // check useReducedMotion() themselves.
    <MotionConfig reducedMotion="user">
      {/* overflow-x-clip (not hidden) so position: sticky keeps working */}
      <div className="min-h-screen overflow-x-clip bg-background text-foreground">
        <ScrollProgress />
        <LandingNav />
        <main>
          <Hero />
          <ScatteredToSorted />
          <HighlightsGallery />
          <LhanaSection />
          <TrendChapter />
          <Numbers />
          <Privacy />
          <FounderStory />
          <FinalCallToAction />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-primary"
    />
  );
}

const NAV_LINKS = [
  { href: "#highlights", label: "Features" },
  { href: "#lhana", label: "Lhana" },
  { href: "#privacy", label: "Privacy" },
];

function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-navy-foreground/10 bg-navy/85 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6"
      >
        <Link
          to="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ClarioBrand dark compact />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-navy-foreground/65 transition-colors hover:text-navy-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-navy-foreground/75 hover:bg-navy-foreground/10 hover:text-navy-foreground"
          >
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="shadow-lhana">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HEADLINE = [
  { text: "Your money.", className: "text-navy-foreground" },
  { text: "Your day.", className: "text-navy-foreground/55" },
  { text: "Sorted.", className: "text-primary" },
];

function FloatingChip({
  className,
  delay,
  progress,
  dockX,
  children,
}: {
  className: string;
  delay: number;
  progress: MotionValue<number>;
  /** Horizontal distance the chip travels to dock into the phone. */
  dockX: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  // Scroll-linked: chips slide into the phone and fade as the hero is scrolled.
  const x = useTransform(progress, [0.15, 0.6], [0, dockX]);
  const opacity = useTransform(progress, [0.3, 0.6], [1, 0]);
  const scale = useTransform(progress, [0.15, 0.6], [1, 0.8]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, opacity, scale }}
      className={cn("absolute z-20 hidden sm:block", className)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.9 + delay, ease: EASE }}
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
          className="flex items-center gap-3 rounded-2xl border will-change-transform border-navy-foreground/15 bg-[oklch(0.27_0.045_282/0.96)] px-4 py-3 text-navy-foreground shadow-cinematic"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Hero() {
  return (
    <ScrollStage
      labelledBy="hero-heading"
      className="bg-navy text-navy-foreground"
      track="lg:h-[170vh]"
      mobileOffset={["start start", "end start"]}
    >
      {(progress) => <HeroStage progress={progress} />}
    </ScrollStage>
  );
}

function HeroStage({ progress }: { progress: MotionValue<number> }) {
  const phoneY = useTransform(progress, [0, 1], [0, -60]);
  const phoneScale = useTransform(progress, [0, 0.7], [1, 1.12]);
  const phoneRotate = useTransform(progress, [0, 0.7], [0, -4]);
  const textY = useTransform(progress, [0, 0.8], [0, -70]);
  const textOpacity = useTransform(progress, [0.1, 0.65], [1, 0]);

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-25" />
        <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--lhana),transparent)] opacity-15" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.035)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      {/* min-h (not h) so content can never be clipped on short screens */}
      <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-14 px-5 pb-20 pt-28 sm:pt-32 lg:grid-cols-[1.1fr_.9fr] lg:gap-8">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="will-change-transform">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" /> Money and your day, connected
          </motion.p>
          <h1
            id="hero-heading"
            className="mt-6 font-display text-[clamp(3.25rem,9vw,7.25rem)] font-bold leading-[0.95] tracking-tight"
          >
            {HEADLINE.map((line, i) => (
              <span key={line.text} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={cn("block", line.className)}
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
            className="mt-6 max-w-xl text-base leading-7 text-navy-foreground/70 sm:text-lg"
          >
            The AI-powered app that connects your finances and daily planning in one calm place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="group min-w-44 shadow-lhana">
              <Link to="/auth">
                Start for free
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-44 border-navy-foreground/20 bg-navy-foreground/5 text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground"
            >
              <a href="#story">See how it works</a>
            </Button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-6 text-xs text-navy-foreground/55"
          >
            Free to start · No credit card · Installs on any device
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: EASE }}
          className="relative flex flex-col items-center"
        >
          <div
            aria-hidden="true"
            className="absolute top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-35"
          />
          <motion.div style={{ y: phoneY }} className="relative will-change-transform">
            <PhoneFrame className="w-[250px] sm:w-[290px]">
              <DashboardScreen />
            </PhoneFrame>
            <FloatingChip className="-left-36 top-20" delay={0}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/15 text-success">
                <ArrowDownLeft className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold tabular-nums">+₹82,000</span>
                <span className="block text-[11px] text-navy-foreground/60">Salary · 12 Jul</span>
              </span>
            </FloatingChip>
            <FloatingChip className="-right-32 top-1/2" delay={1.2}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Dining</span>
                <span className="block text-[11px] text-navy-foreground/60">
                  18% lower this week
                </span>
              </span>
            </FloatingChip>
            <FloatingChip className="-left-28 bottom-16" delay={2.4}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <CalendarCheck className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Pay electricity bill</span>
                <span className="block text-[11px] text-navy-foreground/60">Today · 12:30</span>
              </span>
            </FloatingChip>
          </motion.div>
          <p className="relative mt-6 text-[11px] uppercase tracking-[0.2em] text-navy-foreground/45">
            Illustrative sample data
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Numbers — only facts we can stand behind                            */
/* ------------------------------------------------------------------ */

const FACTS = [
  { value: "4", label: "Languages", note: "English, Deutsch, Español, Français" },
  { value: "4", label: "Currencies", note: "INR, USD, EUR and GBP — set once" },
  { value: "1", label: "App", note: "for your money and your day" },
  { value: "0", label: "Records Lhana can change", note: "Read-only by design" },
];

function Numbers() {
  return (
    <section
      aria-labelledby="numbers-heading"
      className="bg-navy px-5 py-24 text-navy-foreground sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          05 · By the numbers
        </p>
        <h2
          id="numbers-heading"
          className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl"
        >
          Small numbers. Big difference.
        </h2>
        <dl className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-navy-foreground/10 bg-navy-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
              className="flex flex-col bg-navy p-8"
            >
              <dt className="order-2 mt-4 font-medium">{f.label}</dt>
              <dd className="order-1 font-display text-[clamp(4.5rem,9vw,7rem)] font-bold leading-none text-primary">
                {f.value}
              </dd>
              <dd className="order-3 mt-2 text-sm leading-6 text-navy-foreground/60">{f.note}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy & trust                                                     */
/* ------------------------------------------------------------------ */

const PRIVACY = [
  {
    title: "Private to your account",
    copy: "Your transactions, budgets and tasks are tied to your account and protected at the database level. Other users can't see them.",
  },
  {
    title: "AI that reads, never writes",
    copy: "Lhana works from a summary of your own numbers. She can't add, edit or delete anything — and she can't move money.",
  },
  {
    title: "Yours to take, yours to delete",
    copy: "Export your data as a file, or delete your account from Settings, whenever you like.",
  },
  {
    title: "Install it like an app",
    copy: "Add Clario to your home screen on Android, iPhone or desktop. It opens fast and full-screen.",
  },
];

function Privacy() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="bg-background px-5 py-24 text-foreground sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            06 · Privacy first
          </p>
          <h2
            id="privacy-heading"
            className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl"
          >
            Calm by design. Private by default.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            A money app has to earn your trust. Here's how Clario handles yours. Made in India 🇮🇳
          </p>
        </div>
        <ol className="border-t border-border">
          {PRIVACY.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.6 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-8"
            >
              <span className="font-mono text-sm text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-display text-xl font-semibold sm:text-2xl">
                  {p.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground sm:text-base">
                  {p.copy}
                </span>
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Founder                                                             */
/* ------------------------------------------------------------------ */

function FounderStory() {
  return (
    <section
      aria-labelledby="founder-heading"
      className="border-t border-border bg-background px-5 py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1fr_.7fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Why Clario exists
          </p>
          <h2
            id="founder-heading"
            className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl"
          >
            Built to make the everyday feel clear.
          </h2>
          <blockquote className="mt-6 text-lg leading-8 text-muted-foreground">
            “I got tired of switching between to-do apps and banking tools just to keep my finances
            and my day straight. So I built Clario — one app that connects your money and your
            tasks, with AI that ties it all together.”
          </blockquote>
        </div>
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="border-l-2 border-primary pl-6"
        >
          <img
            src="/arun.webp"
            alt="Arun Sundhar N"
            width={192}
            height={256}
            loading="lazy"
            className="h-56 w-44 rounded-2xl object-cover shadow-elevated"
          />
          <figcaption>
            <span className="mt-5 block font-display text-xl font-semibold">Arun Sundhar N</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Founder & Creator of Clario
            </span>
          </figcaption>
          <a
            href="https://linkedin.com/in/arun-sundhar-n-6aba50249"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Linkedin className="h-4 w-4" /> Connect on LinkedIn
          </a>
        </motion.figure>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA — the phone rises into the panel as you arrive            */
/* ------------------------------------------------------------------ */

function FinalCallToAction() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const phoneY = useTransform(scrollYProgress, [0.2, 1], reduce ? [0, 0] : [160, 0]);
  const phoneScale = useTransform(scrollYProgress, [0.2, 1], reduce ? [1, 1] : [0.9, 1]);

  return (
    <section ref={ref} aria-labelledby="cta-heading" className="bg-background px-4 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-navy px-6 pt-20 text-center text-navy-foreground shadow-cinematic sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-30"
        />
        <div className="relative">
          <h2
            id="cta-heading"
            className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight sm:text-6xl"
          >
            Take control of your money and your day.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-navy-foreground/65">
            Set up in a minute. Start with one expense and one task — Clario does the rest.
          </p>
          <Button asChild size="lg" className="group mt-8 shadow-lhana">
            <Link to="/auth">
              Start for free
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-navy-foreground/55">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Free to start · No credit card
          </p>
        </div>
        {/* Phone peeks up from the bottom edge */}
        <motion.div
          style={{ y: phoneY, scale: phoneScale }}
          className="relative mx-auto mt-14 h-[300px] w-fit origin-bottom will-change-transform sm:h-[340px]"
        >
          <PhoneFrame className="w-[250px] sm:w-[280px]">
            <DashboardScreen />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <ClarioBrand />
        <nav
          aria-label="Legal"
          className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground"
        >
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href="mailto:myclario.help@gmail.com" className="hover:text-foreground">
            myclario.help@gmail.com
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">© 2026 Clario. All rights reserved.</p>
      </div>
    </footer>
  );
}
