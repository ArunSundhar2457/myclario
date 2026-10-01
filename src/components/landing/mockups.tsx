import { motion, type Variants } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Globe2,
  Search,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import lhanaAvatar from "@/assets/lhana-insight.webp";
import {
  sampleBudgets,
  sampleCurrencies,
  sampleLanguages,
  sampleSnapshot,
  sampleTasks,
  sampleTransactions,
} from "./sample-data";

/* ------------------------------------------------------------------ */
/* Shared animation variants: screens stagger their rows in on mount.  */
/* ------------------------------------------------------------------ */

const screenVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={screenVariants}
      initial="hidden"
      animate="show"
      className={cn("flex h-full flex-col gap-2.5 px-4 pb-5 pt-12 text-navy-foreground", className)}
    >
      {children}
    </motion.div>
  );
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rowVariants} className={className}>
      {children}
    </motion.div>
  );
}

function ScreenTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Row>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-navy-foreground/55">
        {eyebrow}
      </p>
      <p className="mt-0.5 font-display text-lg font-bold leading-tight">{title}</p>
    </Row>
  );
}

const tile = "rounded-2xl border border-navy-foreground/10 bg-navy-foreground/[0.06] p-3";

/* ------------------------------------------------------------------ */
/* Phone frame                                                         */
/* ------------------------------------------------------------------ */

export function PhoneFrame({
  children,
  className,
  label = "Illustrative Clario app screen with sample data",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative aspect-[9/19] w-[280px] rounded-[2.75rem] bg-gradient-to-b from-[oklch(0.42_0.04_285)] via-[oklch(0.24_0.035_282)] to-[oklch(0.3_0.04_285)] p-[7px] shadow-cinematic",
        className,
      )}
    >
      {/* Outer rim highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[2.75rem] ring-1 ring-inset ring-white/15"
      />
      <div className="relative h-full overflow-hidden rounded-[2.3rem] bg-[oklch(0.19_0.035_282)]">
        {/* Ambient screen glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-30"
        />
        {/* Status bar */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-20 flex h-10 items-center justify-between px-6 text-[10px] font-semibold text-navy-foreground/80"
        >
          <span>9:41</span>
          <span className="h-[22px] w-[78px] rounded-full bg-black/90" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-[2px] border border-navy-foreground/70" />
          </span>
        </div>
        <div className="relative z-10 h-full">{children}</div>
        {/* Glass reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export function DashboardScreen() {
  return (
    <Screen>
      <ScreenTitle eyebrow={`${sampleSnapshot.month} · Sample`} title="Good to see you." />
      <Row className={cn(tile, "text-center")}>
        <p className="text-[10px] uppercase tracking-[0.18em] text-navy-foreground/55">
          Money left this month
        </p>
        <p className="mt-1 font-display text-3xl font-bold tabular-nums">
          {sampleSnapshot.balance}
        </p>
        <svg viewBox="0 0 100 24" className="mt-2 h-6 w-full" aria-hidden="true">
          <path
            d="M0 20 C12 18 18 10 30 12 S48 6 60 9 S80 3 100 4"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Row>
      <Row className="grid grid-cols-2 gap-2.5">
        <div className={tile}>
          <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
          <p className="mt-1.5 text-[10px] text-navy-foreground/55">Income</p>
          <p className="text-sm font-semibold tabular-nums">{sampleSnapshot.income}</p>
        </div>
        <div className={tile}>
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          <p className="mt-1.5 text-[10px] text-navy-foreground/55">Spent</p>
          <p className="text-sm font-semibold tabular-nums">{sampleSnapshot.spent}</p>
        </div>
      </Row>
      <Row className="rounded-2xl border border-primary/30 bg-primary/12 p-3">
        <div className="flex items-center gap-2">
          <img src={lhanaAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
          <p className="text-[11px] font-semibold text-primary">Lhana · Daily briefing</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-navy-foreground/75">
          Dining is 18% lower this week. Keep that pace and your budget stays on track.
        </p>
      </Row>
      <Row className={cn(tile, "flex items-center justify-between")}>
        <span className="flex items-center gap-2 text-[11px]">
          <CalendarDays className="h-3.5 w-3.5 text-primary" /> Today's tasks
        </span>
        <span className="text-[11px] font-semibold tabular-nums">{sampleSnapshot.tasks}</span>
      </Row>
    </Screen>
  );
}

export function TransactionsScreen() {
  return (
    <Screen>
      <ScreenTitle eyebrow="Transactions · Sample" title="Every rupee, logged." />
      <Row className={cn(tile, "flex items-center gap-2 py-2 text-[11px] text-navy-foreground/50")}>
        <Search className="h-3.5 w-3.5" /> Search transactions
      </Row>
      {sampleTransactions.map((t) => (
        <Row key={t.label} className={cn(tile, "flex items-center justify-between py-2.5")}>
          <span className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-lg",
                t.kind === "income" ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
              )}
            >
              {t.kind === "income" ? (
                <ArrowDownLeft className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
            </span>
            <span>
              <span className="block text-xs font-medium">{t.label}</span>
              <span className="block text-[10px] text-navy-foreground/50">{t.detail}</span>
            </span>
          </span>
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              t.kind === "income" && "text-success",
            )}
          >
            {t.value}
          </span>
        </Row>
      ))}
    </Screen>
  );
}

export function BudgetsScreen() {
  return (
    <Screen>
      <ScreenTitle eyebrow="Budgets · Sample" title="Limits that keep up." />
      {sampleBudgets.map((b) => {
        const close = b.percent >= 85;
        return (
          <Row key={b.label} className={tile}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{b.label}</span>
              <span className="tabular-nums text-navy-foreground/60">
                {b.spent} / {b.limit}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-foreground/10">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: b.percent / 100 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className={cn(
                  "h-full origin-left rounded-full",
                  close ? "bg-warning" : "bg-primary",
                )}
              />
            </div>
            {close && <p className="mt-1.5 text-[10px] text-warning">Close to your limit</p>}
          </Row>
        );
      })}
    </Screen>
  );
}

export function PlannerScreen() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <Screen>
      <ScreenTitle eyebrow="Planner · Sample" title="Your day, in order." />
      <Row className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className={cn(
              "rounded-xl py-2 text-[10px]",
              i === 3
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-navy-foreground/[0.06] text-navy-foreground/60",
            )}
          >
            <span className="block">{d}</span>
            <span className="mt-0.5 block text-xs font-semibold">{14 + i}</span>
          </span>
        ))}
      </Row>
      {sampleTasks.map((t) => (
        <Row key={t.title} className={cn(tile, "flex items-center gap-3 py-2.5")}>
          <span
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
              t.done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-navy-foreground/30",
            )}
          >
            {t.done && <Check className="h-3 w-3" />}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-xs font-medium",
                t.done && "text-navy-foreground/45 line-through",
              )}
            >
              {t.title}
            </span>
            <span className="block text-[10px] text-navy-foreground/50">{t.time}</span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              t.priority === "high"
                ? "bg-primary"
                : t.priority === "medium"
                  ? "bg-primary/55"
                  : "bg-navy-foreground/30",
            )}
          />
        </Row>
      ))}
    </Screen>
  );
}

export function LhanaScreen() {
  return (
    <Screen>
      <Row className="flex items-center gap-2.5">
        <img src={lhanaAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        <span>
          <span className="block font-display text-sm font-bold">Ask Lhana</span>
          <span className="block text-[10px] text-primary">Read-only · Sample chat</span>
        </span>
      </Row>
      <Row className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-[11px] text-primary-foreground">
        How am I doing this month?
      </Row>
      <Row className="max-w-[90%] rounded-2xl rounded-bl-md border border-navy-foreground/10 bg-navy-foreground/[0.07] px-3 py-2 text-[11px] leading-relaxed text-navy-foreground/85">
        You've spent ₹36,800 of ₹82,000 income, so ₹45,200 is left. Dining is easing this week —
        nice work.
      </Row>
      <Row className="grid grid-cols-2 gap-2">
        <div className={tile}>
          <p className="text-[10px] text-navy-foreground/55">Spent</p>
          <p className="text-sm font-semibold tabular-nums">₹36,800</p>
        </div>
        <div className={tile}>
          <p className="text-[10px] text-navy-foreground/55">Left</p>
          <p className="text-sm font-semibold tabular-nums text-primary">₹45,200</p>
        </div>
      </Row>
      <Row className="mt-auto flex items-center gap-2 rounded-full border border-navy-foreground/15 px-3 py-2 text-[11px] text-navy-foreground/45">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Ask about your money…
      </Row>
    </Screen>
  );
}

export function CurrencyScreen() {
  return (
    <Screen>
      <ScreenTitle eyebrow="Settings · Sample" title="Your currency. Your language." />
      <Row className="grid grid-cols-2 gap-2">
        {sampleCurrencies.map((c, i) => (
          <div
            key={c.code}
            className={cn(
              tile,
              i === 0 && "border-primary/40 bg-primary/15",
              "flex flex-col items-start",
            )}
          >
            <span className="text-[10px] font-semibold tracking-widest text-navy-foreground/55">
              {c.code}
            </span>
            <span className="mt-1 font-display text-lg font-bold tabular-nums">{c.value}</span>
          </div>
        ))}
      </Row>
      <Row className={tile}>
        <p className="flex items-center gap-2 text-[11px] font-medium">
          <Globe2 className="h-3.5 w-3.5 text-primary" /> Language
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sampleLanguages.map((l, i) => (
            <span
              key={l}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px]",
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-navy-foreground/[0.08] text-navy-foreground/70",
              )}
            >
              {l}
            </span>
          ))}
        </div>
      </Row>
      <Row className="text-[10px] leading-relaxed text-navy-foreground/45">
        Set once in Settings. Every screen follows. Conversions shown are approximate samples.
      </Row>
    </Screen>
  );
}
