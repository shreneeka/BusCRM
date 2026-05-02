"use server";

import { createClient } from "@/lib/supabase/server";
import { OperatorFormData } from "../validations/operator.schema";

export async function createOperator(data: OperatorFormData) {
  const supabase = createClient();

  const { error } = await supabase.from("operators").insert([
    {
      operator_name: data.operatorName,
      contact_person: data.contactPerson,
      mobile_number: data.mobileNumber,
      commission_percentage: data.commission,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Failed to create operator");
  }
}