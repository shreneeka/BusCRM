const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugSettlement() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('=== CHECKING DATABASE STRUCTURE ===');
    
    // Test 1: Check if columns exist by trying to select them
    console.log('\n1. Testing if paid_amount and remaining_amount columns exist...');
    const { data: testData, error: testError } = await supabase
      .from('operator_settlements')
      .select('id, paid_amount, remaining_amount, operator_payable')
      .limit(1);
    
    if (testError) {
      console.log('❌ ERROR selecting columns:', testError.message);
      console.log('This means the columns may not exist in the database');
    } else {
      console.log('✅ Columns exist successfully');
      console.log('Sample data:', testData);
    }
    
    // Test 2: Try to insert a test record with the new fields
    console.log('\n2. Testing insert with paid_amount and remaining_amount...');
    const testRecord = {
      operator_name: 'Debug Test Operator',
      total_amount: 1000,
      commission_percentage: 10,
      commission_amount: 100,
      operator_payable: 900,
      is_paid: false,
      payment_status: 'partial',
      paid_amount: 400,
      remaining_amount: 500,
      settlement_method: 'cash'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('operator_settlements')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ ERROR inserting record:', insertError.message);
      console.log('This means the columns may not exist or have constraints');
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Clean up test record
      if (insertData && insertData[0]) {
        await supabase
          .from('operator_settlements')
          .delete()
          .eq('id', insertData[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    // Test 3: Check recent settlements to see if they have the fields
    console.log('\n3. Checking recent settlements...');
    const { data: recentData, error: recentError } = await supabase
      .from('operator_settlements')
      .select('id, operator_name, paid_amount, remaining_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log('❌ ERROR fetching recent settlements:', recentError.message);
    } else {
      console.log('✅ Recent settlements:');
      recentData.forEach(settlement => {
        console.log(`  - ${settlement.operator_name}: paid=${settlement.paid_amount}, remaining=${settlement.remaining_amount}`);
      });
    }
    
  } catch (error) {
    console.log('❌ DEBUG ERROR:', error.message);
  }
}

debugSettlement();
