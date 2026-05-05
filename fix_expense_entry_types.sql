-- Fix any existing operator payment entries that are incorrectly recorded as Income
-- Update all entries with "Commission Settlement" category to be Expense type

UPDATE accounting_entries 
SET entry_type = 'Expense'
WHERE category_id IN (
    SELECT id FROM accounting_categories 
    WHERE name = 'Commission Settlement' 
    AND category_type = 'Expense'
) 
AND entry_type = 'Income';

-- Also update any entries that have operator payment descriptions but wrong type
UPDATE accounting_entries 
SET entry_type = 'Expense'
WHERE (
    description ILIKE '%payment to%' OR 
    description ILIKE '%Full payment%' OR 
    description ILIKE '%Partial payment%'
) 
AND entry_type = 'Income';

-- Verify the fix
SELECT 
    ae.entry_type,
    ae.amount,
    ae.description,
    ac.name as category_name,
    ac.category_type
FROM accounting_entries ae
JOIN accounting_categories ac ON ae.category_id = ac.id
WHERE ac.name = 'Commission Settlement'
ORDER BY ae.created_at DESC
LIMIT 10;
