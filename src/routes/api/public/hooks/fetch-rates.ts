import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CODES = ["USD", "EUR", "GBP"] as const;

const frankfurterSchema = z.object({
  base: z.string().optional(),
  date: z.string().optional(),
  rates: z.record(z.string(), z.number()),
});

export const Route = createFileRoute("/api/public/hooks/fetch-rates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!expected || !provided || provided !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let payload: z.infer<typeof frankfurterSchema>;
        try {
          const res = await fetch(
            `https://api.frankfurter.dev/v1/latest?base=INR&symbols=${CODES.join(",")}`,
          );
          if (!res.ok) {
            console.error("[fetch-rates] upstream failed", res.status);
            return Response.json(
              { error: "Upstream fetch failed", status: res.status, wrote: false },
              { status: 502 },
            );
          }
          payload = frankfurterSchema.parse(await res.json());
        } catch (err) {
          console.error("[fetch-rates] fetch/parse failed", err);
          return Response.json(
            { error: "Invalid upstream response", wrote: false },
            { status: 502 },
          );
        }

        // Keep the previous cached row when the payload is incomplete.
        const rates: Record<string, number> = { INR: 1 };
        for (const code of CODES) {
          const v = payload.rates[code];
          if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
            console.error("[fetch-rates] missing/invalid rate for", code);
            return Response.json(
              { error: `Missing rate for ${code}`, wrote: false },
              { status: 502 },
            );
          }
          rates[code] = v;
        }

        const rateDate = payload.date ?? new Date().toISOString().slice(0, 10);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("exchange_rates")
          .upsert(
            { base_currency: "INR", rate_date: rateDate, rates, fetched_at: new Date().toISOString() },
            { onConflict: "base_currency,rate_date" },
          );
        if (error) {
          console.error("[fetch-rates] upsert failed", error);
          return Response.json({ error: error.message, wrote: false }, { status: 500 });
        }

        return Response.json({ ok: true, rate_date: rateDate, rates });
      },
    },
  },
});
