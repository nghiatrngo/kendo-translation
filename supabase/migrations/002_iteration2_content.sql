-- Kendo Translation - Extended Schema for Iteration 2
-- Adds columns needed for translation workflow
-- Created: 2024-12-30

-- ============================================
-- EXTEND ARTICLES TABLE
-- Add content columns and translation metadata
-- ============================================

-- Add content columns (for Japanese and English text)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_ja TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add translation metadata
ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS translation_status TEXT DEFAULT 'pending';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS quality_score FLOAT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS translator_id UUID REFERENCES auth.users(id);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_articles_translation_status ON articles(translation_status);
CREATE INDEX IF NOT EXISTS idx_articles_translator_id ON articles(translator_id);

-- ============================================
-- ENABLE RLS (Row Level Security)
-- ============================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read articles
DROP POLICY IF EXISTS "Articles are viewable by everyone" ON articles;
CREATE POLICY "Articles are viewable by everyone" ON articles
    FOR SELECT USING (true);

-- Policy: Authenticated users can update articles
DROP POLICY IF EXISTS "Authenticated users can update articles" ON articles;
CREATE POLICY "Authenticated users can update articles" ON articles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert articles
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON articles;
CREATE POLICY "Authenticated users can insert articles" ON articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
INSERT INTO articles (title, content_ja, translation_status) VALUES 
    ('剣道の基本技術', '剣道の基本技術について説明します。面、小手、胴、突きは剣道の基本打突です。', 'pending'),
    ('Kendo Philosophy: The Way of the Sword', '剣道は単なる武術ではなく、精神的な修養の道でもあります。', 'pending'),
    ('Practice Methods for Beginners', '初心者のための練習方法を紹介します。正しい構えから始めましょう。', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN articles.content_ja IS 'Japanese source text';
COMMENT ON COLUMN articles.content_en IS 'English translation';
COMMENT ON COLUMN articles.translation_status IS 'pending, draft, review, published';
COMMENT ON COLUMN articles.quality_score IS 'AI-generated quality score (0-1)';
