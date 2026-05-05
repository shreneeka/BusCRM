-- Fix column name inconsistency in operators table
-- Rename commission_percent to commission_percentage to match code

-- Drop the old column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operators' 
        AND column_name = 'commission_percent'
    ) THEN
        ALTER TABLE operators RENAME COLUMN commission_percent TO commission_percentage;
    END IF;
END $$;

-- Also fix operator_name to name if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'operators' 
        AND column_name = 'operator_name'
    ) THEN
        ALTER TABLE operators RENAME COLUMN operator_name TO name;
    END IF;
END $$;
