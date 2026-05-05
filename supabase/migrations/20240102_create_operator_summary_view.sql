-- Create operator_summary view for getOperatorsWithTicketCounts function
CREATE OR REPLACE VIEW operator_summary AS
SELECT 
    o.id,
    o.name,
    o.person_name,
    o.mobile_number,
    o.commission_percentage,
    o.is_active,
    o.created_at,
    COALESCE(t.ticket_count, 0) as ticket_count,
    COALESCE(t.pending_settlements, 0) as pending_settlements
FROM operators o
LEFT JOIN (
    SELECT 
        operator_id,
        COUNT(*) as ticket_count,
        COUNT(*) FILTER (WHERE settlement_paid_to_operator = false) as pending_settlements
    FROM tickets 
    GROUP BY operator_id
) t ON o.id = t.operator_id
WHERE o.is_active = true;
