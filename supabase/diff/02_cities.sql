  -- 1. Cities Table
  CREATE TABLE cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  );

  -- 2. Enable RLS
  ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

  -- 3. POLICIES FOR 'cities' TABLE
  -- Everyone needs to see the cities to populate the From/To dropdowns.
  CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT TO authenticated
  USING (true);

  -- Staff must be able to add a new city instantly
  CREATE POLICY "Anyone can add cities" ON cities
  FOR INSERT TO authenticated
  WITH CHECK (true);

  CREATE POLICY "Enable update for authenticated users" 
  ON "public"."cities" 
  AS PERMISSIVE FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

  CREATE POLICY "Enable delete for authenticated users" 
  ON "public"."cities" 
  AS PERMISSIVE FOR DELETE 
  TO authenticated 
  USING (true);