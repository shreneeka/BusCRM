-- Commission Income Category Addition
-- Adding Commission as income category for operator commission tracking

-- 1. Add Commission category for income
INSERT INTO accounting_categories (name, category_type, description, is_active) VALUES
('Commission', 'Income', 'Commission income from ticket bookings', true)
ON CONFLICT DO NOTHING;

-- 2. Add Commission category for tracking operator commission in accounting
-- This will be used when settling operator payments to record commission as income

CREATE OR REPLACE FUNCTION handle_ticket_accounting()
RETURNS TRIGGER AS $$
DECLARE
  commission_amount NUMERIC;
  cash_account_id UUID;
  ticket_booking_category_id UUID;
  commission_expense_category_id UUID;
BEGIN
  -- Only run when payment status changes to partial or paid
  IF TG_OP = 'UPDATE' AND NEW.payment_status IN ('partial', 'paid') AND 
     (OLD.payment_status IS NULL OR OLD.payment_status NOT IN ('partial', 'paid')) THEN
    
    -- Get required IDs
    SELECT id INTO cash_account_id FROM accounts WHERE name = 'Cash' LIMIT 1;
    SELECT id INTO ticket_booking_category_id FROM accounting_categories WHERE name = 'Ticket Booking' AND category_type = 'Income' LIMIT 1;
    SELECT id INTO commission_expense_category_id FROM accounting_categories WHERE name = 'Commission Settlement' AND category_type = 'Expense' LIMIT 1;
    
    -- Create Commission Settlement category if it doesn't exist
    IF commission_expense_category_id IS NULL THEN
      INSERT INTO accounting_categories (name, category_type, description, is_active)
      VALUES ('Commission Settlement', 'Expense', 'Payments/settlements made to bus operators', true)
      RETURNING id INTO commission_expense_category_id;
    END IF;
    
    -- Create Cash account if it doesn't exist
    IF cash_account_id IS NULL THEN
      INSERT INTO accounts (name, type, opening_balance, is_active)
      VALUES ('Cash', 'Cash', 0, true)
      RETURNING id INTO cash_account_id;
    END IF;
    
    -- 1️⃣ INSERT INCOME (Ticket Booking)
    IF ticket_booking_category_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
      INSERT INTO accounting_entries (
        entry_type,
        account_id,
        category_id,
        amount,
        entry_date,
        description,
        ticket_id,
        created_at
      )
      VALUES (
        'Income',
        cash_account_id,
        ticket_booking_category_id,
        NEW.amount,
        CURRENT_DATE,
        'Ticket Booking Income - ' || COALESCE(NEW.passenger_name, 'Unknown Passenger') || ' (' || COALESCE(NEW.ticket_number, 'N/A') || ')',
        NEW.id,
        NOW()
      );
    END IF;

    -- 2️⃣ CALCULATE COMMISSION (Get from operator or default to 10%)
    SELECT COALESCE(commission_percentage, 10) INTO commission_amount 
    FROM operators 
    WHERE id = NEW.operator_id 
    LIMIT 1;
    
    commission_amount := (NEW.amount * commission_amount) / 100;

    -- 3️⃣ INSERT EXPENSE (Operator Commission)
    IF commission_amount > 0 AND commission_expense_category_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
      INSERT INTO accounting_entries (
        entry_type,
        account_id,
        category_id,
        amount,
        entry_date,
        description,
        ticket_id,
        created_at
      )
      VALUES (
        'Expense',
        cash_account_id,
        commission_expense_category_id,
        commission_amount,
        CURRENT_DATE,
        CASE NEW.payment_status
          WHEN 'partial' THEN 'Partial Commission Payment - ' || COALESCE(NEW.passenger_name, 'Unknown Passenger')
          WHEN 'paid' THEN 'Full Commission Payment - ' || COALESCE(NEW.passenger_name, 'Unknown Passenger')
        END,
        NEW.id,
        NOW()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS operator_settlement_accounting_trigger ON operator_settlements;
DROP FUNCTION IF EXISTS handle_operator_settlement_accounting();

-- Create trigger function for operator_settlements table
CREATE OR REPLACE FUNCTION handle_operator_settlement_accounting()
RETURNS TRIGGER AS $$
DECLARE
  commission_amount NUMERIC;
  commission_rate NUMERIC;
  cash_account_id UUID;
  commission_expense_category_id UUID;
  previous_paid_amount NUMERIC DEFAULT 0;
  current_payment_amount NUMERIC;
  payment_count INTEGER DEFAULT 0;
BEGIN
  -- Only run when payment status is 'partial' or 'done' and paid_amount > 0
  IF NEW.payment_status IN ('partial', 'done') AND NEW.paid_amount > 0 THEN
    
    -- Get required IDs
    SELECT id INTO cash_account_id FROM accounts WHERE name = 'Cash' LIMIT 1;
    SELECT id INTO commission_expense_category_id FROM accounting_categories WHERE name = 'Commission Settlement' AND category_type = 'Expense' LIMIT 1;
    
    -- Create Commission Settlement category if it doesn't exist
    IF commission_expense_category_id IS NULL THEN
      INSERT INTO accounting_categories (name, category_type, description, is_active)
      VALUES ('Commission Settlement', 'Expense', 'Payments/settlements made to bus operators', true)
      RETURNING id INTO commission_expense_category_id;
    END IF;
    
    -- Create Cash account if it doesn't exist
    IF cash_account_id IS NULL THEN
      INSERT INTO accounts (name, type, opening_balance, is_active)
      VALUES ('Cash', 'Cash', 0, true)
      RETURNING id INTO cash_account_id;
    END IF;
    
    -- Get commission rate from operator_settlements or default to 10%
    commission_rate := COALESCE(NEW.commission_percentage, 10);
    
    -- For UPDATE operations, calculate only the incremental payment
    IF TG_OP = 'UPDATE' THEN
      previous_paid_amount := COALESCE(OLD.paid_amount, 0);
      current_payment_amount := NEW.paid_amount - previous_paid_amount;
      
      -- Better payment sequence detection for this specific ticket
      -- Count actual payment updates (not just commission entries)
      SELECT COUNT(*) INTO payment_count 
      FROM operator_settlements 
      WHERE ticket_id = NEW.ticket_id
      AND paid_amount > 0
      AND id != NEW.id  -- Exclude current record
      AND created_at < NEW.created_at;
      
      -- Alternative: Check if this is the second+ payment by looking at paid_amount progression
      -- If previous paid_amount was > 0, this is at least the second payment
      IF previous_paid_amount > 0 THEN
        payment_count := payment_count + 1;
      END IF;
      
      RAISE NOTICE 'Payment sequence for ticket %: count=%, previous=%, current=%', NEW.ticket_id, payment_count, previous_paid_amount, current_payment_amount;
    ELSE
      -- For INSERT operations, use the full paid_amount
      current_payment_amount := NEW.paid_amount;
      payment_count := 0;
    END IF;
    
    -- Commission logic: Remove commission on second+ partial payment
    IF NEW.payment_status = 'partial' AND (payment_count >= 1 OR (TG_OP = 'UPDATE' AND previous_paid_amount > 0)) THEN
      -- Second or subsequent partial payment - NO commission
      commission_amount := 0;
      RAISE NOTICE 'No commission applied for second+ partial payment';
    ELSE
      -- First payment or final payment - apply commission
      commission_amount := (current_payment_amount * commission_rate) / 100;
      RAISE NOTICE 'Commission applied: % on payment %', commission_rate, current_payment_amount;
    END IF;
    
    -- INSERT EXPENSE (Operator Commission Payment) only if there's commission to record
    IF commission_amount > 0 AND commission_expense_category_id IS NOT NULL AND cash_account_id IS NOT NULL THEN
      INSERT INTO accounting_entries (
        entry_type,
        account_id,
        category_id,
        amount,
        entry_date,
        description,
        created_at
      )
      VALUES (
        'Expense',
        cash_account_id,
        commission_expense_category_id,
        commission_amount,
        CURRENT_DATE,
        CASE NEW.payment_status
          WHEN 'partial' THEN 
            CASE payment_count
              WHEN 0 THEN 'Commission (' || commission_rate || '%) on FIRST payment ₹' || current_payment_amount || ' to ' || COALESCE(NEW.operator_name, 'Unknown Operator') || ' (Total paid: ₹' || NEW.paid_amount || ', Remaining: ₹' || COALESCE(NEW.remaining_amount, 0) || ')'
              ELSE 'Commission (' || commission_rate || '%) on payment ₹' || current_payment_amount || ' to ' || COALESCE(NEW.operator_name, 'Unknown Operator') || ' (Total paid: ₹' || NEW.paid_amount || ', Remaining: ₹' || COALESCE(NEW.remaining_amount, 0) || ')'
            END
          WHEN 'done' THEN 'Commission (' || commission_rate || '%) on final payment ₹' || current_payment_amount || ' to ' || COALESCE(NEW.operator_name, 'Unknown Operator') || ' (Total: ₹' || NEW.paid_amount || ')'
        END,
        NOW()
      );
    ELSIF commission_amount = 0 AND NEW.payment_status = 'partial' AND payment_count >= 1 THEN
      -- Log zero commission entry for second+ payment for tracking
      INSERT INTO accounting_entries (
        entry_type,
        account_id,
        category_id,
        amount,
        entry_date,
        description,
        created_at
      )
      VALUES (
        'Expense',
        cash_account_id,
        commission_expense_category_id,
        0,
        CURRENT_DATE,
        'No commission on SECOND+ payment ₹' || current_payment_amount || ' to ' || COALESCE(NEW.operator_name, 'Unknown Operator') || ' (Total paid: ₹' || NEW.paid_amount || ', Remaining: ₹' || COALESCE(NEW.remaining_amount, 0) || ')',
        NOW()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on operator_settlements table
CREATE TRIGGER operator_settlement_accounting_trigger
AFTER INSERT OR UPDATE ON operator_settlements
FOR EACH ROW
EXECUTE FUNCTION handle_operator_settlement_accounting();    