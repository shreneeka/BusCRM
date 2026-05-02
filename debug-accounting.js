// Debug script to check accounting entries
import { createClient } from './lib/supabase/server.js';

async function debugAccounting() {
  const supabase = await createClient();
  
  console.log('=== Checking Accounting Entries ===');
  
  // Check if accounting_entries table exists and has data
  const { data: entries, error: entriesError } = await supabase
    .from('accounting_entries')
    .select('*')
    .limit(5);
    
  if (entriesError) {
    console.error('Error fetching accounting entries:', entriesError);
  } else {
    console.log('Accounting entries found:', entries?.length || 0);
    console.log('Sample entries:', entries);
  }
  
  // Check accounting_categories
  const { data: categories, error: categoriesError } = await supabase
    .from('accounting_categories')
    .select('*')
    .eq('name', 'Ticket Booking');
    
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
  } else {
    console.log('Ticket Booking categories:', categories);
  }
  
  // Check recent tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .limit(3);
    
  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
  } else {
    console.log('Recent tickets:', tickets);
  }
}

debugAccounting().catch(console.error);
