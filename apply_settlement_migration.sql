-- Manual SQL script to apply ticket settlement flow updates
-- Run this script in your Supabase SQL editor to update the database schema

-- 1. Add payment_status field to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_paid' 
CHECK (payment_status IN ('paid', 'partial', 'not_paid'));

-- 2. Update existing tickets to have payment_status based on settlement_status
UPDATE tickets 
SET payment_status = CASE 
  WHEN settlement_status = 'paid' THEN 'paid'
  ELSE 'not_paid'
END
WHERE payment_status = 'not_paid';

-- 3. Add settlement_processed_at timestamp for tracking when settlement was done
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS settlement_processed_at TIMESTAMP WITH TIME ZONE NULL;

-- 4. Update existing paid tickets to have settlement_processed_at
UPDATE tickets 
SET settlement_processed_at = settlement_timestamp 
WHERE settlement_status = 'paid' AND settlement_timestamp IS NOT NULL AND settlement_processed_at IS NULL;

-- 5. Create function to handle ticket settlement with commission calculation
CREATE OR REPLACE FUNCTION process_ticket_settlement(p_ticket_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  ticket_record RECORD;
  commission_amount DECIMAL;
  commission_category_id UUID;
  cash_account_id UUID;
BEGIN
  -- Get commission category and cash account IDs
  SELECT id INTO commission_category_id 
  FROM accounting_categories 
  WHERE name = 'Commission' AND category_type = 'Income' 
  LIMIT 1;
  
  SELECT id INTO cash_account_id 
  FROM accounts 
  WHERE name = 'Cash' 
  LIMIT 1;
  
  -- Process each ticket
  FOREACH ticket_record.id IN ARRAY p_ticket_ids
  LOOP
    -- Get ticket details with operator info
    SELECT 
      t.amount,
      o.commission_percent
    INTO ticket_record.amount, ticket_record.commission_percent
    FROM tickets t
    JOIN operators o ON t.operator_id = o.id
    WHERE t.id = ticket_record.id;
    
    -- Calculate commission (10% or operator's commission rate, whichever is higher)
    commission_amount := ticket_record.amount * GREATEST(10, ticket_record.commission_percent) / 100;
    
    -- Update ticket status
    UPDATE tickets 
    SET 
      payment_status = 'paid',
      settlement_status = 'paid',
      settlement_timestamp = TIMEZONE('utc', NOW()),
      settlement_processed_at = TIMEZONE('utc', NOW()),
      updated_at = TIMEZONE('utc', NOW())
    WHERE id = ticket_record.id;
    
    -- Create accounting entry for commission income
    IF commission_category_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
      INSERT INTO accounting_entries (
        account_id,
        category_id,
        entry_type,
        amount,
        entry_date,
        description,
        ticket_id,
        created_at
      ) VALUES (
        cash_account_id,
        commission_category_id,
        'Income',
        commission_amount,
        CURRENT_DATE,
        'Commission from ticket settlement',
        ticket_record.id,
        TIMEZONE('utc', NOW())
      );
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to handle partial payment
CREATE OR REPLACE FUNCTION process_partial_payment(p_ticket_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
  ticket_amount DECIMAL;
BEGIN
  -- Get ticket amount
  SELECT amount INTO ticket_amount
  FROM tickets
  WHERE id = p_ticket_id;
  
  -- Update ticket status based on payment amount
  UPDATE tickets 
  SET 
    payment_status = CASE 
      WHEN p_amount >= ticket_amount THEN 'paid'
      WHEN p_amount > 0 THEN 'partial'
      ELSE 'not_paid'
    END,
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_ticket_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status ON tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_settlement_processed_at ON tickets(settlement_processed_at);

-- 8. Verify the changes
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_tickets,
  COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partial_tickets,
  COUNT(CASE WHEN payment_status = 'not_paid' THEN 1 END) as not_paid_tickets
FROM tickets;
