-- STEP 1: Operator Management Module - Fixed 10% Commission
-- This migration creates the operators table with fixed 10% commission

-- 1. Create operators table with exact structure
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT NOT NULL,
  person_name TEXT,
  mobile_number TEXT,
  commission_percent DECIMAL NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Add updated_at column
ALTER TABLE operators 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 3. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_operators_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operators_modtime ON operators;
CREATE TRIGGER update_operators_modtime
BEFORE UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION update_operators_modified_column();

-- 4. Enable RLS
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies
CREATE POLICY "Authenticated users can manage operators" ON operators
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(operator_name);
CREATE INDEX IF NOT EXISTS idx_operators_mobile ON operators(mobile_number);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active);

-- 7. Add validation function
CREATE OR REPLACE FUNCTION validate_operator()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure commission is exactly 10%
    IF NEW.commission_percent != 10 THEN
        RAISE EXCEPTION 'Commission percent must be exactly 10%';
    END IF;
    
    -- Ensure mobile number is valid (basic validation)
    IF NEW.mobile_number IS NOT NULL AND LENGTH(TRIM(NEW.mobile_number)) < 10 THEN
        RAISE EXCEPTION 'Mobile number must be at least 10 digits';
    END IF;
    
    -- Ensure operator name is not empty
    IF NEW.operator_name IS NULL OR LENGTH(TRIM(NEW.operator_name)) = 0 THEN
        RAISE EXCEPTION 'Operator name cannot be empty';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_operator ON operators;
CREATE TRIGGER trigger_validate_operator
BEFORE INSERT OR UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION validate_operator();

-- 8. Insert sample operators (for testing)
INSERT INTO operators (operator_name, person_name, mobile_number, commission_percent, is_active) VALUES
('Express Travels', 'Raj Kumar', '9876543210', 10, true),
('City Bus Service', 'Amit Sharma', '9876543211', 10, true),
('Tourist Bus', 'Vikram Singh', '9876543212', 10, true)
ON CONFLICT (mobile_number) DO UPDATE SET
  operator_name = EXCLUDED.operator_name,
  person_name = EXCLUDED.person_name,
  commission_percent = EXCLUDED.commission_percent,
  is_active = EXCLUDED.is_active;
