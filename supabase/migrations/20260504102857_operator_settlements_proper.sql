-- Exact operator_settlements table matching user schema
-- Copy from verified migration

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

-- Enable RLS + policies
ALTER TABLE public.operator_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operator settlements" ON public.operator_settlements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create operator settlements" ON public.operator_settlements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update operator settlements" ON public.operator_settlements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete operator settlements" ON public.operator_settlements FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_settlements_ticket_id ON public.operator_settlements (ticket_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_settlements_operator_name ON public.operator_settlements (operator_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_settlements_is_paid ON public.operator_settlements (is_paid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operator_settlements_created_at ON public.operator_settlements (created_at);

-- Run: npx supabase db push

