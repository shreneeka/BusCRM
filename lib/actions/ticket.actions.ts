"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface CreateTicketPayload {
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_location: string;
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
  account_id: string | null;
  account_type: "Cash" | "UPI";
  amount: number;
  operator_id?: string | null;
  operator_name?: string;
  operator_mobile?: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_location: string;
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
  operator_id?: string | null;
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
        pickup_location: data.pickup_location,
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
        payment_status: 'not_paid', // Initialize payment status
        operator_id: data.operator_id || null,
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

  // Step 2: Get Ticket Booking category
  const { data: ticketCategory } = await supabase
    .from("accounting_categories")
    .select("id")
    .eq("name", "Ticket Booking")
    .eq("category_type", "Income")
    .single();

  // Step 3: Create accounting entry for full ticket amount as income
  const { error: accountingError } = await supabase.from("accounting_entries").insert([
    {
      entry_type: "Income",
      account_id: accountId,
      category_id: ticketCategory?.id || null,
      amount: data.amount,
      entry_date: new Date().toISOString().split("T")[0],
      description: `Ticket Booking - ${data.passenger_name} (${data.account_type})`,
      ticket_id: newTicket.id,
      created_at: new Date().toISOString(),
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return [];
    }
    return (data || []) as unknown as Ticket[];
  } catch (error) {
    console.error("Unexpected error fetching tickets:", error);
    return [];
  }
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

  // Update ticket - remove status update as column doesn't exist
  // await supabase
  //   .from("tickets")
  //   .update({ status: "Cancelled" })
  //   .eq("id", ticketId);

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
export async function addAccount(name: string, type: "Cash" | "UPI" | "Other") {
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
export async function getTicketsStats() {
  const supabase = await createClient();

  // Total tickets count
  const { count: totalTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });

  // Settled tickets (using payment_status or settlements join)
  const { count: settledTickets } = await supabase
    .from("tickets")
    .select("*", { 
      count: "exact", 
      head: true 
    })
    .eq("payment_status", "paid");

  // Total amount sum
  const { data: totalAmountData } = await supabase
    .from("tickets")
    .select("amount")
    .gte("amount", 0);

  const totalAmount = totalAmountData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

  // Pending amount (not paid)
  const { data: pendingAmountData } = await supabase
    .from("tickets")
    .select("amount")
    .or("payment_status.eq.not_paid,payment_status.eq.partial");

  const pendingAmount = pendingAmountData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

  // Average ticket value
  const avgTicketValue = totalTickets ? Math.round(totalAmount / totalTickets) : 0;

  return {
    totalTickets: totalTickets || 0,
    settledTickets: settledTicketsCount || 0,
    totalAmount,
    pendingAmount,
    avgTicketValue,
    pendingCount: totalTickets ? totalTickets - settledTickets : 0
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

// --- UPDATE TICKET ---
export async function updateTicket(ticketId: string, updateData: Partial<CreateTicketPayload> & { seat_numbers?: string[] }) {
  const supabase = await createClient();
  
  console.log('=== DEBUG: updateTicket called ===');
  console.log('Ticket ID:', ticketId);
  console.log('Update Data:', JSON.stringify(updateData, null, 2));
  
  try {
    // START WITH A SINGLE FIELD TEST TO ISOLATE THE ISSUE
    console.log('Testing with minimal field first...');
    
    // Test with just passenger_name first
    const { data: testData, error: testError } = await supabase
      .from("tickets")
      .update({ passenger_name: updateData.passenger_name || "Test Update" })
      .eq("id", ticketId)
      .select()
      .single();

    if (testError) {
      console.error('=== MINIMAL TEST FAILED ===');
      console.error('Error Code:', testError.code);
      console.error('Error Message:', testError.message);
      console.error('Error Details:', testError.details);
      console.error('Error Hint:', testError.hint);
      console.error('Full Error Object:', JSON.stringify(testError, null, 2));
      throw testError;
    }
    
    console.log('✅ Minimal test passed, proceeding with full update...');
    
    // If minimal test passed, proceed with full update
    const updateFields: Record<string, any> = {};
    
    // Only include fields that actually exist in the database
    if (updateData.passenger_name) {
      updateFields.passenger_name = updateData.passenger_name;
      console.log('Adding passenger_name to update');
    }
    
    if (updateData.mobile_number) {
      updateFields.mobile_number = updateData.mobile_number;
      console.log('Adding mobile_number to update');
    }
    
    if (updateData.pickup_city) {
      updateFields.pickup_city = updateData.pickup_city;
      console.log('Adding pickup_city to update');
    }
    
    if (updateData.drop_city) {
      updateFields.drop_city = updateData.drop_city;
      console.log('Adding drop_city to update');
    }
    
    if (updateData.pickup_location) {
      updateFields.pickup_location = updateData.pickup_location;
      console.log('Adding pickup_location to update');
    }
    
    if (updateData.drop_location) {
      updateFields.drop_location = updateData.drop_location;
      console.log('Adding drop_location to update');
    }
    
    if (updateData.journey_date) {
      updateFields.journey_date = updateData.journey_date;
      console.log('Adding journey_date to update');
    }
    
    if (updateData.total_seats) {
      updateFields.total_seats = updateData.total_seats;
      console.log('Adding total_seats to update');
    }
    
    if (updateData.pickup_time) {
      updateFields.pickup_time = updateData.pickup_time;
      console.log('Adding pickup_time to update');
    }
    
    if (updateData.bus_number) {
      updateFields.bus_number = updateData.bus_number;
      console.log('Adding bus_number to update');
    }
    
    if (updateData.travel_type) {
      updateFields.travel_type = updateData.travel_type;
      console.log('Adding travel_type to update');
    }
    
    if (updateData.amount) {
      updateFields.amount = updateData.amount;
      console.log('Adding amount to update');
    }
    
    if (updateData.operator_id) {
      updateFields.operator_id = updateData.operator_id;
      console.log('Adding operator_id to update');
    }
    
    if (updateData.account_type) {
      updateFields.account_type = updateData.account_type;
      console.log('Adding account_type to update');
    }
    
    if (updateData.seat_numbers) {
      updateFields.seat_numbers = updateData.seat_numbers;
      console.log('Adding seat_numbers to update');
    }
    
    console.log('Final update fields:', JSON.stringify(updateFields, null, 2));
    
    if (Object.keys(updateFields).length === 0) {
      console.log('No additional fields to update, returning minimal test result');
      return testData;
    }
    
    console.log('Executing full database update...');
    
    // Perform the full update
    const { data, error } = await supabase
      .from("tickets")
      .update(updateFields)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      console.error('=== FULL UPDATE FAILED ===');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('✅ Full update successful:', data);
    revalidatePath("/tickets");
    return data;
  } catch (error) {
    console.error('=== CATCH BLOCK ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', (error as Error).message);
    console.error('Error stack:', (error as Error).stack);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw error;
  }
}
