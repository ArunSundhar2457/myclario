import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listTodayTodos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("todos")
      .select("id, title, is_completed, priority, due_date, due_time")
      .or(`due_date.is.null,due_date.lte.${today}`)
      .order("is_completed", { ascending: true })
      .order("priority", { ascending: false })
      .limit(5);
    if (error) throw error;
    return data ?? [];
  });

export const toggleTodo = createServerFn({ method: "POST" })
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
