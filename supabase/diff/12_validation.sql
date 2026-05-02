-- Ensure only ONE exists
CREATE UNIQUE INDEX IF NOT EXISTS unique_ticket_booking_income
ON accounting_categories (name)
WHERE name = 'Ticket Booking' AND category_type = 'Income';

CREATE OR REPLACE FUNCTION validate_ticket_income_category()
RETURNS TRIGGER AS $$
DECLARE
  cat_type category_type;
BEGIN
  -- If ticket_id is present, enforce rules
  IF NEW.ticket_id IS NOT NULL THEN
    
    SELECT category_type INTO cat_type
    FROM accounting_categories
    WHERE id = NEW.category_id;

    -- Must be Income
    IF NEW.entry_type != 'Income' THEN
      RAISE EXCEPTION 'Ticket entries must be Income';
    END IF;

    -- Must be Ticket Booking category
    IF NOT EXISTS (
      SELECT 1 FROM accounting_categories
      WHERE id = NEW.category_id
      AND name = 'Ticket Booking'
      AND category_type = 'Income'
    ) THEN
      RAISE EXCEPTION 'Ticket entries must use Ticket Booking category';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_ticket_income ON accounting_entries;

CREATE TRIGGER trigger_validate_ticket_income
BEFORE INSERT ON accounting_entries
FOR EACH ROW
EXECUTE FUNCTION validate_ticket_income_category();

