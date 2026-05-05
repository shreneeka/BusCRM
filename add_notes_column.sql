-- Add missing 'notes' column to operator_settlements table
-- Run this SQL code in your Supabase SQL editor or database console

-- Method 1: Simple ALTER TABLE (if column doesn't exist)
ALTER TABLE operator_settlements 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Method 2: Check if column exists first, then add (for PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='notes'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN notes TEXT;
    END IF;
END
$$;

-- Method 3: Alternative approach using pg_catalog (PostgreSQL specific)
-- Uncomment and use if Method 2 doesn't work

/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'operator_settlements'
        AND a.attname = 'notes'
        AND NOT a.attisdropped
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE 'Column notes already exists in operator_settlements';
    ELSE
        ALTER TABLE operator_settlements ADD COLUMN notes TEXT;
        RAISE NOTICE 'Column notes added to operator_settlements';
    END IF;
END
$$;
*/

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'operator_settlements' 
AND column_name = 'notes';
