import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { fetchAllRows } from "./paginate";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";

const kindSchema = z.enum(["income", "expense"]);
const recurrenceSchema = z.enum(["daily", "weekly", "monthly"]).nullable().optional();

function tableFor(kind: "income" | "expense"): "expenses" | "income" {
  return kind === "income" ? "income" : "expenses";
}

const listSchema = z.object({
  kind: kindSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  from: z.string().optional(),
  to: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const listTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listSchema.parse(d))
  .handler(async ({ data, context }) => {
    const table = tableFor(data.kind);
    let q = context.supabase
      .from(table)
      .select("id, amount, category, description, occurred_on, is_recurring, recurrence", {
        count: "exact",
      })
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (data.from) q = q.gte("occurred_on", data.from);
    if (data.to) q = q.lte("occurred_on", data.to);
    if (data.category && data.category !== "all") q = q.eq("category", data.category);
    if (data.search) q = q.ilike("description", `%${data.search}%`);

    const fromIdx = (data.page - 1) * data.pageSize;
    const toIdx = fromIdx + data.pageSize - 1;
    const { data: rows, error, count } = await q.range(fromIdx, toIdx);
    if (error) throw error;
    return {
      rows: (rows ?? []).map((r) => ({ ...r, amount: Number(r.amount) })),
      total: count ?? 0,
    };
  });

const createSchema = z.object({
  kind: kindSchema,
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_recurring: z.boolean().default(false),
  recurrence: recurrenceSchema,
});

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const parsed = createSchema.parse(d);
    const allowed = parsed.kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(allowed as readonly string[]).includes(parsed.category)) {
      throw new Error("Invalid category");
    }
    if (parsed.is_recurring && !parsed.recurrence) {
      throw new Error("Recurrence required for recurring transactions");
    }
    return parsed;
  })
  .handler(async ({ data, context }) => {
    const table = tableFor(data.kind);
    const { data: row, error } = await context.supabase
      .from(table)
      .insert({
        user_id: context.userId,
        amount: data.amount,
        category: data.category,
        description: data.description ?? null,
        occurred_on: data.occurred_on,
        is_recurring: data.is_recurring,
        recurrence: data.is_recurring ? (data.recurrence ?? null) : null,
      })
      .select("id, amount, category, description, occurred_on, is_recurring, recurrence")
      .single();
    if (error) throw error;
    return { ...row, amount: Number(row.amount) };
  });

const updateSchema = z.object({
  kind: kindSchema,
  id: z.string().uuid(),
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().max(500).optional().nullable(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_recurring: z.boolean().default(false),
  recurrence: recurrenceSchema,
});

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const parsed = updateSchema.parse(d);
    if (parsed.is_recurring && !parsed.recurrence) {
      throw new Error("Recurrence required for recurring transactions");
    }
    return parsed;
  })
  .handler(async ({ data, context }) => {
    const table = tableFor(data.kind);
    const { error } = await context.supabase
      .from(table)
      .update({
        amount: data.amount,
        category: data.category,
        description: data.description ?? null,
        occurred_on: data.occurred_on,
        is_recurring: data.is_recurring,
        recurrence: data.is_recurring ? (data.recurrence ?? null) : null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ kind: kindSchema, id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const table = tableFor(data.kind);
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const exportTransactionsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        kind: kindSchema,
        from: z.string().optional(),
        to: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const table = tableFor(data.kind);
    // Supabase caps a single request at 1,000 rows, so read the export in pages.
    // The id tie-break keeps the order stable between pages.
    const rows = await fetchAllRows((from, to) => {
      let q = context.supabase
        .from(table)
        .select("occurred_on, category, description, amount, is_recurring, recurrence")
        .order("occurred_on", { ascending: false })
        .order("id", { ascending: true });
      if (data.from) q = q.gte("occurred_on", data.from);
      if (data.to) q = q.lte("occurred_on", data.to);
      if (data.category && data.category !== "all") q = q.eq("category", data.category);
      if (data.search) q = q.ilike("description", `%${data.search}%`);
      return q.range(from, to);
    });
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Date", "Category", "Description", "Amount", "Recurring", "Recurrence"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.occurred_on,
          r.category,
          r.description ?? "",
          r.amount,
          r.is_recurring,
          r.recurrence ?? "",
        ]
          .map(esc)
          .join(","),
      );
    }
    return { csv: lines.join("\n") };
  });
