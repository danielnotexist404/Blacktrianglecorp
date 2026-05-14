-- =============================================================
-- 0002 — switch api_keys from pgsodium TCE to app-level encryption
-- Safe to run after 0001. Idempotent.
-- =============================================================

-- Strip pgsodium security labels if they exist (some Supabase tiers don't
-- have pgsodium TCE enabled, which would have caused 0001 to error in
-- silent-ish ways). Safe no-op when labels were never applied.
do $$
begin
  begin
    execute 'security label for pgsodium on column public.api_keys.api_key is null';
  exception when others then null; end;
  begin
    execute 'security label for pgsodium on column public.api_keys.api_secret is null';
  exception when others then null; end;
end $$;

-- Rename api_secret -> api_secret_encrypted to make the storage intent
-- explicit. The web app encrypts with AES-256-GCM before insert using
-- BTG_ENCRYPTION_KEY (32-byte base64) from the server-side env.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'api_secret'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'api_secret_encrypted'
  ) then
    alter table public.api_keys rename column api_secret to api_secret_encrypted;
  end if;
end $$;

-- If api_secret_encrypted doesn't exist for any reason (fresh table), add it.
alter table public.api_keys
  add column if not exists api_secret_encrypted text;

-- Make sure NOT NULL is enforced now that the column has a clear name.
alter table public.api_keys
  alter column api_secret_encrypted set not null;
