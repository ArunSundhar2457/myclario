import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Plus, Trash2, PiggyBank, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAppStore, formatMoney } from "@/lib/app-store";
import { categoryIcon } from "@/lib/categories";
import {
  listBudgets,
  listAvailableCategories,
  createBudget,
  updateBudget,
  deleteBudget,
} from "@/lib/budgets.functions";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — Clario" },
      { name: "description", content: "Set monthly limits and stay on track." },
    ],
  }),
  component: BudgetsPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

const monthLabel = () =>
  new Date().toLocaleString(undefined, { month: "long", year: "numeric" });

function BudgetsPage() {
  const { currency } = useAppStore();
  const [editing, setEditing] = useState<{ id: string; category: string; monthly_limit: number } | null>(null);
  const listFn = useServerFn(listBudgets);
  const availFn = useServerFn(listAvailableCategories);
  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => listFn(),
  });
  const { data: available } = useQuery({
    queryKey: ["budgets-available"],
    queryFn: () => availFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly limit for each category. Tracks against {monthLabel()}.
        </p>
      </div>

      <CreateBudgetForm
        available={available ?? []}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
      />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              id={b.id}
              category={b.category}
              limit={b.monthly_limit}
              spent={b.spent}
              currency={currency}
              onEdit={() =>
                setEditing({ id: b.id, category: b.category, monthly_limit: b.monthly_limit })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateBudgetForm({
  available,
  editing,
  onCancelEdit,
}: {
  available: string[];
  editing: { id: string; category: string; monthly_limit: number } | null;
  onCancelEdit: () => void;
}) {
  const [category, setCategory] = useState<string>("");
  const [limit, setLimit] = useState<string>("");
  const queryClient = useQueryClient();
  const createFn = useServerFn(createBudget);
  const updateFn = useServerFn(updateBudget);
  const isEdit = !!editing;

  useMemo(() => {
    if (editing) {
      setCategory(editing.category);
      setLimit(String(editing.monthly_limit));
    } else {
      setCategory("");
      setLimit("");
    }
  }, [editing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["budgets-available"] });
    queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
  };

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      toast.success("Budget created");
      setCategory("");
      setLimit("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; monthly_limit: number }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      toast.success("Budget updated");
      onCancelEdit();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    const num = Number(limit);
    if (!(num > 0)) return toast.error("Enter a limit greater than 0");
    if (isEdit && editing) {
      update.mutate({ id: editing.id, monthly_limit: num });
      return;
    }
    if (!category) return toast.error("Pick a category");
    create.mutate({
      data: { category: category as never, monthly_limit: num },
    });
  }

  const pending = create.isPending || update.isPending;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Category</label>
          <Select value={category} onValueChange={setCategory} disabled={isEdit}>
            <SelectTrigger>
              <SelectValue placeholder={available.length ? "Choose…" : "All categories have budgets"} />
            </SelectTrigger>
            <SelectContent>
              {isEdit && editing ? (
                <SelectItem value={editing.category}>{editing.category}</SelectItem>
              ) : (
                available.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Monthly limit</label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={submit} disabled={pending || (!isEdit && available.length === 0)}>
            {isEdit ? (
              <>
                <Pencil className="mr-1 h-4 w-4" /> Update
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" /> Create
              </>
            )}
          </Button>
          {isEdit && (
            <Button variant="ghost" onClick={onCancelEdit} disabled={pending}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <PiggyBank className="h-8 w-8 text-muted-foreground" />
      <p className="font-display text-lg">No budgets yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pick a category above and set a monthly limit to start tracking.
      </p>
    </div>
  );
}

function BudgetCard({
  id,
  category,
  limit,
  spent,
  currency,
  onEdit,
}: {
  id: string;
  category: string;
  limit: number;
  spent: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  onEdit: () => void;
}) {
  const Icon = categoryIcon(category);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const clamped = Math.min(100, pct);
  const remaining = Math.max(0, limit - spent);

  const status: { label: string; tone: "success" | "warn" | "danger" } =
    pct > 100
      ? { label: "Over Budget", tone: "danger" }
      : pct >= 80
        ? { label: "Warning", tone: "warn" }
        : { label: "On Track", tone: "success" };

  const barColor =
    status.tone === "danger"
      ? "bg-destructive"
      : status.tone === "warn"
        ? "bg-[color:var(--warning,oklch(0.78_0.16_75))]"
        : "bg-primary";

  const badgeClass =
    status.tone === "danger"
      ? "bg-[color-mix(in_oklab,var(--destructive)_15%,var(--background))] text-destructive"
      : status.tone === "warn"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
        : "bg-[color-mix(in_oklab,var(--success)_18%,var(--background))] text-success";

  const queryClient = useQueryClient();
  const delFn = useServerFn(deleteBudget);
  const del = useMutation({
    mutationFn: () => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Budget removed");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgets-available"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">{category}</p>
            <p className="text-xs text-muted-foreground">{monthLabel()}</p>
          </div>
        </div>
        <Badge className={cn("border-0", badgeClass)}>{status.label}</Badge>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <span className="text-muted-foreground">
          Spent <span className="font-semibold tabular-nums text-foreground">{formatMoney(spent, currency)}</span>
        </span>
        <span className="text-muted-foreground">
          Remaining <span className="font-semibold tabular-nums text-foreground">{formatMoney(remaining, currency)}</span>
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        of {formatMoney(limit, currency)} · {Math.round(pct)}%
      </p>

      <div className="mt-4 flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-4 w-4" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => del.mutate()} disabled={del.isPending}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </div>
    </motion.div>
  );
}
