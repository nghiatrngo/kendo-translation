-- Kendo Translation - Initial Schema
-- Iteration 1: Minimal skeleton to prove database connection
-- Created: 2024-12-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Basic user table for authentication
-- Will be extended with Supabase Auth in Iteration 2
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ARTICLES TABLE
-- Minimal article table for proof of concept
-- Will be extended with content fields in Iteration 3
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- ============================================
-- SAMPLE DATA (for testing connection)
-- ============================================
INSERT INTO articles (title) VALUES 
    ('Welcome to Kendo Translation'),
    ('Sample Article 1'),
    ('Sample Article 2')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'User accounts (expanded in Iteration 2 with Supabase Auth)';
COMMENT ON TABLE articles IS 'Kendo articles (expanded in Iteration 3 with JP/EN content)';
