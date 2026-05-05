-- Fix existing expense entries to show 90% amount instead of 10%
-- This script corrects the accounting entries that were created with wrong amounts

-- First, let's see what we currently have
SELECT 
  'Current Entries' as info,
  ae.id,
  ae.amount,
  ae.entry_type,
  ae.description,
  ac.name as category_name,
  ac.category_type,
  ae.ticket_id,
  ae.settlement_id
FROM accounting_entries ae
JOIN accounting_categories ac ON ae.category_id = ac.id
WHERE ac.name IN ('Operator Payment', 'Commission Settlement')
ORDER BY ae.created_at DESC
LIMIT 10;

-- Fix expense entries that have commission amounts (10%) instead of operator payable amounts (90%)
UPDATE accounting_entries 
SET amount = (
  -- Calculate 90% of the original ticket amount
  CASE 
    WHEN ae.settlement_id IS NOT NULL THEN
      -- For settlement entries, get the operator payable from settlement
      (SELECT COALESCE(operator_payable, total_amount * 0.9) 
       FROM operator_settlements 
       WHERE id = ae.settlement_id)
    WHEN ae.ticket_id IS NOT NULL THEN
      -- For ticket entries, calculate 90% of ticket amount
      (SELECT amount * 0.9 FROM tickets WHERE id = ae.ticket_id)
    ELSE ae.amount
  END
)
FROM accounting_entries ae
JOIN accounting_categories ac ON ae.category_id = ac.id
WHERE ac.name IN ('Operator Payment', 'Commission Settlement')
AND ae.entry_type = 'Expense'
AND ae.amount < 1000; -- Assuming these are the incorrect small amounts

-- Verify the fix
SELECT 
  'After Fix' as info,
  ae.id,
  ae.amount,
  ae.entry_type,
  ae.description,
  ac.name as category_name,
  ac.category_type
FROM accounting_entries ae
JOIN accounting_categories ac ON ae.category_id = ac.id
WHERE ac.name IN ('Operator Payment', 'Commission Settlement')
AND ae.entry_type = 'Expense'
ORDER BY ae.created_at DESC
LIMIT 10;

-- Create proper entries for any missing cases
INSERT INTO accounting_entries (
  account_id,
  category_id,
  entry_type,
  amount,
  entry_date,
  description,
  settlement_id,
  ticket_id,
  created_at
)
SELECT 
  ae.account_id,
  ac.id as category_id,
  'Expense' as entry_type,
  CASE 
    WHEN ae.settlement_id IS NOT NULL THEN
      (SELECT COALESCE(operator_payable, total_amount * 0.9) 
       FROM operator_settlements 
       WHERE id = ae.settlement_id)
    WHEN ae.ticket_id IS NOT NULL THEN
      (SELECT amount * 0.9 FROM tickets WHERE id = ae.ticket_id)
    ELSE ae.amount * 9 -- Multiply by 9 to convert 10% to 90%
  END as amount,
  ae.entry_date,
  'Payment to operator - 90% of ticket amount' as description,
  ae.settlement_id,
  ae.ticket_id,
  NOW() as created_at
FROM accounting_entries ae
JOIN accounting_categories ac ON ac.name = 'Commission Settlement' AND ac.category_type = 'Expense'
WHERE ae.entry_type = 'Expense'
AND NOT EXISTS (
  SELECT 1 FROM accounting_entries ae2 
  WHERE ae2.settlement_id = ae.settlement_id 
  AND ae2.ticket_id = ae.ticket_id 
  AND ae2.entry_type = 'Expense'
  AND ae2.amount > ae.amount -- Only if there's no larger amount entry
);

-- Show final result
SELECT 
  'Final Result' as info,
  ae.id,
  ae.amount,
  ae.entry_type,
  ae.description,
  ac.name as category_name,
  ac.category_type
FROM accounting_entries ae
JOIN accounting_categories ac ON ae.category_id = ac.id
WHERE ac.name IN ('Operator Payment', 'Commission Settlement')
AND ae.entry_type = 'Expense'
ORDER BY ae.created_at DESC
LIMIT 10;
