import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MONTH_REGEX, monthBounds } from "./month";
import { callGeminiJson } from "./ai/gemini.server";
import { LANGUAGE_NAME, type BriefingLanguage } from "./briefing.logic";

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

export type Insights = {
  thisMonth: string;
  whereMoneyWent: { category: string; pct: number; note: string }[];
  budgetHealth: { category: string; status: "on_track" | "warning" | "over"; note: string }[];
  tips: string[];
};

const insightsModelSchema = z.object({
  thisMonth: z.string().trim().min(1).max(500),
  whereMoneyWent: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(80),
        pct: z.number().finite().min(0).max(100),
        note: z.string().trim().min(1).max(240),
      }),
    )
    .max(3),
  budgetHealth: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(80),
        status: z.enum(["on_track", "warning", "over"]),
        note: z.string().trim().min(1).max(240),
      }),
    )
    .max(50),
  tips: z.array(z.string().trim().min(1).max(240)).max(3),
});

const quickTipSchema = z.object({
  tip: z.string().trim().min(1).max(240),
});

const INSIGHTS_FALLBACKS: Record<BriefingLanguage, {
  thisMonth: (income: string, expenses: string, net: string, hasActivity: boolean) => string;
  tips: [string, string, string];
}> = {
  en: {
    thisMonth: (income, expenses, net, hasActivity) =>
      hasActivity
        ? `You earned ${income} and spent ${expenses} so far. Net ${net}.`
        : "No activity yet this month — add a few transactions and Clario will get to work.",
    tips: [
      "Log every expense — even small ones add up over the month.",
      "Set a budget for your top spending category to stay in control.",
      "Review your budgets weekly to catch drift early.",
    ],
  },
  de: {
    thisMonth: (income, expenses, net, hasActivity) =>
      hasActivity
        ? `Du hast bisher ${income} verdient und ${expenses} ausgegeben. Dein Saldo beträgt ${net}.`
        : "Diesen Monat gibt es noch keine Aktivität — füge ein paar Transaktionen hinzu, damit Clario loslegen kann.",
    tips: [
      "Erfasse jede Ausgabe — auch kleine Beträge summieren sich über den Monat.",
      "Setze ein Budget für deine wichtigste Ausgabenkategorie, um den Überblick zu behalten.",
      "Prüfe deine Budgets wöchentlich, damit Abweichungen früh auffallen.",
    ],
  },
  es: {
    thisMonth: (income, expenses, net, hasActivity) =>
      hasActivity
        ? `Has recibido ${income} y gastado ${expenses} hasta ahora. Tu saldo neto es ${net}.`
        : "Aún no hay actividad este mes — añade algunas transacciones para que Clario pueda empezar.",
    tips: [
      "Registra cada gasto — incluso los pequeños se acumulan durante el mes.",
      "Define un presupuesto para tu categoría de mayor gasto para mantener el control.",
      "Revisa tus presupuestos cada semana para detectar desviaciones a tiempo.",
    ],
  },
  fr: {
    thisMonth: (income, expenses, net, hasActivity) =>
      hasActivity
        ? `Tu as gagné ${income} et dépensé ${expenses} jusqu’à présent. Ton solde net est de ${net}.`
        : "Aucune activité ce mois-ci — ajoute quelques transactions pour que Clario puisse commencer.",
    tips: [
      "Enregistre chaque dépense — même les petites sommes s’additionnent au fil du mois.",
      "Fixe un budget pour ta catégorie de dépenses principale afin de garder le contrôle.",
      "Vérifie tes budgets chaque semaine pour repérer rapidement les écarts.",
    ],
  },
};

const QUICK_TIP_FALLBACK: Record<BriefingLanguage, string> = {
  en: "Small daily wins compound — log one expense and check off one task today.",
  de: "Kleine tägliche Erfolge summieren sich — erfasse heute eine Ausgabe und erledige eine Aufgabe.",
  es: "Los pequeños avances diarios se acumulan: registra un gasto y completa una tarea hoy.",
  fr: "Les petites victoires quotidiennes comptent — enregistre une dépense et termine une tâche aujourd’hui.",
};

function monthWindow(ym?: string) {
  const { first, nextFirst, monthDate } = monthBounds(ym);
  return { first, nextFirst, monthFirst: monthDate };
}


export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        currency: currencySchema.default("INR"),
        // Multiplier applied to INR amounts for display only. Data stays in INR.
        rate: z.number().positive().finite().default(1),
        month: z.string().regex(MONTH_REGEX).optional(),
        language: z.enum(["en", "de", "es", "fr"]).default("en"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<Insights> => {
    const currency = data.currency;
    const rate = data.rate;
    const fmt = (v: number) => format(v * rate, currency);
    const { first, nextFirst, monthFirst } = monthWindow(data.month);

    const [catRes, totalsRes, budRes] = await Promise.all([
      context.supabase.rpc("get_expense_category_totals", { p_from: first, p_to: nextFirst }),
      context.supabase.rpc("get_totals", { p_from: first, p_to: nextFirst }),
      context.supabase.from("budgets").select("category, monthly_limit").eq("month", monthFirst),
    ]);

    if (catRes.error) throw catRes.error;
    if (totalsRes.error) throw totalsRes.error;
    if (budRes.error) throw budRes.error;

    const spentByCat: Record<string, number> = {};
    for (const e of catRes.data ?? []) {
      spentByCat[e.category] = Number(e.total);
    }
    const totalExpenses = Number(totalsRes.data?.[0]?.spent ?? 0);
    const totalIncome = Number(totalsRes.data?.[0]?.income ?? 0);
    const net = totalIncome - totalExpenses;

    const budgets = (budRes.data ?? []).map((b) => ({
      category: b.category,
      limit: Number(b.monthly_limit),
      spent: spentByCat[b.category] ?? 0,
    }));

    const fallback: Insights = {
      thisMonth:
        totalIncome === 0 && totalExpenses === 0
          ? INSIGHTS_FALLBACKS[data.language].thisMonth(fmt(totalIncome), fmt(totalExpenses), fmt(net), false)
          : INSIGHTS_FALLBACKS[data.language].thisMonth(fmt(totalIncome), fmt(totalExpenses), fmt(net), true),
      whereMoneyWent: Object.entries(spentByCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amt]) => ({
          category: normalizeCat(category),
          pct: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
          note: `${fmt(amt)} spent`,
        })),
      budgetHealth: budgets.map((b) => {
        const pct = b.limit > 0 ? b.spent / b.limit : 0;
        const status = pct >= 1 ? "over" : pct >= 0.8 ? "warning" : "on_track";
        return {
          category: normalizeCat(b.category),
          status,
          note: `${fmt(b.spent)} of ${fmt(b.limit)}`,
        };
      }),
      tips: [...INSIGHTS_FALLBACKS[data.language].tips],
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

    // Figures shown to the model must be in the display currency, not raw INR.
    const conv = (v: number) => Math.round(v * rate * 100) / 100;
    const convByCat = Object.fromEntries(
      Object.entries(spentByCatNorm).map(([k, v]) => [k, conv(v)]),
    );
    const convBudgets = budgetsNorm.map((b) => ({
      category: b.category,
      limit: conv(b.limit),
      spent: conv(b.spent),
    }));

    const prompt = `You are Clario, a calm and encouraging personal finance coach.
Write every human-readable string in ${LANGUAGE_NAME[data.language]}; keep the JSON keys, the "status" values and the category names exactly as given.
Return ONLY compact JSON with this exact shape:
{"thisMonth": string, "whereMoneyWent": [{"category": string, "pct": number, "note": string}], "budgetHealth": [{"category": string, "status": "on_track"|"warning"|"over", "note": string}], "tips": [string, string, string]}
Rules:
- thisMonth: 1-2 sentences. When you mention a monetary amount, format it EXACTLY as one of these strings and never write a raw number: ${fmt(totalIncome)} (income), ${fmt(totalExpenses)} (expenses), ${fmt(net)} (net).
- whereMoneyWent: top 3 spending categories with % share and a short note. In "note", format money as "${fmt(0).replace(/[0-9.,]/g, "")}<number>" using the currency prefix "${fmt(0).replace(/[0-9.,\s]/g, "")}" and grouped digits.
- budgetHealth: 1 entry per budget with status and short note. Format money the same way.
- tips: exactly 3 short, actionable, encouraging tips.
- Never write "Other" as a category; use "Miscellaneous" instead.
- No markdown, no preamble, just JSON.

Data (amounts in ${currency}):
- Total income: ${conv(totalIncome)}
- Total expenses: ${conv(totalExpenses)}
- Net: ${conv(net)}
- Spending by category: ${JSON.stringify(convByCat)}
- Budgets: ${JSON.stringify(convBudgets)}`;

    const text = await callGeminiJson(prompt);
    if (!text) return fallback;
    try {
      const parsed = insightsModelSchema.parse(JSON.parse(text));
      return {
        thisMonth: parsed.thisMonth,
        whereMoneyWent: parsed.whereMoneyWent,
        budgetHealth: parsed.budgetHealth,
        tips: parsed.tips.length === 3 ? parsed.tips : fallback.tips,
      };
    } catch {
      return fallback;
    }
  });

export const quickTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ language: z.enum(["en", "de", "es", "fr"]).default("en") }).parse(d ?? {}),
  )
  .handler(async ({ data }): Promise<{ tip: string }> => {
    const fallback = { tip: QUICK_TIP_FALLBACK[data.language] };
    const text = await callGeminiJson(
      `You are Clario, a calm finance + planning coach. Write the tip in ${LANGUAGE_NAME[data.language]}. Return ONLY JSON: {"tip": string} where tip is 1-2 encouraging sentences (<= 28 words) with one concrete action. No markdown.`,
    );
    if (!text) return fallback;
    try {
      const parsed = quickTipSchema.parse(JSON.parse(text));
      return { tip: parsed.tip };
    } catch {
      return fallback;
    }
  });
