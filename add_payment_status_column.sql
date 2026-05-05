-- Add payment_status column to tickets table if it doesn't exist
-- This fixes the error: Could not find the 'payment_status' column of 'tickets' in the schema cache

DO $$
BEGIN
    -- Check if the column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'payment_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE tickets 
        ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'not_paid' 
        CHECK (payment_status IN ('paid', 'partial', 'not_paid'));
        
        RAISE NOTICE 'payment_status column added to tickets table';
    ELSE
        RAISE NOTICE 'payment_status column already exists in tickets table';
    END IF;
END $$;

-- Also add settlement_processed_at if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'settlement_processed_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE tickets 
        ADD COLUMN settlement_processed_at TIMESTAMP WITH TIME ZONE NULL;
        
        RAISE NOTICE 'settlement_processed_at column added to tickets table';
    ELSE
        RAISE NOTICE 'settlement_processed_at column already exists in tickets table';
    END IF;
END $$;
