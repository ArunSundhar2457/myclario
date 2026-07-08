import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthBounds(ym?: string): { first: string; nextFirst: string } {
  const now = new Date();
  const [y, m] = ym
    ? ym.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const first = new Date(y, m - 1, 1);
  const next = new Date(y, m, 1);
  return { first: iso(first), nextFirst: iso(next) };
}

export const getSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ range: z.enum(["month", "all"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const q = (table: "income" | "expenses") => {
      let qb = context.supabase.from(table).select("amount");
      if (data.range === "month") {
        const { first, nextFirst } = monthBounds();
        qb = qb.gte("occurred_on", first).lt("occurred_on", nextFirst);
      }
      return qb;
    };
    const [inc, exp] = await Promise.all([q("income"), q("expenses")]);
    if (inc.error) throw inc.error;
    if (exp.error) throw exp.error;
    const income = (inc.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const spent = (exp.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return { income, spent, balance: income - spent };
  });

export const getSpendingTrend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const startIso = iso(start);
    const endIso = iso(end);

    const [inc, exp] = await Promise.all([
      context.supabase
        .from("income")
        .select("amount, occurred_on")
        .gte("occurred_on", startIso)
        .lte("occurred_on", endIso),
      context.supabase
        .from("expenses")
        .select("amount, occurred_on")
        .gte("occurred_on", startIso)
        .lte("occurred_on", endIso),
    ]);
    if (inc.error) throw inc.error;
    if (exp.error) throw exp.error;

    const byDay: Record<string, { income: number; spent: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay[iso(d)] = { income: 0, spent: 0 };
    }
    for (const r of inc.data ?? []) {
      const k = r.occurred_on;
      if (byDay[k]) byDay[k].income += Number(r.amount);
    }
    for (const r of exp.data ?? []) {
      const k = r.occurred_on;
      if (byDay[k]) byDay[k].spent += Number(r.amount);
    }
    return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
  });

export const getCategoryBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { first, nextFirst } = monthBounds(data.month);
    const { data: rows, error } = await context.supabase
      .from("expenses")
      .select("amount, category")
      .gte("occurred_on", first)
      .lt("occurred_on", nextFirst);
    if (error) throw error;
    const totals: Record<string, number> = {};
    for (const r of rows ?? []) {
      totals[r.category] = (totals[r.category] ?? 0) + Number(r.amount);
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  });

export const getBudgetAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { first, nextFirst } = monthBounds();
    const [budgets, exp] = await Promise.all([
      context.supabase
        .from("budgets")
        .select("id, category, monthly_limit")
        .eq("month", first),
      context.supabase
        .from("expenses")
        .select("category, amount")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst),
    ]);
    if (budgets.error) throw budgets.error;
    if (exp.error) throw exp.error;
    const spentByCat: Record<string, number> = {};
    for (const r of exp.data ?? []) {
      spentByCat[r.category] = (spentByCat[r.category] ?? 0) + Number(r.amount);
    }
    return (budgets.data ?? [])
      .map((b) => {
        const spent = spentByCat[b.category] ?? 0;
        const limit = Number(b.monthly_limit);
        const percent_used = limit > 0 ? (spent / limit) * 100 : 0;
        return {
          id: b.id,
          category: b.category,
          monthly_limit: limit,
          spent,
          percent_used,
        };
      })
      .filter((b) => b.percent_used >= 80)
      .sort((a, b) => b.percent_used - a.percent_used);
  });

export const getTodayTodos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = iso(new Date());
    const { data, error, count } = await context.supabase
      .from("todos")
      .select("id, title, notes, is_completed, priority, due_date, due_time", { count: "exact" })
      .eq("due_date", today)
      .order("is_completed", { ascending: true })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(5);
    if (error) throw error;
    return { rows: data ?? [], total: count ?? 0 };
  });
