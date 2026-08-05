import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Filter,
  Calendar as CalendarIcon,
  Search,
  Download,
  X,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAppStore, formatMoney, type Currency } from "@/lib/app-store";
import { monthDayRange } from "@/lib/month";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  categoryIcon,
} from "@/lib/categories";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCsv,
} from "@/lib/transactions.functions";

type Kind = "expense" | "income";

const searchSchema = z.object({
  kind: z.enum(["expense", "income"]).catch("expense"),
  page: z.number().int().min(1).catch(1),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Clario" },
      { name: "description", content: "Track your income and expenses." },
    ],
  }),
  validateSearch: searchSchema,
  component: TransactionsPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

const PAGE_SIZE = 10;

function TransactionsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { currency, selectedMonth } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Global month dropdown drives the From/To range, until the user edits it manually.
  const syncedMonthRef = useRef<string | null>(null);
  const manualRangeRef = useRef(false);
  useEffect(() => {
    if (syncedMonthRef.current === selectedMonth) return;
    syncedMonthRef.current = selectedMonth;
    manualRangeRef.current = false;
    const { start, end } = monthDayRange(selectedMonth);
    navigate({ search: { ...search, from: start, to: end, page: 1 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [selectedMonth, navigate]);


  const filters = {
    kind: search.kind,
    page: search.page,
    pageSize: PAGE_SIZE,
    from: search.from,
    to: search.to,
    category: search.category,
    search: search.q,
  };

  const listFn = useServerFn(listTransactions);
  const queryKey = ["transactions", filters] as const;
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => listFn({ data: filters }),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  function setKind(k: Kind) {
    navigate({ search: { ...search, kind: k, page: 1 } });
  }
  function setPage(n: number) {
    navigate({ search: { ...search, page: n } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Log income and expenses to keep an honest picture of your money.
          </p>
        </div>
        <KindToggle value={search.kind} onChange={setKind} />
      </div>

      <FilterBar
        kind={search.kind}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((v) => !v)}
        search={search}
        onChange={(patch) => {
          if ("from" in patch || "to" in patch) manualRangeRef.current = true;
          navigate({ search: { ...search, ...patch, page: 1 } });
        }}

      />

      <TransactionList
        kind={search.kind}
        currency={currency}
        rows={data?.rows ?? []}
        loading={isLoading}
        onEmptyCta={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
        onEdit={(row) => {
          setEditing(row);
          setSheetOpen(true);
        }}
        queryKey={queryKey}
      />

      {(data?.total ?? 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing page {search.page} of {totalPages} · {data?.total ?? 0} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={search.page <= 1}
              onClick={() => setPage(search.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={search.page >= totalPages}
              onClick={() => setPage(search.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ExportCsvButton kind={search.kind} search={search} />

      <Button
        size="icon"
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full shadow-elevated md:bottom-8 md:right-8"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddTransactionSheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setEditing(null);
        }}
        defaultKind={search.kind}
        currency={currency}
        editing={editing}
      />
    </div>
  );
}

function KindToggle({ value, onChange }: { value: Kind; onChange: (k: Kind) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {(["expense", "income"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
            value === k
              ? k === "income"
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {k === "expense" ? "Expenses" : "Income"}
        </button>
      ))}
    </div>
  );
}

function FilterBar({
  kind,
  open,
  onToggle,
  search,
  onChange,
}: {
  kind: Kind;
  open: boolean;
  onToggle: () => void;
  search: { from?: string; to?: string; category?: string; q?: string };
  onChange: (patch: Partial<{ from?: string; to?: string; category?: string; q?: string }>) => void;
}) {
  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const active =
    !!search.from || !!search.to || (search.category && search.category !== "all") || !!search.q;

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-medium text-foreground md:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters {active && <span className="text-primary">·</span>}
        </button>
        <div className="hidden text-sm font-medium md:block">Filters</div>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ from: undefined, to: undefined, category: undefined, q: undefined })
            }
          >
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>
      <div className={cn("mt-3 grid gap-3 md:grid-cols-4", !open && "hidden md:grid")}>
        <DateField
          label="From"
          value={search.from}
          onChange={(v) => onChange({ from: v })}
        />
        <DateField
          label="To"
          value={search.to}
          onChange={(v) => onChange({ to: v })}
        />
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Category</label>
          <Select
            value={search.category ?? "all"}
            onValueChange={(v) => onChange({ category: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q ?? ""}
              onChange={(e) => onChange({ q: e.target.value || undefined })}
              placeholder="Description"
              className="h-9 pl-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined;
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("h-9 w-full justify-start font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMM d, yyyy") : "Any"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) =>
              onChange(d ? format(d, "yyyy-MM-dd") : undefined)
            }
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

type TxRow = {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  occurred_on: string;
  is_recurring: boolean;
  recurrence: string | null;
};

function TransactionList({
  kind,
  currency,
  rows,
  loading,
  onEmptyCta,
  onEdit,
  queryKey,
}: {
  kind: Kind;
  currency: Currency;
  rows: TxRow[];
  loading: boolean;
  onEmptyCta: () => void;
  onEdit: (row: TxRow) => void;
  queryKey: readonly unknown[];
}) {
  const queryClient = useQueryClient();
  const delFn = useServerFn(deleteTransaction);
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { kind, id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<{ rows: TxRow[]; total: number }>(queryKey);
      if (prev) {
        queryClient.setQueryData(queryKey, {
          rows: prev.rows.filter((r) => r.id !== id),
          total: Math.max(0, prev.total - 1),
        });
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-display text-lg">No {kind === "income" ? "income" : "expenses"} yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first entry to start building a picture of your money.
        </p>
        <Button onClick={onEmptyCta} className="mt-2">
          <Plus className="mr-1 h-4 w-4" /> Add {kind}
        </Button>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <TransactionRow
            key={r.id}
            row={r}
            kind={kind}
            currency={currency}
            onDelete={() => del.mutate(r.id)}
            onEdit={() => onEdit(r)}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function TransactionRow({
  row,
  kind,
  currency,
  onDelete,
  onEdit,
}: {
  row: TxRow;
  kind: Kind;
  currency: Currency;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const Icon = categoryIcon(row.category);
  const amountColor = kind === "income" ? "text-success" : "text-destructive";
  const sign = kind === "income" ? "+" : "−";
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.2 }}
      drag="x"
      dragConstraints={{ left: -80, right: 0 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (info.offset.x < -60) onDelete();
      }}
      className="group flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.category}</p>
        {row.description && (
          <p className="truncate text-xs text-muted-foreground">{row.description}</p>
        )}
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold tabular-nums", amountColor)}>
          {sign}
          {formatMoney(row.amount, currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(row.occurred_on + "T00:00:00"), "MMM d")}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="ml-1 hidden rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex"
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="ml-1 hidden rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive md:inline-flex"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.li>
  );
}

function ExportCsvButton({
  kind,
  search,
}: {
  kind: Kind;
  search: { from?: string; to?: string; category?: string; q?: string };
}) {
  const exportFn = useServerFn(exportTransactionsCsv);
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      const { csv } = await exportFn({
        data: { kind, from: search.from, to: search.to, category: search.category, search: search.q },
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      <Download className="mr-2 h-4 w-4" /> Export CSV
    </Button>
  );
}

const formSchema = z.object({
  kind: z.enum(["expense", "income"]),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().max(500).optional(),
  occurred_on: z.string(),
  is_recurring: z.boolean(),
  recurrence: z.enum(["daily", "weekly", "monthly"]).nullable(),
});

function AddTransactionSheet({
  open,
  onOpenChange,
  defaultKind,
  currency,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultKind: Kind;
  currency: Currency;
  editing: TxRow | null;
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!editing;

  // sync when opening
  useMemo(() => {
    if (open) {
      if (editing) {
        setKind(defaultKind);
        setAmount(String(editing.amount));
        setCategory(editing.category);
        setDescription(editing.description ?? "");
        setDate(new Date(editing.occurred_on + "T00:00:00"));
        setRecurring(editing.is_recurring);
        setRecurrence((editing.recurrence as "daily" | "weekly" | "monthly") ?? "monthly");
      } else {
        setKind(defaultKind);
        setAmount("");
        setCategory("");
        setDescription("");
        setDate(new Date());
        setRecurring(false);
        setRecurrence("monthly");
      }
      setErrors({});
    }
  }, [open, defaultKind, editing]);

  const cats = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const queryClient = useQueryClient();
  const createFn = useServerFn(createTransaction);
  const updateFn = useServerFn(updateTransaction);
  const save = useMutation({
    mutationFn: async (vars: { data: z.infer<typeof formSchema> }) => {
      if (isEdit && editing) {
        await updateFn({ data: { ...vars.data, id: editing.id } });
      } else {
        await createFn(vars);
      }
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onSuccess: () => {
      toast.success(isEdit ? "Updated" : "Saved");
      onOpenChange(false);
    },
  });

  function submit() {
    const parsed = formSchema.safeParse({
      kind,
      amount: Number(amount),
      category,
      description: description || undefined,
      occurred_on: format(date, "yyyy-MM-dd"),
      is_recurring: recurring,
      recurrence: recurring ? recurrence : null,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    save.mutate({ data: parsed.data });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit transaction" : "New transaction"}</SheetTitle>
          <SheetDescription>{isEdit ? "Update this entry." : "Log money in or out."}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setCategory("");
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium capitalize",
                  kind === k
                    ? k === "income"
                      ? "bg-success text-white"
                      : "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {k}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1 h-16 border-0 border-b border-border bg-transparent px-0 font-display text-4xl font-semibold tabular-nums shadow-none focus-visible:ring-0"
            />
            <p className="mt-1 text-xs text-muted-foreground">{currency}</p>
            {errors.amount && <InlineError msg={errors.amount} />}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </label>
            <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {cats.map((c) => {
                const Icon = categoryIcon(c);
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {c}
                  </button>
                );
              })}
            </div>
            {errors.category && <InlineError msg={errors.category} />}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note"
              className="mt-1 min-h-[64px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-1 w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium">Recurring</p>
              <p className="text-xs text-muted-foreground">Repeat this transaction.</p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>
          {recurring && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Repeats
              </label>
              <Select
                value={recurrence}
                onValueChange={(v) => setRecurrence(v as typeof recurrence)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={submit}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InlineError({ msg }: { msg: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

// keep useRouter import used in case future revisions need it
void useRouter;
