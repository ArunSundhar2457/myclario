
-- EXPENSES
CREATE TABLE public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  description text,
  occurred_on date not null default current_date,
  is_recurring boolean not null default false,
  recurrence text check (recurrence in ('daily','weekly','monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own expenses" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own expenses" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own expenses" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER expenses_set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX expenses_user_date_idx ON public.expenses (user_id, occurred_on DESC);
CREATE INDEX expenses_user_cat_date_idx ON public.expenses (user_id, category, occurred_on);

-- INCOME
CREATE TABLE public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  description text,
  occurred_on date not null default current_date,
  is_recurring boolean not null default false,
  recurrence text check (recurrence in ('daily','weekly','monthly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income TO authenticated;
GRANT ALL ON public.income TO service_role;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own income" ON public.income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own income" ON public.income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own income" ON public.income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own income" ON public.income FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER income_set_updated_at BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX income_user_date_idx ON public.income (user_id, occurred_on DESC);

-- BUDGETS
CREATE TABLE public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  month date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own budgets" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own budgets" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own budgets" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER budgets_set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
