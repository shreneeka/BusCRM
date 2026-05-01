"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface AccountingCategory {
  id: string;
  name: string;
  category_type: "Income" | "Expense";
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountingEntry {
  id: string;
  entry_type: "Income" | "Expense";
  account_id: string;
  category_id: string;
  amount: number;
  entry_date: string;
  description: string | null;
  reference_number: string | null;
  ticket_id: string | null;
  created_at: string;
  // Joined fields
  account?: { name: string };
  category?: { name: string };
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
  balance: number;
  is_active: boolean;
  total_in: number;
  total_out: number;
  current_balance: number;
}

// --- 1. GET ALL CATEGORIES ---
export async function getAccountingCategories(): Promise<AccountingCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_categories")
    .select("*")
    .order("name");

  if (error) return [];
  return data || [];
}

// --- 2. CREATE CATEGORY ---
export async function createAccountingCategory(formData: FormData) {
  const name = formData.get("name");
  const categoryType = formData.get("categoryType");
  const description = formData.get("description");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Name is required");
  }
  if (categoryType !== "Income" && categoryType !== "Expense") {
    throw new Error("Invalid category type");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounting_categories")
    .insert([{ name: name.trim(), category_type: categoryType, description: typeof description === "string" ? description.trim() : null }]);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return;
}

// --- 3. UPDATE CATEGORY ---
export async function updateAccountingCategory(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const categoryType = formData.get("categoryType");
  const isActive = formData.get("isActive");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Category id is required");
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Name is required");
  }
  if (categoryType !== "Income" && categoryType !== "Expense") {
    throw new Error("Invalid category type");
  }

  const activeValue = isActive === "true" || isActive === "on";
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounting_categories")
    .update({ name: name.trim(), category_type: categoryType, is_active: activeValue })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return;
}

// --- 4. DELETE CATEGORY ---
export async function deleteAccountingCategory(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Category id is required");
  }

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("accounting_entries")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (entries && entries.length > 0) {
    throw new Error("Cannot delete category with existing entries");
  }

  const { error } = await supabase
    .from("accounting_categories")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return;
}

// --- 5. GET ALL ENTRIES ---
export async function getAccountingEntries(): Promise<AccountingEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_entries")
    .select("*, account:accounts(name), category:accounting_categories(name)")
    .order("entry_date", { ascending: false });

  if (error) return [];
  return data || [];
}

// --- 6. CREATE ENTRY (Income or Expense) ---
export async function createAccountingEntry(formData: FormData) {
  const entryType = formData.get("entryType");
  const accountId = formData.get("accountId");
  const categoryId = formData.get("categoryId");
  const amount = formData.get("amount");
  const entryDate = formData.get("entryDate");
  const description = formData.get("description");
  const referenceNumber = formData.get("referenceNumber");
  const ticketId = formData.get("ticketId");

  if (entryType !== "Income" && entryType !== "Expense") {
    throw new Error("Invalid entry type");
  }
  if (typeof accountId !== "string" || !accountId.trim()) {
    throw new Error("Account is required");
  }
  if (typeof categoryId !== "string" || !categoryId.trim()) {
    throw new Error("Category is required");
  }
  if (typeof entryDate !== "string" || !entryDate.trim()) {
    throw new Error("Date is required");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in");

  const { data: account } = await supabase
    .from("accounts")
    .select("id, is_active, balance")
    .eq("id", accountId)
    .single();

  if (!account) throw new Error("Account not found");
  if (!account.is_active) throw new Error("Cannot add entry to inactive account");

  const { data: category } = await supabase
    .from("accounting_categories")
    .select("id, is_active, category_type")
    .eq("id", categoryId)
    .single();

  if (!category) throw new Error("Category not found");
  if (!category.is_active) throw new Error("Cannot use inactive category");
  if (category.category_type !== entryType) {
    throw new Error(`This category is for ${category.category_type} only`);
  }

  const amountNumber = typeof amount === "string" ? parseFloat(amount) : NaN;
  if (Number.isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid amount");
  }

  const { data: newEntry, error: entryError } = await supabase
    .from("accounting_entries")
    .insert([
      {
        entry_type: entryType,
        account_id: accountId,
        category_id: categoryId,
        amount: amountNumber,
        entry_date: entryDate,
        description: typeof description === "string" ? description.trim() : null,
        reference_number: typeof referenceNumber === "string" ? referenceNumber.trim() : null,
        ticket_id: typeof ticketId === "string" && ticketId.trim() ? ticketId : null,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (entryError) throw new Error(entryError.message);

  const balanceChange = entryType === "Income" ? amountNumber : -amountNumber;
  await supabase
    .from("accounts")
    .update({ balance: account.balance + balanceChange })
    .eq("id", accountId);

  revalidatePath("/accounting");
  return;
}

// --- 7. UPDATE ENTRY ---
export async function updateAccountingEntry(formData: FormData) {
  const id = formData.get("id");
  const accountId = formData.get("accountId");
  const categoryId = formData.get("categoryId");
  const amount = formData.get("amount");
  const entryDate = formData.get("entryDate");
  const description = formData.get("description");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Entry id is required");
  }
  if (typeof accountId !== "string" || !accountId.trim()) {
    throw new Error("Account is required");
  }
  if (typeof categoryId !== "string" || !categoryId.trim()) {
    throw new Error("Category is required");
  }
  if (typeof entryDate !== "string" || !entryDate.trim()) {
    throw new Error("Date is required");
  }

  const supabase = await createClient();

  const { data: existingEntry } = await supabase
    .from("accounting_entries")
    .select("*, account:accounts(balance)")
    .eq("id", id)
    .single();

  if (!existingEntry) throw new Error("Entry not found");

  const reverseChange =
    existingEntry.entry_type === "Income"
      ? -existingEntry.amount
      : existingEntry.amount;

  await supabase
    .from("accounts")
    .update({ balance: existingEntry.account.balance + reverseChange })
    .eq("id", existingEntry.account_id);

  const amountNumber = typeof amount === "string" ? parseFloat(amount) : NaN;
  if (Number.isNaN(amountNumber) || amountNumber <= 0) {
    throw new Error("Invalid amount");
  }

  const { data: category, error: categoryError } = await supabase
    .from("accounting_categories")
    .select("id, is_active, category_type")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    throw new Error("Category not found");
  }
  if (!category.is_active) {
    throw new Error("Cannot use inactive category");
  }

  const entryType = existingEntry.entry_type;
  if (category.category_type !== entryType) {
    throw new Error(`This category is for ${category.category_type} only`);
  }

  const balanceChange = entryType === "Income" ? amountNumber : -amountNumber;

  const { data: newAccount, error: newAccountError } = await supabase
    .from("accounts")
    .select("id, balance, is_active")
    .eq("id", accountId)
    .single();

  if (newAccountError || !newAccount) {
    throw new Error("Account not found");
  }
  if (!newAccount.is_active) {
    throw new Error("Cannot move entry to inactive account");
  }

  await supabase
    .from("accounts")
    .update({ balance: newAccount.balance + balanceChange })
    .eq("id", accountId);

  const { error } = await supabase
    .from("accounting_entries")
    .update({
      account_id: accountId,
      category_id: categoryId,
      amount: amountNumber,
      entry_date: entryDate,
      description: typeof description === "string" ? description.trim() : null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/accounting");
  return;
}

// --- 8. DELETE ENTRY ---
export async function deleteAccountingEntry(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Entry id is required");
  }

  const supabase = await createClient();

  const { data: existingEntry } = await supabase
    .from("accounting_entries")
    .select("*, account:accounts(balance)")
    .eq("id", id)
    .single();

  if (!existingEntry) throw new Error("Entry not found");

  const reverseChange =
    existingEntry.entry_type === "Income"
      ? -existingEntry.amount
      : existingEntry.amount;

  await supabase
    .from("accounts")
    .update({ balance: existingEntry.account.balance + reverseChange })
    .eq("id", existingEntry.account_id);

  const { error } = await supabase
    .from("accounting_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/accounting");
  return;
}

// --- 9. GET ACCOUNTS WITH BALANCES ---
export async function getAccountsWithBalances(): Promise<AccountSummary[]> {
  const supabase = await createClient();

  // Get all accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, opening_balance, balance, is_active")
    .order("name");

  if (!accounts) return [];

  // Get income/expense totals per account
  const { data: entries } = await supabase
    .from("accounting_entries")
    .select("account_id, entry_type, amount");

  if (!entries) {
    return accounts.map((acc) => ({
      ...acc,
      opening_balance: acc.opening_balance || 0,
      total_in: 0,
      total_out: 0,
      current_balance: acc.balance || 0,
    }));
  }

  // Calculate totals
  return accounts.map((acc) => {
    const accountEntries = entries.filter((e) => e.account_id === acc.id);
    const totalIn = accountEntries
      .filter((e) => e.entry_type === "Income")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalOut = accountEntries
      .filter((e) => e.entry_type === "Expense")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      ...acc,
      opening_balance: acc.opening_balance || 0,
      total_in: totalIn,
      total_out: totalOut,
      current_balance: (acc.opening_balance || 0) + totalIn - totalOut,
    };
  });
}

// --- 10. CREATE ACCOUNT ---
export async function createAccountingAccount(formData: FormData) {
  const name = formData.get("name");
  const type = formData.get("type");
  const openingBalance = formData.get("openingBalance");

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Name is required");
  }
  if (type !== "Cash" && type !== "UPI") {
    throw new Error("Invalid account type");
  }
  const openingBalanceNumber =
    typeof openingBalance === "string" ? parseFloat(openingBalance) : NaN;
  const amount = Number.isNaN(openingBalanceNumber) ? 0 : openingBalanceNumber;

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .insert([{ name: name.trim(), type, opening_balance: amount, balance: amount, is_active: true }]);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return;
}

// --- 11. UPDATE ACCOUNT ---
export async function updateAccountingAccount(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const isActive = formData.get("isActive");

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Account id is required");
  }
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Name is required");
  }

  const activeValue = isActive === "true" || isActive === "on";
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name: name.trim(), is_active: activeValue })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/accounting");
  return;
}

// --- 12. GET ENTRY STATISTICS ---
export async function getAccountingStats(filteredEntries: AccountingEntry[]) {
  const totalIncome = filteredEntries
    .filter((e) => e.entry_type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = filteredEntries
    .filter((e) => e.entry_type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    totalTransactions: filteredEntries.length,
  };
}

// --- 13. GET ACCOUNT ENTRIES (for account detail view) ---
export async function getAccountEntries(accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounting_entries")
    .select("*, account:accounts(name), category:accounting_categories(name)")
    .eq("account_id", accountId)
    .order("entry_date", { ascending: false });

  if (error) return [];
  return data || [];
}
