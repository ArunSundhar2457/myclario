import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callGemini, callGeminiJson } from "../ai/gemini.server";

/**
 * Tests for the shared AI helper (now backed by Groq) used by
 * Ask Lhana, Insights and the Daily Briefing.
 */

const originalKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;

beforeEach(() => {
  process.env.GROQ_API_KEY = "test-key";
  delete process.env.GROQ_MODEL;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env.GROQ_API_KEY = originalKey;
  process.env.GROQ_MODEL = originalModel;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(impl: () => unknown) {
  const spy = vi.fn(async (_url: string, _init: RequestInit) => impl());
  vi.stubGlobal("fetch", spy);
  return spy;
}

const ok = (text: string) => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content: text } }] }),
});

describe("callGemini (Groq)", () => {
  it("returns null without an API key and makes no request", async () => {
    delete process.env.GROQ_API_KEY;
    const spy = stubFetch(() => ok("unused"));
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("sends a Bearer token, the default model and maps roles", async () => {
    const spy = stubFetch(() => ok("hello"));
    const result = await callGemini({
      system: "be calm",
      messages: [
        { role: "user", text: "q1" },
        { role: "model", text: "a1" },
      ],
    });
    expect(result).toBe("hello");

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
    // The key must never appear in the URL.
    expect(url).not.toContain("test-key");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.messages).toEqual([
      { role: "system", content: "be calm" },
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
    ]);
    expect(body.response_format).toBeUndefined();
  });

  it("uses GROQ_MODEL when set", async () => {
    process.env.GROQ_MODEL = "openai/gpt-oss-20b";
    const spy = stubFetch(() => ok("x"));
    await callGemini({ messages: [{ role: "user", text: "hi" }] });
    expect(JSON.parse(spy.mock.calls[0][1].body as string).model).toBe("openai/gpt-oss-20b");
  });

  it("returns null on an error response", async () => {
    stubFetch(() => ({ ok: false, status: 429, text: async () => "rate limited" }));
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
  });

  it("returns null when the request throws", async () => {
    stubFetch(() => {
      throw new Error("network down");
    });
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
  });

  it("returns null when the response has no content", async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ choices: [] }) }));
    expect(await callGemini({ messages: [{ role: "user", text: "hi" }] })).toBeNull();
  });
});

describe("callGeminiJson", () => {
  it("requests JSON output", async () => {
    const spy = stubFetch(() => ok('{"tip":"save"}'));
    expect(await callGeminiJson("give a tip as JSON")).toBe('{"tip":"save"}');
    const body = JSON.parse(spy.mock.calls[0][1].body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
  });
});
