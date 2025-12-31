-- Agent Logs Table
-- Stores conversation history between translators and AI agents
-- Linked to articles/videos for context

CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Link to content (one of these should be set)
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Agent information
    agent_type VARCHAR(50) NOT NULL,
    model VARCHAR(255) NOT NULL,
    
    -- Conversation content
    system_prompt TEXT,
    user_prompt TEXT NOT NULL,
    response TEXT,
    
    -- Metrics
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    duration_ms INTEGER,
    
    -- Status
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_logs_article ON agent_logs(article_id) WHERE article_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_logs_video ON agent_logs(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_logs_user ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at DESC);

-- Enable RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
DROP POLICY IF EXISTS "Users can view their own agent logs" ON agent_logs;
CREATE POLICY "Users can view their own agent logs"
    ON agent_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own logs
DROP POLICY IF EXISTS "Users can create their own agent logs" ON agent_logs;
CREATE POLICY "Users can create their own agent logs"
    ON agent_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all logs
DROP POLICY IF EXISTS "Admins can view all agent logs" ON agent_logs;
CREATE POLICY "Admins can view all agent logs"
    ON agent_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE agent_logs IS 'Stores AI agent conversation history for translation sessions';
