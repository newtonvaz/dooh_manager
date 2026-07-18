-- Enable RLS on all tables (if not already enabled)
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.playback_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin full access players" ON public.players;
DROP POLICY IF EXISTS "Admin full access playlists" ON public.playlists;
DROP POLICY IF EXISTS "Admin full access content" ON public.content;
DROP POLICY IF EXISTS "Admin full access groups" ON public.groups;
DROP POLICY IF EXISTS "Admin full access categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full access schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admin full access activities" ON public.activities;
DROP POLICY IF EXISTS "Admin full access playback_logs" ON public.playback_logs;

DROP POLICY IF EXISTS "Authenticated read players" ON public.players;
DROP POLICY IF EXISTS "Authenticated read playlists" ON public.playlists;
DROP POLICY IF EXISTS "Authenticated read content" ON public.content;
DROP POLICY IF EXISTS "Authenticated read groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated read categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated read schedules" ON public.schedules;
DROP POLICY IF EXISTS "Authenticated read activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated read playback_logs" ON public.playback_logs;

-- Admin full access policies (using email check for admin@dooh.com)
-- Players
CREATE POLICY "Admin full access players" ON public.players
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Playlists
CREATE POLICY "Admin full access playlists" ON public.playlists
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Content
CREATE POLICY "Admin full access content" ON public.content
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Groups
CREATE POLICY "Admin full access groups" ON public.groups
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Categories
CREATE POLICY "Admin full access categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Schedules
CREATE POLICY "Admin full access schedules" ON public.schedules
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Activities
CREATE POLICY "Admin full access activities" ON public.activities
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Playback logs
CREATE POLICY "Admin full access playback_logs" ON public.playback_logs
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@dooh.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@dooh.com');

-- Authenticated users can read all tables (optional - for player devices reading playlists/content)
CREATE POLICY "Authenticated read players" ON public.players
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read playlists" ON public.playlists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read content" ON public.content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read groups" ON public.groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read categories" ON public.categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read schedules" ON public.schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read activities" ON public.activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read playback_logs" ON public.playback_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon (player devices) to read specific tables for playback
ALTER TABLE IF EXISTS public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon read players for playback" ON public.players;
DROP POLICY IF EXISTS "Anon read playlists for playback" ON public.playlists;
DROP POLICY IF EXISTS "Anon read content for playback" ON public.content;
DROP POLICY IF EXISTS "Anon read schedules for playback" ON public.schedules;

CREATE POLICY "Anon read players for playback" ON public.players
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read playlists for playback" ON public.playlists
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read content for playback" ON public.content
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read schedules for playback" ON public.schedules
  FOR SELECT
  TO anon
  USING (true);