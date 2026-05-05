"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface OperatorFormData {
  operatorName: string;
  contactPerson: string;
  mobileNumber: string;
  commissionPercent?: number;
}

// --- CREATE OPERATOR ---
export async function createOperator(data: OperatorFormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("operators").insert([
    {
      name: data.operatorName,
      person_name: data.contactPerson,
      mobile_number: data.mobileNumber,
      commission_percentage: data.commissionPercent || 10,
      is_active: true,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Failed to create operator: " + error.message);
  }

  revalidatePath("/operators");
}

// --- GET ALL OPERATORS ---
export async function getAllOperators(): Promise<Operator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operators")
    .select("*");

  if (error) {
    console.error("Error fetching operators:", error);
    return [];
  }
  
  return data || [];
}

// --- GET ACTIVE OPERATORS ---
export async function getOperators(): Promise<Operator[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Supabase error in getOperators:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error in getOperators:", err);
    return [];
  }
}

// --- UPDATE OPERATOR ---
export async function updateOperator(id: string, data: Partial<OperatorFormData>) {
  const supabase = await createClient();

  const updateData: Record<string, string | number> = {};
  if (data.operatorName) updateData.name = data.operatorName;
  if (data.contactPerson) updateData.person_name = data.contactPerson;
  if (data.mobileNumber) updateData.mobile_number = data.mobileNumber;
  if (data.commissionPercent !== undefined) updateData.commission_percentage = data.commissionPercent;

  const { error } = await supabase
    .from("operators")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Failed to update operator: " + error.message);
  }

  revalidatePath("/operators");
}

// --- DELETE OPERATOR (Soft Delete) ---
export async function deleteOperator(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("operators")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete operator: " + error.message);
  }

  revalidatePath("/operators");
}

// --- GET OPERATOR BY ID ---
export async function getOperatorById(id: string): Promise<Operator | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// --- GET OPERATOR SUMMARY WITH TICKETS AND SETTLEMENTS ---
export async function getOperatorSummary(id: string) {
  const supabase = await createClient();

  console.log("Fetching operator summary for ID:", id);

  // Get operator details
  const { data: operator, error: operatorError } = await supabase
    .from("operators")
    .select("*")
    .eq("id", id)
    .single();

  console.log("Operator query result:", { operator, operatorError });

  if (operatorError) {
    console.error("Operator database error:", operatorError);
    throw new Error(`Database error: ${operatorError.message}`);
  }

  if (!operator) {
    console.error("Operator not found for ID:", id);
    throw new Error("Operator not found");
  }

  // Get ticket statistics
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("id, amount, commission_amount, operator_payable, settlement_paid_to_operator, journey_date")
    .eq("operator_id", id);

  if (ticketsError) {
    console.error("Error fetching tickets:", ticketsError);
  }

  // Get settlement statistics - handle missing table gracefully
  let settlements: Array<{paid_amount?: number, remaining_amount?: number, payment_status: string, created_at: string}> = [];
  try {
    const { data: settlementsData, error: settlementsError } = await supabase
      .from("operator_settlements")
      .select("paid_amount, remaining_amount, payment_status, created_at")
      .eq("operator_name", operator.name);

    if (settlementsError) {
      console.log("Settlements table not available or other error:", settlementsError);
      settlements = [];
    } else {
      settlements = settlementsData || [];
    }
  } catch (error) {
    console.log("Error accessing settlements table:", error);
    settlements = [];
  }

  const totalTickets = tickets?.length || 0;
  const bookedTickets = tickets?.length || 0; // All tickets are considered booked
  const settledTickets = tickets?.filter(t => t.settlement_paid_to_operator === true).length || 0;
  
  const totalAmount = tickets?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const bookedAmount = tickets?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const settledAmount = tickets?.filter(t => t.settlement_paid_to_operator === true).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  
  const totalCommission = tickets?.reduce((sum, t) => sum + (t.commission_amount || 0), 0) || 0;
  const totalPaid = settlements?.reduce((sum, s) => sum + (s.paid_amount || 0), 0) || 0;
  const paidSettlements = settlements?.filter(s => s.payment_status === 'done').length || 0;

  return {
    operator: {
      ...operator,
      name: operator.name || operator.operator_name,
      commission_percentage: operator.commission_percentage || operator.commission_percent,
    },
    statistics: {
      totalTickets,
      bookedTickets,
      settledTickets,
      totalAmount,
      bookedAmount,
      settledAmount,
      totalCommission,
      totalPaid,
      paidSettlements,
      pendingSettlements: totalTickets - settledTickets,
      commissionPercentage: operator.commission_percentage || operator.commission_percent || 0,
    },
  };
}

// --- GET OPERATORS WITH TICKET COUNTS ---
export async function getOperatorsWithTicketCounts(): Promise<(Operator & { ticketCount: number; pendingSettlements: number })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operator_summary")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching operator summary:", error);
    return [];
  }

  return data || [];
}

// --- ACTIVATE/DEACTIVATE OPERATOR ---
export async function toggleOperatorStatus(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("operators")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error(`Failed to ${isActive ? 'activate' : 'deactivate'} operator: ` + error.message);
  }

  revalidatePath("/organization/operators");
}
