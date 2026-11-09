import type { SupabaseClient } from "@supabase/supabase-js";

export type AiFeature = "lhana" | "insights" | "briefing";
export type UsageDecision = { allowed: true } | { allowed: false; reason: "quota" | "cooldown" };

/** Per-feature daily quota and minimum seconds between requests. */
export const AI_LIMITS: Record<AiFeature, { daily: number; cooldown: number }> = {
  lhana: { daily: 20, cooldown: 4 },
  insights: { daily: 5, cooldown: 5 },
  briefing: { daily: 2, cooldown: 5 },
};

/**
 * Atomically checks and consumes one AI request for the signed-in user.
 * Runs before any model call so a blocked request never spends tokens.
 * Fails closed: if the check itself errors, the request is treated as limited.
 */
export async function consumeAiUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  feature: AiFeature,
  cooldownOverride?: number,
): Promise<UsageDecision> {
  const limit = AI_LIMITS[feature];
  const { data, error } = await supabase.rpc("check_and_increment_ai_usage", {
    p_feature: feature,
    p_limit: limit.daily,
    p_cooldown_seconds: cooldownOverride ?? limit.cooldown,
  });
  if (error || !data) {
    console.error("[ai-usage] check failed", error?.message);
    return { allowed: false, reason: "cooldown" };
  }
  const res = data as { allowed?: boolean; reason?: string };
  if (res.allowed) return { allowed: true };
  return { allowed: false, reason: res.reason === "quota_exceeded" ? "quota" : "cooldown" };
}
