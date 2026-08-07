import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, currency, language, consent_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return (
      data ?? {
        id: context.userId,
        display_name: null,
        currency: "INR",
        language: "en",
        consent_at: null,
      }
    );
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(80).nullable().optional(),
        currency: z.enum(["INR", "USD", "EUR", "GBP"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  });

export const exportUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, expenses, income, budgets, todos] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("expenses").select("*").eq("user_id", context.userId),
      context.supabase.from("income").select("*").eq("user_id", context.userId),
      context.supabase.from("budgets").select("*").eq("user_id", context.userId),
      context.supabase.from("todos").select("*").eq("user_id", context.userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      expenses: expenses.data ?? [],
      income: income.data ?? [],
      budgets: budgets.data ?? [],
      todos: todos.data ?? [],
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    // Delete user rows (RLS-scoped) first
    await Promise.all([
      context.supabase.from("todos").delete().eq("user_id", uid),
      context.supabase.from("budgets").delete().eq("user_id", uid),
      context.supabase.from("expenses").delete().eq("user_id", uid),
      context.supabase.from("income").delete().eq("user_id", uid),
    ]);
    await context.supabase.from("profiles").delete().eq("id", uid);

    // Delete auth user via admin
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw error;
    return { ok: true };
  });
