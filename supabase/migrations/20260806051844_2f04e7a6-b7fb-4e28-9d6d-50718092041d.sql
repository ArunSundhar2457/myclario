CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'INR',
  rate_date date NOT NULL,
  rates jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, rate_date)
);

GRANT SELECT ON public.exchange_rates TO anon;
GRANT SELECT ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exchange rates are publicly readable"
ON public.exchange_rates FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER exchange_rates_set_updated_at
BEFORE UPDATE ON public.exchange_rates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;