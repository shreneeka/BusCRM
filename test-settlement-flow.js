// Test script to verify settlement flow
// This demonstrates the settlement calculation logic

console.log("🧮 Testing Settlement Flow Logic");
console.log("================================");

// Sample data mimicking the database structure
const operators = [
  {
    id: "op1",
    operator_name: "Express Travels",
    commission_percent: 10
  },
  {
    id: "op2", 
    operator_name: "City Bus Service",
    commission_percent: 15
  }
];

const tickets = [
  // Case 1: Customer pays YOU, operator commission 10%
  {
    id: "t1",
    amount: 1000,
    operator_id: "op1",
    payment_received_by: "self", // You received money
    commission_percent: 10,
    settlement_status: "pending"
  },
  // Case 2: Customer pays OPERATOR, operator commission 10%
  {
    id: "t2", 
    amount: 2000,
    operator_id: "op1",
    payment_received_by: "operator", // Operator received money
    commission_percent: 10,
    settlement_status: "pending"
  },
  // Case 3: Customer pays YOU, operator commission 15%
  {
    id: "t3",
    amount: 1500,
    operator_id: "op2", 
    payment_received_by: "self",
    commission_percent: 15,
    settlement_status: "pending"
  }
];

// Calculate settlement for each operator
function calculateSettlement(operatorId, operatorTickets) {
  let totalAmount = 0;
  let totalCommission = 0;
  let youOwedAmount = 0; // What you owe operator
  let operatorOwedAmount = 0; // What operator owes you
  
  operatorTickets.forEach(ticket => {
    totalAmount += ticket.amount;
    const commission = ticket.amount * ticket.commission_percent / 100;
    totalCommission += commission;
    
    if (ticket.payment_received_by === "self") {
      // You received money, so you owe operator the commission
      youOwedAmount += commission;
    } else {
      // Operator received money, so operator owes you the commission  
      operatorOwedAmount += commission;
    }
  });
  
  const netBalance = operatorOwedAmount - youOwedAmount;
  const settlementType = netBalance >= 0 ? "operator_pays" : "you_pay";
  
  return {
    operatorId,
    totalTickets: operatorTickets.length,
    totalAmount,
    totalCommission,
    youOwedAmount,
    operatorOwedAmount,
    netBalance: Math.abs(netBalance),
    settlementType
  };
}

// Test calculations
console.log("\n📊 Settlement Calculations:");
console.log("------------------------");

operators.forEach(operator => {
  const operatorTickets = tickets.filter(t => t.operator_id === operator.id);
  const settlement = calculateSettlement(operator.id, operatorTickets);
  
  console.log(`\n🚌 ${operator.operator_name} (${operator.commission_percent}% commission):`);
  console.log(`   Total Tickets: ${settlement.totalTickets}`);
  console.log(`   Total Amount: ₹${settlement.totalAmount}`);
  console.log(`   Total Commission: ₹${settlement.totalCommission}`);
  console.log(`   You Owe Operator: ₹${settlement.youOwedAmount}`);
  console.log(`   Operator Owes You: ₹${settlement.operatorOwedAmount}`);
  console.log(`   Net Balance: ₹${settlement.netBalance}`);
  
  if (settlement.settlementType === "operator_pays") {
    console.log(`   ✅ Operator pays YOU ₹${settlement.netBalance}`);
  } else {
    console.log(`   💸 You pay operator ₹${settlement.netBalance}`);
  }
});

console.log("\n🎯 Expected Database Records:");
console.log("---------------------------");

// Show what settlement records should look like
operators.forEach(operator => {
  const operatorTickets = tickets.filter(t => t.operator_id === operator.id);
  if (operatorTickets.length > 0) {
    const settlement = calculateSettlement(operator.id, operatorTickets);
    
    console.log(`\nSettlement Record for ${operator.operator_name}:`);
    console.log(JSON.stringify({
      operator_id: operator.id,
      total_tickets: settlement.totalTickets,
      total_amount: settlement.totalAmount,
      total_commission: settlement.totalCommission,
      net_balance: settlement.netBalance * (settlement.settlementType === "you_pay" ? -1 : 1),
      settlement_type: settlement.settlementType,
      status: "pending",
      created_at: new Date().toISOString()
    }, null, 2));
  }
});

console.log("\n✅ Settlement Flow Test Complete!");
console.log("📝 Next Steps:");
console.log("   1. Run database migration: supabase db push");
console.log("   2. Visit /dashboard/settlements to see the UI");
console.log("   3. Create sample tickets with payment_received_by field");
console.log("   4. Test settlement creation and completion");
