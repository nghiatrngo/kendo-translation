-- Migration: Create videos and video_notes tables
-- Run this in Supabase SQL Editor
-- NOTE: This migration adds user_id to existing tables if needed

-- Add user_id column to videos if not exists
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add user_id column to video_notes if not exists
ALTER TABLE video_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update video_notes column name if needed (text -> note_text)
ALTER TABLE video_notes ADD COLUMN IF NOT EXISTS note_text TEXT;

-- Enable RLS (if not already enabled)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read videos
DROP POLICY IF EXISTS "Anyone can read videos" ON videos;
CREATE POLICY "Anyone can read videos"
    ON videos FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert videos
DROP POLICY IF EXISTS "Authenticated users can insert videos" ON videos;
CREATE POLICY "Authenticated users can insert videos"
    ON videos FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own videos
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
CREATE POLICY "Users can update own videos"
    ON videos FOR UPDATE
    USING (user_id IS NULL OR auth.uid() = user_id);

-- Policy: Anyone can read video_notes
DROP POLICY IF EXISTS "Anyone can read video notes" ON video_notes;
CREATE POLICY "Anyone can read video notes"
    ON video_notes FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert video_notes
DROP POLICY IF EXISTS "Authenticated users can insert notes" ON video_notes;
CREATE POLICY "Authenticated users can insert notes"
    ON video_notes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notes
DROP POLICY IF EXISTS "Users can update own notes" ON video_notes;
CREATE POLICY "Users can update own notes"
    ON video_notes FOR UPDATE
    USING (user_id IS NULL OR auth.uid() = user_id);

-- Policy: Users can delete their own notes
DROP POLICY IF EXISTS "Users can delete own notes" ON video_notes;
CREATE POLICY "Users can delete own notes"
    ON video_notes FOR DELETE
    USING (user_id IS NULL OR auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON video_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_start_time ON video_notes(start_time);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
