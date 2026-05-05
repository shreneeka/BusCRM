// Simple test to isolate the update issue
const { createClient } = require('@supabase/supabase-js');

async function testSimpleUpdate() {
  const supabase = createClient(
    'http://localhost:54321', // Replace with actual Supabase URL
    'your-anon-key' // Replace with actual key
  );
  
  try {
    // Test with minimal data to isolate the issue
    const { data, error } = await supabase
      .from("tickets")
      .update({
        passenger_name: "Test Update"
      })
      .eq("id", "some-ticket-id")
      .select()
      .single();
      
    if (error) {
      console.error("Simple update error:", error);
    } else {
      console.log("Simple update success:", data);
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

testSimpleUpdate();
