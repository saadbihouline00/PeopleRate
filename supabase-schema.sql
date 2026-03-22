-- ============================================================
-- PEOPLERATE DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. PLATFORMS table (companies/apps being rated)
CREATE TABLE platforms (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  status      TEXT DEFAULT 'stable' CHECK (status IN ('rising','declining','stable','boycott')),
  upvotes     BIGINT DEFAULT 0,
  downvotes   BIGINT DEFAULT 0,
  trend       DECIMAL(5,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VOTES table (one vote per user per platform)
CREATE TABLE votes (
  id          BIGSERIAL PRIMARY KEY,
  platform_id BIGINT REFERENCES platforms(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type   TEXT NOT NULL CHECK (vote_type IN ('up','down')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform_id, user_id)
);

-- 3. REVIEWS table
CREATE TABLE reviews (
  id          BIGSERIAL PRIMARY KEY,
  platform_id BIGINT REFERENCES platforms(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar      TEXT DEFAULT '🧑',
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL,
  likes       INT DEFAULT 0,
  parent_id   BIGINT REFERENCES reviews(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVIEW LIKES table
CREATE TABLE review_likes (
  id          BIGSERIAL PRIMARY KEY,
  review_id   BIGINT REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 5. PROFILES table (extends Supabase auth)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  avatar      TEXT DEFAULT '🧑',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — keeps data safe
-- ============================================================

ALTER TABLE platforms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;

-- Platforms: anyone can read, only authenticated users can insert
CREATE POLICY "Anyone can view platforms"    ON platforms    FOR SELECT USING (true);
CREATE POLICY "Auth users can add platforms" ON platforms    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Votes: anyone can read, users can only insert/update their own
CREATE POLICY "Anyone can view votes"   ON votes FOR SELECT USING (true);
CREATE POLICY "Users can vote"          ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update vote"   ON votes FOR UPDATE USING (auth.uid() = user_id);

-- Reviews: anyone can read, users manage their own
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can post reviews"  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update review" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete review" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Review likes
CREATE POLICY "Anyone can view likes"  ON review_likes FOR SELECT USING (true);
CREATE POLICY "Users can like"         ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike"       ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- Profiles
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users own their profile"  ON profiles FOR ALL  USING (auth.uid() = id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🧑')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- REALTIME — enable live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE platforms;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;

-- ============================================================
-- SEED DATA — initial platforms
-- ============================================================
INSERT INTO platforms (name, category, description, tags, status, upvotes, downvotes, trend) VALUES
('TikTok',         'Apps',        'Short-form video platform',  ARRAY['Privacy','Addictive','Data Mining'],    'declining', 31000, 53200, -2.4),
('Instagram',      'Apps',        'Photo & video sharing',      ARRAY['Ads Overload','Algorithm'],             'declining', 29800, 42300, -1.1),
('Signal',         'Apps',        'Encrypted messaging',        ARRAY['Privacy','Secure','Recommended'],       'rising',    39200, 2100,   5.8),
('Spotify',        'Apps',        'Music streaming',            ARRAY['Price Hike','Good UI'],                 'stable',    44100, 22300,  1.2),
('X (Twitter)',    'Apps',        'Social media platform',      ARRAY['Bots','Fee Walls','Misinformation'],    'declining', 28000, 63000, -3.7),
('WhatsApp',       'Apps',        'Messaging platform',         ARRAY['Meta Owned','Convenient'],              'stable',    38100, 17100,  0.4),
('McDonald''s',    'Restaurants', 'Fast food chain',            ARRAY['Price Hike','Quality Drop'],            'declining', 48000, 55000, -1.8),
('Chipotle',       'Restaurants', 'Mexican fast casual',        ARRAY['Fresh','Value','Recommended'],          'rising',    52000, 15400,  3.1),
('Starbucks',      'Restaurants', 'Coffee chain',               ARRAY['Overpriced','Long Waits'],              'declining', 34000, 54200, -2.9),
('Marriott',       'Hotels',      'International hotel chain',  ARRAY['Consistent','Pricey'],                  'stable',    27000, 17100,  1.4),
('Airbnb',         'Hotels',      'Home rental platform',       ARRAY['Hidden Fees','Scams','Overpriced'],     'declining', 31000, 48300, -4.2),
('Spirit Airlines','Airlines',    'Budget airline',             ARRAY['Worst Service','Hidden Fees','Delays'], 'boycott',   9200,  82900, -6.1),
('Emirates',       'Airlines',    'Premium airline',            ARRAY['Luxury','On Time','Recommended'],       'rising',    46800, 4200,   4.7),
('Southwest',      'Airlines',    'Budget airline',             ARRAY['Policy Changes','No Frills'],           'stable',    30100, 18100, -0.8),
('Netflix',        'Streaming',   'Video streaming',            ARRAY['Price Hike','Password Ban'],            'declining', 41000, 69000, -3.3),
('YouTube',        'Streaming',   'Video platform',             ARRAY['Free Content','Ads Heavy'],             'stable',    60000, 28000,  1.6),
('Chase',          'Banks',       'Retail banking',             ARRAY['Fees','Good App'],                      'stable',    29000, 32000, -0.6),
('Chime',          'Banks',       'Digital bank',               ARRAY['No Fees','Modern','Recommended'],       'rising',    33000, 5400,   5.2);
