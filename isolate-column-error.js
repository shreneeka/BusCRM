// Test each column individually to find the exact one causing 42703 error
export async function isolateColumnError(ticketId) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const columns = [
    'passenger_name',
    'mobile_number', 
    'pickup_city',
    'drop_city',
    'pickup_location',  // This is the mapped column from pickup_area
    'drop_location',
    'journey_date',
    'total_seats',
    'pickup_time',
    'bus_number',
    'travel_type',
    'amount',
    'operator_id',
    'account_type',
    'seat_numbers'
  ];
  
  console.log('Testing each column individually...');
  
  for (const column of columns) {
    try {
      console.log(`Testing column: ${column}`);
      
      let updateValue;
      switch(column) {
        case 'passenger_name':
          updateValue = 'Test Name';
          break;
        case 'mobile_number':
          updateValue = '1234567890';
          break;
        case 'pickup_city':
        case 'drop_city':
          updateValue = 'Test City';
          break;
        case 'pickup_location':
        case 'drop_location':
          updateValue = 'Test Location';
          break;
        case 'journey_date':
          updateValue = '2024-01-01';
          break;
        case 'total_seats':
          updateValue = 1;
          break;
        case 'pickup_time':
          updateValue = '12:00:00';
          break;
        case 'bus_number':
          updateValue = 'TEST123';
          break;
        case 'travel_type':
          updateValue = 'AC';
          break;
        case 'amount':
          updateValue = 100;
          break;
        case 'operator_id':
          updateValue = null; // Skip this for now
          continue;
        case 'account_type':
          updateValue = 'Cash';
          break;
        case 'seat_numbers':
          updateValue = ['A1'];
          break;
        default:
          updateValue = 'Test';
      }
      
      const { error } = await supabase
        .from("tickets")
        .update({ [column]: updateValue })
        .eq("id", ticketId);
      
      if (error) {
        console.error(`❌ Column ${column} FAILED:`, error);
        console.error(`Error Code: ${error.code}`);
        console.error(`Error Message: ${error.message}`);
        return { success: false, column, error };
      } else {
        console.log(`✅ Column ${column} OK`);
      }
    } catch (err) {
      console.error(`❌ Column ${column} EXCEPTION:`, err);
      return { success: false, column, error: err };
    }
  }
  
  return { success: true, message: 'All columns tested successfully' };
}
