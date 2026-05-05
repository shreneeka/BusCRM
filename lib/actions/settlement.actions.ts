"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SettlementCalculation {
  total_tickets: number;
  total_amount: number;
  total_commission: number;
  you_owed_amount: number;
  operator_owed_amount: number;
  net_balance: number;
  settlement_type: "operator_pays" | "you_pay";
}

export interface Settlement {
  id: string;
  operator_id: string;
  total_tickets: number;
  total_amount: number;
  total_commission: number;
  net_balance: number;
  settlement_type: "operator_pays" | "you_pay";
  status: "pending" | "completed";
  settled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function calculateOperatorSettlement(operatorId: string): Promise<SettlementCalculation | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("calculate_operator_settlement", {
      p_operator_id: operatorId,
    });

    if (error) {
      console.error("Error calculating settlement:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error in calculateOperatorSettlement:", error);
    return null;
  }
}

export async function getOperatorSettlements(operatorId?: string): Promise<Settlement[]> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("settlements")
      .select(`
        *,
        operators (
          operator_name,
          person_name,
          mobile_number
        )
      `)
      .order("created_at", { ascending: false });

    if (operatorId) {
      query = query.eq("operator_id", operatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching settlements:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getOperatorSettlements:", error);
    return [];
  }
}

export async function createSettlement(
  operatorId: string,
  notes?: string
): Promise<{ success: boolean; settlementId?: string; error?: string }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("create_settlement", {
      p_operator_id: operatorId,
      p_notes: notes,
    });

    if (error) {
      console.error("Error creating settlement:", error);
      return { success: false, error: error.message };
    }

    // Get settlement details for accounting entry
    const { data: settlementData } = await supabase
      .from("settlements")
      .select(`
        *,
        operators (
          operator_name,
          commission_percentage
        )
      `)
      .eq("id", data)
      .single();

    if (settlementData) {
      // Get or create cash account
      const { data: cashAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", "Cash")
        .eq("type", "Cash")
        .single();

      // Get commission category
      const { data: commissionCategory } = await supabase
        .from("accounting_categories")
        .select("id")
        .eq("name", "Commission")
        .eq("category_type", "Income")
        .single();

      if (cashAccount && commissionCategory && settlementData.net_balance !== 0) {
        // Create accounting entry for commission income/expense
        await supabase.from("accounting_entries").insert({
          account_id: cashAccount.id,
          category_id: commissionCategory.id,
          entry_type: settlementData.settlement_type === "operator_pays" ? "Income" : "Expense",
          amount: Math.abs(settlementData.net_balance),
          entry_date: new Date().toISOString().split("T")[0],
          description: `${settlementData.settlement_type === "operator_pays" ? "Commission received from" : "Commission paid to"} ${settlementData.operators?.operator_name || 'Operator'} - ${settlementData.total_tickets} tickets`,
        });
      }
    }

    revalidatePath("/dashboard/settlements");
    revalidatePath("/accounting");
    return { success: true, settlementId: data };
  } catch (error) {
    console.error("Error in createSettlement:", error);
    return { success: false, error: "Failed to create settlement" };
  }
}

export async function completeSettlement(
  settlementId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("complete_settlement", {
      p_settlement_id: settlementId,
    });

    if (error) {
      console.error("Error completing settlement:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settlements");
    return { success: true };
  } catch (error) {
    console.error("Error in completeSettlement:", error);
    return { success: false, error: "Failed to complete settlement" };
  }
}

export async function getPendingTicketsForOperator(operatorId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        operators (
          operator_name,
          commission_percentage
        )
      `)
      .eq("operator_id", operatorId)
      .eq("settlement_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending tickets:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPendingTicketsForOperator:", error);
    return [];
  }
}

export async function getAllOperatorsWithPendingSettlements() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("operators")
      .select(`
        *,
        tickets!inner (
          id,
          amount,
          payment_received_by,
          settlement_status
        )
      `)
      .eq("tickets.settlement_status", "pending")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching operators with pending settlements:", error);
      return [];
    }

    // Group tickets by operator and calculate totals
    const operatorsMap = new Map();
    
    data?.forEach((operator: {
      id: string;
      commission_percentage: number;
      tickets: Array<{
        id: string;
        amount: number;
        payment_received_by: string;
        settlement_status: string;
      }>;
    }) => {
      if (!operatorsMap.has(operator.id)) {
        operatorsMap.set(operator.id, {
          ...operator,
          pending_tickets: [],
          total_amount: 0,
          total_commission: 0,
          you_owed_amount: 0,
          operator_owed_amount: 0,
          net_balance: 0,
        });
      }
      
      const op = operatorsMap.get(operator.id);
      operator.tickets.forEach((ticket: {
        amount: number;
        payment_received_by: string;
      }) => {
        op.pending_tickets.push(ticket);
        op.total_amount += ticket.amount;
        
        // Use 10% commission as default, or operator's commission if higher
        const commissionRate = Math.max(10, operator.commission_percentage || 0);
        const commission = ticket.amount * commissionRate / 100;
        op.total_commission += commission;
        
        if (ticket.payment_received_by === "self") {
          op.you_owed_amount += commission;
        } else {
          op.operator_owed_amount += commission;
        }
      });
      
      op.net_balance = op.operator_owed_amount - op.you_owed_amount;
    });

    return Array.from(operatorsMap.values());
  } catch (error) {
    console.error("Error in getAllOperatorsWithPendingSettlements:", error);
    return [];
  }
}

// New operator settlement functions for updated workflow
export async function createOperatorSettlement(settlementData: {
  operator_name: string;
  mobile_number?: string;
  total_amount: number;
  commission_percentage: number;
  commission_amount: number;
  operator_payable: number;
  is_paid: boolean;
  paid_at?: string;
  payment_status?: string;
  settlement_method?: string;
  reference_number?: string;
  bank_name?: string;
  account_number?: string;
  payment_collector_name?: string;
  payment_collector_mobile?: string;
  payment_collected_at?: string;
  notes?: string;
  ticket_ids?: string[];
}) {
  const supabase = await createClient();

  try {
    // Create settlement record
    const { data: settlement, error: settlementError } = await supabase
      .from("operator_settlements")
      .insert({
        operator_name: settlementData.operator_name,
        mobile_number: settlementData.mobile_number || null,
        total_amount: settlementData.total_amount,
        commission_percentage: settlementData.commission_percentage,
        commission_amount: settlementData.commission_amount,
        operator_payable: settlementData.operator_payable,
        is_paid: settlementData.is_paid,
        paid_at: settlementData.paid_at || null,
        payment_status: settlementData.payment_status || "pending",
        settlement_method: settlementData.settlement_method || "cash",
        reference_number: settlementData.reference_number || null,
        bank_name: settlementData.bank_name || null,
        account_number: settlementData.account_number || null,
        payment_collector_name: settlementData.payment_collector_name || null,
        payment_collector_mobile: settlementData.payment_collector_mobile || null,
        payment_collected_at: settlementData.payment_collected_at || null,
        notes: settlementData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (settlementError) {
      console.error("Error creating settlement:", settlementError);
      return { success: false, error: settlementError.message };
    }

    // Create accounting entry for commission
    if (settlementData.commission_amount > 0) {
      // Get commission category
      const { data: category } = await supabase
        .from("accounting_categories")
        .select("id")
        .eq("name", "Commission")
        .eq("category_type", "Income")
        .single();

      // Get cash account
      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", "Cash")
        .single();

      if (category && account) {
        const { error: accountingError } = await supabase
          .from("accounting_entries")
          .insert({
            account_id: account.id,
            category_id: category.id,
            entry_type: "Income",
            amount: settlementData.commission_amount,
            entry_date: new Date().toISOString().split("T")[0],
            description: `Commission from ${settlementData.operator_name}`,
            created_at: new Date().toISOString(),
          });

        if (accountingError) {
          console.error("Error creating accounting entry:", accountingError);
          // Don't fail the whole operation if accounting entry fails
        }
      }
    }

    // Update tickets if provided
    if (settlementData.ticket_ids && settlementData.ticket_ids.length > 0) {
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          updated_at: new Date().toISOString(),
        })
        .in("id", settlementData.ticket_ids);

      if (updateError) {
        console.error("Error updating tickets:", updateError);
        // Don't fail the whole operation if ticket update fails
      }
    }

    revalidatePath("/settlements");
    revalidatePath("/tickets");

    return { success: true, data: settlement };
  } catch (error) {
    console.error("Unexpected error in createOperatorSettlement:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

export async function getOperatorSettlementsList(filters?: {
  operator_name?: string;
  is_paid?: boolean;
  start_date?: string;
  end_date?: string;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("operator_settlements")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.operator_name) {
      query = query.ilike("operator_name", `%${filters.operator_name}%`);
    }

    if (filters?.is_paid !== undefined) {
      query = query.eq("is_paid", filters.is_paid);
    }

    if (filters?.start_date) {
      query = query.gte("created_at", filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching settlements:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Unexpected error in getOperatorSettlementsList:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

export async function updateSettlementPayment(
  settlementId: string,
  isPaid: boolean,
  paymentAmount?: number
) {
  const supabase = await createClient();

  try {
    // First get the current settlement to calculate amounts
    const { data: currentSettlement, error: fetchError } = await supabase
      .from("operator_settlements")
      .select("*")
      .eq("id", settlementId)
      .single();

    if (fetchError) {
      console.error("Error fetching settlement:", fetchError);
      return { success: false, error: fetchError.message };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isPaid) {
      updateData.is_paid = true;
      updateData.paid_at = new Date().toISOString();
      updateData.payment_status = 'done';
      updateData.paid_amount = currentSettlement.operator_payable;
      updateData.remaining_amount = 0;
    } else if (paymentAmount && paymentAmount > 0) {
      // Handle partial payment
      const paidAmount = (currentSettlement.paid_amount || 0) + paymentAmount;
      const remainingAmount = currentSettlement.operator_payable - paidAmount;
      
      updateData.paid_amount = paidAmount;
      updateData.remaining_amount = remainingAmount;
      updateData.payment_status = remainingAmount <= 0 ? 'done' : 'partial';
      updateData.is_paid = remainingAmount <= 0;
      
      if (remainingAmount <= 0) {
        updateData.paid_at = new Date().toISOString();
      }
    } else {
      updateData.is_paid = false;
      updateData.payment_status = 'pending';
    }

    const { data, error } = await supabase
      .from("operator_settlements")
      .update(updateData)
      .eq("id", settlementId)
      .select()
      .single();

    if (error) {
      console.error("Error updating settlement payment:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/settlements");

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in updateSettlementPayment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}
