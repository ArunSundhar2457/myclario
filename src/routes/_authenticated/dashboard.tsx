import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { useCurrency } from "@/components/currency-provider";
import { useLanguage } from "@/components/language-provider";
import type { Currency } from "@/lib/currency";
import { getDailyBriefing } from "@/lib/briefing.functions";
import { toggleTodo } from "@/lib/todos.functions";
import { getProfile } from "@/lib/profile.functions";
import { AddTaskSheet, type TodoRow } from "@/routes/_authenticated/planner";
import {
  getSnapshot,
  getSpendingTrend,
  getCategoryBreakdown,
  getBudgetAlerts,
  getTodayTodos,
} from "@/lib/dashboard.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LhanaAvatar } from "@/components/lhana";

function WhyAskLhana() {
  const { t } = useLanguage();
  return (
    <Link
      to="/lhana"
      search={{ q: "What does my daily briefing mean for me today?" }}
      className="inline-flex items-center gap-2 rounded-full border border-lhana/30 bg-lhana-soft px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-lhana/60"
    >
      <LhanaAvatar size={20} />
      {t("lhana.why")}
    </Link>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Clario" }] }),
  component: Dashboard,
});

type Range = "month" | "all";

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Dashboard() {
  const { selectedMonth } = useAppStore();
  const { currency } = useCurrency();

  // Bento command center: deliberate visual weights, single-column on mobile.
  const cell = "[&>section]:h-full";
  return (
    <div className="space-y-5">
      <Header />
      <div className="grid auto-rows-min gap-4 lg:grid-cols-6">
        <div className={`lg:col-span-4 ${cell}`}>
          <MoneyPulse currency={currency} selectedMonth={selectedMonth} />
        </div>
        <div className={`lg:col-span-2 ${cell}`}>
          <BriefingCard monthLabelText={monthLabel(selectedMonth)} currency={currency} />
        </div>
        <div className={`lg:col-span-4 ${cell}`}>
          <SpendingTrendCard currency={currency} selectedMonth={selectedMonth} />
        </div>
        <div className={`lg:col-span-2 ${cell}`}>
          <CategoryDonutCard selectedMonth={selectedMonth} currency={currency} />
        </div>
        <div className={`lg:col-span-3 ${cell}`}>
          <BudgetAlertStrip currency={currency} selectedMonth={selectedMonth} />
        </div>
        <div className={`lg:col-span-3 ${cell}`}>
          <TasksCard />
        </div>
      </div>
    </div>
  );
}

function Header() {
  const { t } = useLanguage();
  const profileFn = useServerFn(getProfile);
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileFn(),
  });
  const displayName = profile?.display_name;
  const greeting = displayName
    ? t("dashboard.greetingNamed").replace("{name}", displayName)
    : t("dashboard.greeting");

  return (
    <div>
      <p className="text-sm text-muted-foreground">{todayLabel()}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{greeting}</h1>
    </div>
  );
}

type SnapshotCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "destructive" | "accent";
  delay: number;
  loading?: boolean;
};

function SnapshotCard({ label, value, icon: Icon, tone, delay, loading }: SnapshotCardProps) {
  const toneBg: Record<SnapshotCardProps["tone"], string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-[color-mix(in_oklab,var(--success)_18%,var(--background))] text-success",
    destructive:
      "bg-[color-mix(in_oklab,var(--destructive)_15%,var(--background))] text-destructive",
    accent: "bg-[color-mix(in_oklab,var(--accent)_30%,var(--background))] text-accent-foreground",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneBg[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <div className="mt-3 font-display text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
      )}
    </motion.div>
  );
}

/** Dominant bento tile: the month's headline figures, balance first. */
function MoneyPulse({ selectedMonth }: { currency: Currency; selectedMonth: string }) {
  const [range, setRange] = useState<Range>("month");
  const { fmt } = useCurrency();
  const { t } = useLanguage();
  const snapshotFn = useServerFn(getSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["snapshot", range, selectedMonth],
    queryFn: () => snapshotFn({ data: { range, month: selectedMonth } }),
  });

  const income = data?.income ?? 0;
  const spent = data?.spent ?? 0;
  const balance = data?.balance ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-border bg-gradient-to-br from-lhana-soft via-card to-card p-5 shadow-card md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("dashboard.balance")}
          </p>
          <p className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="h-8 w-[130px] rounded-full border-border/60 bg-card/70 text-xs text-muted-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-14 w-56" />
      ) : (
        <p
          className={`mt-3 font-display text-4xl font-bold tabular-nums tracking-tight md:text-5xl ${
            balance >= 0 ? "text-foreground" : "text-destructive"
          }`}
        >
          {fmt(balance)}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SnapshotCard
          label={t("dashboard.income")}
          value={fmt(income)}
          icon={TrendingUp}
          tone="success"
          delay={0.05}
          loading={isLoading}
        />
        <SnapshotCard
          label={t("dashboard.spent")}
          value={fmt(spent)}
          icon={TrendingDown}
          tone="destructive"
          delay={0.1}
          loading={isLoading}
        />
      </div>
    </motion.section>
  );
}

function BudgetAlertStrip({
  currency,
  selectedMonth,
}: {
  currency: Currency;
  selectedMonth: string;
}) {
  const fn = useServerFn(getBudgetAlerts);
  const { fmt } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ["budget-alerts", selectedMonth],
    queryFn: () => fn({ data: { month: selectedMonth } }),
  });

  if (isLoading) return null;
  const alerts = data ?? [];
  if (alerts.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-border bg-card p-5 shadow-card"
      >
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium text-foreground">You're on track this month.</span>
        </div>
      </motion.section>
    );
  }
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Budget alerts</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {alerts.map((b) => (
          <li
            key={b.id}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
          >
            <span className="font-medium text-foreground">{b.category}</span>
            <span className="ml-2 text-destructive">{Math.round(b.percent_used)}% used</span>
            <span className="ml-2 tabular-nums text-muted-foreground">
              {fmt(b.spent)} / {fmt(b.monthly_limit)}
            </span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

function BriefingCard({ monthLabelText, currency }: { monthLabelText: string; currency: string }) {
  const briefingFn = useServerFn(getDailyBriefing);
  const { data, isLoading } = useQuery({
    queryKey: ["daily-briefing", monthLabelText, currency],
    queryFn: () => briefingFn({ data: { monthLabel: monthLabelText, currency } }),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-3xl border border-lhana/25 bg-gradient-to-br from-lhana-soft to-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <LhanaAvatar size={32} />
        <span className="text-xs font-semibold uppercase tracking-wide text-lhana">
          AI Daily Briefing
        </span>
      </div>
      {isLoading || !data ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="font-display text-xl font-semibold tracking-tight">{data.greeting}</p>
          <p className="text-sm leading-relaxed text-foreground/90">{data.insight}</p>
          <p className="text-sm font-medium text-primary">→ {data.nudge}</p>
          <div className="pt-1">
            <WhyAskLhana />
          </div>
        </div>
      )}
    </motion.section>
  );
}

function TasksCard() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const listFn = useServerFn(getTodayTodos);
  const toggleFn = useServerFn(toggleTodo);
  const [editing, setEditing] = useState<TodoRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["today-todos"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; is_completed: boolean }) => toggleFn({ data: vars }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["today-todos"] });
      const prev = queryClient.getQueryData<{
        rows: Array<{ id: string; is_completed: boolean }>;
        total: number;
      }>(["today-todos"]);
      if (prev) {
        queryClient.setQueryData(["today-todos"], {
          ...prev,
          rows: prev.rows.map((r) =>
            r.id === vars.id ? { ...r, is_completed: vars.is_completed } : r,
          ),
        });
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["today-todos"], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["today-todos"] }),
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("dashboard.todaysTasks")}
        </h2>
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
          <Link to="/planner">{t("dashboard.viewAll")}</Link>
        </Button>
      </div>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <Circle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("dashboard.noTasks")}</p>
        </div>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border">
            {rows.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <Checkbox
                  checked={t.is_completed}
                  onCheckedChange={(c) => mutate.mutate({ id: t.id, is_completed: c === true })}
                />
                <span
                  className={
                    t.is_completed
                      ? "flex-1 text-sm text-muted-foreground line-through"
                      : "flex-1 text-sm text-foreground"
                  }
                >
                  {t.title}
                </span>
                {t.is_completed && <CheckCircle2 className="h-4 w-4 text-success" />}
                <button
                  type="button"
                  onClick={() => {
                    setEditing({
                      id: t.id,
                      title: t.title,
                      notes: t.notes ?? null,
                      is_completed: t.is_completed,
                      priority: t.priority,
                      due_date: t.due_date ?? iso,
                      due_time: t.due_time ?? null,
                    });
                    setSheetOpen(true);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Edit task"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {total > rows.length && (
            <p className="mt-3 text-xs text-muted-foreground">
              +{total - rows.length} more due today
            </p>
          )}
        </>
      )}
      <AddTaskSheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setEditing(null);
        }}
        date={iso}
        year={y}
        month={m}
        editing={editing}
      />
    </motion.section>
  );
}

function SpendingTrendCard({
  currency,
  selectedMonth,
}: {
  currency: Currency;
  selectedMonth: string;
}) {
  const fn = useServerFn(getSpendingTrend);
  const { fmt } = useCurrency();
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ["spending-trend", selectedMonth],
    queryFn: () => fn({ data: { month: selectedMonth } }),
  });
  const chartData = data ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t("dashboard.spendingTrend")}
          </h2>
          <p className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Spent
          </span>
        </div>
      </div>
      <div className="mt-4 h-56">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: string) => {
                  const [, m, d] = v.split("-");
                  return `${m}/${d}`;
                }}
                minTickGap={24}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => fmt(v)}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#incomeFill)"
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="var(--destructive)"
                strokeWidth={2}
                fill="url(#spendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.section>
  );
}

const DONUT_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--accent)",
  "var(--destructive)",
  "var(--muted-foreground)",
];

function CategoryDonutCard({
  selectedMonth,
  currency,
}: {
  selectedMonth: string;
  currency: Currency;
}) {
  const fn = useServerFn(getCategoryBreakdown);
  const { fmt } = useCurrency();
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ["category-breakdown", selectedMonth],
    queryFn: () => fn({ data: { month: selectedMonth } }),
  });
  const rows = data ?? [];
  const hasData = rows.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-card"
    >
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {t("dashboard.byCategory")}
      </h2>
      <p className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</p>
      <div className="mt-4 h-56">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hasData ? rows : [{ category: t("dashboard.noDataYet"), total: 1 }]}
                dataKey="total"
                nameKey="category"
                innerRadius={48}
                outerRadius={75}
                stroke="none"
              >
                {(hasData ? rows : [{ category: "empty", total: 1 }]).map((_, i) => (
                  <Cell
                    key={i}
                    fill={hasData ? DONUT_COLORS[i % DONUT_COLORS.length] : "var(--muted)"}
                  />
                ))}
              </Pie>
              {hasData && (
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => fmt(v)}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {!isLoading && !hasData && (
        <p className="text-center text-xs text-muted-foreground">{t("dashboard.noCategoryData")}</p>
      )}
    </motion.section>
  );
}
