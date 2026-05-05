import { createClient } from "@/lib/supabase/server";
import { AccountingCategory, AccountSummary, AccountingEntry } from "@/lib/actions/accounting.actions";

// GET ACCOUNTS WITH BALANCES
export async function getAccountsWithBalances(): Promise<AccountSummary[]> {
  const supabase = await createClient();

  // First get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (accountsError) throw new Error(accountsError.message);

  // Then get income/expense totals for each account
  const { data: entries, error: entriesError } = await supabase
    .from("accounting_entries")
    .select("account_id, entry_type, amount");

  if (entriesError) throw new Error(entriesError.message);

  // Calculate balances for each account
  const accountsWithBalances = accounts.map((account) => {
    const accountEntries = entries.filter(
      (e) => e.account_id === account.id
    );
    
    const totalIn = accountEntries
      .filter((e) => e.entry_type === "Income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const totalOut = accountEntries
      .filter((e) => e.entry_type === "Expense")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const currentBalance =
      Number(account.opening_balance || 0) + totalIn - totalOut;

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      opening_balance: account.opening_balance || 0,
      total_in: totalIn,
      total_out: totalOut,
      current_balance: currentBalance,
      is_active: account.is_active ?? true,
      created_at: account.created_at,
    };
  });

  return accountsWithBalances;
}

// GET ACCOUNTING CATEGORIES
export async function getAccountingCategories(): Promise<AccountingCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounting_categories")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    category_type: category.category_type,
    description: category.description,
    is_active: category.is_active ?? true,
    created_at: category.created_at,
  }));
}

// GET ACCOUNTING ENTRIES
export async function getAccountingEntries(): Promise<AccountingEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounting_entries")
.select(`
      *,
      account:accounts(name),
      category:accounting_categories(name),
      ticket:tickets(id, ticket_number, passenger_name)
    `)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Error fetching accounting entries:", error);
    throw new Error(error.message);
  }

  console.log(`Found ${data?.length || 0} accounting entries`);
  console.log("Sample entries:", data?.slice(0, 3));

  return (data || []).map((entry: any) => ({
    id: entry.id,
    account_id: entry.account_id,
    category_id: entry.category_id,
    entry_type: entry.entry_type,
    amount: entry.amount,
    entry_date: entry.entry_date,
    description: entry.description,
    created_at: entry.created_at,
    account: entry.account ? { name: entry.account.name } : undefined,
category: entry.category ? { name: entry.category.name } : undefined,
    ticket: entry.ticket ? { 
      id: entry.ticket.id,
      ticket_number: entry.ticket.ticket_number, 
      passenger_name: entry.ticket.passenger_name 
    } : undefined,
  }));
}
