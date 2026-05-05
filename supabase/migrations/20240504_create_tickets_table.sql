-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  passenger_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_area TEXT NOT NULL,
  drop_city TEXT NOT NULL,
  drop_location TEXT NOT NULL,
  journey_date DATE NOT NULL,
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pickup_time TIME NOT NULL,
  bus_number TEXT NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('AC', 'Non-AC')),
  seat_numbers TEXT[] NOT NULL,
  total_seats INTEGER NOT NULL,
  amount DECIMAL NOT NULL,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  account_type TEXT CHECK (account_type IN ('Cash', 'UPI')),
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'paid')),
  settlement_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_journey_date ON tickets(journey_date);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_date ON tickets(booking_date);
CREATE INDEX IF NOT EXISTS idx_tickets_settlement_status ON tickets(settlement_status);
CREATE INDEX IF NOT EXISTS idx_tickets_mobile ON tickets(mobile_number);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can manage tickets" ON tickets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create a sequence for auto-generating ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq
START WITH 1000
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

-- Create a function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'T' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Set default ticket number
ALTER TABLE tickets ALTER COLUMN ticket_number SET DEFAULT generate_ticket_number();

-- Insert sample tickets
INSERT INTO tickets (
  passenger_name, mobile_number, pickup_city, pickup_area, drop_city, drop_location,
  journey_date, booking_date, pickup_time, bus_number, travel_type, seat_numbers,
  total_seats, amount, operator_id, account_type
) VALUES
(
  'Rahul Kumar', '9876543210', 'Delhi', 'Connaught Place', 'Mumbai', 'Bandra',
  '2024-05-10', '2024-05-04', '08:00:00', 'DL01AB1234', 'AC', ARRAY['A1', 'A2'],
  2, 1500.00, (SELECT id FROM operators WHERE operator_name = 'Express Travels' LIMIT 1), 'Cash'
),
(
  'Amit Sharma', '9876543211', 'Mumbai', 'Andheri', 'Pune', 'Shivaji Nagar',
  '2024-05-11', '2024-05-04', '10:30:00', 'MH02CD5678', 'Non-AC', ARRAY['B3'],
  1, 800.00, (SELECT id FROM operators WHERE operator_name = 'City Bus Service' LIMIT 1), 'UPI'
)
ON CONFLICT (ticket_number) DO NOTHING;
