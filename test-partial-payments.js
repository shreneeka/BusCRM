// Test script for partial payment validation
// This script can be run in the browser console to test the validation logic

function testPartialPaymentValidation() {
  console.log('Testing Partial Payment Validation Logic...');
  
  // Test Case 1: Full payment validation
  const totalAmount = 1000;
  const paidAmount = 600;
  const remainingAmount = totalAmount - paidAmount;
  
  console.log('\n=== Test Case 1: Partial Payment Scenario ===');
  console.log('Total Amount:', totalAmount);
  console.log('Already Paid:', paidAmount);
  console.log('Remaining Amount:', remainingAmount);
  
  // Test different payment amounts
  const testPayments = [200, 400, 500, 600, 700];
  
  testPayments.forEach(paymentAmount => {
    const isValid = paymentAmount <= remainingAmount;
    const newPaidAmount = paidAmount + paymentAmount;
    const newRemaining = totalAmount - newPaidAmount;
    const status = newRemaining <= 0 ? 'done' : 'partial';
    
    console.log(`\nPayment Amount: ${paymentAmount}`);
    console.log(`Valid: ${isValid ? '✅' : '❌'}`);
    if (isValid) {
      console.log(`New Paid Amount: ${newPaidAmount}`);
      console.log(`New Remaining: ${newRemaining}`);
      console.log(`Status: ${status}`);
    } else {
      console.log(`Error: Payment amount (₹${paymentAmount}) exceeds remaining amount (₹${remainingAmount})`);
    }
  });
  
  // Test Case 2: Edge cases
  console.log('\n=== Test Case 2: Edge Cases ===');
  
  // Zero payment
  console.log('\nZero Payment:');
  console.log('Valid: false (should be rejected)');
  
  // Negative payment
  console.log('\nNegative Payment:');
  console.log('Valid: false (should be rejected)');
  
  // Exact remaining amount
  console.log('\nExact Remaining Amount:');
  console.log(`Payment: ${remainingAmount}`);
  console.log('Valid: true (should complete payment)');
  console.log('Status: done');
  
  // Overpayment
  console.log('\nOverpayment:');
  console.log(`Payment: ${remainingAmount + 100}`);
  console.log('Valid: false (should be rejected)');
  
  console.log('\n=== Validation Complete ===');
}

// Test the settlement update logic
function testSettlementUpdateLogic() {
  console.log('\n\nTesting Settlement Update Logic...');
  
  const currentSettlement = {
    operator_payable: 1000,
    paid_amount: 300,
    remaining_amount: 700,
    payment_status: 'partial'
  };
  
  console.log('Current Settlement:', currentSettlement);
  
  // Test partial payment update
  const paymentAmount = 200;
  const newPaidAmount = currentSettlement.paid_amount + paymentAmount;
  const newRemainingAmount = currentSettlement.operator_payable - newPaidAmount;
  const newStatus = newRemainingAmount <= 0 ? 'done' : 'partial';
  const isPaid = newRemainingAmount <= 0;
  
  console.log('\nAfter Payment of', paymentAmount);
  console.log('New Paid Amount:', newPaidAmount);
  console.log('New Remaining Amount:', newRemainingAmount);
  console.log('New Status:', newStatus);
  console.log('Is Paid:', isPaid);
  
  // Test validation
  console.log('\nValidation:');
  console.log('Payment <= Remaining:', paymentAmount <= currentSettlement.remaining_amount);
  console.log('No Overpayment:', newRemainingAmount >= 0);
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
  testPartialPaymentValidation();
  testSettlementUpdateLogic();
} else {
  console.log('This test script should be run in a browser environment');
  console.log('Copy and paste it into the browser console when on the tickets page');
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testPartialPaymentValidation,
    testSettlementUpdateLogic
  };
}
