import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MONTH_REGEX, monthBounds } from "./month";
import { callGemini } from "./ai/gemini.server";
import { consumeAiUsage } from "./ai/usage.server";
import { translate, type Language } from "./i18n";
import {
  buildCards,
  buildContextBlock,
  contextNeeds,
  deterministicAnswer,
  detectIntents,
  parseModelResponse,
  type CardLabels,
  type Facts,
  type LhanaCard,
} from "./lhana.logic";

/**
 * Ask Lhana — V1.
 * For every user message: authenticate, query through Supabase/RLS,
 * deterministically compute the MINIMUM sanitized financial context the
 * question needs, then make exactly ONE Gemini generation call. Gemini never
 * touches Supabase, never sees raw tables, and never produces a figure that
 * is rendered as a number — all cards are computed server-side.
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

/** Strip control chars and cap length so free text stays prompt-safe. */
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

export type LhanaReply =
  | { ok: true; reply: string; cards: LhanaCard[]; degraded: boolean }
  | { ok: false; error: "unavailable" | "quota" | "cooldown" };

export const askLhana = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }): Promise<LhanaReply> => {
    const { supabase } = context;
    const currency = data.currency;
    const rate = data.rate;
    const fmt = (v: number) => format(v * rate, currency);
    const lang = data.language as Language;
    const tr = (key: string) => translate(lang, key);

    // ---- Usage guardrail: checked before any data or model work ----
    const usage = await consumeAiUsage(supabase, "lhana");
    if (!usage.allowed) return { ok: false, error: usage.reason };

    const intents = detectIntents(data.message);
    const needs = contextNeeds(intents);

    // ---- Deterministic financial context (server is the source of truth) ----
    const { first, nextFirst, monthDate } = monthBounds(data.month);
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
      needs.budgets
        ? supabase.from("budgets").select("category, monthly_limit").eq("month", monthDate)
        : Promise.resolve({ data: [], error: null } as const),
      needs.previousMonth
        ? supabase
            .from("expenses")
            .select("amount")
            .gte("occurred_on", prevBounds.first)
            .lt("occurred_on", prevBounds.nextFirst)
        : Promise.resolve({ data: [], error: null } as const),
      needs.previousMonth
        ? supabase
            .from("income")
            .select("amount")
            .gte("occurred_on", prevBounds.first)
            .lt("occurred_on", prevBounds.nextFirst)
        : Promise.resolve({ data: [], error: null } as const),
      needs.recent
        ? supabase
            .from("expenses")
            .select("category, amount, description, occurred_on")
            .gte("occurred_on", first)
            .lt("occurred_on", nextFirst)
            .order("occurred_on", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [], error: null } as const),
    ]);

    if (expRes.error) throw expRes.error;
    if (incRes.error) throw incRes.error;
    if (budRes.error) throw budRes.error;

    const spentByCat: Record<string, number> = {};
    for (const e of expRes.data ?? []) {
      const c = normalizeCat(e.category);
      spentByCat[c] = (spentByCat[c] ?? 0) + Number(e.amount);
    }
    const spent = Object.values(spentByCat).reduce((a, b) => a + b, 0);
    const income = (incRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0);

    const monthLabel = new Date(y, m - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const prevLabel = new Date(prevDate).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const facts: Facts = {
      monthLabel,
      income,
      spent,
      net: income - spent,
      spentByCat,
      budgets: (budRes.data ?? []).map((b) => ({
        category: normalizeCat(b.category),
        limit: Number(b.monthly_limit),
        spent: spentByCat[normalizeCat(b.category)] ?? 0,
      })),
      ...(needs.previousMonth
        ? {
            prev: {
              label: prevLabel,
              income: (prevIncRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0),
              spent: (prevExpRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0),
            },
          }
        : {}),
      ...(needs.recent
        ? {
            recent: (recentRes.data ?? []).map((r) => ({
              date: r.occurred_on,
              category: normalizeCat(r.category),
              note: r.description ? sanitizeText(r.description) : null,
              amount: Number(r.amount),
            })),
          }
        : {}),
    };

    const cardLabels: CardLabels = {
      income: tr("lhana.card.income"),
      spent: tr("lhana.card.spent"),
      netLeft: tr("lhana.card.netLeft"),
      vsPrevious: tr("lhana.card.vsPrevious"),
      thisMonth: tr("lhana.card.thisMonth"),
      previousMonth: tr("lhana.card.previousMonth"),
      recentActivity: tr("lhana.card.recentActivity"),
      purchase: tr("lhana.card.purchase"),
      leftAfter: tr("lhana.card.leftAfter"),
    };

    const cards = buildCards(facts, intents, fmt, data.message, cardLabels);
    const fallbackAnswer = deterministicAnswer(facts, fmt, {
      noData: tr("lhana.fallbackNoData"),
      summary: tr("lhana.fallbackSummary"),
      unavailable: tr("lhana.error"),
    });
    const contextBlock = buildContextBlock(facts, intents, fmt, data.message);

    // ---- Exactly one Gemini generation call ----
    const system = `You are Lhana, Clario's warm, smart, encouraging AI financial companion.
Personality: calm, plain-spoken, Gen-Z friendly, never judgmental. Celebrate wins.
Rules:
- The FINANCIAL CONTEXT is authoritative. Never invent, estimate, or extrapolate numbers; use only figures given there. If it lacks the data, say what you can see and suggest what to track.
- Never invent a payday, salary date, or future income — Clario does not track them.
- Affordability is judged against money left this month and overall spending, never against a single category budget.
- You are read-only: analyze, explain, compare, calculate, and recommend, but you can never create, edit, or delete records or move money. If asked to change something, explain how the user can do it in Clario instead.
- Reply in ${LANGUAGE_NAME[data.language] ?? "English"}.
- Keep the answer under 120 words. Short paragraphs or tight bullets. No headers, no tables, no markdown fences.
- Format monetary amounts exactly as they appear in the context (already ${currency}-formatted).
Return ONLY a JSON object of the form {"answer": "..."} and nothing else.`;

    const signal = (() => {
      try {
        return getRequest()?.signal;
      } catch {
        return undefined;
      }
    })();

    const text = await callGemini({
      system,
      temperature: 0.6,
      json: true,
      ...(signal ? { signal } : {}),
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

    // ---- Strict validation before display, with deterministic fallback ----
    const parsed = parseModelResponse(text);
    if (!parsed) {
      if (!fallbackAnswer) return { ok: false, error: "unavailable" };
      return { ok: true, reply: fallbackAnswer, cards, degraded: true };
    }
    return { ok: true, reply: parsed.answer.slice(0, 1500), cards, degraded: false };
  });
