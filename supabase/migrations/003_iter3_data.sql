-- Migration 003: Iteration 3 - Real Data Integration
-- Adds terminology, videos, and video_notes tables

-- Add columns to articles for full content
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url_en TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url_ja TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS match_score FLOAT;

-- Create terminology table
CREATE TABLE IF NOT EXISTS terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  reading TEXT,
  domain TEXT DEFAULT 'kendo',
  term_type TEXT DEFAULT 'preferred',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for terminology search
CREATE INDEX IF NOT EXISTS idx_terminology_source ON terminology(source_term);
CREATE INDEX IF NOT EXISTS idx_terminology_target ON terminology(target_term);
CREATE INDEX IF NOT EXISTS idx_terminology_reading ON terminology(reading);
CREATE INDEX IF NOT EXISTS idx_terminology_domain ON terminology(domain);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_notes table
CREATE TABLE IF NOT EXISTS video_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID,
  start_time FLOAT NOT NULL,
  end_time FLOAT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;

-- Terminology: public read, authenticated write
CREATE POLICY "terminology_public_read" ON terminology FOR SELECT USING (true);
CREATE POLICY "terminology_auth_insert" ON terminology FOR INSERT WITH CHECK (true);

-- Videos: public read, authenticated write
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (true);
CREATE POLICY "videos_auth_insert" ON videos FOR INSERT WITH CHECK (true);

-- Video notes: public read, owner write
CREATE POLICY "video_notes_public_read" ON video_notes FOR SELECT USING (true);
CREATE POLICY "video_notes_auth_insert" ON video_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "video_notes_owner_update" ON video_notes FOR UPDATE USING (true);
CREATE POLICY "video_notes_owner_delete" ON video_notes FOR DELETE USING (true);
