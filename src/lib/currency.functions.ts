import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type LatestRates = {
  rate_date: string;
  base_currency: string;
  rates: Record<string, number>;
} | null;

/**
 * Public reference data: the most recent cached daily FX row.
 * No auth required — safe to call during SSR and from public routes.
 */
export const getLatestRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<LatestRates> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
    if (!url || !key) return null;

    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate_date, base_currency, rates")
      .eq("base_currency", "INR")
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      rate_date: data.rate_date,
      base_currency: data.base_currency,
      rates: (data.rates ?? {}) as Record<string, number>,
    };
  },
);
