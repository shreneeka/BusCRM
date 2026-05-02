-- Fix Accounting Module RLS and Tables
-- This migration ensures all accounting tables exist with proper RLS policies

-- 1. Ensure accounting_categories table exists
CREATE TABLE IF NOT EXISTS accounting_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('Income', 'Expense')),
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Enable RLS for accounting_categories
ALTER TABLE accounting_categories ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for accounting_categories
DROP POLICY IF EXISTS "Authenticated users can manage accounting_categories" ON accounting_categories;
CREATE POLICY "Authenticated users can manage accounting_categories" ON accounting_categories
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Ensure accounting_entries table exists
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('Income', 'Expense')),
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

-- 5. Enable RLS for accounting_entries
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for accounting_entries
DROP POLICY IF EXISTS "Authenticated users can manage accounting_entries" ON accounting_entries;
CREATE POLICY "Authenticated users can manage accounting_entries" ON accounting_entries
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Insert default categories if they don't exist
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Ticket Booking', 'Income', 'Income from ticket bookings', true),
('Bus Rental', 'Income', 'Income from bus rentals', true),
('Other Income', 'Income', 'Other income sources', true),
('Fuel', 'Expense', 'Fuel expenses', true),
('Driver Salary', 'Expense', 'Driver salary payments', true),
('Maintenance', 'Expense', 'Bus maintenance costs', true),
('Office Expenses', 'Expense', 'Office operational expenses', true),
('Other Expense', 'Expense', 'Other expense types', true)
ON CONFLICT (name, category_type) DO NOTHING;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounting_categories_name_type ON accounting_categories(name, category_type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_account_id ON accounting_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_category_id ON accounting_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_type ON accounting_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_ticket_id ON accounting_entries(ticket_id);
