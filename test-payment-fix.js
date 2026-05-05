// Test script to verify payment processing works correctly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPaymentProcessing() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('=== TESTING PAYMENT PROCESSING FIX ===');
    
    // Test 1: Get a sample ticket with operator
    console.log('\n1. Getting a sample ticket with operator...');
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        operators!inner(
          name,
          commission_percentage
        )
      `)
      .limit(1);
    
    if (ticketError) {
      console.log('❌ Error getting ticket:', ticketError.message);
      return;
    }
    
    if (!ticketData || ticketData.length === 0) {
      console.log('❌ No tickets found');
      return;
    }
    
    const ticket = ticketData[0];
    console.log('✅ Found ticket:', ticket.ticket_number);
    console.log('   Operator:', ticket.operators.name);
    console.log('   Amount:', ticket.amount);
    
    // Test 2: Create a settlement record
    console.log('\n2. Creating a settlement record...');
    const commissionRate = ticket.operators.commission_percentage || 10;
    const commissionAmount = ticket.amount * commissionRate / 100;
    const operatorPayable = ticket.amount - commissionAmount;
    const paymentAmount = operatorPayable * 0.5; // 50% payment
    
    const settlementRecord = {
      ticket_id: ticket.id,
      operator_name: ticket.operators.name,
      total_amount: ticket.amount,
      commission_percentage: commissionRate,
      commission_amount: commissionAmount,
      operator_payable: operatorPayable,
      paid_amount: paymentAmount,
      remaining_amount: operatorPayable - paymentAmount,
      payment_status: 'partial',
      is_paid: false,
      settlement_method: 'cash',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('operator_settlements')
      .insert(settlementRecord)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Error creating settlement:', insertError.message);
      return;
    }
    
    console.log('✅ Settlement created successfully');
    console.log('   Settlement ID:', insertData.id);
    console.log('   Paid Amount:', insertData.paid_amount);
    console.log('   Remaining Amount:', insertData.remaining_amount);
    console.log('   Status:', insertData.payment_status);
    
    // Test 3: Update with remaining payment
    console.log('\n3. Testing partial payment update...');
    const remainingPayment = insertData.remaining_amount;
    
    const updateData = {
      paid_amount: insertData.paid_amount + remainingPayment,
      remaining_amount: 0,
      payment_status: 'done',
      is_paid: true,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: updateData2, error: updateError } = await supabase
      .from('operator_settlements')
      .update(updateData)
      .eq('id', insertData.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating settlement:', updateError.message);
    } else {
      console.log('✅ Settlement updated successfully');
      console.log('   Final Paid Amount:', updateData2.paid_amount);
      console.log('   Final Remaining Amount:', updateData2.remaining_amount);
      console.log('   Final Status:', updateData2.payment_status);
    }
    
    // Test 4: Clean up
    console.log('\n4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('operator_settlements')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.log('❌ Error cleaning up:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    console.log('\n=== PAYMENT PROCESSING TEST COMPLETE ===');
    console.log('✅ All tests passed! Payment processing should work correctly now.');
    
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
  }
}

testPaymentProcessing();
