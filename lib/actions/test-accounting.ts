"use server";

import { createClient } from "@/lib/supabase/server";

// Test function to verify accounting setup
export async function testAccountingSetup() {
  const supabase = await createClient();
  const results = {
    tablesExist: false,
    categoriesExist: false,
    entriesExist: false,
    canCreateEntry: false,
    errors: [] as string[]
  };

  try {
    // Test 1: Check if accounting_categories table exists
    const { data: categories, error: categoriesError } = await supabase
      .from("accounting_categories")
      .select("count")
      .single();
      
    if (categoriesError) {
      results.errors.push(`Categories table error: ${categoriesError.message}`);
    } else {
      results.categoriesExist = true;
      console.log("✓ accounting_categories table exists");
    }

    // Test 2: Check if accounting_entries table exists
    const { data: entries, error: entriesError } = await supabase
      .from("accounting_entries")
      .select("count")
      .single();
      
    if (entriesError) {
      results.errors.push(`Entries table error: ${entriesError.message}`);
    } else {
      results.entriesExist = true;
      console.log("✓ accounting_entries table exists");
    }

    // Test 3: Check if Ticket Booking category exists
    const { data: ticketCategory, error: ticketCategoryError } = await supabase
      .from("accounting_categories")
      .select("*")
      .eq("name", "Ticket Booking")
      .eq("category_type", "Income")
      .single();
      
    if (ticketCategoryError) {
      results.errors.push(`Ticket Booking category error: ${ticketCategoryError.message}`);
    } else {
      console.log("✓ Ticket Booking category exists:", ticketCategory);
    }

    // Test 4: Try to create a test accounting entry
    if (results.categoriesExist && results.entriesExist && ticketCategory) {
      // Get a test account
      const { data: account } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", "Cash")
        .single();
        
      if (account) {
        const { data: user } = await supabase.auth.getUser();
        
        if (user.user) {
          const { error: insertError } = await supabase
            .from("accounting_entries")
            .insert([{
              entry_type: "Income",
              account_id: account.id,
              category_id: ticketCategory.id,
              amount: 1,
              entry_date: new Date().toISOString().split("T")[0],
              description: "Test entry",
              created_by: user.user.id,
            }]);
            
          if (insertError) {
            results.errors.push(`Insert test entry error: ${insertError.message}`);
          } else {
            results.canCreateEntry = true;
            console.log("✓ Can create accounting entries");
          }
        }
      }
    }

    results.tablesExist = results.categoriesExist && results.entriesExist;
    
  } catch (error) {
    results.errors.push(`General error: ${error}`);
  }

  return results;
}

// Function to run the migration
export async function runAccountingMigration() {
  const supabase = await createClient();
  
  try {
    // This would run the SQL migration
    // For now, we'll just test the setup
    const testResult = await testAccountingSetup();
    return testResult;
  } catch (error) {
    return {
      tablesExist: false,
      categoriesExist: false,
      entriesExist: false,
      canCreateEntry: false,
      errors: [`Migration error: ${error}`]
    };
  }
}
