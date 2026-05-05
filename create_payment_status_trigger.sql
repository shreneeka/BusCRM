-- Create a function to update payment status when remaining amount becomes 0
CREATE OR REPLACE FUNCTION update_payment_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if remaining amount is 0 or less (accounting for floating point precision)
    IF NEW.remaining_amount <= 0.01 THEN
        NEW.payment_status := 'done';
        NEW.is_paid := true;
        NEW.paid_at := COALESCE(NEW.paid_at, CURRENT_TIMESTAMP);
    ELSIF NEW.paid_amount > 0 THEN
        NEW.payment_status := 'partial';
        NEW.is_paid := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS payment_status_trigger ON operator_settlements;
CREATE TRIGGER payment_status_trigger
    BEFORE UPDATE ON operator_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_trigger();

-- Also create a trigger for INSERT operations
DROP TRIGGER IF EXISTS payment_status_insert_trigger ON operator_settlements;
CREATE TRIGGER payment_status_insert_trigger
    BEFORE INSERT ON operator_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_trigger();

-- Test the trigger with existing data
UPDATE operator_settlements 
SET payment_status = CASE 
    WHEN remaining_amount <= 0.01 THEN 'done'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'pending'
END,
is_paid = CASE 
    WHEN remaining_amount <= 0.01 THEN true
    ELSE false
END
WHERE payment_status != CASE 
    WHEN remaining_amount <= 0.01 THEN 'done'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'pending'
END;
