-- Make operator_id nullable to allow tickets without operator
-- Fixes UUID empty string error when operator is optional

ALTER TABLE tickets 
ALTER COLUMN operator_id DROP NOT NULL;

-- Update indexes if needed (safe to run)
DROP INDEX IF EXISTS idx_tickets_operator_id;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id) WHERE operator_id IS NOT NULL;

COMMENT ON COLUMN tickets.operator_id IS 'Operator ID (optional - can be NULL if no operator assigned)';
