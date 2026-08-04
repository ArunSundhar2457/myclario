import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MONTH_REGEX, monthBounds } from "./month";


const currencySchema = z.enum(["INR", "USD", "EUR", "GBP"]);
type Cur = z.infer<typeof currencySchema>;

function fmt(v: number, currency: Cur): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
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

export type Insights = {
  thisMonth: string;
  whereMoneyWent: { category: string; pct: number; note: string }[];
  budgetHealth: { category: string; status: "on_track" | "warning" | "over"; note: string }[];
  tips: string[];
};

function monthWindow(ym?: string) {
  const { first, nextFirst, monthDate } = monthBounds(ym);
  return { first, nextFirst, monthFirst: monthDate };
}


async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
        }),
      },
    );
    if (!res.ok) {
      console.error("Gemini error", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error("Gemini call failed", err);
    return null;
  }
}

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        currency: currencySchema.default("INR"),
        month: z.string().regex(MONTH_REGEX).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<Insights> => {
    const currency = data.currency;
    const { first, nextFirst, monthFirst } = monthWindow(data.month);


    const [expRes, incRes, budRes] = await Promise.all([
      context.supabase
        .from("expenses")
        .select("category, amount")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst),
      context.supabase
        .from("income")
        .select("amount")
        .gte("occurred_on", first)
        .lt("occurred_on", nextFirst),
      context.supabase
        .from("budgets")
        .select("category, monthly_limit")
        .eq("month", monthFirst),
    ]);

    if (expRes.error) throw expRes.error;
    if (incRes.error) throw incRes.error;
    if (budRes.error) throw budRes.error;

    const spentByCat: Record<string, number> = {};
    for (const e of expRes.data ?? []) {
      spentByCat[e.category] = (spentByCat[e.category] ?? 0) + Number(e.amount);
    }
    const totalExpenses = Object.values(spentByCat).reduce((a, b) => a + b, 0);
    const totalIncome = (incRes.data ?? []).reduce((a, r) => a + Number(r.amount), 0);
    const net = totalIncome - totalExpenses;

    const budgets = (budRes.data ?? []).map((b) => ({
      category: b.category,
      limit: Number(b.monthly_limit),
      spent: spentByCat[b.category] ?? 0,
    }));

    const fallback: Insights = {
      thisMonth:
        totalIncome === 0 && totalExpenses === 0
          ? "No activity yet this month — add a few transactions and Clario will get to work."
          : `You earned ${fmt(totalIncome, currency)} and spent ${fmt(totalExpenses, currency)} so far. Net ${fmt(net, currency)}.`,
      whereMoneyWent: Object.entries(spentByCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amt]) => ({
          category: normalizeCat(category),
          pct: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
          note: `${fmt(amt, currency)} spent`,
        })),
      budgetHealth: budgets.map((b) => {
        const pct = b.limit > 0 ? b.spent / b.limit : 0;
        const status = pct >= 1 ? "over" : pct >= 0.8 ? "warning" : "on_track";
        return {
          category: normalizeCat(b.category),
          status,
          note: `${fmt(b.spent, currency)} of ${fmt(b.limit, currency)}`,
        };
      }),
      tips: [
        "Log every expense — even small ones add up over the month.",
        "Set a budget for your top spending category to stay in control.",
        "Review your budgets weekly to catch drift early.",
      ],
    };

    const spentByCatNorm: Record<string, number> = {};
    for (const [k, v] of Object.entries(spentByCat)) {
      spentByCatNorm[normalizeCat(k)] = (spentByCatNorm[normalizeCat(k)] ?? 0) + v;
    }
    const budgetsNorm = budgets.map((b) => ({
      category: normalizeCat(b.category),
      limit: b.limit,
      spent: b.spent,
    }));

    const prompt = `You are Clario, a calm and encouraging personal finance coach.
Return ONLY compact JSON with this exact shape:
{"thisMonth": string, "whereMoneyWent": [{"category": string, "pct": number, "note": string}], "budgetHealth": [{"category": string, "status": "on_track"|"warning"|"over", "note": string}], "tips": [string, string, string]}
Rules:
- thisMonth: 1-2 sentences. When you mention a monetary amount, format it EXACTLY as one of these strings and never write a raw number: ${fmt(totalIncome, currency)} (income), ${fmt(totalExpenses, currency)} (expenses), ${fmt(net, currency)} (net).
- whereMoneyWent: top 3 spending categories with % share and a short note. In "note", format money as "${fmt(0, currency).replace(/[0-9.,]/g, "")}<number>" using the currency prefix "${fmt(0, currency).replace(/[0-9.,\s]/g, "")}" and grouped digits.
- budgetHealth: 1 entry per budget with status and short note. Format money the same way.
- tips: exactly 3 short, actionable, encouraging tips.
- Never write "Other" as a category; use "Miscellaneous" instead.
- No markdown, no preamble, just JSON.

Data (amounts in ${currency}):
- Total income: ${totalIncome}
- Total expenses: ${totalExpenses}
- Net: ${net}
- Spending by category: ${JSON.stringify(spentByCatNorm)}
- Budgets: ${JSON.stringify(budgetsNorm)}`;

    const text = await callGemini(prompt);
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as Partial<Insights>;
      return {
        thisMonth: parsed.thisMonth || fallback.thisMonth,
        whereMoneyWent: Array.isArray(parsed.whereMoneyWent) && parsed.whereMoneyWent.length > 0
          ? parsed.whereMoneyWent.slice(0, 3)
          : fallback.whereMoneyWent,
        budgetHealth: Array.isArray(parsed.budgetHealth)
          ? parsed.budgetHealth
          : fallback.budgetHealth,
        tips: Array.isArray(parsed.tips) && parsed.tips.length > 0
          ? parsed.tips.slice(0, 3)
          : fallback.tips,
      };
    } catch {
      return fallback;
    }
  });

export const quickTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ tip: string }> => {
    const fallback = {
      tip: "Small daily wins compound — log one expense and check off one task today.",
    };
    const text = await callGemini(
      `You are Clario, a calm finance + planning coach. Return ONLY JSON: {"tip": string} where tip is 1-2 encouraging sentences (<= 28 words) with one concrete action. No markdown.`,
    );
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as { tip?: string };
      return { tip: parsed.tip?.trim() || fallback.tip };
    } catch {
      return fallback;
    }
  });
