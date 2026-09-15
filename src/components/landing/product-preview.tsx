import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Sparkles, TrendingUp, Wallet } from "lucide-react";
import lhanaInsight from "@/assets/lhana-insight.png";
import { sampleBudgets, sampleSnapshot, sampleTransactions } from "./sample-data";
import { cn } from "@/lib/utils";

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-navy-foreground/10 bg-landing-surface text-navy-foreground shadow-cinematic",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-6",
      )}
      aria-label="Illustrative Clario dashboard using sample data"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_34%)]"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between border-b border-navy-foreground/10 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-navy-foreground/45">
            Sample dashboard
          </p>
          <p className="mt-1 font-display text-sm font-semibold sm:text-base">Good to see you.</p>
        </div>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
          {sampleSnapshot.month}
        </span>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-xl border border-navy-foreground/10 bg-navy-foreground/[0.045] p-4">
          <p className="text-[10px] uppercase tracking-widest text-navy-foreground/45">
            Money pulse
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums sm:text-4xl">
            {sampleSnapshot.balance}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <PreviewMetric label="Income" value={sampleSnapshot.income} icon={TrendingUp} />
            <PreviewMetric label="Spent" value={sampleSnapshot.spent} icon={Wallet} />
          </div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-2">
            <img
              src={lhanaInsight}
              alt=""
              className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/30"
            />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary">Lhana briefing</p>
              <p className="mt-0.5 text-xs font-medium">Your month, clearly.</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-navy-foreground/70">
            Dining is 18% lower this week. Keep that pace and your monthly budget stays on track.
          </p>
        </div>
      </div>

      {!compact && (
        <div className="relative mt-3 grid gap-3 sm:grid-cols-[1fr_.8fr]">
          <div className="rounded-xl border border-navy-foreground/10 bg-navy-foreground/[0.035] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-navy-foreground/45">
                Budget health
              </p>
              <span className="text-[10px] text-primary">On track</span>
            </div>
            <div className="mt-3 space-y-3">
              {sampleBudgets.map((budget, index) => (
                <div key={budget.label}>
                  <div className="mb-1 flex justify-between text-[10px] text-navy-foreground/55">
                    <span>{budget.label}</span>
                    <span>{budget.percent}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-navy-foreground/10">
                    <motion.div
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: budget.percent / 100 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                      className="h-full origin-left rounded-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-navy-foreground/10 bg-navy-foreground/[0.035] p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-navy-foreground/45">
              <CalendarCheck className="h-3.5 w-3.5" /> Recent activity
            </div>
            <div className="mt-2 divide-y divide-navy-foreground/10">
              {sampleTransactions.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 text-xs">
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="text-[10px] text-navy-foreground/40">{item.detail}</span>
                  </span>
                  <span className="tabular-nums text-navy-foreground/75">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div
        className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1 text-[9px] uppercase tracking-widest text-navy-foreground/25"
        aria-hidden="true"
      >
        <Sparkles className="h-3 w-3" /> Illustrative sample
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-lg border border-navy-foreground/10 bg-navy-foreground/[0.04] p-2.5">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-navy-foreground/40">
        <Icon className="h-3 w-3 text-primary" />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
