-- Organization Module Enhancements
-- This migration adds enhancements to support the complete travel ticket management workflow

-- 1. Add updated_at column to operators table
ALTER TABLE operators 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 2. Create trigger for operators updated_at
CREATE OR REPLACE FUNCTION update_operators_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operators_modtime ON operators;
CREATE TRIGGER update_operators_modtime
BEFORE UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION update_operators_modified_column();

-- 3. Add updated_at column to operator_settlements table
ALTER TABLE operator_settlements 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 4. Create trigger for operator_settlements updated_at
CREATE OR REPLACE FUNCTION update_operator_settlements_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operator_settlements_modtime ON operator_settlements;
CREATE TRIGGER update_operator_settlements_modtime
BEFORE UPDATE ON operator_settlements
FOR EACH ROW EXECUTE FUNCTION update_operator_settlements_modified_column();

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);
CREATE INDEX IF NOT EXISTS idx_operators_mobile ON operators(mobile_number);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_operator_name ON operator_settlements(operator_name);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_is_paid ON operator_settlements(is_paid);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_paid_at ON operator_settlements(paid_at);

-- 6. Add validation function for operator settlements
CREATE OR REPLACE FUNCTION validate_operator_settlement()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure amounts are positive
    IF NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Total amount must be greater than 0';
    END IF;
    
    IF NEW.commission_percentage < 0 OR NEW.commission_percentage > 100 THEN
        RAISE EXCEPTION 'Commission percentage must be between 0 and 100';
    END IF;
    
    IF NEW.commission_amount < 0 THEN
        RAISE EXCEPTION 'Commission amount must be greater than or equal to 0';
    END IF;
    
    IF NEW.operator_payable < 0 THEN
        RAISE EXCEPTION 'Operator payable must be greater than or equal to 0';
    END IF;
    
    -- Ensure the math adds up correctly
    IF ABS(NEW.commission_amount - (NEW.total_amount * NEW.commission_percentage / 100)) > 0.01 THEN
        RAISE EXCEPTION 'Commission amount calculation is incorrect';
    END IF;
    
    IF ABS(NEW.operator_payable - (NEW.total_amount - NEW.commission_amount)) > 0.01 THEN
        RAISE EXCEPTION 'Operator payable calculation is incorrect';
    END IF;
    
    -- If marked as paid, ensure paid_at is set
    IF NEW.is_paid = true AND NEW.paid_at IS NULL THEN
        NEW.paid_at = TIMEZONE('utc', NOW());
    END IF;
    
    -- If not paid, ensure paid_at is null
    IF NEW.is_paid = false AND NEW.paid_at IS NOT NULL THEN
        NEW.paid_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_operator_settlement ON operator_settlements;
CREATE TRIGGER trigger_validate_operator_settlement
BEFORE INSERT OR UPDATE ON operator_settlements
FOR EACH ROW EXECUTE FUNCTION validate_operator_settlement();

-- 7. Add validation function for operators
CREATE OR REPLACE FUNCTION validate_operator()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure commission percentage is valid
    IF NEW.commission_percentage < 0 OR NEW.commission_percentage > 100 THEN
        RAISE EXCEPTION 'Commission percentage must be between 0 and 100';
    END IF;
    
    -- Ensure mobile number is valid (basic validation)
    IF NEW.mobile_number IS NULL OR LENGTH(TRIM(NEW.mobile_number)) < 10 THEN
        RAISE EXCEPTION 'Mobile number must be at least 10 digits';
    END IF;
    
    -- Ensure name is not empty
    IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
        RAISE EXCEPTION 'Operator name cannot be empty';
    END IF;
    
    -- Ensure person name is not empty
    IF NEW.person_name IS NULL OR LENGTH(TRIM(NEW.person_name)) = 0 THEN
        RAISE EXCEPTION 'Person name cannot be empty';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_operator ON operators;
CREATE TRIGGER trigger_validate_operator
BEFORE INSERT OR UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION validate_operator();

-- 8. Create view for operator summary
CREATE OR REPLACE VIEW operator_summary AS
SELECT 
    o.id,
    o.name,
    o.person_name,
    o.mobile_number,
    o.commission_percentage,
    o.is_active,
    o.created_at,
    o.updated_at,
    COUNT(t.id) as total_tickets,
    COALESCE(SUM(CASE WHEN t.status = 'Booked' THEN t.amount ELSE 0 END), 0) as booked_amount,
    COALESCE(SUM(CASE WHEN t.status = 'Settled' THEN t.amount ELSE 0 END), 0) as settled_amount,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(SUM(os.commission_amount), 0) as total_commission,
    COALESCE(SUM(os.operator_payable), 0) as total_paid,
    COUNT(CASE WHEN t.status = 'Booked' THEN 1 END) as pending_settlements
FROM operators o
LEFT JOIN tickets t ON o.id = t.operator_id
LEFT JOIN operator_settlements os ON o.name = os.operator_name AND os.is_paid = true
GROUP BY o.id, o.name, o.person_name, o.mobile_number, o.commission_percentage, o.is_active, o.created_at, o.updated_at
ORDER BY o.name;

-- 9. Create view for settlement summary
CREATE OR REPLACE VIEW settlement_summary AS
SELECT 
    os.id,
    os.ticket_id,
    os.operator_name,
    os.mobile_number,
    os.total_amount,
    os.commission_percentage,
    os.commission_amount,
    os.operator_payable,
    os.is_paid,
    os.paid_at,
    os.created_at,
    os.updated_at,
    t.ticket_number,
    t.passenger_name,
    t.journey_date,
    t.status as ticket_status
FROM operator_settlements os
LEFT JOIN tickets t ON os.ticket_id = t.id
ORDER BY os.created_at DESC;

-- 10. Add sample operators (optional - for testing)
INSERT INTO operators (name, person_name, mobile_number, commission_percentage, is_active) VALUES
('Express Travels', 'Raj Kumar', '9876543210', 10, true),
('City Bus Service', 'Amit Sharma', '9876543211', 12, true),
('Tourist Bus', 'Vikram Singh', '9876543212', 8, true)
ON CONFLICT (mobile_number) DO NOTHING;
