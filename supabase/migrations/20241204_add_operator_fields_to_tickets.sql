-- Add operator name and mobile fields to tickets table
ALTER TABLE tickets 
ADD COLUMN operator_name TEXT,
ADD COLUMN operator_mobile TEXT;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_tickets_operator_name ON tickets(operator_name);
CREATE INDEX IF NOT EXISTS idx_tickets_operator_mobile ON tickets(operator_mobile);

-- Add comment to describe the new fields
COMMENT ON COLUMN tickets.operator_name IS 'Name of the operator for this ticket';
COMMENT ON COLUMN tickets.operator_mobile IS 'Mobile number of the operator for this ticket';
