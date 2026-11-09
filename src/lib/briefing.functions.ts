import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./categories";
import { CURRENCIES, formatMoney, type Currency } from "./currency";
import { MONTH_REGEX, dateString, monthBounds } from "./month";
import { callGeminiJson } from "./ai/gemini.server";
import { consumeAiUsage } from "./ai/usage.server";
import { buildBriefingPrompt, LANGUAGE_NAME, sanitizeLabel } from "./briefing.logic";

const inputSchema = z.object({
  monthLabel: z.string().max(60),
  // "YYYY-MM" of the month shown on the dashboard.
  month: z.string().regex(MONTH_REGEX).optional(),
  // Validated against the supported list inside the handler; unknown values become INR.
  currency: z.string().max(8).default("INR"),
  // Multiplier applied to INR amounts for display only. Data stays in INR.
  rate: z.number().positive().finite().default(1),
  language: z.enum(["en", "de", "es", "fr"]).default("en"),
  // The user's local date; the server runs in UTC and can be a day off.
  today: dateString.optional(),
});

type Briefing = {
  greeting: string;
  insight: string;
  nudge: string;
};

const BRIEFING_FALLBACKS: Record<keyof typeof LANGUAGE_NAME, (openTodos: number) => Briefing> = {
  en: (openTodos) => ({
    greeting: "Welcome back.",
    insight:
      "You're just getting started — add a few transactions and tasks and Clario will start spotting patterns for you.",
    nudge:
      openTodos > 0
        ? `Knock out one of your ${openTodos} open task${openTodos === 1 ? "" : "s"} to build momentum.`
        : "Add today's first task to set the tone for the day.",
  }),
  de: (openTodos) => ({
    greeting: "Willkommen zurück.",
    insight:
      "Du fängst gerade an — füge ein paar Transaktionen und Aufgaben hinzu, damit Clario Muster erkennen kann.",
    nudge:
      openTodos > 0
        ? `Erledige eine deiner ${openTodos} offenen Aufgabe${openTodos === 1 ? "" : "n"}, um Schwung zu bekommen.`
        : "Füge die erste Aufgabe für heute hinzu und starte mit Klarheit.",
  }),
  es: (openTodos) => ({
    greeting: "Qué bueno verte de nuevo.",
    insight:
      "Estás empezando — añade algunas transacciones y tareas para que Clario pueda detectar patrones por ti.",
    nudge:
      openTodos > 0
        ? `Completa una de tus ${openTodos} tarea${openTodos === 1 ? "" : "s"} pendiente${openTodos === 1 ? "" : "s"} para avanzar.`
        : "Añade tu primera tarea de hoy para empezar con buen ritmo.",
  }),
  fr: (openTodos) => ({
    greeting: "Bon retour.",
    insight:
      "Tu commences à peine — ajoute quelques transactions et tâches pour que Clario puisse repérer tes habitudes.",
    nudge:
      openTodos > 0
        ? `Termine une de tes ${openTodos} tâche${openTodos === 1 ? "" : "s"} en attente pour avancer.`
        : "Ajoute ta première tâche du jour pour bien commencer.",
  }),
};

/**
 * AI Daily Briefing.
 * Gives the model the user's real month totals (so it has something true to say),
 * asks for the reply in the user's language, and falls back to a friendly canned
 * briefing if the AI call fails.
 */
export const getDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const today = data.today ?? new Date().toISOString().slice(0, 10);
    const { first, nextFirst } = monthBounds(data.month, today);

    const [todos, totals, cats] = await Promise.all([
      supabase
        .from("todos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", false)
        .lte("due_date", today),
      supabase.rpc("get_totals", { p_from: first, p_to: nextFirst }),
      supabase.rpc("get_expense_category_totals", { p_from: first, p_to: nextFirst }),
    ]);
    const openTodos = todos.count;

    const fallback = BRIEFING_FALLBACKS[data.language](openTodos ?? 0);

    // Without real figures the model would have to invent them, so skip the AI.
    if (totals.error || cats.error) return fallback;

    const income = Number(totals.data?.[0]?.income ?? 0);
    const spent = Number(totals.data?.[0]?.spent ?? 0);
    const currency: Currency = (CURRENCIES as string[]).includes(data.currency)
      ? (data.currency as Currency)
      : "INR";
    const fmt = (v: number) => formatMoney(v * data.rate, currency);

    const top = [...(cats.data ?? [])].sort((a, b) => Number(b.total) - Number(a.total))[0];
    const knownCategory = top
      ? (EXPENSE_CATEGORIES as readonly string[]).includes(top.category)
      : false;

    const prompt = buildBriefingPrompt(
      {
        monthLabel: sanitizeLabel(data.monthLabel),
        income: fmt(income),
        spent: fmt(spent),
        topCategory: top
          ? {
              name: knownCategory
                ? top.category === "Other"
                  ? "Miscellaneous"
                  : top.category
                : "Other",
              amount: fmt(Number(top.total)),
            }
          : null,
        openTasks: openTodos ?? 0,
        hasActivity: income > 0 || spent > 0,
      },
      data.language,
    );

    const usage = await consumeAiUsage(supabase, "briefing");
    if (!usage.allowed) return fallback;
    const text = await callGeminiJson(prompt);
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as Partial<Briefing>;
      return {
        greeting: parsed.greeting?.trim() || fallback.greeting,
        insight: parsed.insight?.trim() || fallback.insight,
        nudge: parsed.nudge?.trim() || fallback.nudge,
      } satisfies Briefing;
    } catch {
      return fallback;
    }
  });
