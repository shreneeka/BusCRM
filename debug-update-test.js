// Debug test to isolate the exact column causing the 42703 error
export async function testMinimalUpdate(ticketId) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('Testing minimal update for ticket:', ticketId);
  
  // Test 1: Update only passenger_name
  try {
    console.log('Test 1: Updating passenger_name only...');
    const { data, error } = await supabase
      .from("tickets")
      .update({ passenger_name: "Test Name" })
      .eq("id", ticketId)
      .select()
      .single();
    
    if (error) {
      console.error('Test 1 failed:', error);
      return { success: false, test: 'passenger_name', error };
    }
    console.log('Test 1 passed');
  } catch (err) {
    console.error('Test 1 exception:', err);
    return { success: false, test: 'passenger_name', error: err };
  }
  
  // Test 2: Update only mobile_number
  try {
    console.log('Test 2: Updating mobile_number only...');
    const { data, error } = await supabase
      .from("tickets")
      .update({ mobile_number: "1234567890" })
      .eq("id", ticketId)
      .select()
      .single();
    
    if (error) {
      console.error('Test 2 failed:', error);
      return { success: false, test: 'mobile_number', error };
    }
    console.log('Test 2 passed');
  } catch (err) {
    console.error('Test 2 exception:', err);
    return { success: false, test: 'mobile_number', error: err };
  }
  
  // Test 3: Update pickup_location (the mapped field)
  try {
    console.log('Test 3: Updating pickup_location only...');
    const { data, error } = await supabase
      .from("tickets")
      .update({ pickup_location: "Test Location" })
      .eq("id", ticketId)
      .select()
      .single();
    
    if (error) {
      console.error('Test 3 failed:', error);
      return { success: false, test: 'pickup_location', error };
    }
    console.log('Test 3 passed');
  } catch (err) {
    console.error('Test 3 exception:', err);
    return { success: false, test: 'pickup_location', error: err };
  }
  
  return { success: true, message: 'All minimal tests passed' };
}
