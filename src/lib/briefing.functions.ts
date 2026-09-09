import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callGeminiJson } from "./ai/gemini.server";

const inputSchema = z.object({
  monthLabel: z.string(),
  currency: z.string(),
});

type Briefing = {
  greeting: string;
  insight: string;
  nudge: string;
};

/**
 * AI Daily Briefing.
 * Calls Gemini directly with the user's GEMINI_API_KEY secret.
 * Falls back to a friendly canned briefing if the API call fails.
 */
export const getDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Pull lightweight context: today's pending todos count.
    const today = new Date().toISOString().slice(0, 10);
    const { count: openTodos } = await supabase
      .from("todos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", false)
      .lte("due_date", today);

    const fallback: Briefing = {
      greeting: "Welcome back.",
      insight:
        "You're just getting started — add a few transactions and tasks and Clario will start spotting patterns for you.",
      nudge:
        openTodos && openTodos > 0
          ? `Knock out one of your ${openTodos} open task${openTodos === 1 ? "" : "s"} to build momentum.`
          : "Add today's first task to set the tone for the day.",
    };

    const key = process.env.GEMINI_API_KEY;
    if (!key) return fallback;

    const prompt = `You are Clario, a calm, smart, encouraging personal finance + planning coach.
Return ONLY a compact JSON object with keys: greeting, insight, nudge.
- greeting: 4-7 friendly words, no name.
- insight: 1 sentence (<= 22 words) about the user's month so far in ${data.currency}.
- nudge: 1 sentence (<= 16 words) telling them the single best next action.
Context:
- Month: ${data.monthLabel}
- Open tasks due today or earlier: ${openTodos ?? 0}
- This is an early session; financial data may be sparse.
No markdown, no preface, just JSON.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!res.ok) {
        console.error("Gemini error", res.status, await res.text());
        return fallback;
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = JSON.parse(text) as Partial<Briefing>;
      return {
        greeting: parsed.greeting?.trim() || fallback.greeting,
        insight: parsed.insight?.trim() || fallback.insight,
        nudge: parsed.nudge?.trim() || fallback.nudge,
      } satisfies Briefing;
    } catch (err) {
      console.error("Gemini call failed", err);
      return fallback;
    }
  });
