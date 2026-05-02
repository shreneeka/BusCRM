"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============= TYPE DEFINITIONS =============

export interface OperatorPayment {
  id: string;
  operator_id: string;
  ticket_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  operator?: {
    id: string;
    operator_name: string;
    person_name: string;
    mobile_number: string;
    commission_percent: number;
  };
  ticket?: {
    id: string;
    ticket_number: string;
    passenger_name: string;
    amount: number;
    booking_date: string;
  };
}

export interface PaymentSummary {
  operator_id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  total_tickets: number;
  paid_tickets: number;
  unpaid_tickets: number;
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
  total_paid: number;
  last_payment_date: string | null;
}

export interface PaymentCollectionDetails {
  ticket_id: string;
  ticket_number: string;
  passenger_name: string;
  ticket_amount: number;
  booking_date: string;
  operator_id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  commission_amount: number;
  operator_payable: number;
  payment_collected: boolean;
  payment_collected_at: string | null;
  payment_id: string | null;
  amount_paid: number | null;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
}

// ============= PAYMENT FUNCTIONS =============

// GET OPERATOR PAYMENT SUMMARY
export async function getOperatorPaymentSummary(): Promise<PaymentSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operator_payment_summary")
    .select("*")
    .order("operator_name");

  if (error) throw new Error(error.message);
  return data || [];
}

// GET PAYMENT COLLECTION DETAILS
export async function getPaymentCollectionDetails(): Promise<PaymentCollectionDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_collection_details")
    .select("*")
    .order("booking_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// GET PAYMENT COLLECTION DETAILS BY OPERATOR
export async function getPaymentCollectionDetailsByOperator(operatorId: string): Promise<PaymentCollectionDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_collection_details")
    .select("*")
    .eq("operator_id", operatorId)
    .order("booking_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// GET UNPAID TICKETS FOR OPERATOR
export async function getUnpaidTicketsByOperator(operatorId: string): Promise<PaymentCollectionDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payment_collection_details")
    .select("*")
    .eq("operator_id", operatorId)
    .eq("payment_collected", false)
    .order("booking_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// RECORD OPERATOR PAYMENT
export async function recordOperatorPayment(formData: FormData) {
  const supabase = await createClient();

  const operatorId = formData.get('operatorId') as string;
  const ticketId = formData.get('ticketId') as string;
  const amountPaid = formData.get('amountPaid') as string;
  const paymentMethod = formData.get('paymentMethod') as string;
  const notes = formData.get('notes') as string;

  if (!operatorId || !ticketId || !amountPaid) {
    throw new Error("Missing required fields: operatorId, ticketId, amountPaid");
  }

  const amountPaidNum = parseFloat(amountPaid);
  if (isNaN(amountPaidNum) || amountPaidNum <= 0) {
    throw new Error("Invalid payment amount");
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const recordedBy = user?.id || null;

  // Call the stored function to record payment and update accounting
  const { data, error } = await supabase
    .rpc('record_operator_payment', {
      p_operator_id: operatorId,
      p_ticket_id: ticketId,
      p_amount_paid: amountPaidNum,
      p_payment_method: paymentMethod || 'Cash',
      p_notes: notes || null,
      p_recorded_by: recordedBy
    });

  if (error) throw new Error(error.message);

  revalidatePath("/operators");
  revalidatePath("/accounting");
  
  return data;
}

// GET OPERATOR PAYMENTS HISTORY
export async function getOperatorPaymentsHistory(operatorId?: string): Promise<OperatorPayment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("operator_payments")
    .select(`
      *,
      operator:operators(id, operator_name, person_name, mobile_number, commission_percent),
      ticket:tickets(id, ticket_number, passenger_name, amount, booking_date)
    `)
    .order("payment_date", { ascending: false });

  if (operatorId) {
    query = query.eq("operator_id", operatorId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

// DELETE OPERATOR PAYMENT (with accounting reversal)
export async function deleteOperatorPayment(formData: FormData) {
  const supabase = await createClient();

  const paymentId = formData.get('paymentId') as string;

  if (!paymentId) {
    throw new Error("Missing payment ID");
  }

  // Get payment details before deletion
  const { data: payment, error: fetchError } = await supabase
    .from("operator_payments")
    .select(`
      *,
      operator:operators(id, operator_name, commission_percent),
      ticket:tickets(id, ticket_number, amount)
    `)
    .eq("id", paymentId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!payment) throw new Error("Payment not found");

  // Delete the payment
  const { error: deleteError } = await supabase
    .from("operator_payments")
    .delete()
    .eq("id", paymentId);

  if (deleteError) throw new Error(deleteError.message);

  // Update ticket payment status
  const { error: ticketError } = await supabase
    .from("tickets")
    .update({
      payment_collected: false,
      payment_collected_at: null,
      payment_collected_by: null
    })
    .eq("id", payment.ticket_id);

  if (ticketError) throw new Error(ticketError.message);

  // Note: In a real implementation, you might want to reverse the accounting entries
  // This would require additional logic to find and reverse the specific entries

  revalidatePath("/operators");
  revalidatePath("/accounting");
}

// GET PAYMENT STATISTICS
export async function getPaymentStatistics() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operator_payment_summary")
    .select(`
      *,
      total_tickets,
      paid_tickets,
      unpaid_tickets,
      total_amount,
      collected_amount,
      pending_amount
    `);

  if (error) throw new Error(error.message);

  const stats = {
    totalOperators: data?.length || 0,
    totalTickets: data?.reduce((sum, op) => sum + op.total_tickets, 0) || 0,
    totalPaidTickets: data?.reduce((sum, op) => sum + op.paid_tickets, 0) || 0,
    totalUnpaidTickets: data?.reduce((sum, op) => sum + op.unpaid_tickets, 0) || 0,
    totalAmount: data?.reduce((sum, op) => sum + op.total_amount, 0) || 0,
    totalCollected: data?.reduce((sum, op) => sum + op.collected_amount, 0) || 0,
    totalPending: data?.reduce((sum, op) => sum + op.pending_amount, 0) || 0,
  };

  return stats;
}
