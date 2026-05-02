"use server";

import { createClient } from "@/lib/supabase/server";

export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");
    
    const supabase = await createClient();
    
    // Test leads table access (which we know works)
    console.log("Testing leads table access...");
    
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("count", { count: 'exact', head: true });
    
    if (leadsError) {
      console.error("Leads table access failed:", leadsError);
      return { success: false, error: leadsError, table: "leads" };
    } else {
      console.log("Leads table access successful. Count:", leadsData);
    }
    
    // Test operators table access
    console.log("Testing operators table access...");
    
    const { data: operatorsData, error: operatorsError } = await supabase
      .from("operators")
      .select("count", { count: 'exact', head: true });
    
    if (operatorsError) {
      console.error("Operators table access failed:", {
        message: operatorsError.message,
        details: operatorsError.details,
        hint: operatorsError.hint,
        code: operatorsError.code
      });
      return { success: false, error: operatorsError, table: "operators" };
    } else {
      console.log("Operators table access successful. Count:", operatorsData);
      return { success: true, count: operatorsData };
    }
    
  } catch (err) {
    console.error("Unexpected error in testSupabaseConnection:", err);
    return { success: false, error: err };
  }
}
