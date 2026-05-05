-- Database Setup for Ticket Booking and Accounting Integration
-- This script sets up the necessary categories and validates the automation system

-- Create required accounting categories if they don't exist
INSERT INTO accounting_categories (name, category_type, description, is_active, created_at)
SELECT 
  'Ticket Booking', 
  'Income', 
  'Income from ticket bookings - automatically created when tickets are booked', 
  true, 
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_categories 
  WHERE name = 'Ticket Booking' AND category_type = 'Income'
);

INSERT INTO accounting_categories (name, category_type, description, is_active, created_at)
SELECT 
  'Operator Payment', 
  'Expense', 
  'Payments made to bus operators - automatically created during settlements', 
  true, 
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_categories 
  WHERE name = 'Operator Payment' AND category_type = 'Expense'
);

INSERT INTO accounting_categories (name, category_type, description, is_active, created_at)
SELECT 
  'Commission', 
  'Income', 
  'Commission earned from operators - automatically calculated during settlements', 
  true, 
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_categories 
  WHERE name = 'Commission' AND category_type = 'Income'
);

-- Add accounting-related columns to tickets table if they don't exist
DO $$
BEGIN
  -- Check and add commission_percentage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE tickets ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 10.0;
    ALTER TABLE tickets ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.0;
    ALTER TABLE tickets ADD COLUMN operator_payable DECIMAL(10,2) DEFAULT 0.0;
    
    -- Update existing tickets with default values
    UPDATE tickets SET 
      commission_percentage = 10.0,
      commission_amount = ROUND(amount * 10.0 / 100, 2),
      operator_payable = amount - ROUND(amount * 10.0 / 100, 2)
    WHERE commission_percentage IS NULL;
  END IF;
END $$;

-- Add accounting_entry_id foreign key to settlements if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operator_settlements' AND column_name = 'accounting_entry_id'
  ) THEN
    ALTER TABLE operator_settlements ADD COLUMN accounting_entry_id UUID REFERENCES accounting_entries(id);
  END IF;
END $$;

-- Create validation function for accounting entries
CREATE OR REPLACE FUNCTION validate_accounting_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate ticket-linked entries
  IF NEW.ticket_id IS NOT NULL THEN
    -- Ticket-linked entries must be Income type
    IF NEW.entry_type != 'Income' THEN
      RAISE EXCEPTION 'Ticket-linked entries must be Income type';
    END IF;
    
    -- Category must be 'Ticket Booking'
    IF NOT EXISTS (
      SELECT 1 FROM accounting_categories ac 
      WHERE ac.id = NEW.category_id 
      AND ac.name = 'Ticket Booking' 
      AND ac.category_type = 'Income'
    ) THEN
      RAISE EXCEPTION 'Ticket income entries must use "Ticket Booking" category';
    END IF;
  END IF;
  
  -- Validate settlement-linked entries
  IF NEW.settlement_id IS NOT NULL THEN
    -- Get category name
    DECLARE
      category_name TEXT;
      category_type TEXT;
    BEGIN
      SELECT ac.name, ac.category_type INTO category_name, category_type
      FROM accounting_categories ac
      WHERE ac.id = NEW.category_id;
    END;
    
    -- Validate expense entries
    IF NEW.entry_type = 'Expense' AND category_name != 'Operator Payment' THEN
      RAISE EXCEPTION 'Settlement expense entries must use "Operator Payment" category';
    END IF;
    
    -- Validate income entries
    IF NEW.entry_type = 'Income' AND category_name != 'Commission' THEN
      RAISE EXCEPTION 'Settlement income entries must use "Commission" category';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for accounting entry validation
DROP TRIGGER IF EXISTS accounting_entry_validation_trigger ON accounting_entries;
CREATE TRIGGER accounting_entry_validation_trigger
    BEFORE INSERT OR UPDATE ON accounting_entries
    FOR EACH ROW
    EXECUTE FUNCTION validate_accounting_entry();

-- Create function to automatically create ticket income entry
CREATE OR REPLACE FUNCTION create_ticket_income_entry()
RETURNS TRIGGER AS $$
DECLARE
  cash_account_id UUID;
  ticket_booking_category_id UUID;
BEGIN
  -- Get cash account
  SELECT id INTO cash_account_id
  FROM accounts
  WHERE name = 'Cash'
  LIMIT 1;
  
  -- Get Ticket Booking category
  SELECT id INTO ticket_booking_category_id
  FROM accounting_categories
  WHERE name = 'Ticket Booking' AND category_type = 'Income'
  LIMIT 1;
  
  -- Create income entry
  IF cash_account_id IS NOT NULL AND ticket_booking_category_id IS NOT NULL THEN
    INSERT INTO accounting_entries (
      account_id,
      category_id,
      entry_type,
      amount,
      entry_date,
      description,
      ticket_id,
      created_at
    ) VALUES (
      cash_account_id,
      ticket_booking_category_id,
      'Income',
      NEW.amount,
      COALESCE(NEW.booking_date, CURRENT_DATE),
      'Ticket Booking - ' || NEW.passenger_name || ' (' || NEW.ticket_number || ')',
      NEW.id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic ticket income entry creation
DROP TRIGGER IF EXISTS ticket_income_entry_trigger ON tickets;
CREATE TRIGGER ticket_income_entry_trigger
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_income_entry();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounting_entries_ticket_id ON accounting_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_settlement_id ON accounting_entries(settlement_id);
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_ticket_ids ON operator_settlements USING GIN(ticket_ids);

-- Verify setup
SELECT 
  'Setup Verification' as section,
  ac.name as category_name,
  ac.category_type,
  ac.description,
  ac.is_active
FROM accounting_categories ac
WHERE ac.name IN ('Ticket Booking', 'Operator Payment', 'Commission')
ORDER BY ac.category_type, ac.name;

-- Show sample financial flow
SELECT 
  'Sample Financial Flow' as section,
  t.ticket_number,
  t.amount as ticket_amount,
  t.commission_percentage,
  t.commission_amount,
  t.operator_payable,
  (t.amount - t.operator_payable) as profit
FROM tickets t
WHERE t.commission_percentage IS NOT NULL
LIMIT 5;

-- Create view for financial summary
CREATE OR REPLACE VIEW ticket_financial_summary AS
SELECT 
  t.id,
  t.ticket_number,
  t.amount as ticket_amount,
  t.passenger_name,
  o.name as operator_name,
  t.commission_percentage,
  t.commission_amount,
  t.operator_payable,
  t.status,
  t.booking_date,
  -- Income entries
  COALESCE(
    (SELECT SUM(ae.amount) 
     FROM accounting_entries ae 
     JOIN accounting_categories ac ON ae.category_id = ac.id 
     WHERE ae.ticket_id = t.id AND ae.entry_type = 'Income'), 
    0
  ) as total_income,
  -- Expense entries
  COALESCE(
    (SELECT SUM(ae.amount) 
     FROM accounting_entries ae 
     JOIN accounting_categories ac ON ae.category_id = ac.id 
     WHERE ae.ticket_id = t.id AND ae.entry_type = 'Expense'), 
    0
  ) as total_expense,
  -- Profit
  COALESCE(
    (SELECT SUM(ae.amount) 
     FROM accounting_entries ae 
     JOIN accounting_categories ac ON ae.category_id = ac.id 
     WHERE ae.ticket_id = t.id AND ae.entry_type = 'Income'), 
    0
  ) - COALESCE(
    (SELECT SUM(ae.amount) 
     FROM accounting_entries ae 
     JOIN accounting_categories ac ON ae.category_id = ac.id 
     WHERE ae.ticket_id = t.id AND ae.entry_type = 'Expense'), 
    0
  ) as profit
FROM tickets t
JOIN operators o ON t.operator_id = o.id;

-- Test the setup
SELECT 
  'Setup Complete' as status,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN commission_percentage IS NOT NULL THEN 1 END) as tickets_with_commission,
  SUM(COALESCE(amount, 0)) as total_ticket_amount,
  SUM(COALESCE(commission_amount, 0)) as total_commission,
  SUM(COALESCE(operator_payable, 0)) as total_operator_payable
FROM tickets;
