import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./categories";
import { MONTH_REGEX, monthBounds } from "./month";

const monthSchema = z.string().regex(MONTH_REGEX);

export const listBudgets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: monthSchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { first, nextFirst, monthDate } = monthBounds(data.month);
    const { data: budgets, error } = await context.supabase
      .from("budgets")
      .select("id, category, monthly_limit, month")
      .eq("month", monthDate)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const { data: exp, error: expErr } = await context.supabase
      .from("expenses")
      .select("category, amount")
      .gte("occurred_on", first)
      .lt("occurred_on", nextFirst);
    if (expErr) throw expErr;
    const spentByCat: Record<string, number> = {};
    for (const e of exp ?? []) {
      spentByCat[e.category] = (spentByCat[e.category] ?? 0) + Number(e.amount);
    }
    return (budgets ?? []).map((b) => ({
      id: b.id,
      category: b.category,
      monthly_limit: Number(b.monthly_limit),
      month: b.month,
      spent: spentByCat[b.category] ?? 0,
    }));
  });

export const listAvailableCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: monthSchema.optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { monthDate } = monthBounds(data.month);
    const { data: rows, error } = await context.supabase
      .from("budgets")
      .select("category")
      .eq("month", monthDate);
    if (error) throw error;
    const taken = new Set((rows ?? []).map((r) => r.category));
    return EXPENSE_CATEGORIES.filter((c) => !taken.has(c));
  });

export const createBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        category: z.enum(EXPENSE_CATEGORIES),
        monthly_limit: z.number().positive(),
        month: monthSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { monthDate } = monthBounds(data.month);
    const { data: row, error } = await context.supabase
      .from("budgets")
      .insert({
        user_id: context.userId,
        category: data.category,
        monthly_limit: data.monthly_limit,
        month: monthDate,
      })
      .select("id, category, monthly_limit, month")
      .single();
    if (error) throw error;
    return { ...row, monthly_limit: Number(row.monthly_limit), spent: 0 };
  });

export const updateBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        monthly_limit: z.number().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("budgets")
      .update({ monthly_limit: data.monthly_limit })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
