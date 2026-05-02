"use server";

import { createClient } from "@/lib/supabase/server";

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

export interface TicketWithOperator {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_location: string;
  drop_location: string;
  journey_date: string;
  amount: number;
  status: string;
  operator_id: string | null;
  operator?: {
    name: string;
    commission_percentage: number;
  };
}

// --- GET ALL OPERATORS ---
export async function getAllOperators(): Promise<Operator[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching operators:", error);
    return [];
  }

  return data || [];
}

// --- GET ALL SETTLEMENTS (Tickets with operator) ---
export async function getTicketsWithOperators(): Promise<TicketWithOperator[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      ticket_number,
      passenger_name,
      mobile_number,
      pickup_location,
      drop_location,
      journey_date,
      amount,
      status,
      operator_id,
      operator:operators(
        name,
        commission_percentage
      )
    `)
    .not("operator_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets with operators:", error);
    return [];
  }

  return (data as unknown as TicketWithOperator[]) || [];
}

// --- GET PENDING SETTLEMENTS ---
export async function getPendingSettlements(): Promise<TicketWithOperator[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      id,
      ticket_number,
      passenger_name,
      mobile_number,
      pickup_location,
      drop_location,
      journey_date,
      amount,
      status,
      operator_id,
      operator:operators(
        name,
        commission_percentage
      )
    `)
    .eq("status", "Booked")
    .not("operator_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending settlements:", error);
    return [];
  }

  return (data as unknown as TicketWithOperator[]) || [];
}
