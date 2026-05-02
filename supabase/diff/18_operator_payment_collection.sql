-- STEP 3: Operator Payment Collection System
-- This migration creates the payment collection system for operator payments

-- 1. Create operator_payments table
CREATE TABLE IF NOT EXISTS operator_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES operators(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  amount_paid DECIMAL NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  payment_method TEXT DEFAULT 'Cash',
  recorded_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_operator_payments_operator_id ON operator_payments(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_payments_ticket_id ON operator_payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_operator_payments_payment_date ON operator_payments(payment_date);

-- 3. Add payment tracking columns to tickets (if not already exists)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS payment_collected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_collected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_collected_by UUID REFERENCES users(id);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_operator_payments_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operator_payments_modtime ON operator_payments;
CREATE TRIGGER update_operator_payments_modtime
BEFORE UPDATE ON operator_payments
FOR EACH ROW EXECUTE FUNCTION update_operator_payments_modified_column();

-- 5. Enable RLS
ALTER TABLE operator_payments ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policies
CREATE POLICY "Authenticated users can manage operator payments" ON operator_payments
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Add validation function for operator payments
CREATE OR REPLACE FUNCTION validate_operator_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate operator exists and is active
    IF NOT EXISTS (SELECT 1 FROM operators WHERE id = NEW.operator_id AND is_active = true) THEN
        RAISE EXCEPTION 'Invalid or inactive operator';
    END IF;
    
    -- Validate ticket exists
    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = NEW.ticket_id) THEN
        RAISE EXCEPTION 'Invalid ticket';
    END IF;
    
    -- Ensure payment amount is positive
    IF NEW.amount_paid <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
    
    -- Check if payment already collected for this ticket
    IF EXISTS (SELECT 1 FROM operator_payments WHERE ticket_id = NEW.ticket_id AND id != NEW.id) THEN
        RAISE EXCEPTION 'Payment already collected for this ticket';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_operator_payment ON operator_payments;
CREATE TRIGGER trigger_validate_operator_payment
BEFORE INSERT OR UPDATE ON operator_payments
FOR EACH ROW EXECUTE FUNCTION validate_operator_payment();

-- 8. Create function to record operator payment and update accounting
CREATE OR REPLACE FUNCTION record_operator_payment(
    p_operator_id UUID,
    p_ticket_id UUID,
    p_amount_paid DECIMAL,
    p_payment_method TEXT DEFAULT 'Cash',
    p_notes TEXT DEFAULT NULL,
    p_recorded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    payment_id UUID;
    ticket_record RECORD;
    operator_record RECORD;
    commission_amount DECIMAL;
    operator_payable DECIMAL;
    commission_account_id UUID;
    operator_account_id UUID;
BEGIN
    -- Get ticket and operator details
    SELECT t.*, o.commission_percent INTO ticket_record, operator_record
    FROM tickets t
    JOIN operators o ON t.operator_id = o.id
    WHERE t.id = p_ticket_id AND o.id = p_operator_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid ticket or operator';
    END IF;
    
    -- Calculate commission and operator payable
    commission_amount := ticket_record.amount * operator_record.commission_percent / 100;
    operator_payable := ticket_record.amount - commission_amount;
    
    -- Get commission and operator accounts (assuming they exist)
    SELECT id INTO commission_account_id FROM accounts WHERE name = 'Commission Income' LIMIT 1;
    SELECT id INTO operator_account_id FROM accounts WHERE name = 'Operator Payable' LIMIT 1;
    
    IF commission_account_id IS NULL OR operator_account_id IS NULL THEN
        RAISE EXCEPTION 'Required accounts not found';
    END IF;
    
    -- Create operator payment record
    INSERT INTO operator_payments (
        operator_id, ticket_id, amount_paid, payment_method, notes, recorded_by
    ) VALUES (
        p_operator_id, p_ticket_id, p_amount_paid, p_payment_method, p_notes, p_recorded_by
    ) RETURNING id INTO payment_id;
    
    -- Update ticket payment status
    UPDATE tickets 
    SET payment_collected = true, 
        payment_collected_at = TIMEZONE('utc', NOW()),
        payment_collected_by = p_recorded_by
    WHERE id = p_ticket_id;
    
    -- Create accounting entries
    -- 1. Record commission as income
    INSERT INTO accounting_entries (
        account_id, category_id, entry_type, amount, entry_date, description
    ) VALUES (
        commission_account_id,
        (SELECT id FROM accounting_categories WHERE name = 'Commission' LIMIT 1),
        'Income',
        commission_amount,
        TIMEZONE('utc', NOW()),
        'Commission from ticket ' || ticket_record.ticket_number || ' - ' || operator_record.operator_name
    );
    
    -- 2. Deduct operator payable from expenses
    INSERT INTO accounting_entries (
        account_id, category_id, entry_type, amount, entry_date, description
    ) VALUES (
        operator_account_id,
        (SELECT id FROM accounting_categories WHERE name = 'Operator Payment' LIMIT 1),
        'Expense',
        operator_payable,
        TIMEZONE('utc', NOW()),
        'Payment to operator ' || operator_record.operator_name || ' for ticket ' || ticket_record.ticket_number
    );
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create view for payment collection summary
CREATE OR REPLACE VIEW operator_payment_summary AS
SELECT 
    o.id as operator_id,
    o.operator_name,
    o.person_name,
    o.mobile_number,
    COUNT(t.id) as total_tickets,
    COUNT(CASE WHEN t.payment_collected = true THEN 1 END) as paid_tickets,
    COUNT(CASE WHEN t.payment_collected = false THEN 1 END) as unpaid_tickets,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN t.payment_collected = true THEN t.amount ELSE 0 END), 0) as collected_amount,
    COALESCE(SUM(CASE WHEN t.payment_collected = false THEN t.amount ELSE 0 END), 0) as pending_amount,
    COALESCE(SUM(op.amount_paid), 0) as total_paid,
    MAX(op.payment_date) as last_payment_date
FROM operators o
LEFT JOIN tickets t ON o.id = t.operator_id AND t.status = 'Booked'
LEFT JOIN operator_payments op ON t.id = op.ticket_id
WHERE o.is_active = true
GROUP BY o.id, o.operator_name, o.person_name, o.mobile_number
ORDER BY o.operator_name;

-- 10. Create view for payment collection details
CREATE OR REPLACE VIEW payment_collection_details AS
SELECT 
    t.id as ticket_id,
    t.ticket_number,
    t.passenger_name,
    t.amount as ticket_amount,
    t.booking_date,
    o.id as operator_id,
    o.operator_name,
    o.person_name,
    o.mobile_number,
    o.commission_percent,
    t.amount * o.commission_percent / 100 as commission_amount,
    t.amount - (t.amount * o.commission_percent / 100) as operator_payable,
    t.payment_collected,
    t.payment_collected_at,
    op.id as payment_id,
    op.amount_paid,
    op.payment_date,
    op.payment_method,
    op.notes
FROM tickets t
JOIN operators o ON t.operator_id = o.id
LEFT JOIN operator_payments op ON t.id = op.ticket_id
WHERE t.status = 'Booked'
ORDER BY t.booking_date DESC;
