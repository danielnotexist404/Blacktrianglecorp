-- =============================================================
-- 0003 — admin role (by email whitelist) + subscription_tier
-- Safe to run after 0001 + 0002. Idempotent.
-- =============================================================

-- ---------- admin_emails whitelist ----------
-- Source of truth for who is an admin. Editing this table promotes /
-- demotes admins immediately, with no app redeploy.
create table if not exists public.admin_emails (
  email text primary key,
  added_at timestamptz not null default now(),
  note text
);

-- Bootstrap the initial admins. Idempotent via ON CONFLICT.
insert into public.admin_emails (email, note) values
  ('blacktrianglecorp@proton.me', 'Founder'),
  ('danielnotexist@proton.me',    'Founder')
on conflict (email) do nothing;

-- Lock down the table — nobody reads it via PostgREST. is_admin() reads
-- it via SECURITY DEFINER so the RLS doesn't apply there.
alter table public.admin_emails enable row level security;
-- (Intentionally no policies — that means no select/insert/update/delete
--  from clients. Manage via SQL editor or service-role only.)

-- ---------- is_admin() ----------
-- Returns true if the currently authenticated user's email is in
-- admin_emails. SECURITY DEFINER lets us cross RLS on both
-- admin_emails and auth.users without recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from public.admin_emails ae
    join auth.users au on au.email = ae.email
    where au.id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ---------- subscription_tier on profiles ----------
alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'starter', 'pro', 'max', 'ultra'));

-- ---------- Admin-bypass RLS policies ----------
-- For each user-scoped table, add a policy that admins can SELECT/UPDATE/DELETE
-- any row. Original "user sees own" policies stay in place; PostgreSQL
-- combines policies with OR for the same command.

-- profiles
drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins_update_all_profiles" on public.profiles;
create policy "admins_update_all_profiles"
  on public.profiles for update
  using (public.is_admin());

-- user_preferences
drop policy if exists "admins_all_user_prefs" on public.user_preferences;
create policy "admins_all_user_prefs"
  on public.user_preferences for all
  using (public.is_admin())
  with check (public.is_admin());

-- api_keys
drop policy if exists "admins_select_all_keys" on public.api_keys;
create policy "admins_select_all_keys"
  on public.api_keys for select
  using (public.is_admin());

drop policy if exists "admins_delete_all_keys" on public.api_keys;
create policy "admins_delete_all_keys"
  on public.api_keys for delete
  using (public.is_admin());

-- signals
drop policy if exists "admins_select_all_signals" on public.signals;
create policy "admins_select_all_signals"
  on public.signals for select
  using (public.is_admin());

-- positions
drop policy if exists "admins_select_all_positions" on public.positions;
create policy "admins_select_all_positions"
  on public.positions for select
  using (public.is_admin());

-- trades
drop policy if exists "admins_select_all_trades" on public.trades;
create policy "admins_select_all_trades"
  on public.trades for select
  using (public.is_admin());

-- ---------- Convenience view for admin user listing ----------
-- Joins profiles + auth.users (only the safe fields) + api_key count.
-- SECURITY INVOKER so RLS still applies (admin policies above let admins
-- read everything).
create or replace view public.admin_users_overview as
select
  p.id,
  p.email,
  p.subscription_tier,
  p.created_at,
  p.updated_at,
  exists (
    select 1 from public.admin_emails ae where ae.email = p.email
  ) as is_admin,
  (
    select count(*)
    from public.api_keys k
    where k.user_id = p.id and k.revoked_at is null
  ) as active_keys,
  (
    select max(au.last_sign_in_at)
    from auth.users au where au.id = p.id
  ) as last_sign_in_at
from public.profiles p;

grant select on public.admin_users_overview to authenticated;
