-- Migration: Create videos and video_notes tables
-- Run this in Supabase SQL Editor

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_notes table
CREATE TABLE IF NOT EXISTS video_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_time REAL NOT NULL DEFAULT 0,
    end_time REAL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read videos
CREATE POLICY IF NOT EXISTS "Anyone can read videos"
    ON videos FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert videos
CREATE POLICY IF NOT EXISTS "Authenticated users can insert videos"
    ON videos FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own videos
CREATE POLICY IF NOT EXISTS "Users can update own videos"
    ON videos FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Anyone can read video_notes
CREATE POLICY IF NOT EXISTS "Anyone can read video notes"
    ON video_notes FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert video_notes
CREATE POLICY IF NOT EXISTS "Authenticated users can insert notes"
    ON video_notes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notes
CREATE POLICY IF NOT EXISTS "Users can update own notes"
    ON video_notes FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY IF NOT EXISTS "Users can delete own notes"
    ON video_notes FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_notes_video_id ON video_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_notes_start_time ON video_notes(start_time);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id);
