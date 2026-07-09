import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Wallet,
  PiggyBank,
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Linkedin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Clario — Your money. Your day. Sorted." },
      {
        name: "description",
        content:
          "The AI-powered app that connects your finances and daily planning in one place.",
      },
      { property: "og:title", content: "Clario — Your money. Your day. Sorted." },
      {
        property: "og:description",
        content:
          "The AI-powered app that connects your finances and daily planning in one place.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) navigate({ to: "/dashboard", replace: true });
      else setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background text-foreground scroll-smooth"
    >
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary"
      />
      <StickyNav />
      <Hero />
      <TrustBar />
      <AudienceTicker />
      <Comparison />
      <HowItWorks />
      <Features />
      <About />
      <FinalCTA />
      <Footer />
    </motion.div>
  );
}

/* ---------------- Sticky Nav ---------------- */

function StickyNav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [blurred, setBlurred] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 120 && y > prev);
    setBlurred(y > 20);
  });

  return (
    <motion.header
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        blurred ? "border-b border-border/60 bg-background/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center">
          <img src="/clario-logo.svg" alt="Clario" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ---------------- Hero ---------------- */

const wordVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function AnimatedLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08, delayChildren: delay }}
        className="inline-block"
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pr-[0.25em]">
            <motion.span variants={wordVariants} className="inline-block">
              {w}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function HeroParticles() {
  // Deterministic pseudo-random positions
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const left = (i * 37) % 100;
    const top = (i * 53) % 100;
    const dur = 8 + (i % 6);
    const dx = ((i % 4) - 2) * 15;
    const dy = -20 - (i % 5) * 8;
    return { left, top, dur, dx, dy, i };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.i}
          className="absolute h-1 w-1 rounded-full bg-primary/30"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, p.dy, 0], x: [0, p.dx, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.i * 0.3 }}
        />
      ))}
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const mockupY = useTransform(scrollY, [0, 600], [0, -80]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <HeroParticles />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl">
          <AnimatedLine text="Your money." delay={0} />
          <AnimatedLine text="Your day." delay={0.35} />
          <span className="block bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
            <AnimatedLine text="Sorted." delay={0.7} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          The AI-powered app that connects your finances and daily planning in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.35, duration: 0.5 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/auth">
            <Button size="lg" className="min-w-[180px]">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="ghost" className="min-w-[180px]">
              See how it works
            </Button>
          </a>
        </motion.div>
      </div>

      <motion.div
        style={{ y: mockupY }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="mt-16 w-full max-w-4xl px-2"
      >
        <MockDashboard />
      </motion.div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Good morning</div>
          <div className="font-display text-lg font-semibold">Here's your day</div>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">July 2026</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatMock label="Saved this month" value={<CountUp value={45200} prefix="₹" />} tone="primary" />
        <StatMock label="Tasks completed" value={<CountUp value={12} suffix=" / 15" />} />
        <StatMock label="Budget health" value="On track" tone="primary" />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI Daily Briefing
        </div>
        <p className="text-sm text-muted-foreground">
          You're 18% under budget on dining this week. Keep it up — you'll hit your savings goal by the 24th.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {[
          { label: "Groceries", pct: 62 },
          { label: "Transport", pct: 34 },
          { label: "Dining", pct: 78 },
        ].map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{b.label}</span>
              <span>{b.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatMock({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display text-lg font-semibold ${
          tone === "primary" ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  useMotionValueEvent(mv, "change", (v) => setDisplay(Math.round(v)));

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ---------------- Trust ---------------- */

function TrustBar() {
  const items = [
    "Free to use",
    "Made in India 🇮🇳",
    "AI-powered",
    "PWA installable",
    "GDPR compliant",
    "Secure",
  ];
  return (
    <section className="border-y border-border bg-secondary/40 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs text-muted-foreground md:text-sm">
        {items.map((it, i) => (
          <motion.span
            key={it}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            {it.includes("🇮🇳") ? (
              <span>
                Made in India{" "}
                <motion.span
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="inline-block"
                >
                  🇮🇳
                </motion.span>
              </span>
            ) : (
              <span>{it}</span>
            )}
            {i < items.length - 1 && <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Audience Ticker ---------------- */

function AudienceTicker() {
  const audiences = [
    "WORKING PROFESSIONALS",
    "FREELANCERS",
    "STUDENTS",
    "ENTREPRENEURS",
    "STARTUP FOUNDERS",
    "REMOTE WORKERS",
    "SMALL BUSINESS",
    "CONTENT CREATORS",
    "BUDGET PLANNERS",
    "GOAL SETTERS",
  ];
  const [paused, setPaused] = useState(false);
  const loop = [...audiences, ...audiences];

  return (
    <section
      className="relative overflow-hidden border-b border-border bg-background py-5"
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: paused ? undefined : ["0%", "-50%"] }}
        transition={{ duration: 45, ease: "linear", repeat: Infinity }}
      >
        {loop.map((word, i) => (
          <span
            key={i}
            className="mx-6 text-xs uppercase tracking-[0.2em] text-muted-foreground md:text-sm"
          >
            {word} <span className="ml-6 text-muted-foreground/40">·</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------------- Comparison ---------------- */

const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const shakeItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: [-6, 6, -3, 0], transition: { duration: 0.5 } },
};

const bounceItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: [8, -3, 0], transition: { duration: 0.5 } },
};

function Comparison() {
  const beforeItems = [
    "Multiple apps, zero clarity",
    "No idea where money goes",
    "Tasks and finances never connected",
    "End of month surprises",
    "Feels overwhelming",
  ];
  const afterItems = [
    "One app for money and time",
    "AI that explains your finances",
    "Tasks connected to your goals",
    "Always know where you stand",
    "Feels effortless",
  ];

  return (
    <section className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl"
        >
          Everything scattered. Now everything sorted.
        </motion.h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-semibold text-foreground">Before Clario</h3>
            <motion.ul
              variants={listContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-5 space-y-3"
            >
              {beforeItems.map((it) => (
                <motion.li
                  key={it}
                  variants={shakeItem}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{it}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="animate-glow-pulse rounded-2xl border border-primary/30 bg-card p-6 ring-1 ring-primary/20"
          >
            <h3 className="font-display text-lg font-semibold text-primary">With Clario</h3>
            <motion.ul
              variants={listContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-5 space-y-3"
            >
              {afterItems.map((it) => (
                <motion.li
                  key={it}
                  variants={bounceItem}
                  className="flex items-start gap-3 text-sm text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{it}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks() {
  const steps = [
    { n: 1, title: "Sign up in seconds", desc: "Free account. No credit card required." },
    { n: 2, title: "Log expenses and plan your day", desc: "Track money and tasks in one place." },
    { n: 3, title: "Get AI insights that connect both", desc: "See how your habits shape your goals." },
  ];

  return (
    <section id="how-it-works" className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl"
        >
          Simple by design
        </motion.h2>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          <svg
            className="pointer-events-none absolute left-0 right-0 top-6 hidden md:block"
            height="2"
            width="100%"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="10" x2="90" y1="1" y2="1"
              stroke="currentColor"
              className="text-primary/30"
              strokeWidth="0.3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>

          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground shadow-lg">
                {s.n}
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */

function Features() {
  const cards = [
    {
      icon: Wallet,
      title: "Expense Tracking",
      desc: "Log income and expenses in seconds. Every rupee accounted for.",
    },
    {
      icon: PiggyBank,
      title: "Budget Management",
      desc: "Set limits, track progress, get alerted before you overspend.",
    },
    {
      icon: CalendarCheck,
      title: "Daily Planner",
      desc: "Plan your day with a built-in calendar. Tasks that connect to your goals.",
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      desc: "Clario reads your month and tells you exactly what to do next.",
    },
  ];

  return (
    <section className="bg-secondary/30 px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl"
        >
          Everything you need, nothing you don't
        </motion.h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(14,124,102,0.35)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- About ---------------- */

function Typewriter({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ staggerChildren: 0.018 }}
      className="inline"
    >
      {chars.map((c, i) => (
        <motion.span
          key={i}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          transition={{ duration: 0.02 }}
        >
          {c}
        </motion.span>
      ))}
    </motion.span>
  );
}

function About() {
  return (
    <section className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          <AnimatedLine text="Why Clario exists." />
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base italic text-muted-foreground md:text-lg">
          "
          <Typewriter text="I got tired of switching between to-do apps and banking tools just to keep my finances and my day straight. So I built Clario — one app that connects your money and your tasks, with AI that ties it all together." />
          "
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mx-auto mt-12 max-w-md overflow-hidden rounded-2xl border border-border bg-secondary/50 p-6 text-left shadow-sm"
        >
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: "100%" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="absolute left-0 top-0 w-[3px] bg-primary"
          />
          <div className="flex items-center gap-5 pl-3">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="shrink-0"
            >
              <img
                src="/arun.jpg"
                alt="Arun Sundhar N"
                className="h-32 w-24 rounded-[50%] border border-border object-cover shadow-md"
              />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-semibold text-foreground">
                Arun Sundhar N
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Founder & Creator of Clario
              </div>
              <a
                href="https://linkedin.com/in/arun-sundhar-n-6aba50249"
                target="_blank"
                rel="noopener noreferrer"
                className="shimmer-on-hover mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Linkedin className="h-3.5 w-3.5" />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCTA() {
  return (
    <section className="px-4 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-8 py-16 text-center md:py-20"
        style={{ backgroundColor: "#1a3a2a" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
            Take control of your money and your day.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/75">
            Join thousands organizing their money and time with Clario.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-white text-[#1a3a2a] hover:bg-white/90"
              >
                Start for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/60">
            <CheckCircle2 className="h-3.5 w-3.5" /> Free forever · No credit card
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-3">
          <img src="/clario-logo.svg" alt="Clario" className="h-12 w-auto" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <span>·</span>
          <a href="mailto:myclario.help@gmail.com" className="hover:text-foreground">
            myclario.help@gmail.com
          </a>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 Clario. All rights reserved.</div>
      </div>
    </footer>
  );
}
