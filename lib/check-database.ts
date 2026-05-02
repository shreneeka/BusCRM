"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkDatabaseSchema() {
  const supabase = await createClient();
  
  try {
    // Check operators table structure
    const { data: operatorsInfo, error: operatorsError } = await supabase
      .rpc('get_table_info', { table_name: 'operators' });
    
    if (operatorsError) {
      console.error("Error checking operators table:", operatorsError);
      
      // Try a simple select to see what columns exist
      const { data: sampleData, error: sampleError } = await supabase
        .from("operators")
        .select("*")
        .limit(1);
      
      if (sampleError) {
        console.error("Error sampling operators table:", sampleError);
        return { success: false, error: sampleError.message };
      }
      
      console.log("Sample operators data:", sampleData);
      return { success: true, data: { sample: sampleData } };
    }
    
    console.log("Operators table info:", operatorsInfo);
    return { success: true, data: operatorsInfo };
    
  } catch (error) {
    console.error("Database schema check error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
