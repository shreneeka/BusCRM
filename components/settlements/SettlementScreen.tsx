"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Users,
  Phone,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Percent,
  Calculator,
  CreditCard,
  Wallet,
  User,
  X,
  Check,
  FileText,
} from "lucide-react";

interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  amount: number;
  commission_amount: number;
  operator_payable: number;
  operator_id: string;
  journey_date: string;
  settlement_paid_to_operator: boolean;
  settlement_paid_at: string | null;
  operator?: {
    operator_name: string;
    person_name: string;
    mobile_number: string;
    commission_percentage: number;
  };
}

interface SettlementCalculation {
  operator_id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number; // Original operator commission
  actual_commission_rate: number; // Actual rate used (10% default or operator's if higher)
  total_amount: number;
  commission_amount: number;
  operator_payable: number;
  ticket_count: number;
  unpaid_tickets: Ticket[];
}


export default function SettlementScreen() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [settlements, setSettlements] = useState<SettlementCalculation[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementCalculation | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    fetchOperators();
    fetchSettlements();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .eq("is_active", true)
        .order("operator_name");

      if (error) throw error;
      setOperators(data || []);
    } catch (error: unknown) {
      console.error("Error fetching operators:", error);
      setError("Failed to fetch operators");
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      // Fetch unpaid tickets with operator details
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          operator:operators(
            operator_name,
            person_name,
            mobile_number,
            commission_percentage
          )
        `)
        .eq("settlement_paid_to_operator", false)
        .not("operator_id", "is", null)
        .order("journey_date", { ascending: false });

      if (ticketsError) throw ticketsError;

      // Group tickets by operator and calculate settlements
      const operatorMap = new Map<string, SettlementCalculation>();

      (tickets || []).forEach((ticket: any) => {
        const operatorId = ticket.operator_id;
        const operator = ticket.operator;

        if (!operatorMap.has(operatorId)) {
          const actualRate = Math.max(10, operator.commission_percentage || 0);
          operatorMap.set(operatorId, {
            operator_id: operatorId,
            operator_name: operator.operator_name,
            person_name: operator.person_name || "",
            mobile_number: operator.mobile_number || "",
            commission_percent: operator.commission_percentage,
            actual_commission_rate: actualRate,
            total_amount: 0,
            commission_amount: 0,
            operator_payable: 0,
            ticket_count: 0,
            unpaid_tickets: [],
          });
        }

        const settlement = operatorMap.get(operatorId)!;
        const ticketAmount = ticket.amount || 0;
        const commissionAmount = ticketAmount * settlement.actual_commission_rate / 100;
        const operatorPayable = ticketAmount - commissionAmount;
        
        settlement.total_amount += ticketAmount;
        settlement.commission_amount += commissionAmount;
        settlement.operator_payable += operatorPayable;
        settlement.ticket_count += 1;
        settlement.unpaid_tickets.push(ticket as Ticket);
      });

      setSettlements(Array.from(operatorMap.values()));
    } catch (error: unknown) {
      console.error("Error fetching settlements:", error);
      setError("Failed to fetch settlements");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedSettlement) return;

    setLoading(true);
    try {
      // Use 10% commission as default, or operator's commission if higher
      const commissionRate = selectedSettlement.actual_commission_rate;
      
      // Create settlement record
      const { error: settlementError } = await supabase
        .from("operator_settlements")
        .insert({
          operator_name: selectedSettlement.operator_name,
          mobile_number: selectedSettlement.mobile_number,
          total_amount: selectedSettlement.total_amount,
          commission_percentage: commissionRate,
          commission_amount: selectedSettlement.commission_amount,
          operator_payable: selectedSettlement.operator_payable,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

      if (settlementError) throw settlementError;

      // Update tickets as paid
      const ticketIds = selectedSettlement.unpaid_tickets.map(t => t.id);
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          settlement_paid_to_operator: true,
          settlement_paid_at: new Date().toISOString(),
        })
        .in("id", ticketIds);

      if (updateError) throw updateError;

      // Create accounting entry for commission income
      const { data: categories } = await supabase
        .from("accounting_categories")
        .select("id")
        .eq("name", "Commission")
        .eq("category_type", "Income")
        .single();

      if (categories) {
        await supabase.from("accounting_entries").insert({
          account_id: (await supabase.from("accounts").select("id").eq("name", "Cash").single()).data?.id,
          category_id: categories.id,
          entry_type: "Income",
          amount: selectedSettlement.commission_amount,
          entry_date: new Date().toISOString().split("T")[0],
          description: `Commission from ${selectedSettlement.operator_name} - ${selectedSettlement.ticket_count} tickets`,
        });
      }

      setSuccess(`Payment of ₹${selectedSettlement.operator_payable.toFixed(2)} processed successfully!`);
      setShowPaymentModal(false);
      setSelectedSettlement(null);
      setPaymentNotes("");
      await fetchSettlements();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const filteredSettlements = selectedOperator
    ? settlements.filter(s => s.operator_id === selectedOperator)
    : settlements;

  const handleTicketSelect = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Operator Settlements
        </h2>
        <p className="text-gray-600">Manage operator payments and commission settlements</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Settlement Form */}
      <div className="space-y-6">
        {/* Operator Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Operator
          </label>
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose an operator...</option>
            {operators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.operator_name} ({operator.commission_percentage}% commission)
              </option>
            ))}
          </select>
        </div>

        {selectedOperator && (
          <>
            {/* Settlement Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Settlement Summary</h3>
                <button
                  onClick={() => {
                    const settlement = settlements.find(s => s.operator_id === selectedOperator);
                    if (settlement) {
                      const allTicketIds = settlement.unpaid_tickets.map(t => t.id);
                      setSelectedTickets(new Set(allTicketIds));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
                  <div className="text-xl font-bold text-gray-900">
                    {selectedTickets.size}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-gray-900">
                    ₹{settlements.find(s => s.operator_id === selectedOperator)?.unpaid_tickets
                      .filter(t => selectedTickets.has(t.id))
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Commission</div>
                  <div className="text-xl font-bold text-green-600">
                    ₹{settlements.find(s => s.operator_id === selectedOperator)?.unpaid_tickets
                      .filter(t => selectedTickets.has(t.id))
                      .reduce((sum, t) => sum + (t.amount * (settlements.find(s => s.operator_id === selectedOperator)?.actual_commission_rate || 0) / 100), 0)
                      .toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Operator Payable</div>
                  <div className="text-xl font-bold text-blue-600">
                    ₹{settlements.find(s => s.operator_id === selectedOperator)?.unpaid_tickets
                      .filter(t => selectedTickets.has(t.id))
                      .reduce((sum, t) => sum + (t.amount - (t.amount * (settlements.find(s => s.operator_id === selectedOperator)?.actual_commission_rate || 0) / 100)), 0)
                      .toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Tickets to Settle */}
              <h4 className="text-md font-medium text-gray-700 mb-3">Tickets to Settle</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Select</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Ticket #</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Passenger</th>
                      <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Operator</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-700">Amount</th>
                      <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium text-gray-700">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.find(s => s.operator_id === selectedOperator)?.unpaid_tickets.map((ticket, index) => (
                      <tr key={ticket.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTickets.has(ticket.id)}
                            onChange={() => handleTicketSelect(ticket.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">{ticket.ticket_number}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">{ticket.passenger_name}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm">{ticket.operator?.operator_name || 'N/A'}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm text-right">₹{ticket.amount.toFixed(2)}</td>
                        <td className="border border-gray-200 px-4 py-2 text-sm text-right">₹{(ticket.amount * (settlements.find(s => s.operator_id === selectedOperator)?.actual_commission_rate || 0) / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Settlement Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Settlement Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this settlement..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const settlement = settlements.find(s => s.operator_id === selectedOperator);
                    if (settlement) {
                      setSelectedSettlement(settlement);
                      setShowPaymentModal(true);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Process Settlement
                </button>
              </div>
            </div>
          </>
        )}

        {selectedOperator && settlements.find(s => s.operator_id === selectedOperator) === undefined && (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No pending tickets found for this operator</p>
          </div>
        )}

        {!selectedOperator && (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Please select an operator to view settlement details</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSettlement(null);
                    setPaymentNotes("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedSettlement.operator_name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tickets:</span>
                      <span className="font-medium">{selectedSettlement.ticket_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">₹{selectedSettlement.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission ({selectedSettlement.actual_commission_rate}%{selectedSettlement.actual_commission_rate > selectedSettlement.commission_percent ? ' - 10% default' : ''}):</span>
                      <span className="font-medium text-green-600">₹{selectedSettlement.commission_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Amount to Pay:</span>
                      <span className="font-bold text-blue-600 text-lg">₹{selectedSettlement.operator_payable.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedSettlement(null);
                      setPaymentNotes("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Pay ₹{selectedSettlement.operator_payable.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
