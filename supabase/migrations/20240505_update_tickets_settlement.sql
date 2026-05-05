-- Update tickets table to add settlement fields
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS operator_payable DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_paid_to_operator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS settlement_paid_at TIMESTAMP WITH TIME ZONE;

-- Update operators table to fix column name inconsistency
ALTER TABLE operators 
ALTER COLUMN commission_percent RENAME TO commission_percentage;

-- Create operator settlements table for tracking payments
CREATE TABLE IF NOT EXISTS operator_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
  total_amount DECIMAL NOT NULL,
  commission_percentage DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  operator_payable DECIMAL NOT NULL,
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for settlements
CREATE INDEX IF NOT EXISTS idx_operator_settlements_operator_id ON operator_settlements(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_date ON operator_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_paid_at ON operator_settlements(paid_at);

-- Enable RLS for settlements
ALTER TABLE operator_settlements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for settlements
CREATE POLICY "Authenticated users can manage settlements" ON operator_settlements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to calculate commission and payable amounts
CREATE OR REPLACE FUNCTION calculate_ticket_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Get operator commission percentage
  DECLARE
    commission_pct DECIMAL;
  BEGIN
    SELECT commission_percentage INTO commission_pct 
    FROM operators 
    WHERE id = NEW.operator_id AND is_active = true;
    
    IF commission_pct IS NOT NULL THEN
      NEW.commission_amount = NEW.amount * (commission_pct / 100);
      NEW.operator_payable = NEW.amount - NEW.commission_amount;
    ELSE
      NEW.commission_amount = 0;
      NEW.operator_payable = NEW.amount;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate commission
DROP TRIGGER IF EXISTS trigger_calculate_ticket_commission ON tickets;
CREATE TRIGGER trigger_calculate_ticket_commission
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION calculate_ticket_commission();

-- Update existing tickets to calculate commission
UPDATE tickets SET 
  commission_amount = amount * (COALESCE((SELECT commission_percentage FROM operators WHERE id = tickets.operator_id), 0) / 100),
  operator_payable = amount - commission_amount
WHERE commission_amount = 0;
