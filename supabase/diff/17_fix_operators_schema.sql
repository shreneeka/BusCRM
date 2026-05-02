-- STEP 3: Fix Operators Schema
-- This migration ensures the operators table has the correct structure

-- 1. Ensure commission_percent column exists with correct type
DO $$
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operators' 
        AND column_name='commission_percent'
    ) THEN
        ALTER TABLE operators ADD COLUMN commission_percent DECIMAL NOT NULL DEFAULT 10;
    END IF;
    
    -- Update any existing rows that might have NULL commission_percent
    UPDATE operators SET commission_percent = 10 WHERE commission_percent IS NULL;
    
    -- Ensure the column has the correct constraint
    ALTER TABLE operators ALTER COLUMN commission_percent SET NOT NULL;
    ALTER TABLE operators ALTER COLUMN commission_percent SET DEFAULT 10;
END $$;

-- 2. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'operators' 
ORDER BY ordinal_position;
