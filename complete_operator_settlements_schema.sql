-- Complete schema fix for operator_settlements table
-- This script ensures all required columns exist for partial payment functionality

-- First, let's check what columns currently exist
-- You can run this separately to see current schema:
/*

1/1

Next.js 16.1.6 (stale)
Turbopack
Console Error
Server



Error fetching settlements: {}
lib/actions/operators.actions.ts (184:13) @ getOperatorSummary


  182 |
  183 |   if (settlementsError) {
> 184 |     console.error("Error fetching settlements:", settlementsError);
      |             ^
  185 |   }
  186 |
  187 |   const totalTickets = tickets?.length || 0;
Call Stack
12

Show 9 ignore-listed frame(s)
getOperatorSummary
lib/actions/operators.actions.ts (184:13)
OperatorDetailPage
app/(dashboard)/operators/[id]/page.tsx (20:23)
OperatorDetailPage
<anonymous>
1
2


1/1

Next.js 16.1.6 (stale)
Turbopack
Console Error
Server



Error fetching settlements: {}
lib/actions/operators.actions.ts (184:13) @ getOperatorSummary


  182 |
  183 |   if (settlementsError) {
> 184 |     console.error("Error fetching settlements:", settlementsError);
      |             ^
  185 |   }
  186 |
  187 |   const totalTickets = tickets?.length || 0;
Call Stack
12

Show 9 ignore-listed frame(s)
getOperatorSummary
lib/actions/operators.actions.ts (184:13)
OperatorDetailPage
app/(dashboard)/operators/[id]/page.tsx (20:23)
OperatorDetailPage
<anonymous>
1
2

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'operator_settlements' 
ORDER BY ordinal_position;
*/

-- Add all missing columns that might be needed for partial payments
-- Each column is added with IF NOT EXISTS to prevent errors

-- 1. notes column (for payment notes and remarks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='notes'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
END
$$;

-- 2. payment_collector_name column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='payment_collector_name'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN payment_collector_name TEXT;
        RAISE NOTICE 'Added payment_collector_name column';
    END IF;
END
$$;

-- 3. payment_collector_mobile column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='payment_collector_mobile'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN payment_collector_mobile TEXT;
        RAISE NOTICE 'Added payment_collector_mobile column';
    END IF;
END
$$;

-- 4. payment_collected_at column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='payment_collected_at'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN payment_collected_at TIMESTAMPTZ;
        RAISE NOTICE 'Added payment_collected_at column';
    END IF;
END
$$;

-- 5. bank_name column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='bank_name'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN bank_name TEXT;
        RAISE NOTICE 'Added bank_name column';
    END IF;
END
$$;

-- 6. account_number column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='account_number'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN account_number TEXT;
        RAISE NOTICE 'Added account_number column';
    END IF;
END
$$;

-- 7. reference_number column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='reference_number'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN reference_number TEXT;
        RAISE NOTICE 'Added reference_number column';
    END IF;
END
$$;

-- 8. settlement_method column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='settlement_method'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN settlement_method TEXT DEFAULT 'cash';
        RAISE NOTICE 'Added settlement_method column';
    END IF;
END
$$;

-- 9. paid_amount column (if not exists) - CRITICAL for partial payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='paid_amount'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added paid_amount column';
    END IF;
END
$$;

-- 10. remaining_amount column (if not exists) - CRITICAL for partial payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='remaining_amount'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added remaining_amount column';
    END IF;
END
$$;

-- 11. payment_status column (if not exists) - CRITICAL for partial payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='payment_status'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN payment_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column';
    END IF;
END
$$;

-- 12. ticket_id column (if not exists) - For linking to tickets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='operator_settlements' 
        AND column_name='ticket_id'
    ) THEN
        ALTER TABLE operator_settlements ADD COLUMN ticket_id UUID REFERENCES tickets(id);
        RAISE NOTICE 'Added ticket_id column';
    END IF;
END
$$;

-- Verify all columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'operator_settlements' 
ORDER BY ordinal_position;

-- Create index on ticket_id for better performance (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'operator_settlements' 
        AND indexname = 'idx_operator_settlements_ticket_id'
    ) THEN
        CREATE INDEX idx_operator_settlements_ticket_id ON operator_settlements(ticket_id);
        RAISE NOTICE 'Created index on ticket_id';
    END IF;
END
$$;

RAISE NOTICE 'Schema update completed successfully!';
