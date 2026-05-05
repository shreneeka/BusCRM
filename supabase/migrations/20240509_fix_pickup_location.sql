-- Fix pickup_location column issue
-- The error shows pickup_location is required but database has pickup_area

-- Add pickup_location column if it doesn't exist (it should be pickup_area)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'pickup_location'
    ) THEN
        ALTER TABLE tickets ADD COLUMN pickup_location TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing tickets to copy pickup_area to pickup_location
UPDATE tickets 
SET pickup_location = pickup_area 
WHERE pickup_location = '' OR pickup_location IS NULL;

-- Also check if we need drop_location vs drop_area
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'drop_area'
    ) THEN
        ALTER TABLE tickets ADD COLUMN drop_area TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update existing tickets to copy drop_location to drop_area  
UPDATE tickets 
SET drop_area = drop_location 
WHERE drop_area = '' OR drop_area IS NULL;
