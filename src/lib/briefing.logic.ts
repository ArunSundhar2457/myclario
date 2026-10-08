/** Pure helpers for the AI daily briefing (kept separate so they can be unit-tested). */

export const LANGUAGE_NAME = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
} as const;

export type BriefingLanguage = keyof typeof LANGUAGE_NAME;

export type BriefingFacts = {
  monthLabel: string;
  /** Already formatted in the user's currency, e.g. "€1,200". */
  income: string;
  spent: string;
  topCategory: { name: string; amount: string } | null;
  openTasks: number;
  hasActivity: boolean;
};

/** Keep free text prompt-safe: strip control/markup characters and cap length. */
export function sanitizeLabel(s: string, max = 40): string {
  return s
    .replace(/[{}[\]<>\\`\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function buildBriefingPrompt(f: BriefingFacts, language: BriefingLanguage): string {
  const facts = f.hasActivity
    ? [
        `- Income so far: ${f.income}`,
        `- Spent so far: ${f.spent}`,
        `- Top spending category: ${f.topCategory ? `${f.topCategory.name} (${f.topCategory.amount})` : "none yet"}`,
      ]
    : ["- No income or spending recorded yet this month."];

  return `You are Clario, a calm, smart, encouraging personal finance + planning coach.
Write in ${LANGUAGE_NAME[language]}.
Return ONLY a compact JSON object with keys: greeting, insight, nudge.
- greeting: 4-7 friendly words, no name.
- insight: 1 sentence (<= 22 words) about the user's month so far. Use ONLY the facts below. Copy any amount exactly as written. Never invent or estimate numbers.
- nudge: 1 sentence (<= 16 words) telling them the single best next action.
Facts:
- Month: ${f.monthLabel}
${facts.join("\n")}
- Open tasks due today or earlier: ${f.openTasks}
No markdown, no preface, just JSON.`;
}
