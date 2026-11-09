CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  feature text NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date, feature)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER ai_usage_set_updated_at BEFORE UPDATE ON public.ai_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_feature text, p_limit int, p_cooldown_seconds int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.ai_usage%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;
  IF p_feature NOT IN ('lhana','insights','briefing') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_feature');
  END IF;
  INSERT INTO public.ai_usage (user_id, usage_date, feature, request_count, last_requested_at)
  VALUES (v_uid, CURRENT_DATE, p_feature, 0, now() - interval '1 day')
  ON CONFLICT (user_id, usage_date, feature) DO NOTHING;

  SELECT * INTO v_row FROM public.ai_usage
  WHERE user_id = v_uid AND usage_date = CURRENT_DATE AND feature = p_feature
  FOR UPDATE;

  IF now() - v_row.last_requested_at < make_interval(secs => p_cooldown_seconds) THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'cooldown');
  END IF;
  IF v_row.request_count >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'quota_exceeded');
  END IF;

  UPDATE public.ai_usage SET request_count = request_count + 1, last_requested_at = now()
  WHERE id = v_row.id;
  RETURN jsonb_build_object('allowed', true, 'remaining', p_limit - v_row.request_count - 1);
END;
$$;
REVOKE ALL ON FUNCTION public.check_and_increment_ai_usage(text,int,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(text,int,int) TO authenticated;