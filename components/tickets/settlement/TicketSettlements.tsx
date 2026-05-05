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
  commission_percent: number;
  is_active: boolean;
}

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  amount: number;
  operator_id: string;
  journey_date: string;
  settlement_status: string;
  settlement_timestamp: string | null;
  payment_received_by: string;
  operator?: {
    operator_name: string;
    person_name: string;
    mobile_number: string;
    commission_percent: number;
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
  total_commission: number;
  you_owed_amount: number;
  operator_owed_amount: number;
  net_balance: number;
  ticket_count: number;
  unpaid_tickets: Ticket[];
}

export default function TicketSettlements() {
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
      // Fetch pending tickets with operator details
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          operator:operators(
            operator_name,
            person_name,
            mobile_number,
            commission_percent
          )
        `)
        .eq("settlement_status", "pending")
        .not("operator_id", "is", null)
        .order("journey_date", { ascending: false });

      if (ticketsError) throw ticketsError;

      // Group tickets by operator and calculate settlements
      const operatorMap = new Map<string, SettlementCalculation>();

      (tickets || []).forEach((ticket: {
        id: string;
        amount: number;
        operator_id: string;
        payment_received_by: string;
        operator: {
          operator_name: string;
          person_name: string;
          mobile_number: string;
          commission_percent: number;
        };
      }) => {
        const operatorId = ticket.operator_id;
        const operator = ticket.operator;

        if (!operatorMap.has(operatorId)) {
          const actualRate = Math.max(10, operator.commission_percent || 0);
          operatorMap.set(operatorId, {
            operator_id: operatorId,
            operator_name: operator.operator_name,
            person_name: operator.person_name || "",
            mobile_number: operator.mobile_number || "",
            commission_percent: operator.commission_percent,
            actual_commission_rate: actualRate,
            total_amount: 0,
            total_commission: 0,
            you_owed_amount: 0,
            operator_owed_amount: 0,
            net_balance: 0,
            ticket_count: 0,
            unpaid_tickets: [],
          });
        }

        const settlement = operatorMap.get(operatorId)!;
        const commission = ticket.amount * settlement.actual_commission_rate / 100;
        
        settlement.total_amount += ticket.amount || 0;
        settlement.total_commission += commission;
        settlement.ticket_count += 1;
        settlement.unpaid_tickets.push(ticket as unknown as Ticket);
        
        if (ticket.payment_received_by === "self") {
          // You received money, so you owe operator the commission
          settlement.you_owed_amount += commission;
        } else {
          // Operator received money, so operator owes you the commission
          settlement.operator_owed_amount += commission;
        }
        
        settlement.net_balance = settlement.operator_owed_amount - settlement.you_owed_amount;
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
      // Use our new settlement system
      const { createSettlement, completeSettlement } = await import("@/lib/actions/settlement.actions");
      
      const result = await createSettlement(selectedSettlement.operator_id, paymentNotes);
      
      if (result.success) {
        // Complete the settlement immediately
        await completeSettlement(result.settlementId!);
        
        setSuccess(`Settlement of ₹${Math.abs(selectedSettlement.net_balance).toFixed(2)} processed successfully!`);
        setShowPaymentModal(false);
        setSelectedSettlement(null);
        setPaymentNotes("");
        await fetchSettlements();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(result.error);
      }
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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Ticket Settlements
        </h2>
        <p className="text-gray-600">Manage operator payments and commission settlements for tickets</p>
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

      {/* Filter by Operator */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Operator
        </label>
        <select
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Operators</option>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.operator_name}
            </option>
          ))}
        </select>
      </div>

      {/* Settlements List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading settlements...</span>
        </div>
      ) : filteredSettlements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No pending settlements found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSettlements.map((settlement) => (
            <div
              key={settlement.operator_id}
              className="border border-gray-200 rounded-lg p-6 bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {settlement.operator_name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{settlement.person_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{settlement.mobile_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      <span>{settlement.actual_commission_rate}% commission {settlement.actual_commission_rate > settlement.commission_percent ? '(10% default applied)' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">
                    {settlement.ticket_count} tickets
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSettlement(settlement);
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              </div>

              {/* Calculation Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{settlement.total_amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Commission ({settlement.actual_commission_rate}%{settlement.actual_commission_rate > settlement.commission_percent ? ' - 10% default' : ''})</div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{settlement.total_commission.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Net Balance</div>
                  <div className={`text-lg font-bold ${settlement.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {settlement.net_balance >= 0 ? 'Operator pays you:' : 'You pay operator:'}
                    <br />
                    ₹{Math.abs(settlement.net_balance).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">System Income</div>
                  <div className="text-lg font-bold text-purple-600">
                    ₹{settlement.total_commission.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Recent Tickets ({settlement.ticket_count})
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {settlement.unpaid_tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="text-xs text-gray-600 flex justify-between items-center py-1 border-b border-gray-100">
                        <span>{ticket.ticket_number} - {ticket.passenger_name}</span>
                        <span className="font-medium">₹{ticket.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {settlement.unpaid_tickets.length > 5 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        ... and {settlement.unpaid_tickets.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                      <span className="font-medium text-green-600">₹{selectedSettlement.total_commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">{selectedSettlement.net_balance >= 0 ? 'Operator pays you:' : 'You pay operator:'}</span>
                      <span className={`font-bold text-lg ${selectedSettlement.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>₹{Math.abs(selectedSettlement.net_balance).toFixed(2)}</span>
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
                        Pay ₹{Math.abs(selectedSettlement.net_balance).toFixed(2)}
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
