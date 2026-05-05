import { createClient } from './lib/supabase/server.js';

async function debugExpenseIssue() {
  const supabase = await createClient();
  
  console.log('=== DEBUGGING EXPENSE ISSUE ===\n');
  
  // 1. Check if Commission Settlement category exists
  console.log('1. Checking for Commission Settlement category...');
  const { data: categories, error: catError } = await supabase
    .from('accounting_categories')
    .select('*')
    .eq('name', 'Commission Settlement');
    
  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log('Found categories:', categories);
    if (categories.length === 0) {
      console.log('❌ Commission Settlement category NOT FOUND');
      
      // Check all expense categories
      const { data: allExpenseCategories } = await supabase
        .from('accounting_categories')
        .select('*')
        .eq('category_type', 'Expense');
      console.log('All expense categories:', allExpenseCategories);
    } else {
      console.log('✅ Commission Settlement category found:', categories[0]);
    }
  }
  
  // 2. Check for recent accounting entries
  console.log('\n2. Checking recent accounting entries...');
  const { data: entries, error: entryError } = await supabase
    .from('accounting_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (entryError) {
    console.error('Error fetching entries:', entryError);
  } else {
    console.log('Recent entries:', entries);
    const expenseEntries = entries.filter(e => e.entry_type === 'Expense');
    console.log(`Found ${expenseEntries.length} expense entries out of ${entries.length} total`);
  }
  
  // 3. Check operator settlements with payments
  console.log('\n3. Checking operator settlements...');
  const { data: settlements, error: settlementError } = await supabase
    .from('operator_settlements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (settlementError) {
    console.error('Error fetching settlements:', settlementError);
  } else {
    console.log('Recent settlements:', settlements);
    settlements.forEach(s => {
      console.log(`Settlement: ${s.operator_name} - Status: ${s.payment_status} - Paid: ₹${s.paid_amount} - Remaining: ₹${s.remaining_amount}`);
    });
  }
  
  // 4. Check Cash account
  console.log('\n4. Checking Cash account...');
  const { data: cashAccount, error: cashError } = await supabase
    .from('accounts')
    .select('*')
    .eq('name', 'Cash');
    
  if (cashError) {
    console.error('Error fetching cash account:', cashError);
  } else {
    console.log('Cash account:', cashAccount);
    if (cashAccount.length === 0) {
      console.log('❌ Cash account NOT FOUND');
      
      // Check all accounts
      const { data: allAccounts } = await supabase
        .from('accounts')
        .select('*');
      console.log('All accounts:', allAccounts);
    } else {
      console.log('✅ Cash account found:', cashAccount[0]);
    }
  }
}

debugExpenseIssue().catch(console.error);
