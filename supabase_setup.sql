-- =============================================================================
-- QR VAULT — COMPLETE DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor
-- Last Updated: 2026-03-07
-- =============================================================================

-- =============================================================================
-- 1. PROFILES TABLE
-- Stores user info, plan type, storage tracking, subscription expiry.
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  plan text default 'FREE',                         -- FREE, STARTER (Plus), PRO
  storage_used bigint default 0,                     -- bytes used in Supabase storage
  storage_limit bigint default 1073741824,           -- 1 GB default (Free plan)
  subscription_expiry_date timestamp with time zone  -- NULL for Free plan, set on purchase
);

-- =============================================================================
-- 2. VAULTS TABLE
-- Each vault belongs to a user and holds files + links via a QR code.
-- =============================================================================
create table if not exists public.vaults (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  created_at timestamp with time zone default now(),
  views integer default 0,
  active boolean default true,
  access_level text default 'PUBLIC',                -- PUBLIC or RESTRICTED
  expires_at timestamp with time zone,               -- NEW: Auto-expiry date
  max_views integer default null,                    -- NEW: Max scans allowed
  report_count integer default 0,                    -- NEW: Community flags
  locked_until timestamp with time zone              -- NEW: Temp block until date
);

-- =============================================================================
-- 3. FILES TABLE
-- Files/links uploaded to a vault. On vault delete, files cascade delete.
-- =============================================================================
create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  name text not null,
  size bigint default 0,
  type text,                                         -- IMAGE, PDF, ZIP, LINK, OTHER
  mime_type text,
  url text
);

-- =============================================================================
-- 4. ACCESS REQUESTS TABLE
-- For restricted vaults, users can request access.
-- =============================================================================
create table if not exists public.access_requests (
  id uuid default gen_random_uuid() primary key,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  email text not null,
  status text default 'PENDING',                     -- PENDING, APPROVED, REJECTED
  requested_at timestamp with time zone default now()
);

-- =============================================================================
-- 5. INVOICES TABLE
-- Stores payment history for users.
-- =============================================================================
create table if not exists public.invoices (
  id text primary key,                               -- INV-YYYYMMDD-XXXXXX
  user_id uuid references public.profiles(id) not null,
  date text not null,
  plan text not null,
  amount integer not null,
  expiry text not null,
  timestamp bigint not null
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.vaults enable row level security;
alter table public.files enable row level security;
alter table public.access_requests enable row level security;
alter table public.invoices enable row level security;

-- Development policies (open access — tighten for production!)
create policy "Public profiles access" on public.profiles for all using (true) with check (true);
create policy "Public vaults access" on public.vaults for all using (true) with check (true);
create policy "Public files access" on public.files for all using (true) with check (true);
create policy "Public requests access" on public.access_requests for all using (true) with check (true);
create policy "Public invoices access" on public.invoices for all using (true) with check (true);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================
-- Create bucket with 5GB file size limit (5368709120 bytes)
insert into storage.buckets (id, name, public, file_size_limit) 
values ('vault-files', 'vault-files', true, 5368709120)
on conflict (id) do update set file_size_limit = 5368709120;

create policy "Public Storage Access" on storage.objects for all 
using ( bucket_id = 'vault-files' ) 
with check ( bucket_id = 'vault-files' );

-- =============================================================================
-- FUNCTIONS (RPC)
-- =============================================================================

-- Increment vault view counter (called from PublicView page)
create or replace function increment_vault_view(vault_id uuid)
returns void as $$
declare
  current_views integer;
  limit_views integer;
begin
  -- Get current views and limit
  select views, max_views into current_views, limit_views 
  from public.vaults 
  where id = vault_id;

  -- Increment
  update public.vaults
  set views = views + 1
  where id = vault_id;

  -- Deactivate if limit reached
  if limit_views is not null and (current_views + 1) >= limit_views then
    update public.vaults
    set active = false
    where id = vault_id;
  end if;
end;
$$ language plpgsql;

-- =============================================================================
-- MIGRATION: If upgrading from older schema, run these ALTER statements
-- =============================================================================

-- Add subscription_expiry_date if missing (added for plan management)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS subscription_expiry_date timestamp with time zone;

-- Ensure storage_limit column exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS storage_limit bigint default 1073741824;

-- Ensure plan column exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS plan text default 'FREE';

-- Create invoices table if missing
create table if not exists public.invoices (
  id text primary key,
  user_id uuid references public.profiles(id) not null,
  date text not null,
  plan text not null,
  amount integer not null,
  expiry text not null,
  timestamp bigint not null
);

-- Ensure expires_at column exists in vaults
ALTER TABLE public.vaults 
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Ensure max_views column exists in vaults
ALTER TABLE public.vaults 
  ADD COLUMN IF NOT EXISTS max_views integer default null;

-- Ensure invoices RLS is enabled
alter table public.invoices enable row level security;
create policy "Public invoices access" on public.invoices for all using (true) with check (true);

-- Ensure deleted_vault_logs has views and deletion_reason
ALTER TABLE public.deleted_vault_logs 
  ADD COLUMN IF NOT EXISTS views integer default 0;

ALTER TABLE public.deleted_vault_logs 
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Ensure vault reporting columns exist
ALTER TABLE public.vaults 
  ADD COLUMN IF NOT EXISTS report_count integer DEFAULT 0;

ALTER TABLE public.vaults 
  ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- =============================================================================
-- PLAN STORAGE LIMITS REFERENCE
-- =============================================================================
-- FREE    = 1 GB   = 1073741824 bytes
-- STARTER = 10 GB  = 10737418240 bytes  (Plus plan)
-- PRO     = 20 GB  = 21474836480 bytes
--
-- When a user upgrades, the app sets:
--   plan = 'STARTER' or 'PRO'
--   storage_limit = corresponding value above
--   subscription_expiry_date = now + 1 month
--
-- When a user cancels:
--   plan = 'FREE'
--   storage_limit = 1073741824
--   subscription_expiry_date = NULL
-- =============================================================================

-- =============================================================================
-- 6. DELETED VAULT LOGS
-- Stores history of auto-deleted vaults (for the 24h free tier limit transparency)
-- =============================================================================
create table if not exists public.deleted_vault_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vault_name text not null,
  original_vault_id uuid,
  views integer default 0,                           -- NEW: Scans before deletion
  deletion_reason text,                              -- NEW: 'TIME_EXPIRED' or 'SCAN_LIMIT_REACHED'
  file_manifest jsonb default '[]'::jsonb,           -- NEW: Precise list of files at deletion
  created_at timestamp with time zone,
  deleted_at timestamp with time zone default now()
);

-- =============================================================================
-- 7. REPORTS TABLE
-- Stores community flags for malware or inappropriate content.
-- =============================================================================
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  file_ids uuid[] default '{}'::uuid[],                -- CHANGED: support multiple files
  reason_virus boolean default false,
  reason_content boolean default false,
  custom_message text,
  expires_at timestamp with time zone,               -- NEW: report expiry
  created_at timestamp with time zone default now()
);

alter table public.reports enable row level security;
create policy "Public reports access" on public.reports for all using (true) with check (true);

alter table public.deleted_vault_logs enable row level security;
create policy "Public deleted_vault_logs access" on public.deleted_vault_logs for all using (true) with check (true);
