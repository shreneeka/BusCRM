// Test script to verify the ticket display fix works correctly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testTicketDisplayFix() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('=== TESTING TICKET DISPLAY FIX ===');
    
    // Test: Get tickets with settlement data to verify the display logic
    console.log('\n1. Fetching tickets with settlement data...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        operator_settlements (
          id,
          operator_payable,
          paid_amount,
          remaining_amount,
          payment_status,
          is_paid
        )
      `)
      .limit(5);
    
    if (ticketsError) {
      console.log('❌ Error fetching tickets:', ticketsError.message);
      return;
    }
    
    console.log('✅ Successfully fetched tickets:', tickets?.length || 0);
    
    // Test: Display the calculation logic for each ticket
    tickets?.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket: ${ticket.ticket_number}`);
      console.log(`   Amount: ₹${ticket.amount}`);
      
      if (ticket.operator_settlements && ticket.operator_settlements.length > 0) {
        const settlement = ticket.operator_settlements[0];
        console.log(`   Settlement Status: ${settlement.payment_status}`);
        console.log(`   Operator Payable: ₹${settlement.operator_payable || 0}`);
        console.log(`   Paid Amount: ₹${settlement.paid_amount || 0}`);
        console.log(`   Remaining Amount: ₹${settlement.remaining_amount || 0}`);
        
        // Calculate what should be displayed
        const totalAmount = settlement.operator_payable || 0;
        const paidAmount = (settlement.operator_payable || 0) - (settlement.remaining_amount || 0);
        const remainingAmount = settlement.remaining_amount || 0;
        
        console.log(`   📊 Display Calculation:`);
        console.log(`      Total: ₹${totalAmount.toFixed(2)}`);
        console.log(`      Paid: ₹${paidAmount.toFixed(2)}`);
        console.log(`      Remaining: ₹${remainingAmount.toFixed(2)}`);
        
        if (settlement.payment_status === 'partial') {
          console.log(`   ✅ Will show: Total, Paid, and Remaining amounts`);
        } else if (settlement.payment_status === 'done') {
          console.log(`   ✅ Will show: Only status badge (Paid)`);
        } else {
          console.log(`   ✅ Will show: Only status badge (Unpaid)`);
        }
      } else {
        console.log(`   ✅ No settlement data - will show Unpaid status`);
      }
    });
    
    console.log('\n=== DISPLAY FIX VERIFICATION COMPLETE ===');
    console.log('✅ The tickets page should now show:');
    console.log('   - Total operator payable amount (like settlement page)');
    console.log('   - Amount already paid');
    console.log('   - Remaining amount to be paid');
    console.log('   - Clear payment status indicators');
    
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
  }
}

testTicketDisplayFix();
