// Test script to verify the schema fix works correctly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSchemaFix() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL||;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('=== TESTING SCHEMA FIX ===');
    
    // Test 1: Check if notes column exists now
    console.log('\n1. Testing notes column existence...');
    const { data: testData, error: testError } = await supabase
      .from('operator_settlements')
      .select('id, notes, paid_amount, remaining_amount')
      .limit(1);
    
    if (testError) {
      console.log('❌ ERROR:', testError.message);
      console.log('This means the notes column might still be missing');
      console.log('Please run the SQL script provided in add_notes_column.sql');
    } else {
      console.log('✅ SUCCESS: All columns exist and are accessible');
      console.log('Sample data structure:', testData);
    }
    
    // Test 2: Try to insert a record with notes
    console.log('\n2. Testing insert with notes column...');
    const testRecord = {
      operator_name: 'Schema Test Operator',
      total_amount: 1000,
      commission_percentage: 10,
      commission_amount: 100,
      operator_payable: 900,
      is_paid: false,
      payment_status: 'partial',
      paid_amount: 400,
      remaining_amount: 500,
      settlement_method: 'cash',
      notes: 'Test payment notes for schema verification'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('operator_settlements')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ INSERT ERROR:', insertError.message);
      console.log('Column might still be missing or have constraints');
    } else {
      console.log('✅ INSERT SUCCESS: Record with notes created');
      console.log('Created record:', insertData[0]);
      
      // Clean up test record
      if (insertData && insertData[0]) {
        await supabase
          .from('operator_settlements')
          .delete()
          .eq('id', insertData[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
    console.log('\n=== SCHEMA TEST COMPLETE ===');
    
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
  }
}

testSchemaFix();
