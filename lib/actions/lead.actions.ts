"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface CreateLeadPayload {
  customer_name: string;
  mobile_number: string;
  from_city_id: string;
  to_city_id: string;
  journey_date: string;
  type: "Ticket" | "Parcel";
  status: "New" | "Follow Up" | "Booked" | "Cancelled";
  number_of_seats?: number | null;
  parcel_count?: number | null; // Updated from weight to count
  notes?: string;
  next_follow_up_date?: string | null;
}

// --- 1. DASHBOARD LOGIC ---
export async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allLeads, error } = await supabase
    .from("leads")
    .select(
      "*, from_city:cities!from_city_id(name), to_city:cities!to_city_id(name)",
    );

  if (error || !allLeads) return null;

  return {
    total: allLeads.length,
    open: allLeads.filter((l) => l.status === "New" && l.journey_date >= today)
      .length,
    followUp: allLeads.filter((l) => l.status === "Follow Up").length,
    completed: allLeads.filter((l) => l.status === "Booked").length,
    cancelled: allLeads.filter((l) => l.status === "Cancelled").length,
    autoClosed: allLeads.filter(
      (l) => l.status === "New" && l.journey_date < today,
    ).length,
    todaysFollowUps: allLeads.filter(
      (l) => l.status === "Follow Up" && l.notes?.includes(today),
    ).length,

    upcomingJourneys: allLeads.filter(
      (l) => l.journey_date >= today && l.status === "Booked",
    ).length,
    recentLeads: allLeads
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5),
  };
}

// --- 2. LEAD MANAGEMENT ---

export async function createLead(data: CreateLeadPayload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("You must be logged in.");

  let formattedNotes = "";
  if (data.notes) {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    formattedNotes = `[${timestamp}] ${data.notes}@@@NONE`;
  }

  const leadPayload = {
    customer_name: data.customer_name,
    mobile_number: data.mobile_number,
    from_city_id: data.from_city_id,
    to_city_id: data.to_city_id,
    journey_date: data.journey_date,
    type: data.type,
    status: data.status,
    number_of_seats: data.number_of_seats,
    parcel_count: data.parcel_count, // Updated to match DB rename
    notes: formattedNotes || null,
    next_follow_up_date: data.next_follow_up_date || null,
    created_by: user.id,
  };

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert([leadPayload])
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("mobile_number", data.mobile_number)
    .maybeSingle();

  if (!existingCustomer) {
    await supabase.from("customers").insert([
      {
        name: data.customer_name,
        mobile_number: data.mobile_number,
        last_booking_date:
          data.status === "Booked"
            ? new Date().toISOString().split("T")[0]
            : null,
      },
    ]);
  }

  // Paths updated to /enquiry
  revalidatePath("/enquiry");
  revalidatePath("/customers");
  revalidatePath("/follow-ups");
  revalidatePath("/");
  return { success: true, lead: newLead };
}

export async function getLeads() {
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `*, from_city:cities!from_city_id(name), to_city:cities!to_city_id(name)`,
    )
    .neq("status", "Booked")
    .order("created_at", { ascending: false });

  return leads || [];
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: string,
  note?: string,
  nextFollowUpDate?: string | null,
) {
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("notes, mobile_number, customer_name")
    .eq("id", leadId)
    .single();

  const existingNotes = lead?.notes || "";
  const updateData: any = { status: newStatus };

  if (nextFollowUpDate !== undefined) {
    updateData.next_follow_up_date = nextFollowUpDate;
  }

  let formattedNote = "";
  if (note) {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (nextFollowUpDate) {
      const formattedFutureDate = new Date(nextFollowUpDate).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
      formattedNote = `[${timestamp}] ${note}@@@${formattedFutureDate}`;
    } else {
      formattedNote = `[${timestamp}] ${note}@@@NONE`;
    }
  }

  if (newStatus === "Cancelled") {
    updateData.cancellation_reason =
      note || "Cancellation requested by customer/staff";
    if (formattedNote) {
      updateData.notes = existingNotes
        ? `${existingNotes}|||${formattedNote}`
        : formattedNote;
    } else {
      const fallbackTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      const fallbackNote = `[${fallbackTime}] Cancelled without a typed note@@@NONE`;
      updateData.notes = existingNotes
        ? `${existingNotes}|||${fallbackNote}`
        : fallbackNote;
    }
  } else if (formattedNote) {
    updateData.notes = existingNotes
      ? `${existingNotes}|||${formattedNote}`
      : formattedNote;
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);

  if (updateError) {
    console.error("Database Update Error:", updateError.message);
    throw new Error(updateError.message);
  }

  if (lead) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("mobile_number", lead.mobile_number)
      .maybeSingle();

    if (!existing) {
      const { error: custError } = await supabase.from("customers").insert([
        {
          name: lead.customer_name,
          mobile_number: lead.mobile_number,
          last_booking_date:
            newStatus === "Booked"
              ? new Date().toISOString().split("T")[0]
              : null,
        },
      ]);

      if (custError) console.error("Customer Insert Error:", custError.message);
    } else if (newStatus === "Booked") {
      await supabase
        .from("customers")
        .update({
          last_booking_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", existing.id);
    }
  }

  revalidatePath("/enquiry");
  revalidatePath("/follow-ups");
  revalidatePath("/customers");
  revalidatePath("/");
}

// --- 3. DIRECTORY & UTILITIES ---

export async function getFollowUpLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      `*, from_city:cities!from_city_id(name), to_city:cities!to_city_id(name)`,
    )
    .eq("status", "Follow Up")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getCustomers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getCustomerById(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    console.error("Error fetching customer:", error);
    throw new Error("Customer not found");
  }
  
  return data;
}

export async function getCityById(cityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", cityId)
    .single();

  if (error) {
    console.error("Error fetching city:", error);
    throw new Error("City not found");
  }
  
  return data;
}

export async function getCities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name");
  return data || [];
}

export async function addCity(name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cities")
    .insert([{ name: name.trim() }]);
  if (error) throw new Error(error.message);
  revalidatePath("/cities");
  revalidatePath("/enquiry"); // Updated path
}

export async function updateCity(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cities")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cities");
}

export async function deleteCity(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    if (error.code === "23503") throw new Error("City is in use by leads.");
    throw new Error(error.message);
  }
  revalidatePath("/cities");
}

export async function addManualCustomer(name: string, mobile_number: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("mobile_number", mobile_number)
    .maybeSingle();

  if (existing) {
    return { error: "A customer with this mobile number already exists." };
  }

  const { error } = await supabase
    .from("customers")
    .insert([{ name, mobile_number }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  return { success: true };
}

export async function getConfirmedLeads() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      `*, from_city:cities!from_city_id(name), to_city:cities!to_city_id(name)`,
    )
    .eq("status", "Booked")
    .order("created_at", { ascending: false });

  return data || [];
}
