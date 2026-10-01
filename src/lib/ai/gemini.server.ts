/**
 * Shared server-only AI helper for all of Clario's AI features
 * (Briefing, Insights, Ask Lhana), backed by GroqCloud.
 *
 * Groq exposes an OpenAI-compatible Chat Completions API.
 * Callers build their own prompts; this helper owns the HTTP request,
 * error logging, and response extraction. It returns `null` on any
 * failure so callers can fall back to deterministic output.
 *
 * Secrets (add in Lovable → Cloud → Secrets):
 *   GROQ_API_KEY  required
 *   GROQ_MODEL    optional, defaults to DEFAULT_MODEL below. Groq retires
 *                 models often, so keeping this in a secret lets you switch
 *                 without a code change.
 */

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 20_000;

/** "model" is kept as a role name so existing callers don't need changes. */
export type AIMessage = { role: "user" | "model"; text: string };
export type GeminiMessage = AIMessage; // backwards-compatible alias

function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  if (!signal) return timeout;
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal;
}

export async function callAI(options: {
  system?: string;
  messages: AIMessage[];
  json?: boolean;
  temperature?: number;
  /** Caller-owned cancellation (user pressed Stop / client disconnected). */
  signal?: AbortSignal;
}): Promise<string | null> {
  // Read env inside the function: on Cloudflare Workers env binds per request.
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error("[ai] GROQ_API_KEY is not set");
    return null;
  }
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: withTimeout(options.signal),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(options.system ? [{ role: "system", content: options.system }] : []),
          ...options.messages.map((m) => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.text,
          })),
        ],
        temperature: options.temperature ?? 0.7,
        max_completion_tokens: 1024,
        // gpt-oss models reason before answering; "low" keeps replies fast and cheap.
        reasoning_effort: "low",
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!res.ok) {
      console.error("[ai] Groq error", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    return json.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[ai] Groq call failed", err);
    return null;
  }
}

/** Convenience wrapper for single-prompt JSON generations. */
export async function callAIJson(prompt: string): Promise<string | null> {
  return callAI({ messages: [{ role: "user", text: prompt }], json: true });
}

// Backwards-compatible names so briefing/insights/lhana keep working unchanged.
export const callGemini = callAI;
export const callGeminiJson = callAIJson;
