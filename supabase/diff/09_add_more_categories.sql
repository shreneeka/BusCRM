-- Add More Accounting Categories
-- Additional income and expense categories for better selection

-- Insert more income categories
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Package Booking', 'Income', 'Income from travel packages', true),
('Tour Booking', 'Income', 'Income from tours', true),
('Commission', 'Income', 'Commission income', true)
ON CONFLICT DO NOTHING;

-- Insert more expense categories
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Insurance', 'Expense', 'Insurance expenses', true),
('Taxi Service', 'Expense', 'Taxi and auto expenses', true),
('Advertisements', 'Expense', 'Marketing and ads expenses', true),
('Refreshments', 'Expense', 'Driver refreshments', true),
('Toll Charges', 'Expense', 'Toll and parking charges', true)
ON CONFLICT DO NOTHING;

-- Verify categories
SELECT name, category_type, is_active FROM accounting_categories ORDER BY category_type, name;
