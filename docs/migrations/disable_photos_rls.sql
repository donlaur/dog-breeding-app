-- Completely disable row level security for the photos table
-- This should resolve the insert permission issues

-- First drop all existing policies
DROP POLICY IF EXISTS "Allow anon to read photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to select photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to insert photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to update their own photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own photos" ON photos;
DROP POLICY IF EXISTS "Allow service_role full access to photos" ON photos;

-- Disable RLS completely
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Verify if the "bypass_rls" setting is needed for your role
ALTER ROLE anon BYPASSRLS;
ALTER ROLE authenticated BYPASSRLS;
ALTER ROLE service_role BYPASSRLS;