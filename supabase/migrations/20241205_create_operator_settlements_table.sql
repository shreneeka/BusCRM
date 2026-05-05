-- Create operator_settlements table with all required fields
CREATE TABLE IF NOT EXISTS public.operator_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NULL,
  operator_name text NOT NULL,
  mobile_number text NULL,
  total_amount numeric NOT NULL,
  commission_percentage numeric NOT NULL,
  commission_amount numeric NOT NULL,
  operator_payable numeric NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT timezone('utc'::text, now()),
  payment_collector_name text NULL,
  payment_collector_mobile text NULL,
  payment_collected_at timestamp with time zone NULL,
  payment_status character varying(20) NULL DEFAULT 'pending'::character varying,
  settlement_method character varying(20) NULL DEFAULT 'cash'::character varying,
  reference_number text NULL,
  bank_name text NULL,
  account_number text NULL,
  CONSTRAINT operator_settlements_pkey PRIMARY KEY (id),
  CONSTRAINT operator_settlements_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE SET NULL,
  CONSTRAINT operator_settlements_payment_status_check CHECK (
    (payment_status)::text = ANY (
      ARRAY[
        'pending'::character varying,
        'partial'::character varying,
        'done'::character varying,
        'not_done'::character varying
      ]::text[]
    )
  ),
  CONSTRAINT operator_settlements_settlement_method_check CHECK (
    (settlement_method)::text = ANY (
      ARRAY[
        'cash'::character varying,
        'bank_transfer'::character varying,
        'upi'::character varying,
        'cheque'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.operator_settlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view operator settlements" ON public.operator_settlements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create operator settlements" ON public.operator_settlements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update operator settlements" ON public.operator_settlements
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete operator settlements" ON public.operator_settlements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_operator_settlements_ticket_id ON public.operator_settlements (ticket_id);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_operator_name ON public.operator_settlements (operator_name);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_mobile_number ON public.operator_settlements (mobile_number);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_is_paid ON public.operator_settlements (is_paid);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_paid_at ON public.operator_settlements (paid_at);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_created_at ON public.operator_settlements (created_at);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_payment_status ON public.operator_settlements (payment_status);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_settlement_method ON public.operator_settlements (settlement_method);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_payment_collected_at ON public.operator_settlements (payment_collected_at);

-- Comments for documentation
COMMENT ON TABLE public.operator_settlements IS 'Operator settlement records tracking payments, commissions, and payment collection details';
COMMENT ON COLUMN public.operator_settlements.ticket_id IS 'Reference to associated ticket (nullable for bulk settlements)';
COMMENT ON COLUMN public.operator_settlements.operator_name IS 'Name of the bus operator';
COMMENT ON COLUMN public.operator_settlements.mobile_number IS 'Operator contact mobile number';
COMMENT ON COLUMN public.operator_settlements.total_amount IS 'Total ticket amount before commission';
COMMENT ON COLUMN public.operator_settlements.commission_percentage IS 'Commission rate percentage';
COMMENT ON COLUMN public.operator_settlements.commission_amount IS 'Calculated commission amount';
COMMENT ON COLUMN public.operator_settlements.operator_payable IS 'Net amount payable to operator (total - commission)';
COMMENT ON COLUMN public.operator_settlements.is_paid IS 'Whether payment has been completed to operator';
COMMENT ON COLUMN public.operator_settlements.paid_at IS 'Timestamp when payment was made to operator';
COMMENT ON COLUMN public.operator_settlements.payment_collector_name IS 'Name of staff/person who collected payment from operator';
COMMENT ON COLUMN public.operator_settlements.payment_collector_mobile IS 'Mobile of payment collector';
COMMENT ON COLUMN public.operator_settlements.payment_collected_at IS 'Timestamp when payment was collected';
COMMENT ON COLUMN public.operator_settlements.payment_status IS 'Status: pending, partial, done, not_done';
COMMENT ON COLUMN public.operator_settlements.settlement_method IS 'Method: cash, bank_transfer, upi, cheque';
COMMENT ON COLUMN public.operator_settlements.reference_number IS 'Transaction/reference ID for digital payments';
COMMENT ON COLUMN public.operator_settlements.bank_name IS 'Bank name for transfers/cheques';
COMMENT ON COLUMN public.operator_settlements.account_number IS 'Account number for bank transfers';
