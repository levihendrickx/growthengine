-- ═══════════════════════════════════════════════════════════════
-- Growth Engine — 001_auth_setup.sql
--
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → paste & run
--   OR: supabase db push (if using the CLI)
-- ═══════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────
-- One row per Supabase auth user.
-- Linked to auth.users so it is deleted automatically if the
-- auth user is deleted.

create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  avatar_url    text,
  auth_provider text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- ── workspaces ────────────────────────────────────────────────
-- Represents an organisation/account (single user to start,
-- later supports teams and agencies).

create table if not exists public.workspaces (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  owner_user_id uuid        references public.profiles(id) on delete cascade,
  plan          text        not null default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── workspace_members ─────────────────────────────────────────
-- Joins users to workspaces with a role.
-- Prepared for future multi-member / agency use.

create table if not exists public.workspace_members (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces(id)  on delete cascade,
  user_id      uuid        not null references public.profiles(id)     on delete cascade,
  role         text        not null default 'owner',
  created_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ── updated_at triggers ───────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;

-- profiles: users can only read/write their own row
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- workspaces: users can read workspaces where they are a member
create policy "workspaces: select where member"
  on public.workspaces for select
  using (
    id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );

create policy "workspaces: insert own"
  on public.workspaces for insert
  with check (owner_user_id = auth.uid());

create policy "workspaces: update own"
  on public.workspaces for update
  using (owner_user_id = auth.uid());

-- workspace_members: users can read their own memberships
create policy "workspace_members: select own"
  on public.workspace_members for select
  using (user_id = auth.uid());

create policy "workspace_members: insert own"
  on public.workspace_members for insert
  with check (user_id = auth.uid());
