-- First, drop existing policies
DROP POLICY IF EXISTS "Allow anon to read photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to select photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to insert photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to update their own photos" ON photos;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own photos" ON photos;

-- Temporarily disable RLS to make sure there are no conflicts
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Add a policy for the service_role (the API server typically uses this role)
CREATE POLICY "Allow service_role full access to photos" 
  ON photos 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable ANON read access to photos
CREATE POLICY "Allow anon to read photos" 
  ON photos 
  FOR SELECT 
  TO anon
  USING (true);

-- Enable authenticated users to select photos
CREATE POLICY "Allow authenticated users to select photos" 
  ON photos 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Enable authenticated users to insert photos
CREATE POLICY "Allow authenticated users to insert photos" 
  ON photos 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Enable authenticated users to update photos
CREATE POLICY "Allow authenticated users to update photos" 
  ON photos 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable authenticated users to delete photos
CREATE POLICY "Allow authenticated users to delete photos" 
  ON photos 
  FOR DELETE 
  TO authenticated
  USING (true);