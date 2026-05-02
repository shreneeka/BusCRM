"use server";

import { createClient } from "@/lib/supabase/server";

// Function to create accounting entries for existing tickets
export async function migrateExistingTicketsToAccounting() {
  const supabase = await createClient();
  
  // Get the Ticket Booking category ID
  const { data: category, error: categoryError } = await supabase
    .from("accounting_categories")
    .select("id")
    .eq("name", "Ticket Booking")
    .eq("category_type", "Income")
    .single();
    
  if (categoryError || !category) {
    throw new Error("Ticket Booking category not found");
  }
  
  // Get all tickets that have account_id but no accounting entry
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("*")
    .not("account_id", "is", null)
    .eq("status", "Booked");
    
  if (ticketsError) {
    throw new Error(`Failed to fetch tickets: ${ticketsError.message}`);
  }
  
  console.log(`Found ${tickets.length} tickets to migrate`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const ticket of tickets) {
    // Check if accounting entry already exists
    const { data: existingEntry } = await supabase
      .from("accounting_entries")
      .select("id")
      .eq("ticket_id", ticket.id)
      .maybeSingle();
      
    if (existingEntry) {
      console.log(`Skipping ticket ${ticket.ticket_number} - entry already exists`);
      continue;
    }
    
    // Create accounting entry
    const { error: insertError } = await supabase
      .from("accounting_entries")
      .insert([{
        entry_type: "Income",
        account_id: ticket.account_id,
        category_id: category.id,
        amount: ticket.amount,
        entry_date: ticket.booking_date || ticket.created_at?.split("T")[0],
        description: `Ticket #${ticket.ticket_number} - ${ticket.passenger_name}`,
        ticket_id: ticket.id,
        created_by: ticket.created_by,
      }]);
      
    if (insertError) {
      console.error(`Failed to create entry for ticket ${ticket.ticket_number}:`, insertError);
      errorCount++;
    } else {
      console.log(`Created accounting entry for ticket ${ticket.ticket_number}`);
      successCount++;
    }
  }
  
  return {
    total: tickets.length,
    success: successCount,
    errors: errorCount,
  };
}

// Function to test accounting entry creation
export async function testAccountingEntryCreation() {
  const supabase = await createClient();
  
  // Get test data
  const { data: category } = await supabase
    .from("accounting_categories")
    .select("id")
    .eq("name", "Ticket Booking")
    .eq("category_type", "Income")
    .single();
    
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("name", "Cash")
    .single();
    
  const { data: user } = await supabase.auth.getUser();
  
  if (!category || !account || !user.user) {
    throw new Error("Missing required data for test");
  }
  
  // Create test entry
  const { data, error } = await supabase
    .from("accounting_entries")
    .insert([{
      entry_type: "Income",
      account_id: account.id,
      category_id: category.id,
      amount: 100,
      entry_date: new Date().toISOString().split("T")[0],
      description: "Test entry",
      created_by: user.user.id,
    }])
    .select()
    .single();
    
  if (error) {
    throw new Error(`Test failed: ${error.message}`);
  }
  
  return data;
}
