-- 1. Custom Enums for Ticket Module
CREATE TYPE travel_type AS ENUM ('AC', 'Non-AC');
CREATE TYPE account_type AS ENUM ('Cash', 'UPI');
CREATE TYPE ticket_status AS ENUM ('Booked', 'Cancelled', 'Settled');

-- 2. Accounts Table (for Accounting Integration)
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type account_type NOT NULL,
  balance DECIMAL DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Enable RLS for accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR 'accounts' TABLE
CREATE POLICY "Authenticated users can manage accounts" ON accounts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Insert default cash account
INSERT INTO accounts (name, type, balance, is_active)
VALUES ('Cash', 'Cash', 0, true)
ON CONFLICT (name) DO NOTHING;

-- 6. Tickets Table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Ticket Details
  passenger_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,
  journey_date DATE NOT NULL,
  booking_date DATE DEFAULT CURRENT_DATE NOT NULL,
  seat_numbers TEXT[] NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats >= 1 AND total_seats <= 70),
  pickup_time TIME NOT NULL,
  bus_number TEXT,
  travel_type travel_type NOT NULL DEFAULT 'Non-AC',
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Payment Details
  account_id UUID REFERENCES accounts(id),
  account_type account_type NOT NULL,
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  
  -- Status
  status ticket_status DEFAULT 'Booked' NOT NULL,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Enable RLS for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES FOR 'tickets' TABLE
CREATE POLICY "Authenticated users can manage tickets" ON tickets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Add updated_at column & trigger
ALTER TABLE tickets 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

CREATE OR REPLACE FUNCTION update_tickets_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_modtime
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE PROCEDURE update_tickets_modified_column();

-- 10. Income Entries Table (for Accounting Integration)
CREATE TABLE income_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id),
  amount DECIMAL NOT NULL CHECK (amount >= 0),
  description TEXT,
  entry_type TEXT NOT NULL DEFAULT 'Ticket Booking',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Enable RLS for income_entries
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

-- 12. POLICIES FOR 'income_entries' TABLE
CREATE POLICY "Authenticated users can manage income_entries" ON income_entries
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 13. Operator Settlement Table (for Operator Payments)
CREATE TABLE operator_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  operator_name TEXT NOT NULL,
  mobile_number TEXT,
  total_amount DECIMAL NOT NULL,
  commission_percentage DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  operator_payable DECIMAL NOT NULL,
  is_paid BOOLEAN DEFAULT false NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 14. Enable RLS for operator_settlements
ALTER TABLE operator_settlements ENABLE ROW LEVEL SECURITY;

-- 15. POLICIES FOR 'operator_settlements' TABLE
CREATE POLICY "Authenticated users can manage operator_settlements" ON operator_settlements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 16. Operators Table (for Commission Setup)
CREATE TABLE operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  commission_percentage DECIMAL DEFAULT 10 NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 17. Enable RLS for operators
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- 18. POLICIES FOR 'operators' TABLE
CREATE POLICY "Authenticated users can manage operators" ON operators
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 19. Add operator_id to tickets for link
ALTER TABLE tickets ADD COLUMN operator_id UUID REFERENCES operators(id);
