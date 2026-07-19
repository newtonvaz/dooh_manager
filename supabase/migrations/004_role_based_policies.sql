-- ============================================================
-- Role-Based Access Control (RBAC) Policies
-- Roles: admin, gestor_projeto, operacional
-- Role is stored in auth.users.app_metadata['role']
-- ============================================================

-- Helper function to check user role
create or replace function public.user_role() returns text as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$ language sql stable;

-- Helper to check if user has one of the allowed roles
create or replace function public.has_role(allowed_roles text[]) returns boolean as $$
  select public.user_role() = any(allowed_roles);
$$ language sql stable;

---------------------------------------------------------------
-- 1. PLAYERS
---------------------------------------------------------------
alter table public.players enable row level security;

drop policy if exists "admin_all_players" on public.players;
drop policy if exists "gestor_all_players" on public.players;
drop policy if exists "operacional_read_players" on public.players;
drop policy if exists "operacional_update_players" on public.players;
drop policy if exists "anon_read_players" on public.players;

create policy "admin_all_players" on public.players
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_players" on public.players
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_players" on public.players
  for select to authenticated
  using (public.has_role(array['operacional']));

create policy "operacional_update_players" on public.players
  for update to authenticated
  using (public.has_role(array['operacional']))
  with check (public.has_role(array['operacional']));

create policy "anon_read_players" on public.players
  for select to anon
  using (true);

---------------------------------------------------------------
-- 2. CONTENT
---------------------------------------------------------------
alter table public.content enable row level security;

drop policy if exists "admin_all_content" on public.content;
drop policy if exists "gestor_all_content" on public.content;
drop policy if exists "operacional_read_content" on public.content;
drop policy if exists "anon_read_content" on public.content;

create policy "admin_all_content" on public.content
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_content" on public.content
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_content" on public.content
  for select to authenticated
  using (public.has_role(array['operacional']));

create policy "anon_read_content" on public.content
  for select to anon
  using (true);

---------------------------------------------------------------
-- 3. PLAYLISTS
---------------------------------------------------------------
alter table public.playlists enable row level security;

drop policy if exists "admin_all_playlists" on public.playlists;
drop policy if exists "gestor_all_playlists" on public.playlists;
drop policy if exists "operacional_read_playlists" on public.playlists;
drop policy if exists "operacional_update_playlists" on public.playlists;
drop policy if exists "anon_read_playlists" on public.playlists;

create policy "admin_all_playlists" on public.playlists
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_playlists" on public.playlists
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_playlists" on public.playlists
  for select to authenticated
  using (public.has_role(array['operacional']));

create policy "operacional_update_playlists" on public.playlists
  for update to authenticated
  using (public.has_role(array['operacional']))
  with check (public.has_role(array['operacional']));

create policy "anon_read_playlists" on public.playlists
  for select to anon
  using (true);

---------------------------------------------------------------
-- 4. GROUPS
---------------------------------------------------------------
alter table public.groups enable row level security;

drop policy if exists "admin_all_groups" on public.groups;
drop policy if exists "gestor_all_groups" on public.groups;
drop policy if exists "operacional_read_groups" on public.groups;

create policy "admin_all_groups" on public.groups
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_groups" on public.groups
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_groups" on public.groups
  for select to authenticated
  using (public.has_role(array['operacional']));

---------------------------------------------------------------
-- 5. CATEGORIES
---------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "admin_all_categories" on public.categories;
drop policy if exists "gestor_all_categories" on public.categories;
drop policy if exists "operacional_read_categories" on public.categories;

create policy "admin_all_categories" on public.categories
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_categories" on public.categories
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_categories" on public.categories
  for select to authenticated
  using (public.has_role(array['operacional']));

---------------------------------------------------------------
-- 6. SCHEDULES
---------------------------------------------------------------
alter table public.schedules enable row level security;

drop policy if exists "admin_all_schedules" on public.schedules;
drop policy if exists "gestor_all_schedules" on public.schedules;
drop policy if exists "operacional_read_schedules" on public.schedules;
drop policy if exists "anon_read_schedules" on public.schedules;

create policy "admin_all_schedules" on public.schedules
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_all_schedules" on public.schedules
  for all to authenticated
  using (public.has_role(array['gestor_projeto']))
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_schedules" on public.schedules
  for select to authenticated
  using (public.has_role(array['operacional']));

create policy "anon_read_schedules" on public.schedules
  for select to anon
  using (true);

---------------------------------------------------------------
-- 7. ACTIVITIES
---------------------------------------------------------------
alter table public.activities enable row level security;

drop policy if exists "admin_all_activities" on public.activities;
drop policy if exists "gestor_read_activities" on public.activities;
drop policy if exists "operacional_read_activities" on public.activities;

create policy "admin_all_activities" on public.activities
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_read_activities" on public.activities
  for select to authenticated
  using (public.has_role(array['gestor_projeto']));

create policy "operacional_read_activities" on public.activities
  for select to authenticated
  using (public.has_role(array['operacional']));

---------------------------------------------------------------
-- 8. PLAYBACK LOGS
---------------------------------------------------------------
alter table public.playback_logs enable row level security;

drop policy if exists "admin_all_playback_logs" on public.playback_logs;
drop policy if exists "gestor_read_playback_logs" on public.playback_logs;
drop policy if exists "gestor_insert_playback_logs" on public.playback_logs;
drop policy if exists "operacional_read_playback_logs" on public.playback_logs;
drop policy if exists "operacional_insert_playback_logs" on public.playback_logs;

create policy "admin_all_playback_logs" on public.playback_logs
  for all to authenticated
  using (public.has_role(array['admin']))
  with check (public.has_role(array['admin']));

create policy "gestor_read_playback_logs" on public.playback_logs
  for select to authenticated
  using (public.has_role(array['gestor_projeto']));

create policy "gestor_insert_playback_logs" on public.playback_logs
  for insert to authenticated
  with check (public.has_role(array['gestor_projeto']));

create policy "operacional_read_playback_logs" on public.playback_logs
  for select to authenticated
  using (public.has_role(array['operacional']));

create policy "operacional_insert_playback_logs" on public.playback_logs
  for insert to authenticated
  with check (public.has_role(array['operacional']));

---------------------------------------------------------------
-- 9. STORAGE: uploads bucket policies
---------------------------------------------------------------
-- Note: Uploads use presigned URLs generated server-side (bypass RLS).
-- These policies only control direct access via the Supabase client.

drop policy if exists "admin_storage_uploads" on storage.objects;
drop policy if exists "gestor_storage_uploads" on storage.objects;
drop policy if exists "operacional_storage_uploads" on storage.objects;

create policy "admin_storage_uploads" on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads' and public.has_role(array['admin']))
  with check (bucket_id = 'uploads' and public.has_role(array['admin']));

create policy "gestor_storage_uploads" on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads' and public.has_role(array['gestor_projeto']))
  with check (bucket_id = 'uploads' and public.has_role(array['gestor_projeto']));

create policy "operacional_storage_uploads" on storage.objects
  for select to authenticated
  using (bucket_id = 'uploads' and public.has_role(array['operacional']));

-- Allow public read access to uploaded files (for playback / viewing)
drop policy if exists "anon_read_storage_uploads" on storage.objects;
create policy "anon_read_storage_uploads" on storage.objects
  for select to anon
  using (bucket_id = 'uploads');

---------------------------------------------------------------
-- HOW TO CREATE USERS WITH ROLES
-- Run these commands in the Supabase SQL Editor:
--
-- -- Admin user
-- select supabase_auth.admin.create_user(
--   email => 'admin@dooh.com',
--   password => 'sua-senha-aqui',
--   email_confirm => true,
--   app_metadata => jsonb_build_object('role', 'admin')
-- );
--
-- -- Gestor de Projeto
-- select supabase_auth.admin.create_user(
--   email => 'gestor@dooh.com',
--   password => 'sua-senha-aqui',
--   email_confirm => true,
--   app_metadata => jsonb_build_object('role', 'gestor_projeto')
-- );
--
-- -- Operacional
-- select supabase_auth.admin.create_user(
--   email => 'operacional@dooh.com',
--   password => 'sua-senha-aqui',
--   email_confirm => true,
--   app_metadata => jsonb_build_object('role', 'operacional')
-- );
--
-- To update an existing user's role:
-- select supabase_auth.admin.update_user_by_id(
--   'user-uuid-here',
--   jsonb_build_object('app_metadata', jsonb_build_object('role', 'admin'))
-- );
---------------------------------------------------------------
