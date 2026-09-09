import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MONTH_REGEX, monthBounds } from "./month";
import { callGemini } from "./ai/gemini.server";

/**
 * Ask Lhana — V1.
 * For every user message: authenticate, query through Supabase/RLS,
 * deterministically compute the minimum sanitized financial context,
 * and make exactly ONE Gemini generation call. Gemini never touches
 * Supabase and never sees raw tables — only the sanitized context below.
 * Strictly read-only: this module performs no writes of any kind.
 */

const currencySchema = z.enum(["INR", "USD", "EUR", "GBP"]);
type Cur = z.infer<typeof currencySchema>;

const LOCALE: Record<Cur, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

function format(v: number, currency: Cur): string {
  try {
    return new Intl.NumberFormat(LOCALE[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${currency} ${Math.round(v)}`;
  }
}

function normalizeCat(c: string): string {
  return c === "Other" ? "Miscellaneous" : c;
}

/** Strip control chars and cap length so free-text notes stay prompt-safe. */
function sanitizeText(s: string, max = 60): string {
  return s
    .replace(/[{}[\]<>\\`\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(2000),
});

const inputSchema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z.array(messageSchema).max(12).default([]),
  currency: currencySchema.default("INR"),
  rate: z.number().positive().finite().default(1),
  month: z.string().regex(MONTH_REGEX).optional(),
  language: z.enum(["en", "de", "es", "fr"]).default("en"),
});

const LANGUAGE_NAME: Record<string, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
};

export type LhanaReply = { ok: true; reply: string } | { ok: false; error: "unavailable" };

export const askLhana = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<LhanaReply> => {
    const { supabase } = context;
    const currency = data.currency;
    const rate = data.rate;
    const fmt = (v: number) => format(v * rate, currency);

    // ---- Deterministic financial context (server is the source of truth) ----
    const { first, nextFirst, monthDate } = monthBounds(data.month);
    // Previous month bounds, computed explicitly for month comparison.
    const [y, m] = [Number(monthDate.slice(0, 4)), Number(monthDate.slice(5, 7))];
    const prevDate = new Date(y, m - 2, 1);
    const prevYm = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const prevBounds = monthBounds(prevYm);

    const [expRes, incRes, budRes, prevExpRes, prevIncRes, recentRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("category, amount")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst),
      supabase
        .from("income")
        .select("amount")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst),
      supabase.from("budgets").select("category, monthly_limit").eq("month", monthDate),
      supabase
        .from("expenses")
        .select("amount")
        .gte("occurred_on", prevBounds.first)
        .lt("occurred_on", prevBounds.nextFirst),
      supabase
        .from("income")
        .select("amount")
        .gte("occurred_on", prevBounds.first)
        .lt("occurred_on", prevBounds.nextFirst),
      supabase
        .from("expenses")
        .select("category, amount, description, occurred_on")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst)
        .order("occurred_on", { ascending: false })
        .limit(8),
    ]);

    if (expRes.error) throw expRes.error;
    if (incRes.error) throw incRes.error;
    if (budRes.error) throw budRes.error;

    const spentByCat: Record<string, number> = {};
    for (const e of expRes.data ?? []) {
      const c = normalizeCat(e.category);
      spentByCat[c] = (spentByCat[c] ?? 0) + Number(e.amount);
    }
    const totalExpenses = Object.values(spentByCat).reduce((a, b) => a + b, 0);
    const totalIncome = (incRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0);
    const net = totalIncome - totalExpenses;
    const prevExpenses = (prevExpRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0);
    const prevIncome = (prevIncRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0);

    const budgets = (budRes.data ?? []).map((b) => {
      const limit = Number(b.monthly_limit);
      const spent = spentByCat[normalizeCat(b.category)] ?? 0;
      return {
        category: normalizeCat(b.category),
        limit: fmt(limit),
        spent: fmt(spent),
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        remaining: fmt(Math.max(0, limit - spent)),
      };
    });

    const topCategories = Object.entries(spentByCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amt]) => ({
        category,
        amount: fmt(amt),
        share: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
      }));

    const recent = (recentRes.data ?? []).map((r) => ({
      date: r.occurred_on,
      category: normalizeCat(r.category),
      note: r.description ? sanitizeText(r.description) : null,
      amount: fmt(Number(r.amount)),
    }));

    const monthLabel = new Date(y, m - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const contextBlock = [
      `Month: ${monthLabel}`,
      `Income: ${fmt(totalIncome)} | Spent: ${fmt(totalExpenses)} | Net: ${fmt(net)}`,
      `Previous month — Income: ${fmt(prevIncome)} | Spent: ${fmt(prevExpenses)}`,
      `Top categories: ${topCategories.length ? JSON.stringify(topCategories) : "none"}`,
      `Budgets: ${budgets.length ? JSON.stringify(budgets) : "none set"}`,
      `Recent expenses: ${recent.length ? JSON.stringify(recent) : "none"}`,
    ].join("\n");

    // ---- Exactly one Gemini generation call ----
    const system = `You are Lhana, Clario's warm, smart, encouraging AI financial companion.
Personality: calm, plain-spoken, Gen-Z friendly, never judgmental. Celebrate wins.
Rules:
- The FINANCIAL CONTEXT below is authoritative. Never invent or estimate numbers; only use figures given there. If the context lacks data to answer, say what you can see and suggest what to track.
- You are read-only: you can analyze, explain, compare, calculate, and recommend, but you can never create, edit, or delete records or move money. If asked to change something, explain how the user can do it in Clario instead.
- Reply in ${LANGUAGE_NAME[data.language] ?? "English"}.
- Keep answers under 120 words. Short paragraphs or tight bullet points. No headers, no tables.
- Format monetary amounts exactly as they appear in the context (already ${currency}-formatted).`;

    const text = await callGemini({
      system,
      temperature: 0.6,
      messages: [
        ...data.history.map((h) => ({
          role: (h.role === "assistant" ? "model" : "user") as "user" | "model",
          text: sanitizeText(h.text, 2000),
        })),
        {
          role: "user",
          text: `FINANCIAL CONTEXT (authoritative):\n${contextBlock}\n\nUSER QUESTION: ${sanitizeText(data.message, 500)}`,
        },
      ],
    });

    // ---- Validate before display ----
    const reply = text?.trim();
    if (!reply || reply.length < 2) return { ok: false, error: "unavailable" };
    return { ok: true, reply: reply.slice(0, 1500) };
  });
