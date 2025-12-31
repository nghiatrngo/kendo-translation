-- Migration: Add user roles and profiles table
-- Run this in Supabase SQL Editor

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'translator', 'reader')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile (except role)
CREATE POLICY IF NOT EXISTS "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY IF NOT EXISTS "Admins can read all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update any profile
CREATE POLICY IF NOT EXISTS "Admins can update any profile"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', 'reader');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create first admin user (replace with your email)
-- INSERT INTO profiles (id, username, role)
-- VALUES (
--     (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
--     'Admin',
--     'admin'
-- ) ON CONFLICT (id) DO UPDATE SET role = 'admin';
