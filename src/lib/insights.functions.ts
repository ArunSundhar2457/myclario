import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Insights = {
  thisMonth: string;
  whereMoneyWent: { category: string; pct: number; note: string }[];
  budgetHealth: { category: string; status: "on_track" | "warning" | "over"; note: string }[];
  tips: string[];
};

function currentMonthBounds() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { first: iso(first), nextFirst: iso(next), monthFirst: iso(first) };
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
  .handler(async ({ context }): Promise<Insights> => {
    const { first, nextFirst, monthFirst } = currentMonthBounds();

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
          : `You earned ${totalIncome.toFixed(0)} and spent ${totalExpenses.toFixed(0)} so far. Net ${net.toFixed(0)}.`,
      whereMoneyWent: Object.entries(spentByCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amt]) => ({
          category,
          pct: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
          note: `${amt.toFixed(0)} spent`,
        })),
      budgetHealth: budgets.map((b) => {
        const pct = b.limit > 0 ? b.spent / b.limit : 0;
        const status = pct >= 1 ? "over" : pct >= 0.8 ? "warning" : "on_track";
        return {
          category: b.category,
          status,
          note: `${b.spent.toFixed(0)} of ${b.limit.toFixed(0)}`,
        };
      }),
      tips: [
        "Log every expense — even small ones add up over the month.",
        "Set a budget for your top spending category to stay in control.",
        "Review your budgets weekly to catch drift early.",
      ],
    };

    const prompt = `You are Clario, a calm and encouraging personal finance coach.
Return ONLY compact JSON with this exact shape:
{"thisMonth": string, "whereMoneyWent": [{"category": string, "pct": number, "note": string}], "budgetHealth": [{"category": string, "status": "on_track"|"warning"|"over", "note": string}], "tips": [string, string, string]}
Rules:
- thisMonth: 1-2 sentences summarizing income vs expenses and net.
- whereMoneyWent: top 3 spending categories with % share and a short note.
- budgetHealth: 1 entry per budget with status and short note.
- tips: exactly 3 short, actionable, encouraging tips.
- No markdown, no preamble, just JSON.

Data:
- Total income: ${totalIncome}
- Total expenses: ${totalExpenses}
- Net: ${net}
- Spending by category: ${JSON.stringify(spentByCat)}
- Budgets: ${JSON.stringify(budgets)}`;

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
