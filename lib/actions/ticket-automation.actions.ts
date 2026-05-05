// Ticket Booking Automation Middleware
// This file handles the automated integration between tickets and accounting

import { createClient } from "@/lib/supabase/server";
import { createTicketIncomeEntry, calculateOperatorCommission, createSettlementIncomeEntry } from "./ticket-accounting.actions";

export interface TicketCreationData {
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  operator_id: string;
  account_id: string;
  amount: number;
  payment_status?: string;
}

export interface OperatorData {
  id: string;
  name: string;
  commission_percentage: number;
  mobile_number?: string;
}

/**
 * Automated ticket creation with accounting integration
 * This function should be called whenever a ticket is created
 */
export async function createTicketWithAccounting(ticketData: TicketCreationData) {
  const supabase = await createClient();

  try {
    console.log(`🎫 Creating automated ticket: ${ticketData.ticket_number}`);

    // Step 1: Get operator information
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("*")
      .eq("id", ticketData.operator_id)
      .single();

    if (operatorError || !operator) {
      throw new Error(`Operator not found: ${operatorError?.message || "Unknown error"}`);
    }

    // Step 2: Calculate commission and payable amounts
    const commission = calculateOperatorCommission(ticketData.amount, operator.commission_percentage);
    
    console.log(`💰 Commission calculation for ticket ${ticketData.ticket_number}:`, {
      ticketAmount: ticketData.amount,
      commissionPercentage: operator.commission_percentage,
      commissionAmount: commission.commissionAmount,
      operatorPayable: commission.operatorPayable,
      profit: commission.profit
    });

    // Step 3: Create the ticket record
    const ticketRecord = {
      ticket_number: ticketData.ticket_number,
      amount: ticketData.amount,
      passenger_name: ticketData.passenger_name,
      operator_id: ticketData.operator_id,
      account_id: ticketData.account_id,
      travel_date: ticketData.travel_date,
      booking_date: ticketData.booking_date || new Date().toISOString().split("T")[0],
      commission_percentage: operator.commission_percentage,
      commission_amount: commission.commissionAmount,
      operator_payable: commission.operatorPayable,
      status: "booked",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdTicket, error: ticketError } = await supabase
      .from("tickets")
      .insert(ticketRecord)
      .select()
      .single();

    if (ticketError) {
      throw new Error(`Failed to create ticket: ${ticketError.message}`);
    }

    console.log(`✅ Ticket created: ${createdTicket.ticket_number}`);

    // Step 4: Create automatic income entry
    const incomeResult = await createTicketIncomeEntry({
      ticket_id: createdTicket.id,
      ticket_number: createdTicket.ticket_number,
      amount: createdTicket.amount,
      passenger_name: createdTicket.passenger_name,
      operator_id: createdTicket.operator_id,
      operator_name: operator.name,
      operator_commission_percentage: createdTicket.commission_percentage,
      account_id: createdTicket.account_id,
      booking_date: createdTicket.booking_date,
      payment_status: ticketData.payment_status, // Pass payment status
    });

    if (!incomeResult.success) {
      // Don't fail ticket creation if accounting fails, but log the error
      console.error("⚠️ Failed to create income entry:", incomeResult.error);
    }

    return {
      success: true,
      data: {
        ticket: createdTicket,
        operator,
        commission,
        incomeEntry: incomeResult.success ? incomeResult.data : null
      },
      message: `Ticket ${createdTicket.ticket_number} created successfully with accounting integration`
    };

  } catch (error) {
    console.error("❌ Error creating ticket with accounting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Automated settlement creation with accounting integration
 * This function should be called whenever a settlement is created
 */
export async function createSettlementWithAccounting(settlementData: {
  operator_id: string;
  ticket_ids: string[];
  payment_amount: number;
  payment_method: string;
  account_id: string;
  settlement_method?: string;
  reference_number?: string;
  notes?: string;
}) {
  const supabase = await createClient();

  try {
    console.log(`💰 Creating automated settlement for ${settlementData.ticket_ids.length} tickets`);

    // Step 1: Get operator information
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("*")
      .eq("id", settlementData.operator_id)
      .single();

    if (operatorError || !operator) {
      throw new Error(`Operator not found: ${operatorError?.message || "Unknown error"}`);
    }

    // Step 2: Get ticket information
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*")
      .in("id", settlementData.ticket_ids);

    if (ticketsError || !tickets || tickets.length === 0) {
      throw new Error(`Tickets not found: ${ticketsError?.message || "Unknown error"}`);
    }

    // Step 3: Calculate totals
    const totals = tickets.reduce((acc, ticket) => ({
      totalTicketAmount: acc.totalTicketAmount + ticket.amount,
      totalCommission: acc.totalCommission + ticket.commission_amount,
      totalOperatorPayable: acc.totalOperatorPayable + ticket.operator_payable,
    }), {
      totalTicketAmount: 0,
      totalCommission: 0,
      totalOperatorPayable: 0,
    });

    console.log(`💰 Settlement totals:`, totals);

    // Step 4: Validate payment amount
    if (settlementData.payment_amount > totals.totalOperatorPayable) {
      throw new Error(`Payment amount (₹${settlementData.payment_amount}) exceeds operator payable (₹${totals.totalOperatorPayable})`);
    }

    // Step 5: Create settlement record
    const settlementRecord = {
      operator_id: settlementData.operator_id,
      operator_name: operator.name,
      mobile_number: operator.mobile_number,
      total_amount: totals.totalTicketAmount,
      commission_percentage: operator.commission_percentage,
      commission_amount: totals.totalCommission,
      operator_payable: totals.totalOperatorPayable,
      paid_amount: settlementData.payment_amount,
      remaining_amount: totals.totalOperatorPayable - settlementData.payment_amount,
      is_paid: settlementData.payment_amount >= totals.totalOperatorPayable,
      payment_status: settlementData.payment_amount >= totals.totalOperatorPayable ? "done" : "partial",
      settlement_method: settlementData.settlement_method || settlementData.payment_method,
      reference_number: settlementData.reference_number,
      notes: settlementData.notes,
      ticket_ids: settlementData.ticket_ids,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdSettlement, error: settlementError } = await supabase
      .from("operator_settlements")
      .insert(settlementRecord)
      .select()
      .single();

    if (settlementError) {
      throw new Error(`Failed to create settlement: ${settlementError.message}`);
    }

    console.log(`✅ Settlement created: ${createdSettlement.id}`);

    // Step 6: Create accounting entries (Income only - no expense entries)
    const accountingResult = await createSettlementIncomeEntry({
      settlement_id: createdSettlement.id,
      ticket_ids: settlementData.ticket_ids,
      operator_id: settlementData.operator_id,
      operator_name: operator.name,
      total_ticket_amount: totals.totalTicketAmount,
      total_commission: totals.totalCommission,
      operator_payable: totals.totalOperatorPayable,
      payment_amount: settlementData.payment_amount,
      payment_method: settlementData.payment_method,
      payment_date: new Date().toISOString().split("T")[0],
      account_id: settlementData.account_id,
    });

    if (!accountingResult.success) {
      // Don't fail settlement creation if accounting fails, but log the error
      console.error("⚠️ Failed to create accounting entries:", accountingResult.error);
    }

    // Step 7: Update ticket statuses
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: settlementData.payment_amount >= totals.totalOperatorPayable ? "paid" : "partial_paid",
        updated_at: new Date().toISOString(),
      })
      .in("id", settlementData.ticket_ids);

    if (updateError) {
      console.error("⚠️ Failed to update ticket statuses:", updateError);
    }

    return {
      success: true,
      data: {
        settlement: createdSettlement,
        operator,
        tickets,
        totals,
        accountingEntries: accountingResult.success ? accountingResult.data : null
      },
      message: `Settlement created successfully with accounting integration`
    };

  } catch (error) {
    console.error("❌ Error creating settlement with accounting:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
 * Validate and prevent manual override of automated entries
 */
export async function validateAutomatedEntryIntegrity(entryId: string) {
  const supabase = await createClient();

  try {
    // Get the entry with related data
    const { data: entry, error: fetchError } = await supabase
      .from("accounting_entries")
      .select(`
        *,
        accounting_categories!inner(
          name,
          category_type
        ),
        tickets!left(
          ticket_number,
          amount,
          commission_percentage,
          commission_amount
        ),
        operator_settlements!left(
          operator_name,
          total_amount,
          commission_amount
        )
      `)
      .eq("id", entryId)
      .single();

    if (fetchError || !entry) {
      throw new Error("Accounting entry not found");
    }

    const errors: string[] = [];

    // Validate ticket-linked entries
    if (entry.ticket_id) {
      if (entry.entry_type !== "Income") {
        errors.push("Ticket-linked entries must be Income type");
      }

      if (entry.accounting_categories.name !== "Ticket Booking") {
        errors.push("Ticket income entries must use 'Ticket Booking' category");
      }

      if (entry.tickets && entry.amount !== entry.tickets.amount) {
        errors.push(`Ticket income amount (₹${entry.amount}) must equal ticket amount (₹${entry.tickets.amount})`);
      }
    }

    // Validate settlement-linked entries
    if (entry.settlement_id) {
      if (entry.entry_type === "Expense" && entry.accounting_categories.name !== "Operator Payment") {
        errors.push("Settlement expense entries must use 'Operator Payment' category");
      }

      if (entry.entry_type === "Income" && entry.accounting_categories.name !== "Commission") {
        errors.push("Settlement income entries must use 'Commission' category");
      }

      if (entry.operator_settlements) {
        if (entry.entry_type === "Expense" && entry.amount > entry.operator_settlements.operator_payable) {
          errors.push("Expense amount cannot exceed operator payable amount");
        }

        if (entry.entry_type === "Income" && entry.amount !== entry.operator_settlements.commission_amount) {
          errors.push("Commission income amount must equal settlement commission amount");
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join("; ")
      };
    }

    return {
      success: true,
      data: entry,
      message: "Automated entry integrity validated"
    };

  } catch (error) {
    console.error("❌ Error validating automated entry integrity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed"
    };
  }
}

/**
 * Get financial summary for a ticket
 * Shows complete financial flow: Income -> Commission -> Expense
 */
export async function getTicketFinancialSummary(ticketId: string) {
  const supabase = await createClient();

  try {
    // Get ticket information
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        operators!inner(
          name,
          commission_percentage
        )
      `)
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error(`Ticket not found: ${ticketError?.message || "Unknown error"}`);
    }

    // Get all accounting entries for this ticket
    const { data: entries, error: entriesError } = await supabase
      .from("accounting_entries")
      .select(`
        *,
        accounting_categories!inner(
          name,
          category_type
        )
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (entriesError) {
      throw new Error(`Failed to fetch entries: ${entriesError.message}`);
    }

    // Get settlement information if any
    const { data: settlements, error: settlementError } = await supabase
      .from("operator_settlements")
      .select("*")
      .contains("ticket_ids", [ticketId]);

    if (settlementError) {
      throw new Error(`Failed to fetch settlements: ${settlementError.message}`);
    }

    // Calculate financial summary
    const summary = {
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        amount: ticket.amount,
        passenger_name: ticket.passenger_name,
        operator_name: ticket.operators.name,
        commission_percentage: ticket.commission_percentage,
        commission_amount: ticket.commission_amount,
        operator_payable: ticket.operator_payable,
        status: ticket.status
      },
      income: {
        ticketBooking: 0,
        commission: 0,
        total: 0
      },
      expense: {
        operatorPayment: 0,
        total: 0
      },
      profit: 0,
      entries: entries || [],
      settlements: settlements || []
    };

    // Calculate totals from entries
    entries.forEach(entry => {
      if (entry.entry_type === "Income") {
        summary.income.total += entry.amount;
        if (entry.accounting_categories.name === "Ticket Booking") {
          summary.income.ticketBooking += entry.amount;
        } else if (entry.accounting_categories.name === "Commission") {
          summary.income.commission += entry.amount;
        }
      } else if (entry.entry_type === "Expense") {
        summary.expense.total += entry.amount;
        if (entry.accounting_categories.name === "Operator Payment") {
          summary.expense.operatorPayment += entry.amount;
        }
      }
    });

    summary.profit = summary.income.total - summary.expense.total;

    return {
      success: true,
      data: summary,
      message: "Financial summary retrieved successfully"
    };

  } catch (error) {
    console.error("❌ Error getting ticket financial summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get summary"
    };
  }
}
