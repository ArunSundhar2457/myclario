import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ScrollStage } from "./scroll-stage";

/**
 * Cumulative spending vs. a "usual pace" line. The chart is revealed through a
 * scroll-linked clip rectangle, so it draws forward when scrolling down and
 * rewinds when scrolling up. (Animating pathLength on a non-scaling-stroke path
 * inside preserveAspectRatio="none" renders a gappy dashed line — avoid that.)
 */

const SPEND_PATH =
  "M0 92 C8 90 12 85 18 83 S28 77 34 72 S44 60 50 58 S62 52 68 46 S80 36 86 32 S95 25 100 23";
const DOTS = [
  { x: 0, y: 92 },
  { x: 50, y: 58 },
  { x: 100, y: 23 },
];

function ChartDot({ x, y, reveal }: { x: number; y: number; reveal: MotionValue<number> }) {
  const opacity = useTransform(reveal, [x - 2, x + 1], [0, 1]);
  return (
    <motion.span
      aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%`, opacity, scale: opacity }}
      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
    />
  );
}

function Callout({
  at,
  reveal,
  className,
  children,
}: {
  at: number;
  reveal: MotionValue<number>;
  className: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(reveal, [at - 1, at + 4], [0, 1]);
  const y = useTransform(reveal, [at - 1, at + 4], [8, 0]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity, y }}
      className={`absolute rounded-xl border border-border bg-card px-3 py-2 text-left shadow-elevated ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function TrendChapter() {
  return (
    <ScrollStage
      labelledBy="trend-heading"
      className="bg-background text-foreground"
      track="lg:h-[200vh]"
      stageClassName="px-5 py-24 sm:py-32 lg:py-0"
    >
      {(progress) => <TrendStage progress={progress} />}
    </ScrollStage>
  );
}

function TrendStage({ progress }: { progress: MotionValue<number> }) {
  const reveal = useTransform(progress, [0.08, 0.85], [0, 103]);
  return (
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            04 · The shape of your month
          </p>
          <h2
            id="trend-heading"
            className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl"
          >
            See the trend. Understand the moment.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            A clear spending line, set against your usual pace, turns a list of transactions into
            something you can read at a glance — and act on.
          </p>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-elevated sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Spent in July · Sample
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-4xl">
                ₹36,800
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full bg-primary" /> Your spending
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 border-t border-dashed border-muted-foreground" /> Usual pace
              </span>
            </div>
          </div>

          <div
            role="img"
            aria-label="Sample chart: cumulative spending in July stays below the usual pace, ending 8% under it"
            className="relative mt-10 aspect-[1.6/1] w-full"
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity=".25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
                <clipPath id="trendReveal">
                  <motion.rect x="-2" y="-10" height="120" width={reveal} />
                </clipPath>
              </defs>
              {[25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <g clipPath="url(#trendReveal)">
                <line
                  x1="0"
                  y1="92"
                  x2="100"
                  y2="15"
                  stroke="var(--muted-foreground)"
                  strokeWidth="1.25"
                  strokeDasharray="5 5"
                  vectorEffect="non-scaling-stroke"
                  opacity=".6"
                />
                <path d={`${SPEND_PATH} L100 100 L0 100 Z`} fill="url(#trendFill)" />
                <path
                  d={SPEND_PATH}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>
            {DOTS.map((d) => (
              <ChartDot key={d.x} x={d.x} y={d.y} reveal={reveal} />
            ))}
            <Callout at={50} reveal={reveal} className="left-[50%] top-[58%] ml-3 mt-3">
              <p className="text-[11px] text-muted-foreground">Mid-month</p>
              <p className="text-xs font-semibold">On pace</p>
            </Callout>
            <Callout at={95} reveal={reveal} className="right-0 top-[23%] mt-4">
              <p className="text-[11px] text-muted-foreground">Today</p>
              <p className="text-xs font-semibold text-primary">8% under your usual pace</p>
            </Callout>
          </div>
          <div className="mt-4 flex justify-between text-[11px] text-muted-foreground">
            <span>1 Jul</span>
            <span>8 Jul</span>
            <span>15 Jul</span>
          </div>
        </div>
      </div>
  );
}
