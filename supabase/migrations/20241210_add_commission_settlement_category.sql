-- Migration: Add &#39;Commission Settlement&#39; Expense category for operator payments
-- Safe: ON CONFLICT DO NOTHING if exists

INSERT INTO accounting_categories (name, category_type, description, is_active)
VALUES (&#39;Commission Settlement&#39;, &#39;Expense&#39;, &#39;Payments/settlements made to bus operators&#39;, true)
ON CONFLICT (name) DO NOTHING;

-- Verify
COMMENT ON COLUMN accounting_categories.name IS &#39;Unique category name (Commission Settlement added for operator expenses)&#39;;

