-- Add payment_received_by field to tickets table for settlement flow
ALTER TABLE tickets 
ADD COLUMN payment_received_by TEXT NOT NULL DEFAULT 'self' 
CHECK (payment_received_by IN ('self', 'operator'));

-- Create operator_settlements table as requested by user
CREATE TABLE IF NOT EXISTS public.operator_settlements (
  id uuid not null default gen_random_uuid (),
  ticket_id uuid null,
  operator_name text not null,
  mobile_number text null,
  total_amount numeric not null,
  commission_percentage numeric not null,
  commission_amount numeric not null,
  operator_payable numeric not null,
  is_paid boolean not null default false,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint operator_settlements_pkey primary key (id),
  constraint operator_settlements_ticket_id_fkey foreign KEY (ticket_id) references tickets (id) on delete set null
) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.operator_settlements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view all settlements" ON public.operator_settlements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert settlements" ON public.operator_settlements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update settlements" ON public.operator_settlements
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete settlements" ON public.operator_settlements
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operator_settlements_ticket_id ON public.operator_settlements(ticket_id);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_is_paid ON public.operator_settlements(is_paid);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_operator_name ON public.operator_settlements(operator_name);
CREATE INDEX IF NOT EXISTS idx_operator_settlements_created_at ON public.operator_settlements(created_at);

-- Add indexes for settlements
CREATE INDEX IF NOT EXISTS idx_settlements_operator_id ON settlements(operator_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at);

-- Enable RLS for settlements
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for settlements
CREATE POLICY "Authenticated users can manage settlements" ON settlements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to calculate operator settlement
CREATE OR REPLACE FUNCTION calculate_operator_settlement(p_operator_id UUID)
RETURNS TABLE(
  total_tickets BIGINT,
  total_amount DECIMAL,
  total_commission DECIMAL,
  you_owed_amount DECIMAL,
  operator_owed_amount DECIMAL,
  net_balance DECIMAL,
  settlement_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tickets,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(SUM(t.amount * o.commission_percent / 100), 0) as total_commission,
    COALESCE(SUM(CASE WHEN t.payment_received_by = 'self' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) as you_owed_amount,
    COALESCE(SUM(CASE WHEN t.payment_received_by = 'operator' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) as operator_owed_amount,
    COALESCE(SUM(CASE WHEN t.payment_received_by = 'operator' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN t.payment_received_by = 'self' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) as net_balance,
    CASE 
      WHEN COALESCE(SUM(CASE WHEN t.payment_received_by = 'operator' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) > 
           COALESCE(SUM(CASE WHEN t.payment_received_by = 'self' THEN t.amount * o.commission_percent / 100 ELSE 0 END), 0) 
      THEN 'operator_pays'
      ELSE 'you_pay'
    END as settlement_type
  FROM tickets t
  JOIN operators o ON t.operator_id = o.id
  WHERE t.operator_id = p_operator_id 
    AND t.settlement_status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create function to create settlement record
CREATE OR REPLACE FUNCTION create_settlement(p_operator_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  settlement_id UUID;
  settlement_data RECORD;
BEGIN
  -- Get settlement calculation
  SELECT * INTO settlement_data 
  FROM calculate_operator_settlement(p_operator_id)
  LIMIT 1;
  
  -- Create settlement record
  INSERT INTO settlements (
    operator_id, 
    total_tickets, 
    total_amount, 
    total_commission, 
    net_balance, 
    settlement_type,
    status,
    notes
  ) VALUES (
    p_operator_id,
    settlement_data.total_tickets,
    settlement_data.total_amount,
    settlement_data.total_commission,
    settlement_data.net_balance,
    settlement_data.settlement_type,
    'pending',
    p_notes
  ) RETURNING id INTO settlement_id;
  
  RETURN settlement_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete settlement
CREATE OR REPLACE FUNCTION complete_settlement(p_settlement_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update settlement status
  UPDATE settlements 
  SET status = 'completed', 
      settled_at = TIMEZONE('utc', NOW()),
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_settlement_id;
  
  -- Mark related tickets as settled
  UPDATE tickets 
  SET settlement_status = 'paid',
      settlement_timestamp = TIMEZONE('utc', NOW()),
      updated_at = TIMEZONE('utc', NOW())
  WHERE operator_id = (SELECT operator_id FROM settlements WHERE id = p_settlement_id)
    AND settlement_status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Update existing tickets to have default payment_received_by
UPDATE tickets SET payment_received_by = 'self' WHERE payment_received_by IS NULL;
