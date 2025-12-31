const { Client } = require('pg');

const sql = `
-- Fix: Profiles RLS Infinite Recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Create safe is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate admin policies using safe function
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Update roles for test users
UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin-1@test.com');
UPDATE public.profiles SET role = 'translator' WHERE id = (SELECT id FROM auth.users WHERE email = 'translator-1@test.com');

-- Allow authenticated users to insert videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users only' AND tablename = 'videos'
  ) THEN
    EXECUTE 'CREATE POLICY "Enable insert for authenticated users only" ON "public"."videos" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;
END $$;
`;

async function main() {
    const client = new Client({
        host: 'db.mbgmyvmsvenvtecvrjia.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'zS5Z6M4sSOENjRWS',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to Supabase database...');
        await client.connect();
        console.log('Connected. Executing SQL...');

        const result = await client.query(sql);
        console.log('✅ SQL executed successfully!');
        console.log('Result:', result);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

main();
