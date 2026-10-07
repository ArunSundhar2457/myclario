import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Database, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import lhanaImage from "@/assets/lhana-insight.webp";
import { ScrollStage } from "./scroll-stage";

/**
 * Introduces Lhana with a short sample chat. Each beat of the conversation is
 * tied to scroll position, so it plays forward when scrolling down and rewinds
 * when scrolling up. On desktop the section pins while the chat plays.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const FACTS = [
  {
    icon: Database,
    title: "Works from your real numbers",
    copy: "Every figure is calculated from your own transactions and budgets.",
  },
  {
    icon: ShieldCheck,
    title: "Never invents numbers",
    copy: "If the data isn't there, Lhana says so and suggests what to track.",
  },
  {
    icon: Lock,
    title: "Read-only by design",
    copy: "She can explain and recommend — but never add, edit or delete records, or move money.",
  },
];

// Scroll progress (0–1) at which each chat beat appears.
const BEATS = [0.1, 0.3, 0.5, 0.7];

export function LhanaSection() {
  return (
    <ScrollStage
      id="lhana"
      labelledBy="lhana-heading"
      className="bg-navy text-navy-foreground"
      track="lg:h-[260vh]"
      stageClassName="px-5 py-24 sm:py-32 lg:py-0"
    >
      {(progress) => <LhanaStage progress={progress} />}
    </ScrollStage>
  );
}

function LhanaStage({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    const next = BEATS.filter((b) => v >= b).length;
    setStep((s) => (s === next ? s : next));
  });
  const shown = reduce ? BEATS.length : step;

  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-25"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
        <div>
          <div className="relative inline-block">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-full bg-[radial-gradient(closest-side,var(--primary),transparent)] opacity-50"
            />
            <img
              src={lhanaImage}
              alt="Lhana, Clario's AI money guide"
              width={128}
              height={128}
              loading="lazy"
              className="relative h-28 w-28 rounded-full object-cover ring-2 ring-primary/40 sm:h-32 sm:w-32"
            />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            03 · Meet Lhana
          </p>
          <h2
            id="lhana-heading"
            className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl"
          >
            Calm answers from your own numbers.
          </h2>
          <ul className="mt-10 space-y-6">
            {FACTS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-navy-foreground/65">
                    {copy}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-label="Sample conversation with Lhana"
          className="relative rounded-[2rem] border border-navy-foreground/10 bg-navy-foreground/[0.04] p-5 shadow-cinematic sm:p-8"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-navy-foreground/50">
            Sample conversation
          </p>
          <div className="mt-6 flex min-h-[340px] flex-col gap-4">
            <AnimatePresence>
              {shown >= 1 && (
                <motion.div
                  key="q"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground"
                >
                  Can I afford a ₹6,000 dinner out this month?
                </motion.div>
              )}
              {shown === 2 && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-navy-foreground/[0.08] px-4 py-3"
                  aria-label="Lhana is typing"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-navy-foreground/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
              {shown >= 3 && (
                <motion.div
                  key="a"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="flex max-w-[92%] gap-3"
                >
                  <img
                    src={lhanaImage}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                  <p className="rounded-2xl rounded-tl-md border border-navy-foreground/10 bg-navy-foreground/[0.07] px-4 py-3 text-sm leading-6 text-navy-foreground/85">
                    Yes. You have ₹45,200 left this month, so you'd still have ₹39,200 after dinner.
                    Your dining budget is nearly used, though — this would take it over for July.
                  </p>
                </motion.div>
              )}
              {shown >= 4 && (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="ml-11 grid grid-cols-2 gap-3"
                >
                  <div className="rounded-2xl border border-navy-foreground/10 bg-navy-foreground/[0.05] p-4">
                    <p className="text-[11px] text-navy-foreground/55">Left this month</p>
                    <p className="mt-1 font-display text-xl font-bold tabular-nums">₹45,200</p>
                  </div>
                  <div className="rounded-2xl border border-primary/30 bg-primary/12 p-4">
                    <p className="text-[11px] text-navy-foreground/55">Left after dinner</p>
                    <p className="mt-1 font-display text-xl font-bold tabular-nums text-primary">
                      ₹39,200
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-navy-foreground/45">
            Figures in Lhana's cards are calculated by Clario, not the AI.
          </p>
        </div>
      </div>
    </div>
  );
}
