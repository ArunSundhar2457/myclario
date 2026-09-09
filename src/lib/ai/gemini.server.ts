/**
 * Shared server-only Gemini helper for all of Clario's AI features
 * (Briefing, Insights, Ask Lhana). Single infrastructure layer —
 * no other AI provider or gateway is used.
 *
 * Callers build their own prompts; this helper owns the HTTP request,
 * error logging, and response extraction. It returns `null` on any
 * failure so callers can fall back to deterministic output.
 */

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiMessage = { role: "user" | "model"; text: string };

export async function callGemini(options: {
  system?: string;
  messages: GeminiMessage[];
  json?: boolean;
  temperature?: number;
}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...(options.system
          ? { systemInstruction: { parts: [{ text: options.system }] } }
          : {}),
        contents: options.messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          ...(options.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
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

/** Convenience wrapper for single-prompt JSON generations. */
export async function callGeminiJson(prompt: string): Promise<string | null> {
  return callGemini({ messages: [{ role: "user", text: prompt }], json: true });
}
