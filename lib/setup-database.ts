"use server";

import { createClient } from "@/lib/supabase/server";

// Database setup script for creating required tables
export async function setupDatabase() {
  const supabase = await createClient();
  
  try {
    console.log("Starting database setup...");
    
    // Check if operators table exists
    const { error: operatorsCheckError } = await supabase
      .from("operators")
      .select("id")
      .limit(1);
    
    if (operatorsCheckError?.code === '42P01') {
      console.log("Operators table does not exist. Creating it...");
      
      // Create operators table manually
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS operators (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            operator_name TEXT NOT NULL,
            person_name TEXT,
            mobile_number TEXT,
            commission_percent DECIMAL NOT NULL DEFAULT 10,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
          );
          
          ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Authenticated users can manage operators" ON operators
          FOR ALL TO authenticated
          USING (true)
          WITH CHECK (true);
          
          INSERT INTO operators (operator_name, person_name, mobile_number, commission_percent, is_active) VALUES
          ('Express Travels', 'Raj Kumar', '9876543210', 10, true),
          ('City Bus Service', 'Amit Sharma', '9876543211', 10, true),
          ('Tourist Bus', 'Vikram Singh', '9876543212', 10, true);
        `
      });
      
      if (createError) {
        console.error("Error creating operators table:", createError);
        return { success: false, error: createError.message };
      }
      
      console.log("Operators table created successfully");
    }
    
    return { success: true, message: "Database setup completed" };
    
  } catch (error) {
    console.error("Database setup error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
