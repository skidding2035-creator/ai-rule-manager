-- AI Rule Manager — require authentication
-- Run this in the Supabase SQL editor after signing up your own account
-- through the app's /login page (first-time setup).
--
-- Replaces the fully-open "allow all" policies from schema.sql with policies
-- that require a logged-in Supabase Auth session. Still single-implicit-user
-- in spirit (any authenticated session gets full access, no per-row
-- ownership) — this only closes the anonymous-access hole, since the app is
-- moving from a local-only tool to something reachable over the internet.
--
-- The MCP server keeps working after this: it should switch to the Supabase
-- service_role key (see mcp-server/README.md), which bypasses RLS entirely
-- and is unaffected by this change.

drop policy "allow all (categories)" on categories;
drop policy "allow all (projects)" on projects;
drop policy "allow all (rules)" on rules;
drop policy "allow all (rule_versions)" on rule_versions;
drop policy "allow all (ai_connections)" on ai_connections;

create policy "authenticated only (categories)" on categories
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated only (projects)" on projects
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated only (rules)" on rules
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated only (rule_versions)" on rule_versions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "authenticated only (ai_connections)" on ai_connections
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
