import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const priority = z.enum(["low", "medium", "high"]);

function monthBounds(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const next = new Date(year, month, 1);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
      2,
      "0",
    )}`;
  return { first: iso(first), nextFirst: iso(next) };
}

export const listTodosForMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { first, nextFirst } = monthBounds(data.year, data.month);
    const { data: rows, error } = await context.supabase
      .from("todos")
      .select("id, due_date, is_completed")
      .gte("due_date", first)
      .lt("due_date", nextFirst);
    if (error) throw error;
    return rows ?? [];
  });

export const listTodosForDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ date: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("todos")
      .select("id, title, notes, is_completed, priority, due_date, due_time")
      .eq("due_date", data.date)
      .order("is_completed", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return rows ?? [];
  });

export const createTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        notes: z.string().max(2000).optional().nullable(),
        due_date: z.string(),
        due_time: z.string().optional().nullable(),
        priority,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("todos")
      .insert({
        user_id: context.userId,
        title: data.title,
        notes: data.notes ?? null,
        due_date: data.due_date,
        due_time: data.due_time || null,
        priority: data.priority,
        is_completed: false,
      })
      .select("id, title, notes, is_completed, priority, due_date, due_time")
      .single();
    if (error) throw error;
    return row;
  });

export const togglePlannerTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), is_completed: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("todos")
      .update({ is_completed: data.is_completed })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const updateTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200),
        notes: z.string().max(2000).optional().nullable(),
        due_date: z.string(),
        due_time: z.string().optional().nullable(),
        priority,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("todos")
      .update({
        title: data.title,
        notes: data.notes ?? null,
        due_date: data.due_date,
        due_time: data.due_time || null,
        priority: data.priority,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("todos").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
