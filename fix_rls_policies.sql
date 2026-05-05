-- Fix RLS policies to allow data access and insertion

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage operators" ON operators;
DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;

-- Create new policies that allow anonymous access for development
CREATE POLICY "Allow anonymous access to operators" ON operators
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to tickets" ON tickets
FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS (keep it enabled but with permissive policies)
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Insert sample operators
INSERT INTO operators (name, person_name, mobile_number, commission_percentage, is_active) VALUES
('Express Travels', 'Raj Kumar', '9876543210', 10, true),
('City Bus Service', 'Amit Sharma', '9876543211', 12, true),
('Tourist Bus', 'Vikram Singh', '9876543212', 8, true)
ON CONFLICT DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (
  ticket_number, passenger_name, mobile_number, pickup_city, pickup_area, pickup_location,
  drop_city, drop_location, journey_date, booking_date, seat_numbers, total_seats,
  pickup_time, bus_number, travel_type, account_id, account_type, amount, operator_id
) VALUES
(
  'TKT001', 'John Doe', '9876543220', 'Mumbai', 'Andheri', 'Andheri',
  'Pune', 'Swargate', '2024-05-10', '2024-05-04', ARRAY['A1', 'A2'], 2,
  '08:00:00', 'MH-12-AB-1234', 'AC', NULL, 'Cash', 500, 
  (SELECT id FROM operators WHERE name = 'Express Travels' LIMIT 1)
),
(
  'TKT002', 'Jane Smith', '9876543221', 'Delhi', 'Connaught Place', 'Connaught Place',
  'Agra', 'Taj Mahal', '2024-05-11', '2024-05-04', ARRAY['B1'], 1,
  '09:30:00', 'DL-01-CD-5678', 'Non-AC', NULL, 'Cash', 300,
  (SELECT id FROM operators WHERE name = 'City Bus Service' LIMIT 1)
),
(
  'TKT003', 'Mike Johnson', '9876543222', 'Bangalore', 'MG Road', 'MG Road',
  'Mysore', 'Palace', '2024-05-12', '2024-05-04', ARRAY['C3', 'C4'], 2,
  '10:15:00', 'KA-01-EF-9012', 'AC', NULL, 'Cash', 750,
  (SELECT id FROM operators WHERE name = 'Tourist Bus' LIMIT 1)
)
ON CONFLICT (ticket_number) DO NOTHING;
