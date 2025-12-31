-- Translation Memory Table
-- Stores approved translations for RAG enhancement

CREATE TABLE IF NOT EXISTS translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    domain VARCHAR(50) DEFAULT 'kendo',
    quality FLOAT DEFAULT 0.8,
    human_approved BOOLEAN DEFAULT false,
    
    -- Metrics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    article_id UUID REFERENCES articles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add full-text search capability (using 'simple' config since 'japanese' is not available)
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS 
    source_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', source_text)) STORED;

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_tm_source_text ON translation_memory USING gin(source_tsv);
CREATE INDEX IF NOT EXISTS idx_tm_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_tm_quality ON translation_memory(quality DESC);
CREATE INDEX IF NOT EXISTS idx_tm_human_approved ON translation_memory(human_approved);

-- Add missing columns if table already exists
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES articles(id);
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS human_approved BOOLEAN DEFAULT false;
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE translation_memory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved translations
DROP POLICY IF EXISTS "TM public read approved" ON translation_memory;
CREATE POLICY "TM public read approved"
    ON translation_memory
    FOR SELECT
    USING (human_approved = true);

-- Authenticated users can read their own drafts
DROP POLICY IF EXISTS "TM users read own" ON translation_memory;
CREATE POLICY "TM users read own"
    ON translation_memory
    FOR SELECT
    USING (auth.uid() = created_by);

-- Translators can insert
DROP POLICY IF EXISTS "TM translators insert" ON translation_memory;
CREATE POLICY "TM translators insert"
    ON translation_memory
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'translator')
        )
    );

-- Admins can update any
DROP POLICY IF EXISTS "TM admins update" ON translation_memory;
CREATE POLICY "TM admins update"
    ON translation_memory
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE translation_memory IS 'Stores approved translations for RAG-enhanced translation';
