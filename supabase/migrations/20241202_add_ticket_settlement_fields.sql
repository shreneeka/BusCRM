-- Migration: Add settlement fields to tickets table
-- Stores operator payment details directly in ticket record (Req 4.3)

-- Add settlement fields with IF NOT EXISTS
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS settled_operator_name TEXT,
ADD COLUMN IF NOT EXISTS settled_mobile_number TEXT,
ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add settlement status index
CREATE INDEX IF NOT EXISTS idx_tickets_settlement_status ON tickets(settlement_status);
CREATE INDEX IF NOT EXISTS idx_tickets_settled_by ON tickets(settled_by);

-- Update RLS policy to include new fields (existing policy allows all for authenticated)
-- No change needed, but verify
DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;
CREATE POLICY "Authenticated users can manage tickets" ON tickets
FOR ALL TO authenticated
USING (true);

-- Optional: Update existing pending tickets settlement_status if missing
UPDATE tickets 
SET settlement_status = 'pending' 
WHERE settlement_status IS NULL AND status = 'Booked';

-- Verify changes
COMMENT ON COLUMN tickets.settled_operator_name IS 'Operator name recorded at settlement';
COMMENT ON COLUMN tickets.settled_mobile_number IS 'Operator mobile recorded at settlement';
COMMENT ON COLUMN tickets.settled_by IS 'User ID who performed settlement';

