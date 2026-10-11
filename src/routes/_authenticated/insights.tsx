import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCcw, TrendingUp, PiggyBank, Lightbulb, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/app-store";
import { useCurrency } from "@/components/currency-provider";
import { generateInsights, quickTip, type Insights } from "@/lib/insights.functions";
import { useLanguage } from "@/components/language-provider";
import { LhanaAvatar } from "@/components/lhana";

function WhyAskLhana({ question }: { question: string }) {
  const { t } = useLanguage();
  return (
    <Link
      to="/lhana"
      search={{ q: question }}
      className="mt-3 inline-flex items-center gap-2 rounded-full border border-lhana/30 bg-lhana-soft px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-lhana/60"
    >
      <LhanaAvatar size={20} />
      {t("lhana.why")}
    </Link>
  );
}

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — Clario" },
      { name: "description", content: "AI-powered insights into your money." },
    ],
  }),
  component: InsightsPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

function InsightsPage() {
  const { t } = useLanguage();
  const { language } = useLanguage();
  const { selectedMonth } = useAppStore();
  const { currency, rate } = useCurrency();
  const genFn = useServerFn(generateInsights);
  const tipFn = useServerFn(quickTip);
  const [started, setStarted] = useState(false);

  // Keyed on the selected month, so changing the global dropdown refetches
  // insights for that month instead of showing stale data.
  const generate = useQuery({
    queryKey: ["insights", currency, rate, selectedMonth, language],
    queryFn: () => genFn({ data: { currency, rate, month: selectedMonth, language } }),
    enabled: started,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const tip = useMutation({
    mutationFn: () => tipFn({ data: { language } }),
  });

  const insights = generate.data as Insights | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("insights.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-lhana/25 bg-gradient-to-br from-lhana-soft to-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <LhanaAvatar size={40} pose="insight" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("insights.quickTip")}
              </p>
              {tip.isPending ? (
                <Skeleton className="mt-2 h-4 w-64" />
              ) : (
                <p className="mt-1 text-sm font-medium">
                  {tip.data?.tip ?? "Tap refresh for a quick, personalized nudge from Clario."}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => tip.mutate()} disabled={tip.isPending}>
            <RefreshCcw className={cn("mr-1 h-3 w-3", tip.isPending && "animate-spin")} />
            {t("insights.refresh")}
          </Button>
        </div>
      </div>

      {!insights && !generate.isFetching && !generate.isError && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-lhana/30 bg-lhana-soft/40 p-10 text-center">
          <LhanaAvatar size={72} pose="welcome" />
          <p className="font-display text-lg">{t("insights.generateTitle")}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t("insights.generateHint")}</p>
          <Button
            onClick={() => (started ? generate.refetch() : setStarted(true))}
            className="mt-2"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" /> {t("insights.generate")}
          </Button>
        </div>
      )}

      {generate.isFetching && <InsightsSkeleton />}

      {generate.isError && !generate.isFetching && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">Couldn't generate insights.</p>
          <p className="mt-1 text-muted-foreground">Give it another try in a moment.</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => generate.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {insights && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => generate.refetch()}>
              <RefreshCcw className="mr-1 h-3 w-3" /> Regenerate
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InsightCard
              icon={Wallet}
              title={new Date(
                Number(selectedMonth.slice(0, 4)),
                Number(selectedMonth.slice(5, 7)) - 1,
                1,
              ).toLocaleString(undefined, { month: "long", year: "numeric" })}
            >
              <p className="text-sm leading-relaxed">{insights.thisMonth}</p>
              <WhyAskLhana question="Explain my month in simple words. What matters most?" />
            </InsightCard>

            <InsightCard icon={TrendingUp} title="Where your money went">
              {insights.whereMoneyWent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses yet this month.</p>
              ) : (
                <ul className="space-y-2">
                  {insights.whereMoneyWent.map((w) => (
                    <li key={w.category} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{w.category}</p>
                        <p className="text-xs text-muted-foreground">{w.note}</p>
                      </div>
                      <span className="tabular-nums text-sm font-semibold text-primary">
                        {w.pct}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </InsightCard>

            <InsightCard icon={PiggyBank} title="Budget health">
              {insights.budgetHealth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No budgets set yet.</p>
              ) : (
                <ul className="space-y-2">
                  {insights.budgetHealth.map((b) => (
                    <li key={b.category} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{b.category}</p>
                        <p className="text-xs text-muted-foreground">{b.note}</p>
                      </div>
                      <StatusPill status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
              <WhyAskLhana question="How is my budget health and what should I do about it?" />
            </InsightCard>

            <InsightCard icon={Lightbulb} title="Smart tips">
              <ul className="space-y-2">
                {insights.tips.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </InsightCard>
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: "on_track" | "warning" | "over" }) {
  const styles = {
    on_track: "bg-success/10 text-success",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    over: "bg-destructive/10 text-destructive",
  } as const;
  const label = { on_track: "On track", warning: "Warning", over: "Over" }[status];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[status],
      )}
    >
      {label}
    </span>
  );
}

function InsightsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-3/5" />
        </div>
      ))}
    </div>
  );
}
