l-- Commission Income Category Addition
-- Adding Commission as income category for operator commission tracking

-- 1. Add Commission category for income
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Commission', 'Income', 'Commission income from ticket bookings', true)
ON CONFLICT DO NOTHING;

-- 2. Add Commission category for tracking operator commission in accounting
-- This will be used when settling operator payments to record commission as income
