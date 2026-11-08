-- FXFINN initial PostgreSQL schema for Supabase.
-- Apply with: supabase db push (or paste into Supabase SQL Editor).
create extension if not exists pgcrypto;

create type public.transaction_type as enum ('income','expense','transfer','investment','debt_payment','asset_purchase','asset_sale');
create type public.goal_priority as enum ('low','medium','high');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  type text not null check (type in ('cash','bank','brokerage','wallet','credit_card','other')),
  currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'), current_balance numeric(20,2) not null default 0 check (current_balance >= 0), notes text,
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  date date not null, type public.transaction_type not null, category text not null check (char_length(category) between 1 and 80),
  amount numeric(20,2) not null check (amount > 0), currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  account_id uuid references public.accounts(id) on delete set null,
  transfer_account_id uuid references public.accounts(id) on delete set null,
  description text not null default '' check (char_length(description) <= 160), notes text check (char_length(notes) <= 2000),
  attachment_path text, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (account_id is null or account_id <> transfer_account_id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  category text not null check (category in ('Cash','Bank Account','Stocks','ETF','Mutual Fund','Gold','Real Estate','Crypto','Business','Vehicle','Other')),
  purchase_value numeric(20,2) not null check (purchase_value >= 0), current_value numeric(20,2) not null check (current_value >= 0),
  purchase_date date, quantity numeric(24,8) check (quantity is null or quantity >= 0), currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  notes text check (char_length(notes) <= 2000), deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  type text not null check (type in ('Credit Card','Personal Loan','Home Loan','Vehicle Loan','Education Loan','Business Loan','Other Debt')),
  original_amount numeric(20,2) not null check (original_amount >= 0), outstanding_amount numeric(20,2) not null check (outstanding_amount >= 0),
  interest_rate numeric(7,4) not null default 0 check (interest_rate between 0 and 100), monthly_payment numeric(20,2) not null default 0 check (monthly_payment >= 0),
  due_date date, currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'), notes text check (char_length(notes) <= 2000),
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), goal_type text not null default 'net_worth',
  target_amount numeric(20,2) not null check (target_amount > 0), current_amount numeric(20,2) not null default 0 check (current_amount >= 0),
  target_date date, priority public.goal_priority not null default 'medium', currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  notes text check (char_length(notes) <= 2000), completed_at timestamptz, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.allocations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 80), percentage numeric(7,4) not null check (percentage between 0 and 100),
  sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, category)
);

create table public.wealth_levels (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40), min_net_worth numeric(20,2) not null check (min_net_worth >= 0),
  color text not null default '#B78A35', sort_order integer not null default 0, created_at timestamptz not null default now(),
  unique(user_id, name), unique(user_id, min_net_worth)
);

create table public.achievement_definitions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  key text not null, title text not null, description text not null, condition_type text not null,
  threshold numeric(20,2), created_at timestamptz not null default now(), unique(user_id, key)
);
alter table public.achievement_definitions add constraint achievement_definitions_id_user_unique unique (id, user_id);
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null,
  unlocked_at timestamptz not null default now(), unique(user_id, achievement_id),
  constraint user_achievements_owner_fk foreign key (achievement_id, user_id)
    references public.achievement_definitions(id, user_id) on delete cascade
);

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null, total_assets numeric(20,2) not null, total_liabilities numeric(20,2) not null,
  net_worth numeric(20,2) not null, currency char(3) not null default 'INR', created_at timestamptz not null default now(),
  unique(user_id, snapshot_date, currency)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('monthly','quarterly','yearly')), period_start date not null, period_end date not null,
  status text not null default 'generated' check (status in ('queued','generated','failed')), storage_path text,
  created_at timestamptz not null default now(), check (period_end >= period_start)
);
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications jsonb not null default '{"goal_milestones":true,"monthly_summary":true,"allocation_warnings":true}'::jsonb,
  privacy jsonb not null default '{}'::jsonb, preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null, entity_type text, entity_id uuid, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions(user_id, date desc) where deleted_at is null;
create index transactions_user_type_idx on public.transactions(user_id, type, date desc) where deleted_at is null;
create index assets_user_idx on public.assets(user_id) where deleted_at is null;
create index liabilities_user_idx on public.liabilities(user_id) where deleted_at is null;
create index goals_user_idx on public.goals(user_id) where deleted_at is null;
create index snapshots_user_date_idx on public.net_worth_snapshots(user_id, snapshot_date desc);
create index audit_user_created_idx on public.audit_logs(user_id, created_at desc);

-- Create a profile and default wealth tiers after signup. No default financial amounts are fabricated.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')) on conflict (id) do nothing;
  insert into public.settings(user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.wealth_levels(user_id,name,min_net_worth,color,sort_order) values
    (new.id,'Bronze',0,'#B77B4B',1),(new.id,'Silver',100000,'#8B95A5',2),(new.id,'Gold',500000,'#B78A35',3),
    (new.id,'Platinum',1000000,'#54758F',4),(new.id,'Diamond',5000000,'#4F8DAB',5);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- All API access uses the authenticated Supabase role. RLS is the last-line tenant boundary.
do $$
declare t text;
begin
  foreach t in array array['profiles','accounts','transactions','assets','liabilities','goals','allocations','wealth_levels','achievement_definitions','user_achievements','net_worth_snapshots','reports','settings','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
create policy "profile owner" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "accounts owner" on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions owner" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "assets owner" on public.assets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "liabilities owner" on public.liabilities for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals owner" on public.goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "allocations owner" on public.allocations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "wealth levels owner" on public.wealth_levels for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "achievement defs owner" on public.achievement_definitions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "achievements owner" on public.user_achievements for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "snapshots owner" on public.net_worth_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reports owner" on public.reports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings owner" on public.settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit owner read" on public.audit_logs for select using (user_id = auth.uid());
create policy "audit owner insert" on public.audit_logs for insert with check (user_id = auth.uid());

-- Accounts referenced by a ledger row must belong to the same user.
create or replace function public.validate_transaction_accounts()
returns trigger language plpgsql as $$
begin
  if new.account_id is not null and not exists(select 1 from public.accounts a where a.id = new.account_id and a.user_id = new.user_id) then
    raise exception 'Account does not belong to this user';
  end if;
  if new.transfer_account_id is not null and not exists(select 1 from public.accounts a where a.id = new.transfer_account_id and a.user_id = new.user_id) then
    raise exception 'Transfer account does not belong to this user';
  end if;
  return new;
end; $$;
create trigger transaction_account_guard before insert or update on public.transactions for each row execute procedure public.validate_transaction_accounts();

create or replace function public.replace_allocations(p_items jsonb)
returns void language plpgsql security invoker as $$
declare item jsonb; total numeric(9,4) := 0;
begin
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Allocation payload must be an array'; end if;
  for item in select * from jsonb_array_elements(p_items) loop
    if coalesce((item->>'percentage')::numeric, -1) < 0 or (item->>'percentage')::numeric > 100 then raise exception 'Invalid allocation percentage'; end if;
    total := total + (item->>'percentage')::numeric;
  end loop;
  if abs(total - 100) > 0.0001 then raise exception 'Allocation percentages must total 100'; end if;
  delete from public.allocations where user_id = auth.uid();
  insert into public.allocations(user_id,category,percentage,sort_order)
  select auth.uid(), x.category, x.percentage, x.sort_order
  from jsonb_to_recordset(p_items) as x(category text, percentage numeric, sort_order integer);
end; $$;
revoke all on function public.replace_allocations(jsonb) from public;
grant execute on function public.replace_allocations(jsonb) to authenticated;

-- Updated-at triggers.
do $$ declare t text; begin
  foreach t in array array['profiles','accounts','transactions','assets','liabilities','goals','allocations','settings'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end $$;

-- Private Storage bucket for attachments; access is scoped to auth.uid()/{path}.
insert into storage.buckets(id,name,public) values ('fxfinn-private','fxfinn-private',false) on conflict (id) do nothing;
create policy "private file owner read" on storage.objects for select to authenticated using (bucket_id='fxfinn-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private file owner write" on storage.objects for insert to authenticated with check (bucket_id='fxfinn-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private file owner update" on storage.objects for update to authenticated using (bucket_id='fxfinn-private' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id='fxfinn-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private file owner delete" on storage.objects for delete to authenticated using (bucket_id='fxfinn-private' and (storage.foldername(name))[1] = auth.uid()::text);
