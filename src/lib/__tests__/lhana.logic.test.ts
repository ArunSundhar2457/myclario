import { describe, expect, it } from "vitest";
import {
  affordabilityVerdict,
  buildCards,
  buildContextBlock,
  contextNeeds,
  deterministicAnswer,
  detectIntents,
  extractAmount,
  parseModelResponse,
  topCategories,
  type CardLabels,
  type Facts,
} from "../lhana.logic";
import { DICTS, LANGUAGES, translate } from "../i18n";

const fmt = (v: number) => `INR ${Math.round(v)}`;

const labels: CardLabels = {
  income: "Income",
  spent: "Spent",
  netLeft: "Left this month",
  vsPrevious: "Spending vs last month",
  thisMonth: "This month",
  previousMonth: "Last month",
  recentActivity: "Recent activity",
  purchase: "Purchase",
  leftAfter: "Left after this:",
};

const facts: Facts = {
  monthLabel: "September 2026",
  income: 50000,
  spent: 30000,
  net: 20000,
  spentByCat: { Food: 12000, Rent: 15000, Transport: 3000 },
  budgets: [
    { category: "Food", limit: 10000, spent: 12000 },
    { category: "Transport", limit: 6000, spent: 3000 },
  ],
  prev: { label: "August 2026", income: 50000, spent: 26000 },
  recent: [
    { date: "2026-09-08", category: "Food", note: "Late night biryani", amount: 800 },
    { date: "2026-09-07", category: "Transport", note: null, amount: 200 },
  ],
};

const emptyFacts: Facts = {
  monthLabel: "September 2026",
  income: 0,
  spent: 0,
  net: 0,
  spentByCat: {},
  budgets: [],
};

describe("intent detection", () => {
  it("detects spending questions", () => {
    expect(detectIntents("Where did my money go this month?")).toContain("spending");
  });

  it("detects a category/food question", () => {
    const intents = detectIntents("How much did I spend on food?");
    expect(intents).toContain("category");
    expect(contextNeeds(intents).categories).toBe(true);
  });

  it("detects affordability", () => {
    expect(detectIntents("Can I afford a 5,000 purchase?")).toContain("affordability");
  });

  it("detects month comparison and only then loads previous month", () => {
    const compare = detectIntents("Am I spending more than last month?");
    expect(compare).toContain("comparison");
    expect(contextNeeds(compare).previousMonth).toBe(true);
    expect(contextNeeds(detectIntents("How much did I spend on food?")).previousMonth).toBe(false);
  });

  it("falls back to general for open questions", () => {
    expect(detectIntents("Hey Lhana, any advice?")).toEqual(["general"]);
  });

  it("keeps context minimal per intent", () => {
    const needs = contextNeeds(detectIntents("How is my budget looking?"));
    expect(needs.budgets).toBe(true);
    expect(needs.previousMonth).toBe(false);
    expect(needs.recent).toBe(false);
  });
});

describe("affordability", () => {
  it("extracts amounts with separators and suffixes", () => {
    expect(extractAmount("Can I afford 5,000?")).toBe(5000);
    expect(extractAmount("Can I afford 5k?")).toBe(5000);
    expect(extractAmount("Kann ich mir 5.000 leisten?")).toBe(5000);
    expect(extractAmount("Can I afford it?")).toBeNull();
  });

  it("judges against money left, never a single category budget", () => {
    // Food budget is blown (12k/10k) but 5k is still comfortable vs 20k left.
    expect(affordabilityVerdict(facts, 5000)).toBe("comfortable");
    expect(affordabilityVerdict(facts, 18000)).toBe("tight");
    expect(affordabilityVerdict(facts, 25000)).toBe("not-now");
  });

  it("is unknown with no data", () => {
    expect(affordabilityVerdict(emptyFacts, 5000)).toBe("unknown");
  });

  it("never invents payday and says so in the context", () => {
    const block = buildContextBlock(facts, ["affordability"], fmt, "Can I afford 5,000?");
    expect(block).toMatch(/PAYDAY: Clario does not track payday/);
    expect(block).toMatch(/NEVER against a single category budget/);
    expect(block).toContain("Affordability target: INR 5000");
  });
});

describe("context block", () => {
  it("includes only the needed sections", () => {
    const block = buildContextBlock(facts, ["comparison"], fmt, "vs last month?");
    expect(block).toContain("Previous month (August 2026)");
    expect(block).not.toContain("Recent expenses");
  });

  it("flags missing data instead of estimating", () => {
    const block = buildContextBlock(emptyFacts, ["spending"], fmt, "What did I spend?");
    expect(block).toMatch(/DATA STATUS: no income, expenses, or budgets/);
    expect(block).toContain("none recorded");
  });

  it("ranks categories by amount with shares", () => {
    const cats = topCategories(facts, fmt);
    expect(cats[0]).toMatchObject({ category: "Rent", share: 50 });
  });
});

describe("deterministic result cards", () => {
  it("builds a comparison card with a server-computed delta", () => {
    const cards = buildCards(facts, ["comparison"], fmt, "vs last month?", labels);
    const card = cards.find((c) => c.type === "comparison");
    expect(card).toMatchObject({ currentValue: "INR 30000", previousValue: "INR 26000" });
    expect(card && "deltaText" in card && card.deltaText).toBe("+INR 4000");
    expect(card && "tone" in card && card.tone).toBe("warn");
  });

  it("builds budget cards with tones", () => {
    const cards = buildCards(facts, ["budget"], fmt, "How is my budget?", labels);
    const food = cards.find((c) => c.type === "budget" && c.category === "Food");
    expect(food).toMatchObject({ percentUsed: 120, tone: "warn" });
  });

  it("builds affordability cards from money left", () => {
    const cards = buildCards(facts, ["affordability"], fmt, "Can I afford 5,000?", labels);
    expect(cards[0]).toMatchObject({ type: "metric", value: "INR 5000", tone: "good" });
    expect(cards[0]).toMatchObject({ hint: "Left after this: INR 15000" });
  });

  it("builds a transactions card for recent questions", () => {
    const cards = buildCards(facts, ["recent"], fmt, "recent transactions", labels);
    const tx = cards.find((c) => c.type === "transactions");
    expect(tx && "items" in tx && tx.items[0]?.label).toBe("Food · Late night biryani");
  });

  it("shows no cards when there is no data", () => {
    expect(buildCards(emptyFacts, ["spending"], fmt, "spend?", labels)).toEqual([]);
  });

  it("respects the currency formatter it is given", () => {
    const eur = (v: number) => `€${v}`;
    const cards = buildCards(facts, ["spending"], fmt === eur ? ["spending"] : ["spending"], eur, labels);
    expect(cards[0]).toMatchObject({ value: "€30000" });
  });
});

describe("model response validation", () => {
  it("accepts a valid JSON payload", () => {
    expect(parseModelResponse('{"answer":"You spent INR 30000 this month."}')).toEqual({
      answer: "You spent INR 30000 this month.",
    });
  });

  it("recovers a fenced JSON payload", () => {
    expect(parseModelResponse('```json\n{"answer":"Nice work."}\n```')?.answer).toBe("Nice work.");
  });

  it("accepts validated prose", () => {
    expect(parseModelResponse("Plain prose reply")?.answer).toBe("Plain prose reply");
  });

  it("rejects malformed or empty output", () => {
    expect(parseModelResponse('{"answer":')).toBeNull();
    expect(parseModelResponse("")).toBeNull();
    expect(parseModelResponse(null)).toBeNull();
    expect(parseModelResponse("   ")).toBeNull();
  });

  it("rejects a wrong-shape payload", () => {
    expect(parseModelResponse('{"reply": 42}')).toBeNull();
  });
});

describe("deterministic fallback", () => {
  const strings = {
    noData: "No data yet.",
    summary: "In {month} you earned {income}, spent {spent}, leaving {net}.",
    unavailable: "Unavailable.",
  };

  it("summarises with server figures when the model fails", () => {
    expect(deterministicAnswer(facts, fmt, strings)).toBe(
      "In September 2026 you earned INR 50000, spent INR 30000, leaving INR 20000.",
    );
  });

  it("uses the no-data message when nothing is recorded", () => {
    expect(deterministicAnswer(emptyFacts, fmt, strings)).toBe("No data yet.");
  });
});

describe("four-language dictionaries", () => {
  it("keeps exactly the four configured languages", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["en", "de", "es", "fr"]);
  });

  it("has every English key in all four dictionaries", () => {
    const keys = Object.keys(DICTS.en);
    for (const { code } of LANGUAGES) {
      const missing = keys.filter((k) => !DICTS[code][k]);
      expect(missing, `missing in ${code}`).toEqual([]);
    }
  });

  it("translates every Lhana string in all four languages", () => {
    const lhanaKeys = Object.keys(DICTS.en).filter((k) => k.startsWith("lhana."));
    expect(lhanaKeys.length).toBeGreaterThan(20);
    for (const { code } of LANGUAGES) {
      for (const key of lhanaKeys) expect(translate(code, key)).not.toBe(key);
    }
  });
});
