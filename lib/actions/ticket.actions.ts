"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface CreateTicketPayload {
  passenger_name: string;
  mobile_number: string;
  pickup_location: string;
  drop_location: string;
  journey_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number?: string;
  travel_type: "AC" | "Non-AC";
  ticket_number: string;
  account_id?: string;
  account_type: "Cash" | "UPI";
  amount: number;
  operator_id?: string;
}

export interface Ticket {
  id: string;
  passenger_name: string;
  mobile_number: string;
  pickup_location: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string | null;
  travel_type: "AC" | "Non-AC";
  ticket_number: string;
  account_id: string | null;
  account_type: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

export interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

// --- 1. CREATE TICKET & INCOME ENTRY ---
export async function createTicket(data: CreateTicketPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be logged in.");

  // Convert seat_numbers array to PostgreSQL array format
  const seatNumbersDb = `{${data.seat_numbers.map((s) => `"${s}"`).join(",")}}`;

  // Insert ticket
  const { data: newTicket, error: ticketError } = await supabase
    .from("tickets")
    .insert([
      {
        passenger_name: data.passenger_name,
        mobile_number: data.mobile_number,
        pickup_location: data.pickup_location,
        drop_location: data.drop_location,
        journey_date: data.journey_date,
        seat_numbers: seatNumbersDb,
        total_seats: data.total_seats,
        pickup_time: data.pickup_time,
        bus_number: data.bus_number || null,
        travel_type: data.travel_type,
        ticket_number: data.ticket_number,
        account_id: data.account_id || null,
        account_type: data.account_type,
        amount: data.amount,
        operator_id: data.operator_id || null,
        created_by: user.id,
        status: "Booked",
      },
    ])
    .select()
    .single();

  if (ticketError) throw new Error(ticketError.message);

  // Create income entry for the full amount
  if (data.account_id) {
    await supabase.from("income_entries").insert([
      {
        ticket_id: newTicket.id,
        account_id: data.account_id,
        amount: data.amount,
        description: `Ticket #${data.ticket_number} - ${data.passenger_name}`,
        entry_type: "Ticket Booking",
      },
    ]);

    // Update account balance (add income)
    const { data: currentAccount } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", data.account_id)
      .single();

    if (currentAccount) {
      await supabase
        .from("accounts")
        .update({ balance: currentAccount.balance + data.amount })
        .eq("id", data.account_id);
    }
  }

  // Auto-create or update customer if new
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("mobile_number", data.mobile_number)
    .maybeSingle();

  if (!existingCustomer) {
    await supabase.from("customers").insert([
      {
        name: data.passenger_name,
        mobile_number: data.mobile_number,
        last_booking_date: new Date().toISOString().split("T")[0],
      },
    ]);
  } else {
    await supabase
      .from("customers")
      .update({ last_booking_date: new Date().toISOString().split("T")[0] })
      .eq("id", existingCustomer.id);
  }

  revalidatePath("/tickets");
  revalidatePath("/customers");
  return { success: true, ticket: newTicket };
}

// --- 2. GET ALL TICKETS ---
export async function getTickets(): Promise<Ticket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as unknown as Ticket[];
}

// --- 3. GET ACCOUNTS ---
export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  return data || [];
}

// --- 4. GET OPERATORS ---
export async function getOperators(): Promise<Operator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operators")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  return data || [];
}

// --- 5. GET CUSTOMER BY MOBILE NUMBER (for auto-fill) ---
export async function getCustomerByMobile(mobileNumber: string) {
  const supabase = await createClient();
  const formattedMobile = `+91 ${mobileNumber}`;

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile_number")
    .eq("mobile_number", formattedMobile)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching customer:", error.message);
    return null;
  }

  return data || null;
}

export async function searchCustomersByMobileFragment(fragment: string) {
  const supabase = await createClient();
  const mobileFragment = `%${fragment}%`;

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, mobile_number")
    .ilike("mobile_number", mobileFragment)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching customer suggestions:", error.message);
    return [];
  }

  return data || [];
}

// --- 6. GET TICKET BY ID ---
export async function getTicketById(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error) return null;
  return data;
}

// --- 6. CANCEL TICKET ---
export async function cancelTicket(ticketId: string) {
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) throw new Error("Ticket not found");

  // Update ticket status
  await supabase
    .from("tickets")
    .update({ status: "Cancelled" })
    .eq("id", ticketId);

  // Reverse the income entry (deduct from account)
  if (ticket.account_id && ticket.amount > 0) {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", ticket.account_id)
      .single();

    if (account) {
      await supabase
        .from("accounts")
        .update({ balance: account.balance - ticket.amount })
        .eq("id", ticket.account_id);
    }
  }

  revalidatePath("/tickets");
  return { success: true };
}

// --- 7. SETTLE OPERATOR PAYMENT ---
export async function settleOperatorPayment(
  ticketId: string,
  operatorName: string,
  mobileNumber: string,
) {
  const supabase = await createClient();

  // Get ticket details
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, operator:operators(ticket_id, commission_percentage)")
    .eq("id", ticketId)
    .single();

  if (!ticket) throw new Error("Ticket not found");

  const totalAmount = ticket.amount;
let commissionPercent = 10; // Default 10%

  // Get operator commission if linked
  if (ticket.operator_id) {
    const { data: operator } = await supabase
      .from("operators")
      .select("commission_percentage")
      .eq("id", ticket.operator_id)
      .single();

    if (operator) {
      commissionPercent = operator.commission_percentage;
    }
  }

  const commissionAmount = (totalAmount * commissionPercent) / 100;
  const operatorPayable = totalAmount - commissionAmount;

  // Create settlement record
  await supabase.from("operator_settlements").insert([
    {
      ticket_id: ticketId,
      operator_name: operatorName,
      mobile_number: mobileNumber,
      total_amount: totalAmount,
      commission_percentage: commissionPercent,
      commission_amount: commissionAmount,
      operator_payable: operatorPayable,
      is_paid: true,
      paid_at: new Date().toISOString(),
    },
  ]);

  // Update ticket status to Settled
  await supabase
    .from("tickets")
    .update({ status: "Settled" })
    .eq("id", ticketId);

  // Deduct operator payable from the main account (if it was added as income)
  if (ticket.account_id && operatorPayable > 0) {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", ticket.account_id)
      .single();

    if (account) {
      await supabase
        .from("accounts")
        .update({ balance: account.balance - operatorPayable })
        .eq("id", ticket.account_id);
    }
  }

  revalidatePath("/tickets");
  return {
    success: true,
    settlement: {
      totalAmount,
      commissionPercent,
      commissionAmount,
      operatorPayable,
    },
  };
}

// --- 8. ADD NEW ACCOUNT ---
export async function addAccount(name: string, type: "Cash" | "UPI") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .insert([{ name, type, balance: 0, is_active: true }]);

  if (error) throw new Error(error.message);
  revalidatePath("/tickets");
  return { success: true };
}

// --- 9. ADD NEW OPERATOR ---
export async function addOperator(
  name: string,
  personName: string,
  mobileNumber: string,
  commissionPercentage: number = 10,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("operators")
    .insert([
      {
        name,
        person_name: personName,
        mobile_number: mobileNumber,
        commission_percentage: commissionPercentage,
        is_active: true,
      },
    ]);

  if (error) throw new Error(error.message);
  revalidatePath("/tickets");
  return { success: true };
}

// --- 10. GET OPERATOR SETTLEMENTS ---
export async function getOperatorSettlements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operator_settlements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// --- 11. GET INCOME ENTRIES ---
export async function getIncomeEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_entries")
    .select("*, account:accounts(name)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// --- 12. GET TICKET STATISTICS ---
export async function getTicketStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id, amount, status, journey_date, created_at");

  if (!allTickets) return null;

return {
    totalBooked: allTickets.filter((t: { status: string }) => t.status === "Booked").length,
    totalCancelled: allTickets.filter((t: { status: string }) => t.status === "Cancelled").length,
    totalSettled: allTickets.filter((t: { status: string }) => t.status === "Settled").length,
    totalAmount: allTickets.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0),
    todayBookings: allTickets.filter((t: { created_at: string }) => {
      const bookingDate = new Date(t.created_at).toISOString().split("T")[0];
      return bookingDate === today;
    }).length,
  };
}
