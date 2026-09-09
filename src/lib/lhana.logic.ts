import { z } from "zod";

/**
 * Pure, deterministic Lhana logic — no I/O, no model calls.
 * The server is the single source of truth for every financial number:
 * intent detection, context selection, result cards, and the safe fallback
 * answer all live here so they can be unit-tested in isolation.
 */

export type Intent =
  | "spending"
  | "category"
  | "budget"
  | "comparison"
  | "recent"
  | "affordability"
  | "general";

export type Facts = {
  monthLabel: string;
  income: number;
  spent: number;
  net: number;
  spentByCat: Record<string, number>;
  budgets: { category: string; limit: number; spent: number }[];
  prev?: { label: string; income: number; spent: number };
  recent?: { date: string; category: string; note: string | null; amount: number }[];
};

export type Fmt = (v: number) => string;

/* ------------------------------ result cards ------------------------------ */

export type LhanaCard =
  | { type: "metric"; label: string; value: string; hint?: string; tone?: "default" | "good" | "warn" }
  | {
      type: "comparison";
      label: string;
      currentLabel: string;
      currentValue: string;
      previousLabel: string;
      previousValue: string;
      deltaText: string;
      tone: "default" | "good" | "warn";
    }
  | {
      type: "budget";
      category: string;
      spent: string;
      limit: string;
      percentUsed: number;
      tone: "default" | "good" | "warn";
    }
  | {
      type: "transactions";
      title: string;
      items: { date: string; label: string; amount: string }[];
    };

/* --------------------------- response contract ---------------------------- */

/**
 * Gemini returns ONLY prose. Every number rendered as a card is computed
 * here, so a malformed or hallucinated payload can never surface as a figure.
 */
export const lhanaModelResponseSchema = z.object({
  answer: z.string().trim().min(2).max(1500),
});

export type LhanaModelResponse = z.infer<typeof lhanaModelResponseSchema>;

/** Tolerant JSON extraction + strict Zod validation. Returns null when invalid. */
export function parseModelResponse(raw: string | null | undefined): LhanaModelResponse | null {
  if (!raw) return null;
  const text = raw.trim();
  const candidates: string[] = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const braced = text.match(/\{[\s\S]*\}/);
  if (braced?.[0]) candidates.push(braced[0]);

  for (const candidate of candidates) {
    try {
      const parsed = lhanaModelResponseSchema.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
    } catch {
      /* try next candidate */
    }
  }
  // Plain prose (no JSON at all) is still acceptable content, once validated.
  const asProse = lhanaModelResponseSchema.safeParse({ answer: text.replace(/```/g, "").trim() });
  return asProse.success ? asProse.data : null;
}

/* ---------------------------- intent detection ---------------------------- */

const KEYWORDS: Record<Exclude<Intent, "general">, RegExp> = {
  affordability:
    /\b(afford|affordable|can i (buy|spend|get)|kann ich mir|leisten|puedo (permitirme|comprar|gastar)|permitirme|je peux|puis-je|acheter)\b/i,
  comparison:
    /\b(compare|comparison|last month|previous month|versus|vs\.?|change[ds]?|more or less|vergleich|letzter monat|vormonat|mes pasado|mes anterior|comparar|mois dernier|comparer)\b/i,
  budget: /\b(budget|budgets|limit|over ?budget|on track|budgetplan|presupuesto|límite|limite)\b/i,
  category:
    /\b(categor|food|groceries|dining|eating out|rent|transport|shopping|bills|entertainment|health|kategorie|essen|lebensmittel|comida|categoría|alimentation|nourriture)\b/i,
  recent:
    /\b(recent|latest|last (few )?(transaction|expense|purchase)|what was|explain (this|that) charge|transactions?|letzte|reciente|transacción|récent|dépense)\b/i,
  spending:
    /\b(spend|spent|spending|where did my money|outgoings|expenses|total|ausgaben|ausgegeben|gasto|gastado|gasté|dépens|dépensé)\b/i,
};

/** Detect every intent present, most specific first; never empty. */
export function detectIntents(message: string): Intent[] {
  const found: Intent[] = [];
  const order: Exclude<Intent, "general">[] = [
    "affordability",
    "comparison",
    "budget",
    "category",
    "recent",
    "spending",
  ];
  for (const intent of order) if (KEYWORDS[intent].test(message)) found.push(intent);
  return found.length > 0 ? found : ["general"];
}

/** What deterministic context each set of intents needs — the minimum, nothing more. */
export type ContextNeeds = {
  categories: boolean;
  budgets: boolean;
  previousMonth: boolean;
  recent: boolean;
};

export function contextNeeds(intents: Intent[]): ContextNeeds {
  const has = (i: Intent) => intents.includes(i);
  return {
    categories: has("category") || has("spending") || has("general"),
    budgets: has("budget") || has("affordability") || has("general"),
    previousMonth: has("comparison"),
    recent: has("recent") || has("category"),
  };
}

/* --------------------------- amount extraction ---------------------------- */

/** Pull a purchase amount out of an affordability question ("can I afford ₹5,000?"). */
export function extractAmount(message: string): number | null {
  const match = message.match(/(\d[\d.,\s]*)\s*(k|thousand|lakh)?/i);
  if (!match) return null;
  const raw = match[1].replace(/[\s,]/g, "");
  // Treat a trailing ".000"-style group as a thousands separator, not decimals.
  const numeric = Number(/\.\d{3}$/.test(raw) ? raw.replace(/\./g, "") : raw);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k" || suffix === "thousand") return numeric * 1000;
  if (suffix === "lakh") return numeric * 100000;
  return numeric;
}

/* ------------------------------ context block ----------------------------- */

export function topCategories(facts: Facts, fmt: Fmt, limit = 5) {
  return Object.entries(facts.spentByCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, amount]) => ({
      category,
      amount: fmt(amount),
      share: facts.spent > 0 ? Math.round((amount / facts.spent) * 100) : 0,
    }));
}

export function budgetHealth(facts: Facts, fmt: Fmt) {
  return facts.budgets.map((b) => ({
    category: b.category,
    limit: fmt(b.limit),
    spent: fmt(b.spent),
    percentUsed: b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0,
    remaining: fmt(Math.max(0, b.limit - b.spent)),
  }));
}

export function hasAnyData(facts: Facts): boolean {
  return facts.income > 0 || facts.spent > 0 || facts.budgets.length > 0;
}

/**
 * Build the sanitized, minimum context block for the current question.
 * Only sections the detected intents require are included.
 */
export function buildContextBlock(
  facts: Facts,
  intents: Intent[],
  fmt: Fmt,
  message: string,
): string {
  const needs = contextNeeds(intents);
  const lines: string[] = [
    `Month: ${facts.monthLabel}`,
    `Income: ${fmt(facts.income)} | Spent: ${fmt(facts.spent)} | Net left: ${fmt(facts.net)}`,
  ];

  if (!hasAnyData(facts)) {
    lines.push(
      "DATA STATUS: no income, expenses, or budgets recorded for this month. Do not estimate; invite the user to add data.",
    );
  }

  if (needs.categories) {
    const cats = topCategories(facts, fmt);
    lines.push(`Top categories: ${cats.length ? JSON.stringify(cats) : "none recorded"}`);
  }
  if (needs.budgets) {
    const b = budgetHealth(facts, fmt);
    lines.push(`Budgets: ${b.length ? JSON.stringify(b) : "no budgets set"}`);
  }
  if (needs.previousMonth) {
    lines.push(
      facts.prev
        ? `Previous month (${facts.prev.label}) — Income: ${fmt(facts.prev.income)} | Spent: ${fmt(facts.prev.spent)} | Change in spending: ${fmt(facts.spent - facts.prev.spent)}`
        : "Previous month: no data recorded",
    );
  }
  if (needs.recent) {
    const recent = (facts.recent ?? []).map((r) => ({
      date: r.date,
      category: r.category,
      note: r.note,
      amount: fmt(r.amount),
    }));
    lines.push(`Recent expenses: ${recent.length ? JSON.stringify(recent) : "none recorded"}`);
  }
  if (intents.includes("affordability")) {
    const amount = extractAmount(message);
    lines.push(
      [
        amount !== null ? `Affordability target: ${fmt(amount)}` : "Affordability target: not stated",
        `Judge affordability against money left this month (${fmt(facts.net)}) and overall spending — NEVER against a single category budget.`,
        "PAYDAY: Clario does not track payday or upcoming income. Never invent or assume a payday, salary date, or future income. Say it isn't tracked if it matters.",
        amount !== null
          ? `Deterministic verdict: ${affordabilityVerdict(facts, amount)}`
          : "Ask the user for the amount.",
      ].join("\n"),
    );
  }

  return lines.join("\n");
}

export function affordabilityVerdict(
  facts: Facts,
  amount: number,
): "comfortable" | "tight" | "not-now" | "unknown" {
  if (!hasAnyData(facts)) return "unknown";
  if (amount <= facts.net * 0.5) return "comfortable";
  if (amount <= facts.net) return "tight";
  return "not-now";
}

/* ------------------------------ result cards ------------------------------ */

export type CardLabels = {
  income: string;
  spent: string;
  netLeft: string;
  vsPrevious: string;
  thisMonth: string;
  previousMonth: string;
  recentActivity: string;
  purchase: string;
  leftAfter: string;
};

/** Deterministic cards for the answer — every figure computed here, never by the model. */
export function buildCards(
  facts: Facts,
  intents: Intent[],
  fmt: Fmt,
  message: string,
  labels: CardLabels,
): LhanaCard[] {
  const cards: LhanaCard[] = [];
  if (!hasAnyData(facts)) return cards;

  if (intents.includes("affordability")) {
    const amount = extractAmount(message);
    if (amount !== null) {
      const verdict = affordabilityVerdict(facts, amount);
      cards.push({
        type: "metric",
        label: labels.purchase,
        value: fmt(amount),
        hint: `${labels.leftAfter} ${fmt(facts.net - amount)}`,
        tone: verdict === "comfortable" ? "good" : verdict === "tight" ? "default" : "warn",
      });
    }
    cards.push({
      type: "metric",
      label: labels.netLeft,
      value: fmt(facts.net),
      tone: facts.net >= 0 ? "good" : "warn",
    });
    return cards.slice(0, 4);
  }

  if (intents.includes("comparison") && facts.prev) {
    const delta = facts.spent - facts.prev.spent;
    cards.push({
      type: "comparison",
      label: labels.vsPrevious,
      currentLabel: labels.thisMonth,
      currentValue: fmt(facts.spent),
      previousLabel: labels.previousMonth,
      previousValue: fmt(facts.prev.spent),
      deltaText: `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${fmt(Math.abs(delta))}`,
      tone: delta > 0 ? "warn" : delta < 0 ? "good" : "default",
    });
  }

  if (intents.includes("spending") || intents.includes("category") || intents.includes("general")) {
    cards.push({ type: "metric", label: labels.spent, value: fmt(facts.spent) });
    cards.push({
      type: "metric",
      label: labels.netLeft,
      value: fmt(facts.net),
      tone: facts.net >= 0 ? "good" : "warn",
    });
  }

  if (intents.includes("budget")) {
    for (const b of budgetHealth(facts, fmt).slice(0, 3)) {
      cards.push({
        type: "budget",
        category: b.category,
        spent: b.spent,
        limit: b.limit,
        percentUsed: b.percentUsed,
        tone: b.percentUsed >= 100 ? "warn" : b.percentUsed >= 80 ? "default" : "good",
      });
    }
  }

  if (intents.includes("recent") && (facts.recent?.length ?? 0) > 0) {
    cards.push({
      type: "transactions",
      title: labels.recentActivity,
      items: (facts.recent ?? []).slice(0, 6).map((r) => ({
        date: r.date,
        label: r.note ? `${r.category} · ${r.note}` : r.category,
        amount: fmt(r.amount),
      })),
    });
  }

  return cards.slice(0, 4);
}

/* ------------------------------- fallback -------------------------------- */

export type FallbackStrings = {
  noData: string;
  summary: string;
  unavailable: string;
};

/**
 * Safe deterministic answer used when the model is unavailable or its payload
 * fails validation. Uses only server-computed figures.
 */
export function deterministicAnswer(facts: Facts, fmt: Fmt, strings: FallbackStrings): string {
  if (!hasAnyData(facts)) return strings.noData;
  return strings.summary
    .replace("{month}", facts.monthLabel)
    .replace("{income}", fmt(facts.income))
    .replace("{spent}", fmt(facts.spent))
    .replace("{net}", fmt(facts.net));
}
