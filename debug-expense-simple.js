// Simple debug script to check database issues
// Run this with: node -e "
// This is a template for manual SQL queries to run in the database console

const debugQueries = [
  // 1. Check if Commission Settlement category exists
  `SELECT * FROM accounting_categories WHERE name = 'Commission Settlement';`,
  
  // 2. Check all expense categories
  `SELECT * FROM accounting_categories WHERE category_type = 'Expense';`,
  
  // 3. Check recent accounting entries
  `SELECT * FROM accounting_entries ORDER BY created_at DESC LIMIT 10;`,
  
  // 4. Check expense entries specifically
  `SELECT * FROM accounting_entries WHERE entry_type = 'Expense' ORDER BY created_at DESC LIMIT 10;`,
  
  // 5. Check operator settlements with payments
  `SELECT * FROM operator_settlements WHERE payment_status IN ('partial', 'done') ORDER BY created_at DESC LIMIT 5;`,
  
  // 6. Check Cash account
  `SELECT * FROM accounts WHERE name = 'Cash';`,
  
  // 7. Check all accounts
  `SELECT * FROM accounts;`
];

console.log('Run these SQL queries in your Supabase SQL Editor to debug the expense issue:');
debugQueries.forEach((query, index) => {
  console.log(\`\n\${index + 1}. \${query}\`);
});
