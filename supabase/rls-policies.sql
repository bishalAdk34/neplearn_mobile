-- Run this in Supabase SQL Editor to fix RLS policies
-- Dashboard → SQL Editor → New Query → Paste → Run

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_xp
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own xp" ON user_xp;
DROP POLICY IF EXISTS "Users can read own xp" ON user_xp;
CREATE POLICY "Users can insert own xp" ON user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own xp" ON user_xp FOR SELECT USING (auth.uid() = user_id);

-- user_streaks
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can read own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streak" ON user_streaks;
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- user_learned_words
ALTER TABLE user_learned_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own words" ON user_learned_words;
DROP POLICY IF EXISTS "Users can read own words" ON user_learned_words;
DROP POLICY IF EXISTS "Users can delete own words" ON user_learned_words;
CREATE POLICY "Users can insert own words" ON user_learned_words FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own words" ON user_learned_words FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own words" ON user_learned_words FOR DELETE USING (auth.uid() = user_id);

-- journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own journal" ON journal_entries;
DROP POLICY IF EXISTS "Users can read own journal" ON journal_entries;
CREATE POLICY "Users can insert own journal" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own journal" ON journal_entries FOR SELECT USING (auth.uid() = user_id);

-- get_total_xp RPC function (if not already created)
CREATE OR REPLACE FUNCTION get_total_xp(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(xp_amount), 0)::INTEGER FROM user_xp WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;
