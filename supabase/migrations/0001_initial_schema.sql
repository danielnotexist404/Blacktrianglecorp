-- =============================================================
-- BTG Trader — initial schema
-- Applied to a fresh Supabase project. Idempotent where reasonable.
-- =============================================================

-- ---------- profiles ----------
-- Mirrors auth.users with app-specific fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- user_preferences ----------
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'demo'
    check (mode in ('demo', 'live')),
  selected_symbol text not null default 'BTCUSDT.P',
  focus_mode text not null default 'both'
    check (focus_mode in ('large_only', 'small_only', 'both')),
  risk_per_trade_pct numeric(5,2) not null default 1.00
    check (risk_per_trade_pct > 0 and risk_per_trade_pct <= 10),
  daily_loss_cap_pct numeric(5,2) not null default 5.00
    check (daily_loss_cap_pct > 0 and daily_loss_cap_pct <= 50),
  max_leverage int not null default 3
    check (max_leverage between 1 and 50),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "prefs_all_own" on public.user_preferences;
create policy "prefs_all_own"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- api_keys ----------
-- Encrypts api_key + api_secret at rest via pgsodium Transparent
-- Column Encryption. Withdraw permission is forbidden at the
-- check-constraint level; server-side verification with Bybit
-- /v5/user/query-api is enforced before insert.
create extension if not exists pgsodium;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange text not null default 'bybit'
    check (exchange = 'bybit'),
  mode text not null
    check (mode in ('demo', 'live')),
  label text not null,
  api_key text not null,
  api_secret text not null,
  permissions text[] not null
    check (
      permissions <@ array['read','trade']::text[]
      and not ('withdraw' = any(permissions))
    ),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- Encrypt the credential columns at rest.
security label for pgsodium
  on column public.api_keys.api_key
  is 'ENCRYPT WITH KEY ID null SECURITY INVOKER';

security label for pgsodium
  on column public.api_keys.api_secret
  is 'ENCRYPT WITH KEY ID null SECURITY INVOKER';

create index if not exists idx_api_keys_user
  on public.api_keys (user_id, revoked_at);

alter table public.api_keys enable row level security;

drop policy if exists "keys_select_own" on public.api_keys;
create policy "keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);

drop policy if exists "keys_insert_own" on public.api_keys;
create policy "keys_insert_own"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

drop policy if exists "keys_update_own" on public.api_keys;
create policy "keys_update_own"
  on public.api_keys for update
  using (auth.uid() = user_id);

drop policy if exists "keys_delete_own" on public.api_keys;
create policy "keys_delete_own"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- ---------- signals ----------
-- Emitted by the strategy engine; one row per evaluated setup.
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('long','short')),
  lvn_low numeric not null,
  lvn_high numeric not null,
  atr_14 numeric,
  status text not null default 'pending'
    check (status in ('pending','filled','invalidated','sl_hit','cancelled')),
  result_r numeric,
  ts timestamptz not null default now()
);

create index if not exists idx_signals_user_ts
  on public.signals (user_id, ts desc);

alter table public.signals enable row level security;

drop policy if exists "signals_select_own" on public.signals;
create policy "signals_select_own"
  on public.signals for select
  using (auth.uid() = user_id);

-- ---------- positions ----------
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid references public.signals(id),
  exchange text not null default 'bybit',
  mode text not null check (mode in ('demo','live')),
  symbol text not null,
  side text not null check (side in ('long','short')),
  entry_price numeric not null,
  size_usd numeric not null,
  stop_loss numeric not null,
  partials_total int not null default 4,
  partials_hit int not null default 0,
  status text not null default 'open'
    check (status in ('open','closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  pnl_usd numeric
);

create index if not exists idx_positions_user_status
  on public.positions (user_id, status);

alter table public.positions enable row level security;

drop policy if exists "positions_select_own" on public.positions;
create policy "positions_select_own"
  on public.positions for select
  using (auth.uid() = user_id);

-- ---------- trades ----------
-- Closed positions / completed fills for the history view.
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_id uuid references public.positions(id),
  exchange text not null default 'bybit',
  mode text not null check (mode in ('demo','live')),
  symbol text not null,
  side text not null check (side in ('long','short')),
  entry_price numeric not null,
  exit_price numeric not null,
  size_usd numeric not null,
  pnl_usd numeric not null,
  result_r numeric not null,
  duration_sec int not null,
  outcome text not null check (outcome in ('win','loss','break_even')),
  opened_at timestamptz not null,
  closed_at timestamptz not null
);

create index if not exists idx_trades_user_closed
  on public.trades (user_id, closed_at desc);

alter table public.trades enable row level security;

drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own"
  on public.trades for select
  using (auth.uid() = user_id);

-- ---------- handle_new_user trigger ----------
-- Auto-creates profile + default preferences when a Supabase auth.users
-- row is inserted (i.e. on signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.user_preferences (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at triggers ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_profiles_touch on public.profiles;
create trigger tr_profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists tr_prefs_touch on public.user_preferences;
create trigger tr_prefs_touch
  before update on public.user_preferences
  for each row execute function public.touch_updated_at();
