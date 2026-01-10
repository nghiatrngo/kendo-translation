
-- Agent Prompts Table
-- Stores customizable prompt templates for different agents and approaches

CREATE TABLE IF NOT EXISTS agent_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    agent_type VARCHAR(50) NOT NULL, -- 'translation', 'reflection', etc.
    approach VARCHAR(50), -- 'literal', 'natural', 'formal', or null for generic
    
    template TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique combination of agent_type and approach per user
    UNIQUE(user_id, agent_type, approach)
);

-- Enable RLS
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;

-- Users can view their own prompts
DROP POLICY IF EXISTS "Users can view their own agent prompts" ON agent_prompts;
CREATE POLICY "Users can view their own agent prompts"
    ON agent_prompts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert/update their own prompts
DROP POLICY IF EXISTS "Users can manage their own agent prompts" ON agent_prompts;
CREATE POLICY "Users can manage their own agent prompts"
    ON agent_prompts
    FOR ALL
    USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_agent_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agent_prompts_timestamp ON agent_prompts;
CREATE TRIGGER update_agent_prompts_timestamp
    BEFORE UPDATE ON agent_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_prompts_updated_at();

COMMENT ON TABLE agent_prompts IS 'Stores customizable prompt templates for AI agents';
