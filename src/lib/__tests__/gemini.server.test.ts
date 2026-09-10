import { afterEach, describe, expect, it, vi } from "vitest";
import { callGemini, callGeminiJson } from "../ai/gemini.server";

/**
 * Regression guard for the single shared Gemini helper used by
 * Ask Lhana, Insights, and the Daily Briefing.
 */
const originalKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  process.env.GEMINI_API_KEY = originalKey;
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string, init: RequestInit) => unknown) {
  const spy = vi.fn(async (url: string, init: RequestInit) => impl(url, init));
  vi.stubGlobal("fetch", spy);
  return spy;
}

const ok = (text: string) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

describe("callGemini", () => {
  it("returns null without an API key and makes no request", async () => {
    delete process.env.GEMINI_API_KEY;
    const spy = stubFetch(() => ok("nope"));
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("makes exactly one request and returns the text", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const spy = stubFetch(() => ok("Hello from Lhana"));
    const out = await callGemini({ messages: [{ role: "user", text: "hi" }] });
    expect(out).toBe("Hello from Lhana");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("passes system instruction, JSON mode, and abort signal through", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const controller = new AbortController();
    const spy = stubFetch(() => ok('{"answer":"ok"}'));
    await callGemini({
      system: "be nice",
      json: true,
      signal: controller.signal,
      messages: [{ role: "user", text: "hi" }],
    });
    const init = spy.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.systemInstruction.parts[0].text).toBe("be nice");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(init.signal).toBe(controller.signal);
  });

  it("returns null on an API error instead of throwing (Insights/Briefing fallback)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    stubFetch(() => ({ ok: false, status: 429, text: async () => "rate limited" }));
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
  });

  it("returns null when the network call throws", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    stubFetch(() => {
      throw new Error("boom");
    });
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
  });

  it("callGeminiJson requests JSON output (Insights/Briefing behaviour)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const spy = stubFetch(() => ok('{"greeting":"Hi"}'));
    const out = await callGeminiJson("prompt");
    expect(out).toBe('{"greeting":"Hi"}');
    const body = JSON.parse((spy.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.contents).toHaveLength(1);
  });
});
