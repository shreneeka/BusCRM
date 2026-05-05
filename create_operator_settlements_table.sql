-- Consolidated operator_settlements table matching exact schema requirements
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

-- Note: Run this via supabase db push or include in migration workflow
