-- Remove all expense entries and keep only income entries
-- This script cleans up the accounting system to show only income entries

-- Show current expense entries before deletion
SELECT 
  'Current Expense Entries' as info,
  COUNT(*) as total_expense_entries,
  SUM(amount) as total_expense_amount
FROM accounting_entries 
WHERE entry_type = 'Expense';

-- Delete all expense entries
DELETE FROM accounting_entries 
WHERE entry_type = 'Expense';

-- Verify deletion
SELECT 
  'After Deletion' as info,
  COUNT(*) as remaining_expense_entries,
  SUM(amount) as remaining_expense_amount
FROM accounting_entries 
WHERE entry_type = 'Expense';

-- Show remaining income entries
SELECT 
  'Remaining Income Entries' as info,
  COUNT(*) as total_income_entries,
  SUM(amount) as total_income_amount
FROM accounting_entries 
WHERE entry_type = 'Income';

-- Show final accounting summary
SELECT 
  'Final Summary' as info,
  COUNT(CASE WHEN entry_type = 'Income' THEN 1 END) as income_entries,
  SUM(CASE WHEN entry_type = 'Income' THEN amount ELSE 0 END) as total_income,
  COUNT(CASE WHEN entry_type = 'Expense' THEN 1 END) as expense_entries,
  SUM(CASE WHEN entry_type = 'Expense' THEN amount ELSE 0 END) as total_expense,
  (SUM(CASE WHEN entry_type = 'Income' THEN amount ELSE 0 END) - SUM(CASE WHEN entry_type = 'Expense' THEN amount ELSE 0 END)) as net_profit
FROM accounting_entries;

-- Update ticket accounting entries to show 100% ticket price
UPDATE accounting_entries 
SET amount = (
  SELECT t.amount 
  FROM tickets t 
  WHERE t.id = accounting_entries.ticket_id
)
WHERE entry_type = 'Income' 
AND ticket_id IS NOT NULL
AND amount < (
  SELECT t.amount 
  FROM tickets t 
  WHERE t.id = accounting_entries.ticket_id
);

-- Verify ticket income entries are correct
SELECT 
  'Ticket Income Verification' as info,
  ae.id,
  ae.amount,
  t.amount as ticket_amount,
  ae.description,
  CASE 
    WHEN ae.amount = t.amount THEN 'Correct (100%)'
    ELSE 'Incorrect - needs fix'
  END as status
FROM accounting_entries ae
JOIN tickets t ON ae.ticket_id = t.id
WHERE ae.entry_type = 'Income' 
AND ae.ticket_id IS NOT NULL
ORDER BY ae.created_at DESC
LIMIT 10;
