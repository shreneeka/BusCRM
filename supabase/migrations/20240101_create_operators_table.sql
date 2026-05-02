-- Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT NOT NULL,
  person_name TEXT,
  mobile_number TEXT,
  commission_percent DECIMAL NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(operator_name);
CREATE INDEX IF NOT EXISTS idx_operators_mobile ON operators(mobile_number);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active);

-- Enable RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can manage operators" ON operators
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Insert sample operators
INSERT INTO operators (operator_name, person_name, mobile_number, commission_percent, is_active) VALUES
('Express Travels', 'Raj Kumar', '9876543210', 10, true),
('City Bus Service', 'Amit Sharma', '9876543211', 10, true),
('Tourist Bus', 'Vikram Singh', '9876543212', 10, true)
ON CONFLICT (mobile_number) DO UPDATE SET
  operator_name = EXCLUDED.operator_name,
  person_name = EXCLUDED.person_name,
  commission_percent = EXCLUDED.commission_percent,
  is_active = EXCLUDED.is_active;
