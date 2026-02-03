-- ==========================================
-- Fuga, SA — Supabase Database Setup
-- ==========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Paste → Run)
-- ==========================================

-- 1. Create the main table
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  pin TEXT DEFAULT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (open access for this friend group app)
CREATE POLICY "Anyone can read all data"
  ON user_data FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert data"
  ON user_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update data"
  ON user_data FOR UPDATE
  USING (true);

-- 4. Create function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for auto-updating timestamp
CREATE TRIGGER user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_data;

-- 7. Seed the 8 users (empty data, ready for input)
INSERT INTO user_data (user_id, data) VALUES
  ('nuno', '{}'),
  ('pedro-r', '{}'),
  ('pedro-c', '{}'),
  ('filipe', '{}'),
  ('bruno', '{}'),
  ('albano', '{}'),
  ('joao', '{}'),
  ('henrique', '{}')
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- ✅ Done! Your database is ready.
-- ==========================================
