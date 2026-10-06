import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Circle, Wallet } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * "From scattered to sorted" — six pieces of everyday money/life admin float
 * apart in their original form (a paper receipt, a bank SMS, a spreadsheet, a
 * note, a sticky note, a calendar entry). As the user scrolls they fly into
 * place and turn into Clario cards inside one dashboard. Fully scroll-linked,
 * so scrolling back up scatters them again.
 */

type Fragment = {
  id: string;
  source: string;
  left: number;
  top: number;
  scatter: { x: number; y: number; rotate: number };
  sourceFace: ReactNode;
  sourceClass: string;
  clarioFace: ReactNode;
};

const CARD_W = 260;
const CARD_H = 110;

const FRAGMENTS: Fragment[] = [
  {
    id: "receipt",
    source: "Paper receipt",
    left: 0,
    top: 0,
    scatter: { x: -300, y: -40, rotate: -12 },
    sourceClass: "bg-[oklch(0.96_0.012_85)] text-[oklch(0.3_0.02_60)] font-mono",
    sourceFace: (
      <div className="flex h-full flex-col justify-between border-b-2 border-dashed border-black/15 p-3.5 text-[11px]">
        <span className="font-semibold tracking-widest">GROCERY MART</span>
        <span className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>₹1,240.00</span>
        </span>
        <span className="opacity-60">14/07 · 18:42 · THANK YOU</span>
      </div>
    ),
    clarioFace: (
      <ClarioRow
        icon={<ArrowUpRight className="h-4 w-4" />}
        title="Groceries"
        meta="Food · Today"
        value="−₹1,240"
      />
    ),
  },
  {
    id: "salary",
    source: "Bank SMS",
    left: CARD_W + 20,
    top: 0,
    scatter: { x: 310, y: -60, rotate: 9 },
    sourceClass: "bg-[oklch(0.9_0.01_280)] text-[oklch(0.3_0.02_280)] rounded-bl-md",
    sourceFace: (
      <div className="p-3.5 text-[11px] leading-relaxed">
        <span className="font-semibold">BK-ALERT</span>
        <p className="mt-1">
          Your A/c XX42 is credited with INR 82,000.00 on 12-Jul. Avl bal updated.
        </p>
      </div>
    ),
    clarioFace: (
      <ClarioRow
        icon={<ArrowDownLeft className="h-4 w-4" />}
        title="Salary"
        meta="Income · 12 Jul"
        value="+₹82,000"
        positive
      />
    ),
  },
  {
    id: "sheet",
    source: "Spreadsheet",
    left: 0,
    top: CARD_H + 20,
    scatter: { x: -360, y: 40, rotate: 7 },
    sourceClass: "bg-white text-[oklch(0.35_0.02_280)] font-mono",
    sourceFace: (
      <div className="grid h-full grid-cols-3 text-[11px]">
        {["Item", "Jul", "Total?", "Dining", "3,900", "=SUM(", "Metro", "180", "#REF!"].map(
          (c, i) => (
            <span
              key={`${c}-${i}`}
              className={cn(
                "flex items-center border-b border-r border-black/10 px-2",
                i < 3 && "bg-black/[0.04] font-semibold",
              )}
            >
              {c}
            </span>
          ),
        )}
      </div>
    ),
    clarioFace: (
      <div className="flex h-full flex-col justify-center p-4">
        <span className="text-[11px] text-navy-foreground/55">Dining · July</span>
        <span className="mt-1 font-display text-2xl font-bold tabular-nums">₹3,900</span>
        <span className="text-[11px] text-primary">18% lower this week</span>
      </div>
    ),
  },
  {
    id: "note",
    source: "Notes app",
    left: CARD_W + 20,
    top: CARD_H + 20,
    scatter: { x: 340, y: 50, rotate: -8 },
    sourceClass: "bg-[oklch(0.95_0.05_90)] text-[oklch(0.35_0.05_75)]",
    sourceFace: (
      <div className="p-3.5 text-[12px] leading-relaxed">
        <span className="font-semibold">budget ideas</span>
        <p className="mt-1">dining max 5k this month?? (last month was way over)</p>
      </div>
    ),
    clarioFace: (
      <div className="flex h-full flex-col justify-center p-4">
        <span className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-medium">
            <Wallet className="h-3.5 w-3.5 text-primary" /> Dining budget
          </span>
          <span className="tabular-nums text-navy-foreground/60">78%</span>
        </span>
        <span className="mt-3 h-2 overflow-hidden rounded-full bg-navy-foreground/10">
          <span className="block h-full w-[78%] rounded-full bg-primary" />
        </span>
        <span className="mt-2 text-[11px] text-navy-foreground/55">₹3,900 of ₹5,000</span>
      </div>
    ),
  },
  {
    id: "sticky",
    source: "Sticky note",
    left: 0,
    top: (CARD_H + 20) * 2,
    scatter: { x: -250, y: 110, rotate: 10 },
    sourceClass: "bg-[oklch(0.9_0.07_95)] text-[oklch(0.3_0.05_80)]",
    sourceFace: (
      <div className="flex h-full items-center justify-center p-3.5 text-center text-base font-semibold italic">
        pay electricity bill!!
      </div>
    ),
    clarioFace: (
      <div className="flex h-full items-center gap-3 p-4">
        <Circle className="h-5 w-5 shrink-0 text-navy-foreground/40" />
        <span>
          <span className="block text-sm font-medium">Pay electricity bill</span>
          <span className="block text-[11px] text-navy-foreground/55">Today · 12:30 · High</span>
        </span>
      </div>
    ),
  },
  {
    id: "calendar",
    source: "Calendar",
    left: CARD_W + 20,
    top: (CARD_H + 20) * 2,
    scatter: { x: 270, y: 100, rotate: -6 },
    sourceClass: "bg-white text-[oklch(0.3_0.02_280)]",
    sourceFace: (
      <div className="flex h-full flex-col">
        <span className="bg-[oklch(0.6_0.18_25)] px-3.5 py-1.5 text-[11px] font-semibold text-white">
          THURSDAY 17
        </span>
        <span className="flex flex-1 items-center px-3.5 text-[12px]">21:00 — plan tomorrow</span>
      </div>
    ),
    clarioFace: (
      <div className="flex h-full items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <CalendarDays className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-medium">Plan tomorrow</span>
          <span className="block text-[11px] text-navy-foreground/55">Thu 17 · 21:00</span>
        </span>
      </div>
    ),
  },
];

const STAGE_W = CARD_W * 2 + 20;
const STAGE_H = CARD_H * 3 + 40;

function ClarioRow({
  icon,
  title,
  meta,
  value,
  positive = false,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-3 p-4">
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            positive ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
          )}
        >
          {icon}
        </span>
        <span>
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-[11px] text-navy-foreground/55">{meta}</span>
        </span>
      </span>
      <span
        className={cn("font-display text-lg font-bold tabular-nums", positive && "text-success")}
      >
        {value}
      </span>
    </div>
  );
}

/** Smaller scatter distance on phones so the pieces stay on screen. */
function useScatterSpread() {
  const [spread, setSpread] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setSpread(mq.matches ? 0.5 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return spread;
}

function FragmentCard({
  f,
  progress,
  spread,
}: {
  f: Fragment;
  progress: MotionValue<number>;
  spread: number;
}) {
  // 0.08 → 0.55: fly in. 0.4 → 0.58: transform from the original look into a Clario card.
  const x = useTransform(progress, [0.08, 0.55], [f.scatter.x * spread, 0]);
  const y = useTransform(progress, [0.08, 0.55], [f.scatter.y * spread, 0]);
  const rotate = useTransform(progress, [0.08, 0.55], [f.scatter.rotate, 0]);
  const sourceOpacity = useTransform(progress, [0.4, 0.58], [1, 0]);
  const clarioOpacity = useTransform(progress, [0.4, 0.58], [0, 1]);
  const labelOpacity = useTransform(progress, [0, 0.3, 0.45], [1, 1, 0]);

  return (
    <motion.div
      style={{ x, y, rotate, left: f.left, top: f.top, width: CARD_W, height: CARD_H }}
      className="absolute will-change-transform"
    >
      <motion.span
        style={{ opacity: labelOpacity }}
        className="absolute -top-6 left-1 font-mono text-[11px] uppercase tracking-[0.18em] text-navy-foreground/55"
      >
        {f.source}
      </motion.span>
      <motion.div
        style={{ opacity: sourceOpacity }}
        className={cn("absolute inset-0 overflow-hidden rounded-2xl shadow-xl", f.sourceClass)}
      >
        {f.sourceFace}
      </motion.div>
      <motion.div
        style={{ opacity: clarioOpacity }}
        className="absolute inset-0 overflow-hidden rounded-2xl border border-navy-foreground/10 bg-[oklch(0.25_0.04_282)] text-navy-foreground shadow-lg"
      >
        {f.clarioFace}
      </motion.div>
    </motion.div>
  );
}

export function ScatteredToSorted() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // With reduced motion, everything sits in its final, sorted state.
  const progress = useTransform(scrollYProgress, (v) => (reduce ? 1 : v));
  const spread = useScatterSpread();

  const headingA = useTransform(progress, [0, 0.35, 0.48], [1, 1, 0]);
  const headingAY = useTransform(progress, [0.35, 0.48], [0, -20]);
  const headingB = useTransform(progress, [0.5, 0.64], [0, 1]);
  const headingBY = useTransform(progress, [0.5, 0.64], [20, 0]);
  const frameOpacity = useTransform(progress, [0.55, 0.72], [0, 1]);
  const frameScale = useTransform(progress, [0.55, 0.72], [0.96, 1]);

  return (
    <section
      id="story"
      ref={sectionRef}
      aria-labelledby="story-heading"
      className={cn(
        "relative bg-navy text-navy-foreground",
        reduce ? "py-24" : "h-[200vh] lg:h-[240vh]",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-8 overflow-hidden px-5",
          !reduce && "sticky top-0 h-[100svh] min-h-[620px]",
        )}
      >
        <div className="relative z-10 grid text-center">
          <motion.div
            style={{ opacity: headingA, y: headingAY }}
            className="will-change-transform [grid-area:1/1]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              01 · From noise to clarity
            </p>
            <h2
              id="story-heading"
              className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl"
            >
              Everything scattered.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-navy-foreground/65 sm:text-base">
              Receipts, bank messages, spreadsheets, notes. Your money and your day live in a dozen
              places.
            </p>
          </motion.div>
          <motion.div
            style={{ opacity: headingB, y: headingBY }}
            className="will-change-transform [grid-area:1/1]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              One Clario view
            </p>
            <p className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Now everything sorted.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm text-navy-foreground/65 sm:text-base">
              Clario turns the pieces into one calm view of your money and your day.
            </p>
          </motion.div>
        </div>

        {/* Stage: fixed-size layout, scaled to fit smaller screens. */}
        <div className="relative h-[250px] w-full min-[420px]:h-[290px] sm:h-[340px] lg:h-[400px]">
          <div
            className="absolute left-1/2 top-1/2 origin-center scale-[0.6] min-[420px]:scale-[0.7] sm:scale-[0.85] lg:scale-100"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              marginLeft: -STAGE_W / 2,
              marginTop: -STAGE_H / 2,
            }}
          >
            <motion.div
              aria-hidden="true"
              style={{ opacity: frameOpacity, scale: frameScale }}
              className="absolute -inset-5 rounded-[2rem] will-change-transform border border-navy-foreground/10 bg-navy-foreground/[0.03] shadow-cinematic"
            />
            <div aria-hidden="true">
              {FRAGMENTS.map((f) => (
                <FragmentCard key={f.id} f={f} progress={progress} spread={spread} />
              ))}
            </div>
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-navy-foreground/45">
          Illustrative sample data
        </p>
      </div>
    </section>
  );
}
