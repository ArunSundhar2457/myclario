-- When a user account is deleted, automatically delete their
-- expenses, income and budgets too (todos and profiles already cascade).
-- Safe to run more than once: each constraint is only added if missing.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_user_id_fkey') then
    alter table public.expenses
      add constraint expenses_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'income_user_id_fkey') then
    alter table public.income
      add constraint income_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'budgets_user_id_fkey') then
    alter table public.budgets
      add constraint budgets_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;
