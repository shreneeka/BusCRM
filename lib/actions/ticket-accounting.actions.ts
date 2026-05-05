// Ticket Booking and Accounting Integration Actions
// This file handles the automated accounting entries for ticket bookings and settlements

import { createClient } from "@/lib/supabase/server";

export interface TicketAccountingData {
  ticket_id: string;
  ticket_number: string;
  amount: number;
  passenger_name: string;
  operator_id: string;
  operator_name: string;
  operator_commission_percentage: number;
  account_id: string; // Account selected in ticket form
  booking_date: string;
}

export interface SettlementAccountingData {
  settlement_id: string;
  ticket_ids: string[];
  operator_id: string;
  operator_name: string;
  total_ticket_amount: number;
  total_commission: number;
  operator_payable: number;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  account_id: string;
}

/**
 * Create automatic Income entry when a ticket is booked
 * Logic based on payment status:
 * - Paid: 10% income (commission), 90% removed as expense
 * - Partial: 10% income (commission), 90% removed as expense  
 * - Not Paid: 100% income (full amount)
 * Category = "Ticket Booking"
 * Entry type = "Income"
 */
export async function createTicketIncomeEntry(ticketData: TicketAccountingData & { payment_status?: string }) {
  const supabase = await createClient();

  try {
    console.log(`🎫 Creating automatic ticket income entry for ticket ${ticketData.ticket_number} (payment_status: ${ticketData.payment_status || 'unknown'})`);

    // Validate ticket data
    if (!ticketData.amount || ticketData.amount <= 0) {
      throw new Error("Invalid ticket amount for income entry");
    }

    if (!ticketData.account_id) {
      throw new Error("Account ID is required for ticket income entry");
    }

    // Get or create "Ticket Booking" category (Income)
    let { data: category } = await supabase
      .from("accounting_categories")
      .select("id")
      .eq("name", "Ticket Booking")
      .eq("category_type", "Income")
      .single();

    if (!category) {
      console.log("Creating Ticket Booking category...");
      const { data: newCategory, error: createError } = await supabase
        .from("accounting_categories")
        .insert({
          name: "Ticket Booking",
          category_type: "Income",
          description: "Income from ticket bookings",
          is_active: true,
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error(`Failed to create Ticket Booking category: ${createError.message}`);
      }
      category = newCategory;
    }

    // Calculate income amount based on payment status
    let incomeAmount = ticketData.amount;
    let description = `Ticket Booking - ${ticketData.passenger_name} (${ticketData.ticket_number}) - ${ticketData.operator_name}`;
    
    if (ticketData.payment_status === 'paid') {
      // Paid: 10% income (commission), 90% removed as expense
      incomeAmount = ticketData.amount * 0.1; // Only 10% as income
      description += ` (Commission only - 90% removed as expense)`;
    } else if (ticketData.payment_status === 'partial') {
      // Partial: 10% income (commission), 90% removed as expense
      incomeAmount = ticketData.amount * 0.1; // Only 10% as income
      description += ` (Partial payment - commission only, 90% removed as expense)`;
    }
    // For 'not_paid' or undefined, keep 100% income

    // Create income entry
    const incomeEntry = {
      account_id: ticketData.account_id,
      category_id: category.id,
      entry_type: "Income",
      amount: incomeAmount,
      entry_date: ticketData.booking_date,
      description,
      ticket_id: ticketData.ticket_id,
      created_at: new Date().toISOString(),
    };

    const { data: createdEntry, error: insertError } = await supabase
      .from("accounting_entries")
      .insert(incomeEntry)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create ticket income entry: ${insertError.message}`);
    }

    console.log(`✅ Ticket income entry created: ₹${incomeAmount} for ticket ${ticketData.ticket_number} (status: ${ticketData.payment_status})`);
    
    // Create expense entry for 90% removed amount if ticket is paid or partial
    if (ticketData.payment_status === 'paid' || ticketData.payment_status === 'partial') {
      try {
        const removedAmount = ticketData.payment_status === 'paid' 
          ? ticketData.amount * 0.9  // 90% removed as expense
          : ticketData.amount * 0.9; // Same for partial - 90% removed as expense
        
        // Get or create "Ticket Booking Removal" category (Expense)
        let { data: removalCategory } = await supabase
          .from("accounting_categories")
            .select("id")
            .eq("name", "Ticket Booking Removal")
            .eq("category_type", "Expense")
            .single();

        if (!removalCategory) {
          console.log("Creating Ticket Booking Removal category...");
          const { data: newCategory, error: createError } = await supabase
            .from("accounting_categories")
              .insert({
                name: "Ticket Booking Removal",
                category_type: "Expense",
                description: "90% of ticket amount removed when paid/partial",
                is_active: true,
              })
              .select("id")
              .single();

          if (createError) {
            throw new Error(`Failed to create Ticket Booking Removal category: ${createError.message}`);
          }
          removalCategory = newCategory;
        }

        // Create expense entry for 90% removed
        const expenseEntry = {
          account_id: ticketData.account_id,
          category_id: removalCategory.id,
          entry_type: "Expense",
          amount: removedAmount,
          entry_date: ticketData.booking_date,
          description: `90% of ticket amount removed (${ticketData.payment_status}) - ${ticketData.passenger_name} (${ticketData.ticket_number})`,
          ticket_id: ticketData.ticket_id,
          created_at: new Date().toISOString(),
        };

        const { data: createdExpenseEntry, error: expenseError } = await supabase
          .from("accounting_entries")
          .insert(expenseEntry)
          .select()
          .single();

        if (expenseError) {
          console.error("❌ Error creating ticket removal expense entry:", expenseError);
        } else {
          console.log(`✅ Ticket removal expense entry created: ₹${removedAmount} for ticket ${ticketData.ticket_number}`);
        }
      } catch (error) {
        console.error("❌ Error creating ticket removal expense entry:", error);
      }
    }
    
    return {
      success: true,
      data: createdEntry,
      message: `Ticket income entry of ₹${incomeAmount} created successfully`
    };

  } catch (error) {
    console.error("❌ Error creating ticket income entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Calculate operator commission and payable amounts
 * Commission = Ticket Amount × Commission %
 * Payable = Ticket Amount - Commission
 */
export function calculateOperatorCommission(ticketAmount: number, commissionPercentage: number) {
  const commission = (ticketAmount * commissionPercentage) / 100;
  const payable = ticketAmount - commission;
  
  return {
    ticketAmount,
    commissionPercentage,
    commissionAmount: commission,
    operatorPayable: payable,
    profit: commission // Profit equals commission amount
  };
}

/**
 * Create commission income entry when operator is paid
 * Only create income entries - NO expense entries
 * Income amount = Commission Amount (business profit)
 * Category = "Commission"
 * Entry type = "Income"
 */
export async function createSettlementIncomeEntry(settlementData: SettlementAccountingData) {
  const supabase = await createClient();

  try {
    console.log(`💰 Creating settlement income entry for ${settlementData.operator_name}`);

    // Validate settlement data
    if (!settlementData.total_commission || settlementData.total_commission <= 0) {
      throw new Error("Invalid commission amount for income entry");
    }

    if (!settlementData.account_id) {
      throw new Error("Account ID is required for settlement income entry");
    }

    // Get "Commission" category (Income)
    let { data: commissionCategory } = await supabase
      .from("accounting_categories")
      .select("id")
      .eq("name", "Commission")
      .eq("category_type", "Income")
      .single();

    if (!commissionCategory) {
      console.log("Creating Commission category...");
      const { data: newCategory, error: createError } = await supabase
        .from("accounting_categories")
        .insert({
          name: "Commission",
          category_type: "Income",
          description: "Commission earned from operators",
          is_active: true,
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error(`Failed to create Commission category: ${createError.message}`);
      }
      commissionCategory = newCategory;
    }

    // Create commission income entry (business profit)
    const commissionEntry = {
      account_id: settlementData.account_id,
      category_id: commissionCategory.id,
      entry_type: "Income",
      amount: settlementData.total_commission,
      entry_date: settlementData.payment_date,
      description: `Commission from ${settlementData.operator_name} - ${settlementData.ticket_ids.length} tickets`,
      settlement_id: settlementData.settlement_id,
      created_at: new Date().toISOString(),
    };

    const { data: createdCommissionEntry, error: commissionError } = await supabase
      .from("accounting_entries")
      .insert(commissionEntry)
      .select()
      .single();

    if (commissionError) {
      throw new Error(`Failed to create settlement income entry: ${commissionError.message}`);
    }

    console.log(`✅ Settlement income entry created: ₹${settlementData.total_commission} for ${settlementData.operator_name}`);
    
    return {
      success: true,
      data: createdCommissionEntry,
      message: `Settlement income entry of ₹${settlementData.total_commission} created successfully`
    };

  } catch (error) {
    console.error("❌ Error creating settlement income entry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Validate accounting entry integrity
 * Prevents manual modification of automated entries
 */
export async function validateAccountingEntry(entryId: string, userId?: string) {
  const supabase = await createClient();

  try {
    // Get the entry
    const { data: entry, error: fetchError } = await supabase
      .from("accounting_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    if (fetchError || !entry) {
      throw new Error("Accounting entry not found");
    }

    // Check if entry is ticket-linked (automated)
    if (entry.ticket_id) {
      // Ticket-linked entries must always be Income type
      if (entry.entry_type !== "Income") {
        throw new Error("Ticket-linked entries must be Income type");
      }

      // Category must be "Ticket Booking"
      const { data: category } = await supabase
        .from("accounting_categories")
        .select("name")
        .eq("id", entry.category_id)
        .single();

      if (!category || category.name !== "Ticket Booking") {
        throw new Error("Ticket income entries must use 'Ticket Booking' category");
      }
    }

    // Check if entry is settlement-linked (automated)
    if (entry.settlement_id) {
      // Settlement entries can be Expense (operator payment) or Income (commission)
      const { data: category } = await supabase
        .from("accounting_categories")
        .select("name, category_type")
        .eq("id", entry.category_id)
        .single();

      if (!category) {
        throw new Error("Invalid category for settlement entry");
      }

      if (entry.entry_type === "Expense" && category.name !== "Operator Payment") {
        throw new Error("Settlement expense entries must use 'Operator Payment' category");
      }

      if (entry.entry_type === "Income" && category.name !== "Commission") {
        throw new Error("Settlement income entries must use 'Commission' category");
      }
    }

    return {
      success: true,
      data: entry,
      message: "Accounting entry validation passed"
    };

  } catch (error) {
    console.error("❌ Accounting entry validation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

/**
 * Calculate profit from ticket and settlement entries
 * Profit = Income - Expense (should equal commission amount)
 */
export async function calculateTicketProfit(ticketId: string) {
  const supabase = await createClient();

  try {
    // Get all entries for this ticket
    const { data: entries, error: fetchError } = await supabase
      .from("accounting_entries")
      .select(`
        *,
        accounting_categories!inner(
          name,
          category_type
        )
      `)
      .eq("ticket_id", ticketId);

    if (fetchError) {
      throw new Error(`Failed to fetch ticket entries: ${fetchError.message}`);
    }

    if (!entries || entries.length === 0) {
      return {
        success: false,
        error: "No accounting entries found for this ticket"
      };
    }

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    let ticketIncome = 0;
    let operatorExpense = 0;

    entries.forEach(entry => {
      if (entry.entry_type === "Income") {
        totalIncome += entry.amount;
        if (entry.accounting_categories.name === "Ticket Booking") {
          ticketIncome += entry.amount;
        }
      } else if (entry.entry_type === "Expense") {
        totalExpense += entry.amount;
        if (entry.accounting_categories.name === "Operator Payment") {
          operatorExpense += entry.amount;
        }
      }
    });

    const profit = totalIncome - totalExpense;

    return {
      success: true,
      data: {
        ticketId,
        totalIncome,
        totalExpense,
        ticketIncome,
        operatorExpense,
        profit,
        entries: entries.length
      },
      message: `Ticket profit calculated: ₹${profit}`
    };

  } catch (error) {
    console.error("❌ Error calculating ticket profit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Calculation failed"
    };
  }
}
