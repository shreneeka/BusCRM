"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name");

  if (error) throw new Error(error.message);

  return users || [];
}

