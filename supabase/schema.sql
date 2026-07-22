-- AI Rule Manager — database schema
-- Run this in the Supabase SQL editor once, before seed.sql.
--
-- Scope: data persistence only, no auth in this pass (see RLS note below).

create extension if not exists pgcrypto;

create type rule_status as enum ('active', 'draft', 'pending_approval', 'stopped', 'rejected');
create type rule_priority as enum ('high', 'medium', 'low');
create type accent_color as enum ('blue', 'green', 'orange', 'purple', 'teal', 'red', 'gray');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color accent_color not null,
  code_prefix text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color accent_color not null,
  created_at timestamptz not null default now()
);

create table rules (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  content text not null,
  version text not null default 'v1.0',
  status rule_status not null default 'draft',
  category_id uuid not null references categories(id) on delete restrict,
  project_id uuid references projects(id) on delete restrict, -- null = shared across all projects
  priority rule_priority not null default 'medium',
  tags text[] not null default '{}',
  ai_platforms text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references rules(id) on delete cascade,
  version text not null,
  content text not null,
  status rule_status not null,
  changed_by text not null default 'ユーザーA',
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table ai_connections (
  id text primary key, -- 'chatgpt' | 'claude' | 'gemini' | 'copilot'
  name text not null,
  connected boolean not null default false
);

create index rules_category_id_idx on rules(category_id);
create index rules_project_id_idx on rules(project_id);
create index rules_status_idx on rules(status);
create index rule_versions_rule_id_idx on rule_versions(rule_id);
create index rule_versions_created_at_idx on rule_versions(created_at desc);

-- Row Level Security
-- NOTE: these policies allow the anon key full read/write access on every
-- table, which is fine for local/personal use only — the anon key ships
-- inside the client-side JS bundle, so anyone who obtains it can read and
-- write every row. Before deploying this publicly, run auth_migration.sql
-- (adds real login and scopes these policies to authenticated sessions).
alter table categories enable row level security;
alter table projects enable row level security;
alter table rules enable row level security;
alter table rule_versions enable row level security;
alter table ai_connections enable row level security;

create policy "allow all (categories)" on categories for all using (true) with check (true);
create policy "allow all (projects)" on projects for all using (true) with check (true);
create policy "allow all (rules)" on rules for all using (true) with check (true);
create policy "allow all (rule_versions)" on rule_versions for all using (true) with check (true);
create policy "allow all (ai_connections)" on ai_connections for all using (true) with check (true);
