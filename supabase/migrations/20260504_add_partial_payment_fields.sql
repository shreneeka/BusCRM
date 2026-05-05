-- Add partial payment fields to operator_settlements table
ALTER TABLE public.operator_settlements 
ADD COLUMN IF NOT EXISTS paid_amount numeric NULL,
ADD COLUMN IF NOT EXISTS remaining_amount numeric NULL;

-- Add comments for new fields
COMMENT ON COLUMN public.operator_settlements.paid_amount IS 'Amount paid so far for partial payments';
COMMENT ON COLUMN public.operator_settlements.remaining_amount IS 'Remaining amount to be paid for partial payments';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_operator_settlements_paid_amount ON public.operator_settlements (paid_amount);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_remaining_amount ON public.operator_settlements (remaining_amount);
