-- Fix tickets table schema and ensure all required columns exist
-- This migration addresses the 'drop_city' column error and other schema issues

-- First, ensure all required columns exist in tickets table
DO $$
BEGIN
    -- Check and add drop_city if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'drop_city'
    ) THEN
        ALTER TABLE tickets ADD COLUMN drop_city TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Check and add drop_location if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'drop_location'
    ) THEN
        ALTER TABLE tickets ADD COLUMN drop_location TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Check and add pickup_area if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'pickup_area'
    ) THEN
        ALTER TABLE tickets ADD COLUMN pickup_area TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Check and add pickup_city if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'pickup_city'
    ) THEN
        ALTER TABLE tickets ADD COLUMN pickup_city TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Check and add settlement fields if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'commission_amount'
    ) THEN
        ALTER TABLE tickets ADD COLUMN commission_amount DECIMAL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'operator_payable'
    ) THEN
        ALTER TABLE tickets ADD COLUMN operator_payable DECIMAL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'settlement_paid_to_operator'
    ) THEN
        ALTER TABLE tickets ADD COLUMN settlement_paid_to_operator BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'settlement_paid_at'
    ) THEN
        ALTER TABLE tickets ADD COLUMN settlement_paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Fix operators table column names if needed
DO $$
BEGIN
    -- Rename commission_percent to commission_percentage if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operators' 
        AND column_name = 'commission_percent'
    ) THEN
        ALTER TABLE operators RENAME COLUMN commission_percent TO commission_percentage;
    END IF;
    
    -- Rename operator_name to name if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operators' 
        AND column_name = 'operator_name'
    ) THEN
        ALTER TABLE operators RENAME COLUMN operator_name TO name;
    END IF;
END $$;

-- Ensure operator_settlements table exists
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

-- Enable RLS for operator_settlements
ALTER TABLE operator_settlements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for operator_settlements
DROP POLICY IF EXISTS "Authenticated users can manage settlements" ON operator_settlements;
CREATE POLICY "Authenticated users can manage settlements" ON operator_settlements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create or replace the commission calculation function
CREATE OR REPLACE FUNCTION calculate_ticket_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Get operator commission percentage
  DECLARE
    commission_pct DECIMAL;
  BEGIN
    -- Handle both possible column names for operator
    BEGIN
      SELECT commission_percentage INTO commission_pct 
      FROM operators 
      WHERE id = NEW.operator_id AND is_active = true;
    EXCEPTION WHEN undefined_column THEN
      SELECT commission_percent INTO commission_pct 
      FROM operators 
      WHERE id = NEW.operator_id AND is_active = true;
    END;
    
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
  commission_amount = amount * (COALESCE(
    (SELECT commission_percentage FROM operators WHERE id = tickets.operator_id), 
    0
  ) / 100),
  operator_payable = amount - commission_amount
WHERE commission_amount = 0 OR commission_amount IS NULL;

-- Create operator_summary view for getOperatorsWithTicketCounts function
DROP VIEW IF EXISTS operator_summary;
CREATE OR REPLACE VIEW operator_summary AS
SELECT 
    o.id,
    o.name as name,
    o.person_name,
    o.mobile_number,
    o.commission_percentage as commission_percentage,
    o.is_active,
    o.created_at,
    COALESCE(t.ticket_count, 0) as ticket_count,
    COALESCE(t.pending_settlements, 0) as pending_settlements
FROM operators o
LEFT JOIN (
    SELECT 
        operator_id,
        COUNT(*) as ticket_count,
        COUNT(*) FILTER (WHERE settlement_paid_to_operator = false OR settlement_paid_to_operator IS NULL) as pending_settlements
    FROM tickets 
    GROUP BY operator_id
) t ON o.id = t.operator_id
WHERE o.is_active = true;
