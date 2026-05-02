"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============= TYPE DEFINITIONS =============

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
  total_in: number;
  total_out: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface AccountingCategory {
  id: string;
  name: string;
  category_type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountingEntry {
  id: string;
  account_id: string;
  category_id: string;
  entry_type: string;
  amount: number;
  entry_date: string;
  description: string | null;
  created_at: string;
  account?: { name: string };
  category?: { name: string };
  ticket?: { id: string; ticket_number: string; passenger_name: string };
}

// ============= ACCOUNT FUNCTIONS =============

// CREATE ACCOUNT
export async function createAccountingAccount(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const openingBalance = formData.get('openingBalance') as string;

  if (!name || !type) {
    throw new Error("Missing required fields");
  }

  const openingBalanceNum = openingBalance ? parseFloat(openingBalance) : 0;
  
  const { error } = await supabase.from("accounts").insert([{
    name,
    type,
    opening_balance: openingBalanceNum,
  }]);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// UPDATE ACCOUNT
export async function updateAccountingAccount(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const isActive = formData.get('isActive') as string;

  if (!id || !name) {
    throw new Error("Missing required fields");
  }

  const updateData: { name: string; is_active: boolean } = {
    name,
    is_active: isActive === "true",
  };

  const { error } = await supabase
    .from("accounts")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// ============= CATEGORY FUNCTIONS =============

// CREATE CATEGORY
export async function createAccountingCategory(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const categoryType = formData.get('categoryType') as string;
  const description = formData.get('description') as string;

  if (!name || !categoryType) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase.from("accounting_categories").insert([{
    name,
    category_type: categoryType,
    description: description || null,
    is_active: true,
  }]);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// UPDATE CATEGORY
export async function updateAccountingCategory(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const categoryType = formData.get('categoryType') as string;
  const isActive = formData.get('isActive') as string;

  if (!id || !name || !categoryType) {
    throw new Error("Missing required fields");
  }

  const updateData: { name: string; category_type: string; is_active: boolean } = {
    name,
    category_type: categoryType,
    is_active: isActive === "true",
  };

  const { error } = await supabase
    .from("accounting_categories")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// DELETE CATEGORY
export async function deleteAccountingCategory(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;

  if (!id) {
    throw new Error("Missing category ID");
  }

  const { error } = await supabase
    .from("accounting_categories")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// ============= ENTRY FUNCTIONS =============

// CREATE ENTRY
export async function createAccountingEntry(formData: FormData) {
  const supabase = await createClient();

  // Extract data from FormData
  const accountId = formData.get('accountId') as string;
  const categoryId = formData.get('categoryId') as string;
  const amount = formData.get('amount') as string;
  const entryDate = formData.get('entryDate') as string;
  const description = formData.get('description') as string;
  const entryType = formData.get('entryType') as string;

  // Validate required fields
  if (!entryType || (entryType !== "Income" && entryType !== "Expense")) {
    throw new Error("Invalid entry type. Must be 'Income' or 'Expense'");
  }

  if (!accountId || !categoryId || !amount || !entryDate) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase.from("accounting_entries").insert([{
    account_id: accountId,
    category_id: categoryId,
    entry_type: entryType,
    amount: parseFloat(amount),
    entry_date: entryDate,
    description: description || null,
  }]);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// UPDATE ENTRY
export async function updateAccountingEntry(formData: FormData) {
  const supabase = await createClient();

  // Extract data from FormData
  const id = formData.get('id') as string;
  const accountId = formData.get('accountId') as string;
  const categoryId = formData.get('categoryId') as string;
  const amount = formData.get('amount') as string;
  const entryDate = formData.get('entryDate') as string;
  const description = formData.get('description') as string;

  // Validate required fields
  if (!id || !accountId || !categoryId || !amount || !entryDate) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("accounting_entries")
    .update({
      account_id: accountId,
      category_id: categoryId,
      amount: parseFloat(amount),
      entry_date: entryDate,
      description: description || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}

// DELETE ENTRY
export async function deleteAccountingEntry(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('id') as string;

  if (!id) {
    throw new Error("Missing entry ID");
  }

  const { error } = await supabase
    .from("accounting_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  
  revalidatePath("/accounting");
}
