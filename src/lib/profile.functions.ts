import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchAllRows } from "./paginate";

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
        language: z.enum(["en", "de", "es", "fr"]).optional(),
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
    const { supabase, userId } = context;
    // Read every row (Supabase caps one request at 1,000) and fail loudly rather
    // than hand the user an export that silently leaves data out.
    const all = (table: "expenses" | "income" | "budgets" | "todos") =>
      fetchAllRows((from, to) =>
        supabase
          .from(table)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      );
    const [profile, expenses, income, budgets, todos] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      all("expenses"),
      all("income"),
      all("budgets"),
      all("todos"),
    ]);
    if (profile.error) throw profile.error;
    return {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      expenses,
      income,
      budgets,
      todos,
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Deleting the login removes everything else too: profiles, todos,
    // expenses, income and budgets are all set to cascade in the database.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw error;
    return { ok: true };
  });
