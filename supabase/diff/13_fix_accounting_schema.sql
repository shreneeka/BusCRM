-- Fix Accounting Schema Issues
-- This migration fixes inconsistencies and missing components in the accounting system

-- 1. Fix accounts table - ensure both balance and opening_balance exist and are properly set
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS opening_balance DECIMAL DEFAULT 0 NOT NULL;

-- Update existing accounts to set opening_balance from current balance if not already set
UPDATE accounts SET opening_balance = balance WHERE opening_balance = 0 AND balance > 0;

-- 2. Ensure accounting_entries table has all required fields with correct types
ALTER TABLE accounting_entries DROP CONSTRAINT IF EXISTS accounting_entries_entry_type_check;
ALTER TABLE accounting_entries ADD CONSTRAINT accounting_entries_entry_type_check 
CHECK (entry_type IN ('Income', 'Expense'));

-- 3. Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_accounting_entries_ticket_id ON accounting_entries(ticket_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_created_by ON accounting_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_account_id ON tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);

-- 4. Fix Commission category insertion (there was a typo in migration 11)
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Commission', 'Income', 'Commission income from ticket bookings', true)
ON CONFLICT (name, category_type) DO NOTHING;

-- 5. Ensure Cash account exists and is properly configured
INSERT INTO accounts (name, type, balance, opening_balance, is_active) 
VALUES ('Cash', 'Cash', 0, 0, true)
ON CONFLICT (name) DO UPDATE SET 
  type = EXCLUDED.type,
  balance = COALESCE(accounts.balance, 0),
  opening_balance = COALESCE(accounts.opening_balance, 0),
  is_active = true;

-- 6. Add updated_at trigger to accounting_entries for better tracking
ALTER TABLE accounting_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

CREATE OR REPLACE FUNCTION update_accounting_entries_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounting_entries_modtime ON accounting_entries;
CREATE TRIGGER update_accounting_entries_modtime
BEFORE UPDATE ON accounting_entries
FOR EACH ROW EXECUTE PROCEDURE update_accounting_entries_modified_column();

-- 7. Add validation function to ensure data integrity
CREATE OR REPLACE FUNCTION validate_accounting_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure amount is positive
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;
    
    -- Ensure entry_date is not in the future
    IF NEW.entry_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Entry date cannot be in the future';
    END IF;
    
    -- If ticket_id is present, ensure it's a valid ticket
    IF NEW.ticket_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = NEW.ticket_id) THEN
            RAISE EXCEPTION 'Invalid ticket_id';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_accounting_entry ON accounting_entries;
CREATE TRIGGER trigger_validate_accounting_entry
BEFORE INSERT OR UPDATE ON accounting_entries
FOR EACH ROW EXECUTE FUNCTION validate_accounting_entry();

-- 8. Fix any existing accounting_entries that might have null values in critical fields
UPDATE accounting_entries 
SET entry_date = COALESCE(entry_date, CURRENT_DATE)
WHERE entry_date IS NULL;

UPDATE accounting_entries 
SET description = COALESCE(description, 'No description')
WHERE description IS NULL;

-- 9. Add a view for easier accounting reports
CREATE OR REPLACE VIEW accounting_summary AS
SELECT 
    ae.id,
    ae.entry_type,
    ae.amount,
    ae.entry_date,
    ae.description,
    a.name as account_name,
    ac.name as category_name,
    t.ticket_number,
    t.passenger_name,
    ae.created_at
FROM accounting_entries ae
LEFT JOIN accounts a ON ae.account_id = a.id
LEFT JOIN accounting_categories ac ON ae.category_id = ac.id
LEFT JOIN tickets t ON ae.ticket_id = t.id
ORDER BY ae.created_at DESC;
