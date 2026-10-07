import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MONTH_REGEX, isoDate, monthBounds, monthDayRange } from "./month";

const iso = isoDate;
const monthSchema = z.string().regex(MONTH_REGEX);

export const getSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ range: z.enum(["month", "all"]), month: monthSchema.optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const args =
      data.range === "month"
        ? (() => {
            const { first, nextFirst } = monthBounds(data.month);
            return { p_from: first, p_to: nextFirst };
          })()
        : {};
    const { data: rows, error } = await context.supabase.rpc("get_totals", args);
    if (error) throw error;
    const income = Number(rows?.[0]?.income ?? 0);
    const spent = Number(rows?.[0]?.spent ?? 0);
    return { income, spent, balance: income - spent };
  });

export const getSpendingTrend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: monthSchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { start: startIso, end: endIso, days } = monthDayRange(data.month);
    const start = new Date(
      Number(startIso.slice(0, 4)),
      Number(startIso.slice(5, 7)) - 1,
      Number(startIso.slice(8, 10)),
    );

    // End is inclusive in monthDayRange; the DB function wants an exclusive upper bound.
    const endExclusive = new Date(
      Number(endIso.slice(0, 4)),
      Number(endIso.slice(5, 7)) - 1,
      Number(endIso.slice(8, 10)) + 1,
    );
    const { data: dayRows, error } = await context.supabase.rpc("get_daily_totals", {
      p_from: startIso,
      p_to: iso(endExclusive),
    });
    if (error) throw error;

    const byDay: Record<string, { income: number; spent: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay[iso(d)] = { income: 0, spent: 0 };
    }
    for (const r of dayRows ?? []) {
      const slot = byDay[r.day];
      if (slot) {
        slot.income += Number(r.income);
        slot.spent += Number(r.spent);
      }
    }
    return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
  });

export const getCategoryBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: monthSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { first, nextFirst } = monthBounds(data.month);
    const { data: rows, error } = await context.supabase.rpc("get_expense_category_totals", {
      p_from: first,
      p_to: nextFirst,
    });
    if (error) throw error;
    const totals: Record<string, number> = {};
    for (const r of rows ?? []) {
      totals[r.category] = Number(r.total);
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  });

export const getBudgetAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: monthSchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { first, nextFirst } = monthBounds(data.month);
    const [budgets, exp] = await Promise.all([
      context.supabase.from("budgets").select("id, category, monthly_limit").eq("month", first),
      context.supabase.rpc("get_expense_category_totals", { p_from: first, p_to: nextFirst }),
    ]);
    if (budgets.error) throw budgets.error;
    if (exp.error) throw exp.error;
    const spentByCat: Record<string, number> = {};
    for (const r of exp.data ?? []) {
      spentByCat[r.category] = Number(r.total);
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
