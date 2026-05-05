-- Complete Database Setup Script
-- Run this in your Supabase SQL editor to set up the entire database

-- 1. Create basic enums (do nothing if they already exist)
do $$
begin
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'travel_type') THEN
        CREATE TYPE travel_type AS ENUM ('AC', 'Non-AC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('Cash', 'UPI');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('Booked', 'Cancelled', 'Settled');
    END IF;
end $$;

-- 2. Create operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  commission_percent DECIMAL DEFAULT 10 NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type account_type NOT NULL,
  balance DECIMAL DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Create tickets table with all required fields
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Ticket Details
  passenger_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_area TEXT NOT NULL,
  drop_city TEXT NOT NULL,
  drop_location TEXT NOT NULL,
  journey_date DATE NOT NULL,
  booking_date DATE DEFAULT CURRENT_DATE NOT NULL,
  seat_numbers TEXT[] NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 70),
  pickup_time TIME NOT NULL,
  bus_number TEXT NOT NULL,
  travel_type travel_type NOT NULL DEFAULT 'Non-AC',
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Payment Details
  account_id UUID REFERENCES accounts(id),
  account_type account_type NOT NULL,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  
  -- Operator Details
  operator_id UUID REFERENCES operators(id),
  
  -- Status Fields
  status ticket_status DEFAULT 'Booked' NOT NULL,
  settlement_status TEXT DEFAULT 'pending' NOT NULL CHECK (settlement_status IN ('pending', 'paid')),
  payment_status TEXT DEFAULT 'not_paid' NOT NULL CHECK (payment_status IN ('paid', 'partial', 'not_paid')),
  
  -- Timestamp Fields
  settlement_timestamp TIMESTAMP WITH TIME ZONE NULL,
  settlement_processed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Payment received by field
  payment_received_by TEXT NOT NULL DEFAULT 'self' CHECK (payment_received_by IN ('self', 'operator'))
);

-- 5. Create accounting_categories table
CREATE TABLE IF NOT EXISTS accounting_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category_type TEXT NOT NULL CHECK (category_type IN ('Income', 'Expense')),
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Create accounting_entries table
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  category_id UUID REFERENCES accounting_categories(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('Income', 'Expense')),
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  entry_date DATE NOT NULL,
  description TEXT,
  ticket_id UUID REFERENCES tickets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Enable Row Level Security
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
CREATE POLICY "Users can manage operators" ON operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage accounts" ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage tickets" ON tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage accounting_categories" ON accounting_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage accounting_entries" ON accounting_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status ON tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_settlement_status ON tickets(settlement_status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_operators_is_active ON operators(is_active);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_date ON accounting_entries(entry_date);

-- 10. Create updated_at trigger for tickets
CREATE OR REPLACE FUNCTION update_tickets_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_modtime ON tickets;
CREATE TRIGGER update_tickets_modtime
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE PROCEDURE update_tickets_modified_column();

-- 11. Insert default data
-- Default cash account
INSERT INTO accounts (name, type, balance, is_active)
VALUES ('Cash', 'Cash', 0, true)
ON CONFLICT (name) DO NOTHING;

-- Default accounting categories
INSERT INTO accounting_categories (name, category_type, description, is_active)
VALUES 
  ('Ticket Sales', 'Income', 'Income from ticket bookings', true),
  ('Commission', 'Income', 'Commission earned from operators', true),
  ('Fuel', 'Expense', 'Fuel expenses', true),
  ('Maintenance', 'Expense', 'Vehicle maintenance costs', true)
ON CONFLICT (name) DO NOTHING;

-- Sample operators
INSERT INTO operators (operator_name, person_name, mobile_number, commission_percent, is_active)
VALUES 
  ('Express Travels', 'Raj Kumar', '9876543210', 10, true),
  ('City Bus Service', 'Amit Singh', '9876543211', 12, true),
  ('Fast Transport', 'Priya Sharma', '9876543212', 8, true)
ON CONFLICT (mobile_number) DO NOTHING;

-- Sample tickets
INSERT INTO tickets (
  passenger_name, mobile_number, pickup_city, pickup_area, drop_city, drop_location,
  journey_date, seat_numbers, total_seats, pickup_time, bus_number, travel_type,
  ticket_number, account_type, amount, operator_id, status, settlement_status, payment_status
)
SELECT 
  'John Doe', '9876543210', 'Mumbai', 'Dadar', 'Pune', 'Shivaji Nagar',
  CURRENT_DATE + INTERVAL '1 day', ARRAY['A1', 'A2'], 2, '09:00', 'MH-12-1234', 'AC',
  'TKT-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || (ROW_NUMBER() OVER (ORDER BY (SELECT NULL))),
  'Cash', 500.00, o.id, 'Booked', 'pending', 'not_paid'
FROM operators o 
WHERE o.operator_name = 'Express Travels'
LIMIT 1;

INSERT INTO tickets (
  passenger_name, mobile_number, pickup_city, pickup_area, drop_city, drop_location,
  journey_date, seat_numbers, total_seats, pickup_time, bus_number, travel_type,
  ticket_number, account_type, amount, operator_id, status, settlement_status, payment_status
)
SELECT 
  'Jane Smith', '9876543211', 'Delhi', 'Connaught Place', 'Agra', 'Taj Mahal',
  CURRENT_DATE + INTERVAL '2 days', ARRAY['B1'], 1, '08:30', 'DL-01-5678', 'Non-AC',
  'TKT-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || (ROW_NUMBER() OVER (ORDER BY (SELECT NULL))),
  'UPI', 300.00, o.id, 'Booked', 'pending', 'not_paid'
FROM operators o 
WHERE o.operator_name = 'City Bus Service'
LIMIT 1;

-- 12. Verification query
SELECT 
  'Database setup completed successfully' as status,
  (SELECT COUNT(*) FROM operators) as operators_count,
  (SELECT COUNT(*) FROM tickets) as tickets_count,
  (SELECT COUNT(*) FROM accounts) as accounts_count,
  (SELECT COUNT(*) FROM accounting_categories) as categories_count;
