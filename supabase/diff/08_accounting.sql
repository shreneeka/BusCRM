-- Accounting Module - Database Schema
-- Phase 1: Categories, Accounts Enhancement, Entries

-- 1. Custom Enums for Accounting
CREATE TYPE accounting_entry_type AS ENUM ('Income', 'Expense');
CREATE TYPE category_type AS ENUM ('Income', 'Expense');

-- 2. Add opening_balance to accounts (if not exists)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS opening_balance DECIMAL DEFAULT 0 NOT NULL;

-- 3. Categories Table (for Income/Expense categories)
CREATE TABLE IF NOT EXISTS accounting_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_type category_type NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Enable RLS for accounting_categories
ALTER TABLE accounting_categories ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES FOR 'accounting_categories' TABLE
CREATE POLICY "Authenticated users can manage accounting_categories" ON accounting_categories
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Create unique index on category name + type
CREATE UNIQUE INDEX IF NOT EXISTS unique_category_name_type 
ON accounting_categories (name, category_type);

-- 7. Insert default income categories
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Ticket Booking', 'Income', 'Income from ticket bookings', true),
('Bus Rental', 'Income', 'Income from bus rentals', true),
('Other Income', 'Income', 'Other income sources', true)
ON CONFLICT DO NOTHING;

-- 8. Insert default expense categories
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Fuel', 'Expense', 'Fuel expenses', true),
('Driver Salary', 'Expense', 'Driver salary payments', true),
('Maintenance', 'Expense', 'Bus maintenance costs', true),
('Office Expenses', 'Expense', 'Office operational expenses', true),
('Other Expense', 'Expense', 'Other expense types', true)
ON CONFLICT DO NOTHING;

-- 9. Accounting Entries Table (Unified Income + Expense)
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_type accounting_entry_type NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES accounting_categories(id) ON DELETE RESTRICT,
  amount DECIMAL NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference_number TEXT,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 10. Enable RLS for accounting_entries
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- 11. POLICIES FOR 'accounting_entries' TABLE
CREATE POLICY "Authenticated users can manage accounting_entries" ON accounting_entries
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 12. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounting_entries_account_id ON accounting_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_category_id ON accounting_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_type ON accounting_entries(entry_type);

-- 13. Add updated_at column to accounts for balance tracking
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

CREATE OR REPLACE FUNCTION update_accounts_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounts_modtime ON accounts;
CREATE TRIGGER update_accounts_modtime
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE PROCEDURE update_accounts_modified_column();
