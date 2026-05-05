"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface CreateTicketPayload {
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string;
  travel_type: "AC" | "Non-AC";
  ticket_number: string;
  account_id: string;
  account_type: "Cash" | "UPI";
  amount: number;
  operator_id: string;
  operator_name?: string;
  operator_mobile?: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string;
  travel_type: "AC" | "Non-AC";
  account_id: string | null;
  account_type: string;
  amount: number;
  commission_amount: number;
  operator_payable: number;
  settlement_paid_to_operator: boolean;
  settlement_paid_at: string | null;
  operator_id: string;
  operator_name?: string;
  operator_mobile?: string;
  created_at: string;
  updated_at: string;
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

// --- HELPER FUNCTION TO GET TICKET BOOKING CATEGORY ID ---
async function getTicketBookingCategoryId() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_categories")
    .select("id")
    .eq("name", "Ticket Booking")
    .eq("category_type", "Income")
    .single();
  
  if (error || !data) throw new Error("Ticket Booking category not found");
  return data.id;
}

// --- HELPER FUNCTION TO GET OR CREATE CASH ACCOUNT ---
async function getOrCreateCashAccount() {
  const supabase = await createClient();
  
  // Try to find existing cash account
  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", "Cash")
    .eq("type", "Cash")
    .eq("is_active", true)
    .maybeSingle();
  
  if (existingAccount) {
    return existingAccount.id;
  }
  
  // Create cash account if it doesn't exist
  const { data: newAccount, error } = await supabase
    .from("accounts")
    .insert([{
      name: "Cash",
      type: "Cash",
      opening_balance: 0,
      is_active: true,
    }])
    .select("id")
    .single();
  
  if (error || !newAccount) throw new Error("Failed to create Cash account");
  return newAccount.id;
}

// --- HELPER FUNCTION TO GET COMMISSION CATEGORY ID ---
async function getCommissionCategoryId() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_categories")
    .select("id")
    .eq("name", "Commission")
    .eq("category_type", "Income")
    .single();
  
  if (error || !data) throw new Error("Commission category not found");
  return data.id;
}

// --- 1. CREATE TICKET & INCOME ENTRY ---
export async function createTicket(data: CreateTicketPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be logged in.");


  // Step 1: Create Ticket
  const { data: newTicket, error: ticketError } = await supabase
    .from("tickets")
    .insert([
      {
        ticket_number: data.ticket_number,
        passenger_name: data.passenger_name,
        mobile_number: data.mobile_number,
        pickup_city: data.pickup_city,
        pickup_area: data.pickup_area,
        pickup_location: data.pickup_area, // Use pickup_area as pickup_location
        drop_city: data.drop_city,
        drop_location: data.drop_location,
        journey_date: data.journey_date,
        booking_date: data.booking_date,
        seat_numbers: data.seat_numbers,
        total_seats: data.total_seats,
        pickup_time: data.pickup_time,
        bus_number: data.bus_number,
        travel_type: data.travel_type,
        account_id: data.account_id,
        account_type: data.account_type,
        amount: data.amount,
        operator_id: data.operator_id,
      },
    ])

    .select()
    .single();

  if (ticketError) throw new Error(ticketError.message);

  // Create accounting entry for all ticket bookings
  // Step 1: Determine account to use
  let accountId = data.account_id;
  if (!accountId) {
    // For cash bookings, use or create a default Cash account
    accountId = await getOrCreateCashAccount();
  }

  // Step 2: Create accounting entry for full ticket amount as income
  const { error: accountingError } = await supabase.from("accounting_entries").insert([
    {
      description: `Ticket Booking - ${data.passenger_name} (${data.account_type})`,
      amount: data.amount,
      type: "income",
      category: "ticket_booking",
      reference_type: "ticket",
      reference_id: newTicket.id,
      date: new Date().toISOString().split("T")[0],
      account_id: accountId,
    },
  ]);

  if (accountingError) {
    console.error("Accounting entry creation failed:", accountingError);
    // Continue anyway - don't fail the whole ticket
  } else {
    console.log("✅ Accounting entry created successfully");
  }

  // Revalidate accounting path so the entry shows in Accounting module
  revalidatePath("/accounting");

  // Step 5: Update account balance (add income)
  const { data: currentAccount } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (currentAccount) {
    await supabase
      .from("accounts")
      .update({ balance: currentAccount.balance + data.amount })
      .eq("id", accountId);
    console.log("✅ Account balance updated");
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

export async function searchOperatorsByName(fragment: string) {
  const supabase = await createClient();
  if (fragment.length < 2) return [];

  const nameFragment = `%${fragment}%`;

  const { data, error } = await supabase
    .from("operators")
    .select("id, name, person_name, mobile_number, commission_percentage")
    .eq("is_active", true)
    .or(`name.ilike.${nameFragment},person_name.ilike.${nameFragment},mobile_number.ilike.${nameFragment}`)
    .order("name")
    .limit(10);

  if (error) {
    console.error("Error fetching operator suggestions:", error.message);
    return [];
  }

  return data || [];
}

export async function searchOperatorsByMobile(mobileFragment: string) {
  const supabase = await createClient();
  if (mobileFragment.length < 3) return [];

  const mobileSearch = `%${mobileFragment}%`;

  const { data, error } = await supabase
    .from("operators")
    .select("id, name, person_name, mobile_number, commission_percentage")
    .eq("is_active", true)
    .ilike("mobile_number", mobileSearch)
    .order("name")
    .limit(5);

  if (error) {
    console.error("Error fetching operator by mobile:", error.message);
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

// --- 7. CANCEL TICKET ---
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
  if (ticket.amount > 0) {
    // Find the accounting entry for this ticket to get the account_id
    const { data: accountingEntry } = await supabase
      .from("accounting_entries")
      .select("account_id")
      .eq("ticket_id", ticketId)
      .maybeSingle();

    if (accountingEntry && accountingEntry.account_id) {
      const { data: account } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", accountingEntry.account_id)
        .single();

      if (account) {
        await supabase
          .from("accounts")
          .update({ balance: account.balance - ticket.amount })
          .eq("id", accountingEntry.account_id);
      }
    }
  }

  revalidatePath("/tickets");
  return { success: true };
}



// --- 9. ADD NEW ACCOUNT ---
export async function addAccount(name: string, type: "Cash" | "UPI") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .insert([{ name, type, balance: 0, is_active: true }]);

  if (error) throw new Error(error.message);
  revalidatePath("/tickets");
  return { success: true };
}

// --- 10. ADD NEW OPERATOR ---
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

// --- 11. GET OPERATOR SETTLEMENTS ---
export async function getOperatorSettlements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operator_settlements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// --- 12. GET INCOME ENTRIES ---
export async function getIncomeEntries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_entries")
    .select("*, account:accounts(name)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

// --- 13. GET TICKET STATISTICS ---
export async function getTicketStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id, amount, commission_amount, settlement_paid_to_operator, journey_date, created_at");

  if (!allTickets) return null;

  return {
    totalBooked: allTickets.length,
    totalSettled: allTickets.filter((t: { settlement_paid_to_operator: boolean }) => t.settlement_paid_to_operator).length,
    totalAmount: allTickets.reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0),
    totalCommission: allTickets.reduce((sum: number, t: { commission_amount: number }) => sum + (t.commission_amount || 0), 0),
    todayBookings: allTickets.filter((t: { created_at: string }) => {
      const bookingDate = new Date(t.created_at).toISOString().split("T")[0];
      return bookingDate === today;
    }).length,
  };
}

// --- 14. PROCESS OPERATOR SETTLEMENT ---
export async function processOperatorSettlement(
  operatorId: string,
  ticketIds: string[],
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be logged in.");

  try {
    // Get ticket details for settlement record
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .in("id", ticketIds);

    if (ticketsError) throw ticketsError;
    if (!tickets || tickets.length === 0) throw new Error("No tickets found");

    // Calculate totals
    const totalAmount = tickets.reduce((sum, ticket) => sum + (ticket.amount || 0), 0);
    const commissionAmount = tickets.reduce((sum, ticket) => sum + (ticket.commission_amount || 0), 0);
    const operatorPayable = tickets.reduce((sum, ticket) => sum + (ticket.operator_payable || 0), 0);

    // Get operator details
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("*")
      .eq("id", operatorId)
      .single();

    if (operatorError) throw operatorError;

    // Create settlement record
    const { error: settlementError } = await supabase
      .from("operator_settlements")
      .insert({
        operator_id: operatorId,
        total_amount: totalAmount,
        commission_percentage: operator.commission_percentage,
        commission_amount: commissionAmount,
        operator_payable: operatorPayable,
        settlement_date: new Date().toISOString().split("T")[0],
        paid_at: new Date().toISOString(),
        paid_by: user.id,
        notes: notes || null,
      });

    if (settlementError) throw settlementError;

    // Update tickets as settled
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        settlement_paid_to_operator: true,
        settlement_paid_at: new Date().toISOString(),
      })
      .in("id", ticketIds);

    if (updateError) throw updateError;

    // Create accounting entry for commission income
    const { data: commissionCategory } = await supabase
      .from("accounting_categories")
      .select("id")
      .eq("name", "Commission")
      .eq("category_type", "Income")
      .single();

    if (commissionCategory) {
      // Get or create cash account
      const { data: cashAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", "Cash")
        .eq("type", "Cash")
        .single();

      if (cashAccount) {
        await supabase.from("accounting_entries").insert({
          account_id: cashAccount.id,
          category_id: commissionCategory.id,
          entry_type: "Income",
          amount: commissionAmount,
          entry_date: new Date().toISOString().split("T")[0],
          description: `Commission from ${operator.operator_name} - ${tickets.length} tickets`,
        });
      }
    }

    revalidatePath("/settlements");
    revalidatePath("/accounting");
    return { success: true };
  } catch (error: unknown) {
    console.error("Settlement processing error:", error);
    throw error;
  }
}

// --- 15. GET SETTLEMENT HISTORY ---
export async function getSettlementHistory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("operator_settlements")
    .select(`
      *,
      operator:operators(
        operator_name,
        person_name,
        mobile_number
      ),
      paid_by_user:auth.users(
        email
      )
    `)
    .order("paid_at", { ascending: false });

  if (error) return [];
  return data || [];
}
