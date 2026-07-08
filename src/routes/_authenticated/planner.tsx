import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  listTodosForMonth,
  listTodosForDay,
  createTodo,
  updateTodo,
  togglePlannerTodo,
  deleteTodo,
} from "@/lib/planner.functions";

type Priority = "low" | "medium" | "high";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Planner — Clario" },
      { name: "description", content: "Plan your day, one task at a time." },
    ],
  }),
  component: PlannerPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PlannerPage() {
  const [selected, setSelected] = useState<Date>(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoRow | null>(null);
  const selectedIso = isoDate(selected);
  const year = selected.getFullYear();
  const month = selected.getMonth() + 1;

  const monthFn = useServerFn(listTodosForMonth);
  const dayFn = useServerFn(listTodosForDay);

  const monthQuery = useQuery({
    queryKey: ["planner-month", year, month],
    queryFn: () => monthFn({ data: { year, month } }),
  });
  const dayQuery = useQuery({
    queryKey: ["planner-day", selectedIso],
    queryFn: () => dayFn({ data: { date: selectedIso } }),
  });

  const daysWithTodos = useMemo(() => {
    const set = new Set<string>();
    for (const t of monthQuery.data ?? []) {
      if (t.due_date) set.add(t.due_date);
    }
    return set;
  }, [monthQuery.data]);

  const dayRows = dayQuery.data ?? [];
  const completedCount = dayRows.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Planner</h1>
          <p className="text-sm text-muted-foreground">
            Plan your day, one task at a time.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSelected(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            modifiers={{
              hasTodos: (d) => daysWithTodos.has(isoDate(d)),
            }}
            modifiersClassNames={{
              hasTodos:
                "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
            className={cn("pointer-events-auto")}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
            <div>
              <p className="font-display text-lg font-semibold">
                {format(selected, "EEEE, MMM d")}
              </p>
              <p className="text-xs text-muted-foreground">
                {dayRows.length} task{dayRows.length === 1 ? "" : "s"} · {completedCount} completed
              </p>
            </div>
          </div>

          {dayQuery.isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : dayRows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="font-display text-lg">Nothing planned yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add your first task for {format(selected, "MMM d")} and set the tone for the day.
              </p>
              <Button onClick={() => setSheetOpen(true)} className="mt-2">
                <Plus className="mr-1 h-4 w-4" /> Add task
              </Button>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {dayRows.map((t) => (
                <TaskRow
                  key={t.id}
                  row={t}
                  selectedIso={selectedIso}
                  year={year}
                  month={month}
                  onEdit={(row) => {
                    setEditingTodo(row);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <Button
        size="icon"
        onClick={() => {
          setEditingTodo(null);
          setSheetOpen(true);
        }}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full shadow-elevated md:bottom-8 md:right-8"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddTaskSheet
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setEditingTodo(null);
        }}
        date={selectedIso}
        year={year}
        month={month}
        editing={editingTodo}
      />
    </div>
  );
}

type TodoRow = {
  id: string;
  title: string;
  notes: string | null;
  is_completed: boolean;
  priority: string;
  due_date: string | null;
  due_time: string | null;
};

const PRIORITY_STYLE: Record<Priority, string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-destructive/10 text-destructive",
};

function TaskRow({
  row,
  selectedIso,
  year,
  month,
  onEdit,
}: {
  row: TodoRow;
  selectedIso: string;
  year: number;
  month: number;
  onEdit: (row: TodoRow) => void;
}) {
  const queryClient = useQueryClient();
  const toggleFn = useServerFn(togglePlannerTodo);
  const delFn = useServerFn(deleteTodo);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["planner-day", selectedIso] });
    queryClient.invalidateQueries({ queryKey: ["planner-month", year, month] });
  };

  const toggle = useMutation({
    mutationFn: (v: boolean) => toggleFn({ data: { id: row.id, is_completed: v } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: () => delFn({ data: { id: row.id } }),
    onSuccess: () => {
      toast.success("Task deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pr = (row.priority as Priority) ?? "medium";
  return (
    <li className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <Checkbox
        checked={row.is_completed}
        onCheckedChange={(v) => toggle.mutate(!!v)}
        aria-label={row.is_completed ? "Mark incomplete" : "Mark complete"}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            row.is_completed && "text-muted-foreground line-through",
          )}
        >
          {row.title}
        </p>
        {row.due_time && (
          <p className="text-xs text-muted-foreground">{row.due_time.slice(0, 5)}</p>
        )}
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
          PRIORITY_STYLE[pr] ?? PRIORITY_STYLE.medium,
        )}
      >
        {pr}
      </span>
      <button
        type="button"
        onClick={() => onEdit(row)}
        className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Edit task"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => del.mutate()}
        className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function AddTaskSheet({
  open,
  onOpenChange,
  date,
  year,
  month,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: string;
  year: number;
  month: number;
  editing: TodoRow | null;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const queryClient = useQueryClient();
  const createFn = useServerFn(createTodo);
  const updateFn = useServerFn(updateTodo);
  const isEdit = !!editing;

  useMemo(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title);
        setNotes(editing.notes ?? "");
        setTime(editing.due_time ? editing.due_time.slice(0, 5) : "");
        setPriority((editing.priority as Priority) ?? "medium");
      } else {
        setTitle("");
        setNotes("");
        setTime("");
        setPriority("medium");
      }
    }
  }, [open, editing]);

  const targetDate = editing?.due_date ?? date;

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit && editing) {
        await updateFn({
          data: {
            id: editing.id,
            title: title.trim(),
            notes: notes.trim() || null,
            due_date: targetDate,
            due_time: time || null,
            priority,
          },
        });
      } else {
        await createFn({
          data: {
            title: title.trim(),
            notes: notes.trim() || null,
            due_date: date,
            due_time: time || null,
            priority,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Task updated" : "Task added");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["planner-day", date] });
      queryClient.invalidateQueries({ queryKey: ["planner-day", targetDate] });
      queryClient.invalidateQueries({ queryKey: ["planner-month", year, month] });
      queryClient.invalidateQueries({ queryKey: ["today-todos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    save.mutate();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl md:max-w-lg md:mx-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit task" : "New task"}</SheetTitle>
          <SheetDescription>For {format(new Date(targetDate + "T00:00:00"), "MMM d, yyyy")}</SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review this week's budget"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
              <div className="inline-flex w-full rounded-md border border-input p-0.5">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                      priority === p
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Save task"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
