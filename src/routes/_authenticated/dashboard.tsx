import { createFileRoute } from "@tanstack/react-router";
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
  PiggyBank,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useAppStore, formatMoney } from "@/lib/app-store";
import { getDailyBriefing } from "@/lib/briefing.functions";
import { listTodayTodos, toggleTodo } from "@/lib/todos.functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Clario" }] }),
  component: Dashboard,
});

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
  const { selectedMonth, currency } = useAppStore();

  return (
    <div className="space-y-6">
      <Header />
      <SnapshotCards currency={currency} />
      <div className="grid gap-5 lg:grid-cols-2">
        <BriefingCard monthLabelText={monthLabel(selectedMonth)} currency={currency} />
        <TasksCard />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <SpendingTrendCard currency={currency} />
        <CategoryDonutCard />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{todayLabel()}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
        Good to see you.
      </h1>
    </div>
  );
}

type SnapshotCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "destructive" | "accent";
  delay: number;
};

function SnapshotCard({ label, value, icon: Icon, tone, delay }: SnapshotCardProps) {
  const toneBg: Record<SnapshotCardProps["tone"], string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-[color-mix(in_oklab,var(--success)_18%,var(--background))] text-success",
    destructive:
      "bg-[color-mix(in_oklab,var(--destructive)_15%,var(--background))] text-destructive",
    accent:
      "bg-[color-mix(in_oklab,var(--accent)_30%,var(--background))] text-accent-foreground",
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
      <div className="mt-3 font-display text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
    </motion.div>
  );
}

function SnapshotCards({ currency }: { currency: "INR" | "USD" | "EUR" | "GBP" }) {
  // Placeholder zeros until Transactions ships
  const items: Array<Omit<SnapshotCardProps, "delay">> = [
    { label: "Income", value: formatMoney(0, currency), icon: TrendingUp, tone: "success" },
    { label: "Spent", value: formatMoney(0, currency), icon: TrendingDown, tone: "destructive" },
    { label: "Saved", value: formatMoney(0, currency), icon: PiggyBank, tone: "primary" },
    { label: "Balance", value: formatMoney(0, currency), icon: Wallet, tone: "accent" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((it, i) => (
        <SnapshotCard key={it.label} {...it} delay={i * 0.05} />
      ))}
    </div>
  );
}

function BriefingCard({
  monthLabelText,
  currency,
}: {
  monthLabelText: string;
  currency: string;
}) {
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
      className="rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-card p-5 shadow-card"
    >
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
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
          <p className="font-display text-xl font-semibold tracking-tight">
            {data.greeting}
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">{data.insight}</p>
          <p className="text-sm font-medium text-primary">→ {data.nudge}</p>
        </div>
      )}
    </motion.section>
  );
}

function TasksCard() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listTodayTodos);
  const toggleFn = useServerFn(toggleTodo);
  const { data, isLoading } = useQuery({
    queryKey: ["today-todos"],
    queryFn: () => listFn(),
  });

  const mutate = useMutation({
    mutationFn: (vars: { id: string; is_completed: boolean }) =>
      toggleFn({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today-todos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Today's tasks
        </h2>
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-xs text-muted-foreground"
        >
          View all
        </Button>
      </div>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <Circle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tasks yet. The Planner ships next.
          </p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {data.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5">
              <Checkbox
                checked={t.is_completed}
                onCheckedChange={(c) =>
                  mutate.mutate({ id: t.id, is_completed: c === true })
                }
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
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}

function SpendingTrendCard({ currency }: { currency: "INR" | "USD" | "EUR" | "GBP" }) {
  // Placeholder series until Transactions ships
  const data = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    spent: 0,
  }));
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2"
    >
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Spending trend
      </h2>
      <p className="text-xs text-muted-foreground">Last 30 days</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => formatMoney(v, currency)}
            />
            <Area
              type="monotone"
              dataKey="spent"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#spendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

function CategoryDonutCard() {
  const data = [{ name: "No data yet", value: 1 }];
  const colors = ["var(--muted)"];
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <h2 className="font-display text-lg font-semibold tracking-tight">
        By category
      </h2>
      <p className="text-xs text-muted-foreground">This month</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={48}
              outerRadius={75}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Add transactions to see your category mix.
      </p>
    </motion.section>
  );
}
