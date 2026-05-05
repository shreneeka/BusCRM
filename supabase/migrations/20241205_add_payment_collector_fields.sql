-- Add payment collector fields to operator_settlements table
ALTER TABLE public.operator_settlements 
ADD COLUMN payment_collector_name TEXT NULL,
ADD COLUMN payment_collector_mobile TEXT NULL,
ADD COLUMN payment_collected_at TIMESTAMP WITH TIME ZONE NULL;

-- Add comments for the new fields
COMMENT ON COLUMN public.operator_settlements.payment_collector_name IS 'Name of the person who collected the payment from the operator';
COMMENT ON COLUMN public.operator_settlements.payment_collector_mobile IS 'Mobile number of the payment collector';
COMMENT ON COLUMN public.operator_settlements.payment_collected_at IS 'Timestamp when the payment was collected by the collector';

-- Create index for payment_collected_at for better query performance
CREATE INDEX IF NOT EXISTS idx_operator_settlements_payment_collected_at ON public.operator_settlements USING btree (payment_collected_at) TABLESPACE pg_default;
