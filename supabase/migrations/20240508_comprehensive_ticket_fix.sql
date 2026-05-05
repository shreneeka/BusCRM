-- Comprehensive fix for ticket creation issues
-- This migration ensures all required columns and constraints exist

-- First, ensure all required columns exist in tickets table
DO $$
BEGIN
    -- Basic ticket columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'ticket_number') THEN
        ALTER TABLE tickets ADD COLUMN ticket_number TEXT NOT NULL UNIQUE DEFAULT 'T' || LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT, 6, '0');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'passenger_name') THEN
        ALTER TABLE tickets ADD COLUMN passenger_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'mobile_number') THEN
        ALTER TABLE tickets ADD COLUMN mobile_number TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'pickup_city') THEN
        ALTER TABLE tickets ADD COLUMN pickup_city TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'pickup_area') THEN
        ALTER TABLE tickets ADD COLUMN pickup_area TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'drop_city') THEN
        ALTER TABLE tickets ADD COLUMN drop_city TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'drop_location') THEN
        ALTER TABLE tickets ADD COLUMN drop_location TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'journey_date') THEN
        ALTER TABLE tickets ADD COLUMN journey_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'booking_date') THEN
        ALTER TABLE tickets ADD COLUMN booking_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'seat_numbers') THEN
        ALTER TABLE tickets ADD COLUMN seat_numbers TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'total_seats') THEN
        ALTER TABLE tickets ADD COLUMN total_seats INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'pickup_time') THEN
        ALTER TABLE tickets ADD COLUMN pickup_time TIME NOT NULL DEFAULT '12:00:00';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'bus_number') THEN
        ALTER TABLE tickets ADD COLUMN bus_number TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'travel_type') THEN
        ALTER TABLE tickets ADD COLUMN travel_type TEXT NOT NULL DEFAULT 'AC' CHECK (travel_type IN ('AC', 'Non-AC'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'amount') THEN
        ALTER TABLE tickets ADD COLUMN amount DECIMAL NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'operator_id') THEN
        ALTER TABLE tickets ADD COLUMN operator_id UUID NOT NULL DEFAULT (SELECT id FROM operators LIMIT 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'account_id') THEN
        ALTER TABLE tickets ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'account_type') THEN
        ALTER TABLE tickets ADD COLUMN account_type TEXT CHECK (account_type IN ('Cash', 'UPI')) DEFAULT 'Cash';
    END IF;
    
    -- Operator details columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'operator_name') THEN
        ALTER TABLE tickets ADD COLUMN operator_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'operator_mobile') THEN
        ALTER TABLE tickets ADD COLUMN operator_mobile TEXT;
    END IF;
    
    -- Settlement columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'commission_amount') THEN
        ALTER TABLE tickets ADD COLUMN commission_amount DECIMAL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'operator_payable') THEN
        ALTER TABLE tickets ADD COLUMN operator_payable DECIMAL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'settlement_paid_to_operator') THEN
        ALTER TABLE tickets ADD COLUMN settlement_paid_to_operator BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'settlement_paid_at') THEN
        ALTER TABLE tickets ADD COLUMN settlement_paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'settlement_status') THEN
        ALTER TABLE tickets ADD COLUMN settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'paid'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'settlement_timestamp') THEN
        ALTER TABLE tickets ADD COLUMN settlement_timestamp TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Ensure operators table has correct column names
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operators' AND column_name = 'name') THEN
        ALTER TABLE operators RENAME COLUMN operator_name TO name;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operators' AND column_name = 'commission_percentage') THEN
        ALTER TABLE operators RENAME COLUMN commission_percent TO commission_percentage;
    END IF;
END $$;

-- Ensure accounts table exists for accounting
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Cash', 'UPI', 'Bank')),
  balance DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage accounts" ON accounts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default cash account if it doesn't exist
INSERT INTO accounts (name, type, balance) 
VALUES ('Cash', 'Cash', 0)
ON CONFLICT DO NOTHING;

-- Create or replace the commission calculation function
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

-- Create function to auto-populate operator details
CREATE OR REPLACE FUNCTION update_ticket_operator_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Update operator details when operator_id is set
  IF NEW.operator_id IS NOT NULL THEN
    SELECT 
      o.name,
      o.mobile_number
    INTO 
      NEW.operator_name,
      NEW.operator_mobile
    FROM operators o 
    WHERE o.id = NEW.operator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update operator details
DROP TRIGGER IF EXISTS trigger_update_ticket_operator_details ON tickets;
CREATE TRIGGER trigger_update_ticket_operator_details
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW
WHEN (NEW.operator_id IS NOT NULL)
EXECUTE FUNCTION update_ticket_operator_details();

-- Update existing tickets to populate missing data
UPDATE tickets 
SET 
    operator_name = COALESCE(operator_name, (SELECT name FROM operators WHERE id = tickets.operator_id)),
    operator_mobile = COALESCE(operator_mobile, (SELECT mobile_number FROM operators WHERE id = tickets.operator_id)),
    commission_amount = COALESCE(commission_amount, amount * COALESCE((SELECT commission_percentage FROM operators WHERE id = tickets.operator_id), 0) / 100),
    operator_payable = COALESCE(operator_payable, amount - commission_amount)
WHERE operator_id IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_account_id ON tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_tickets_journey_date ON tickets(journey_date);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_date ON tickets(booking_date);
CREATE INDEX IF NOT EXISTS idx_tickets_settlement_status ON tickets(settlement_status);
CREATE INDEX IF NOT EXISTS idx_tickets_mobile ON tickets(mobile_number);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Ensure RLS is enabled on tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage tickets" ON tickets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
