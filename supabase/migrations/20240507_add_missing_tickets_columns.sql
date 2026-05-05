-- Add missing columns to tickets table
-- This migration addresses missing operator_mobile and other columns

-- Add operator_mobile column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'operator_mobile'
    ) THEN
        ALTER TABLE tickets ADD COLUMN operator_mobile TEXT;
    END IF;
END $$;

-- Add operator_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'operator_name'
    ) THEN
        ALTER TABLE tickets ADD COLUMN operator_name TEXT;
    END IF;
END $$;

-- Update existing tickets to populate operator details from operators table
UPDATE tickets 
SET 
    operator_name = (SELECT name FROM operators WHERE id = tickets.operator_id),
    operator_mobile = (SELECT mobile_number FROM operators WHERE id = tickets.operator_id)
WHERE operator_name IS NULL OR operator_mobile IS NULL;

-- Create trigger to automatically update operator details when operator changes
CREATE OR REPLACE FUNCTION update_ticket_operator_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Update operator details when operator_id is set or changed
    IF NEW.operator_id IS NOT NULL THEN
        SELECT 
            o.name,
            o.mobile_number
        INTO 
            NEW.operator_name,
            NEW.operator_mobile
        FROM operators o 
        WHERE o.id = NEW.operator_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update operator details
DROP TRIGGER IF EXISTS trigger_update_ticket_operator_details ON tickets;
CREATE TRIGGER trigger_update_ticket_operator_details
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW
WHEN (NEW.operator_id IS NOT NULL)
EXECUTE FUNCTION update_ticket_operator_details();
