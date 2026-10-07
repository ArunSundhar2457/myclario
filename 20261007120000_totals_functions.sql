-- Aggregate functions so totals are summed inside Postgres.
--
-- Why: Supabase's API returns at most 1,000 rows per request, so adding up
-- rows in the app silently under-counts once someone has >1,000 transactions.
-- These functions return only the small summed result.
--
-- They run as the calling user (SECURITY INVOKER, the default), so the
-- existing row-level security still applies: each person only ever sums
-- their own rows. Passing NULL for p_from / p_to means "no limit".
-- p_from is inclusive, p_to is EXCLUSIVE (matches the app's month bounds).
-- Safe to run more than once.

create or replace function public.get_totals(p_from date default null, p_to date default null)
returns table (income numeric, spent numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(i.amount) from public.income i
              where (p_from is null or i.occurred_on >= p_from)
                and (p_to is null or i.occurred_on < p_to)), 0)::numeric as income,
    coalesce((select sum(e.amount) from public.expenses e
              where (p_from is null or e.occurred_on >= p_from)
                and (p_to is null or e.occurred_on < p_to)), 0)::numeric as spent;
$$;

create or replace function public.get_expense_category_totals(p_from date, p_to date)
returns table (category text, total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select e.category, sum(e.amount)::numeric as total
  from public.expenses e
  where e.occurred_on >= p_from and e.occurred_on < p_to
  group by e.category;
$$;

create or replace function public.get_daily_totals(p_from date, p_to date)
returns table (day date, income numeric, spent numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select d.day,
         coalesce(sum(d.income), 0)::numeric as income,
         coalesce(sum(d.spent), 0)::numeric as spent
  from (
    select i.occurred_on as day, i.amount as income, 0::numeric as spent
      from public.income i
      where i.occurred_on >= p_from and i.occurred_on < p_to
    union all
    select e.occurred_on, 0::numeric, e.amount
      from public.expenses e
      where e.occurred_on >= p_from and e.occurred_on < p_to
  ) d
  group by d.day
  order by d.day;
$$;

-- Only signed-in users may call these (not anonymous visitors).
revoke execute on function public.get_totals(date, date) from public, anon;
revoke execute on function public.get_expense_category_totals(date, date) from public, anon;
revoke execute on function public.get_daily_totals(date, date) from public, anon;
grant execute on function public.get_totals(date, date) to authenticated;
grant execute on function public.get_expense_category_totals(date, date) to authenticated;
grant execute on function public.get_daily_totals(date, date) to authenticated;
