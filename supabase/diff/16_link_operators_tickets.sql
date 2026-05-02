-- STEP 2: Link Operator with Tickets
-- This migration adds operator relationship to tickets table

-- 1. Add operator_id column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id);

-- 2. Add settlement tracking columns to tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES users(id);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_operator_id ON tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_is_settled ON tickets(is_settled);
CREATE INDEX IF NOT EXISTS idx_tickets_settled_at ON tickets(settled_at);

-- 4. Add validation function for tickets
CREATE OR REPLACE FUNCTION validate_ticket_operator()
RETURNS TRIGGER AS $$
BEGIN
    -- If operator_id is provided, ensure it's a valid operator
    IF NEW.operator_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operators WHERE id = NEW.operator_id AND is_active = true) THEN
            RAISE EXCEPTION 'Invalid or inactive operator selected';
        END IF;
    END IF;
    
    -- If ticket is marked as settled, ensure settled_at is set
    IF NEW.is_settled = true AND NEW.settled_at IS NULL THEN
        NEW.settled_at = TIMEZONE('utc', NOW());
    END IF;
    
    -- If ticket is not settled, ensure settled_at is null
    IF NEW.is_settled = false AND NEW.settled_at IS NOT NULL THEN
        NEW.settled_at = NULL;
        NEW.settled_by = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_ticket_operator ON tickets;
CREATE TRIGGER trigger_validate_ticket_operator
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION validate_ticket_operator();

-- 5. Create view for operator tickets summary
CREATE OR REPLACE VIEW operator_tickets_summary AS
SELECT 
    o.id as operator_id,
    o.operator_name,
    o.person_name,
    o.mobile_number,
    o.commission_percent,
    COUNT(t.id) as total_tickets,
    COUNT(CASE WHEN t.is_settled = false THEN 1 END) as pending_tickets,
    COUNT(CASE WHEN t.is_settled = true THEN 1 END) as settled_tickets,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN t.is_settled = false THEN t.amount ELSE 0 END), 0) as pending_amount,
    COALESCE(SUM(CASE WHEN t.is_settled = true THEN t.amount ELSE 0 END), 0) as settled_amount
FROM operators o
LEFT JOIN tickets t ON o.id = t.operator_id
WHERE o.is_active = true
GROUP BY o.id, o.operator_name, o.person_name, o.mobile_number, o.commission_percent
ORDER BY o.operator_name;

-- 6. Create view for settlement calculations
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
