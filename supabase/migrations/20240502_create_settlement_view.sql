-- Create settlement calculations view
-- This view provides settlement data for operators

-- First, ensure the tickets table has the required columns
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id),
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_is_settled ON tickets(is_settled);
CREATE INDEX IF NOT EXISTS idx_tickets_settled_at ON tickets(settled_at);

-- Create the settlement calculations view
CREATE OR REPLACE VIEW settlement_calculations AS
SELECT 
    o.id as operator_id,
    o.operator_name,
    o.commission_percent,
    COUNT(t.id) as ticket_count,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(SUM(t.amount) * o.commission_percent / 100, 0) as commission_amount,
    COALESCE(SUM(t.amount) - (SUM(t.amount) * o.commission_percent / 100), 0) as operator_payable,
    COUNT(CASE WHEN t.is_settled = false THEN 1 END) as pending_count,
    COALESCE(SUM(CASE WHEN t.is_settled = false THEN t.amount ELSE 0 END), 0) as pending_amount
FROM operators o
LEFT JOIN tickets t ON o.id = t.operator_id
WHERE o.is_active = true AND t.status = 'Booked'
GROUP BY o.id, o.operator_name, o.commission_percent
HAVING COUNT(t.id) > 0
ORDER BY o.operator_name;
