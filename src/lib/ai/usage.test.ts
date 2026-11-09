import { describe, expect, it } from "vitest";
import { AI_LIMITS } from "./usage.server";

describe("AI usage limits", () => {
  it("Lhana allows 20 requests a day with a 4s cooldown", () => {
    expect(AI_LIMITS.lhana).toEqual({ daily: 20, cooldown: 4 });
  });
  it("Insights allows 5 requests a day with a 5s cooldown", () => {
    expect(AI_LIMITS.insights).toEqual({ daily: 5, cooldown: 5 });
  });
  it("Briefing allows 2 requests a day with a 5s cooldown", () => {
    expect(AI_LIMITS.briefing).toEqual({ daily: 2, cooldown: 5 });
  });
});
