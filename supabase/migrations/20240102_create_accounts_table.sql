-- Create accounts table for accounting integration
-- Create enum first
CREATE TYPE account_type AS ENUM ('Cash', 'UPI');

CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type account_type NOT NULL,
  balance DECIMAL DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for accounts
CREATE POLICY "Authenticated users can manage accounts" ON accounts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default cash account
INSERT INTO accounts (name, type, balance, is_active)
VALUES ('Cash', 'Cash', 0, true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);
