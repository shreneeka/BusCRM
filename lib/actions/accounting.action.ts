"use server";

import { createClient } from "@/lib/supabase/server";

// CREATE ACCOUNT
export async function createAccountingAccount(data: {
  name: string;
  type: string;
}) {
  const supabase = await createClient(); // ✅ FIXED

  const { error } = await supabase.from("accounts").insert([data]);

  if (error) throw new Error(error.message);
}

// UPDATE ACCOUNT
export async function updateAccountingAccount(
  id: string,
  data: { name: string; type: string }
) {
  const supabase = await createClient(); // ✅ FIXED

  const { error } = await supabase
    .from("accounts")
    .update(data)
    .eq("id", id);

  if (error) throw new Error(error.message);
}