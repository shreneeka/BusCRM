
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Calculator,
  DollarSign,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Operator {
  id: string;
  name: string;
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
  operator_id: string;
  journey_date: string;
  pickup_city: string;
  drop_city: string;
  operators?: {
    id: string;
    name: string;
    person_name: string;
    mobile_number: string;
    commission_percentage: number;
  }[];
}

interface SettlementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedTicketIds?: string[];
}

export default function OperatorSettlementForm({ 
  onClose, 
  onSuccess, 
  selectedTicketIds = [] 
}: SettlementFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [autoOperator, setAutoOperator] = useState<Operator | null>(null);
  const [selectedTicketsData, setSelectedTicketsData] = useState<Ticket[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentCollectorName, setPaymentCollectorName] = useState("");
  const [paymentCollectorMobile, setPaymentCollectorMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});



  const fetchAutoData = useCallback(async () => {
    if (selectedTicketIds.length === 0) return;
    
    try {
      console.log("Fetching data for ticket IDs:", selectedTicketIds);
      
      // Get first ticket to find operator
      const { data: firstTicket, error: ticketError } = await supabase
        .from("tickets")
        .select("operator_id")
        .eq("id", selectedTicketIds[0])
        .single();
      
      if (ticketError) {
        console.error("Error fetching first ticket:", ticketError);
        return;
      }
      
      if (!firstTicket) {
        console.log("No first ticket found");
        return;
      }
      
      console.log("First ticket operator_id:", firstTicket.operator_id);
      
      // Fetch operator
      const { data: opData, error: opError } = await supabase
        .from("operators")
        .select("*")
        .eq("id", firstTicket.operator_id)
        .single();
      
      if (opError) {
        console.error("Error fetching operator:", opError);
      }
      
      console.log("Operator data:", opData);
      
      if (opData) {
        setAutoOperator(opData);
      }
      
      // Fetch selected tickets with operator data
      const { data: ticketData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          passenger_name,
          mobile_number,
          amount,
          operator_id,
          journey_date,
          pickup_city,
          drop_city
        `)
        .in("id", selectedTicketIds);
      
      if (ticketsError) {
        console.error("Error fetching tickets:", ticketsError);
        console.error("Error details:", JSON.stringify(ticketsError, null, 2));
        return;
      }
      
      console.log("Ticket data:", ticketData);
      
      // If tickets are fetched, try to get operator data separately
      if (ticketData && ticketData.length > 0) {
        const operatorIds = [...new Set(ticketData.map(t => t.operator_id).filter(Boolean))];
        
        if (operatorIds.length > 0) {
          console.log("Fetching operators for IDs:", operatorIds);
          
          // First check if operators table exists
          const { error: tableError } = await supabase
            .from("operators")
            .select("count")
            .limit(1);
            
          if (tableError) {
            console.error("Operators table not accessible:", tableError);
            console.log("Setting tickets without operator data");
            setSelectedTicketsData(ticketData.map(ticket => ({
              ...ticket,
              operators: []
            })));
            return;
          }
          
          // Use correct column name
          const { data: operatorsData, error: operatorsError } = await supabase
            .from("operators")
            .select("id, name, person_name, mobile_number, commission_percentage")
            .in("id", operatorIds);
            
          if (operatorsError) {
            console.error("Error fetching operators:", operatorsError);
            console.error("Error details:", JSON.stringify(operatorsError, null, 2));
            console.log("Setting tickets without operator data");
            setSelectedTicketsData(ticketData.map(ticket => ({
              ...ticket,
              operators: []
            })));
          } else {
            console.log("Operators data:", operatorsData);
            
            // Merge operator data into tickets
            const ticketsWithOperators = ticketData.map(ticket => {
              const operator = operatorsData?.find(op => op.id === ticket.operator_id);
              return {
                ...ticket,
                operators: operator ? [operator] : []
              };
            });
            
            setSelectedTicketsData(ticketsWithOperators);
          }
        } else {
          setSelectedTicketsData(ticketData);
        }
      }
    } catch (err) {
      console.error("Error fetching auto data:", err);
    }
  }, [supabase, selectedTicketIds]);

  useEffect(() => {
    fetchAutoData();
  }, [fetchAutoData]);





  const calculateTotals = () => {
    const totalAmount = selectedTicketsData.reduce((sum, ticket) => sum + (ticket.amount || 0), 0);
    const commissionRate = autoOperator?.commission_percentage || 10;
    const commissionAmount = totalAmount * commissionRate / 100;
    const operatorPayable = totalAmount - commissionAmount;
    
    return {
      totalTickets: selectedTicketsData.length,
      totalAmount,
      commissionAmount,
      operatorPayable,
      commissionRate
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!autoOperator) {
      newErrors.operator = "No operator found for selected tickets";
    }
    
    if (selectedTicketsData.length === 0) {
      newErrors.tickets = "No tickets found";
    }
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      newErrors.paymentAmount = "Please enter a valid payment amount";
    } else if (parseFloat(paymentAmount) > totals.operatorPayable) {
      newErrors.paymentAmount = "Payment amount cannot exceed operator payable amount";
    }
    
    
    if (!settlementMethod) {
      newErrors.settlementMethod = "Please select settlement method";
    }
    
    if (settlementMethod === "bank_transfer" && !bankName) {
      newErrors.bankName = "Bank name is required for bank transfer";
    }
    
    if (settlementMethod === "bank_transfer" && !accountNumber) {
      newErrors.accountNumber = "Account number is required for bank transfer";
    }
    
    if ((settlementMethod === "bank_transfer" || settlementMethod === "upi" || settlementMethod === "cheque") && !referenceNumber) {
      newErrors.referenceNumber = "Reference number is required for digital payments";
    }
    
    if (paymentCollectorName && !paymentCollectorMobile) {
      newErrors.paymentCollectorMobile = "Mobile number is required when collector name is provided";
    }
    
    if (paymentCollectorMobile && !paymentCollectorName) {
      newErrors.paymentCollectorName = "Collector name is required when mobile number is provided";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      if (!autoOperator) {
        throw new Error("Operator not found");
      }

      // Generate settlement number
      const settlementNumber = `STL-${Date.now()}`;
      
      // Create settlement records for each ticket
      const paymentAmountNum = parseFloat(paymentAmount);
      const isFullPayment = paymentAmountNum >= totals.operatorPayable;
      const paymentStatus = isFullPayment ? 'done' : (paymentAmountNum > 0 ? 'partial' : 'pending');
      
      const settlementRecords = selectedTicketsData.map((ticket) => {
        const ticketOperatorPayable = ticket.amount - (ticket.amount * totals.commissionRate / 100);
        // Apply "Amount - Paid amount" logic
        const ticketPaidAmount = paymentAmountNum > 0 ? Math.min(paymentAmountNum, ticketOperatorPayable) : 0;
        const ticketRemainingAmount = ticketOperatorPayable - ticketPaidAmount;
        
        return {
          ticket_id: ticket.id,
          operator_name: autoOperator.name,
          mobile_number: autoOperator.mobile_number,
          total_amount: ticket.amount,
          commission_percentage: totals.commissionRate,
          commission_amount: ticket.amount * totals.commissionRate / 100,
          operator_payable: ticketOperatorPayable,
          is_paid: isFullPayment,
          paid_at: paymentAmountNum > 0 ? new Date().toISOString() : null,
          payment_status: paymentStatus,
          paid_amount: ticketPaidAmount > 0 ? ticketPaidAmount : null,
          remaining_amount: ticketRemainingAmount,
          settlement_method: settlementMethod,
          reference_number: referenceNumber || settlementNumber,
          bank_name: bankName || null,
          account_number: accountNumber || null,
          payment_collector_name: paymentCollectorName || null,
          payment_collector_mobile: paymentCollectorMobile || null,
          payment_collected_at: paymentCollectorName ? new Date().toISOString() : null
        };
      });

      const { error: settlementError } = await supabase
        .from("operator_settlements")
        .insert(settlementRecords);

      if (settlementError) {
        console.error("Settlement creation error:", settlementError);
        throw new Error("Failed to create settlement records");
      }

      // Create accounting entry for commission
      const { data: categories } = await supabase
        .from("accounting_categories")
        .select("id")
        .eq("name", "Commission")
        .eq("category_type", "Income")
        .single();

      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("name", "Cash")
        .single();

      if (categories && accounts) {
        await supabase.from("accounting_entries").insert({
          account_id: accounts.id,
          category_id: categories.id,
          entry_type: "Income",
          amount: totals.commissionAmount,
          entry_date: new Date().toISOString().split("T")[0],
          description: `Commission from ${autoOperator.name} - ${totals.totalTickets} tickets`,
          created_at: new Date().toISOString()
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Settlement processing error:", error);
      alert("Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Operator Settlement</h3>
              <p className="text-sm text-gray-600 mt-1">Complete settlement details for selected tickets</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">

            {/* Ticket Details Table */}
            {selectedTicketsData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Selected Tickets ({selectedTicketsData.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journey</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTicketsData.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{ticket.ticket_number}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{ticket.passenger_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{ticket.pickup_city} → {ticket.drop_city}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{new Date(ticket.journey_date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{ticket.operators?.[0]?.name || autoOperator?.name || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">₹{ticket.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settlement Summary */}
            {selectedTicketsData.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Settlement Summary</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Total Tickets</p>
                    <p className="text-lg font-semibold text-blue-900">{totals.totalTickets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total Amount</p>
                    <p className="text-lg font-semibold text-blue-900">
                      ₹{totals.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Commission ({totals.commissionRate}%)</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₹{totals.commissionAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Operator Payable</p>
                    <p className="text-lg font-semibold text-blue-900">
                      ₹{totals.operatorPayable.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            {selectedTicketsData.length > 0 && (
              <div className="space-y-4">  
                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter payment amount"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {errors.paymentAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentAmount}</p>
                  )}
                  {paymentAmount && parseFloat(paymentAmount) < totals.operatorPayable && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm font-medium text-yellow-800">Partial Payment Details</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="ml-2 font-medium text-blue-600">₹{totals.operatorPayable.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="ml-2 font-medium text-green-600">₹{parseFloat(paymentAmount).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining:</span>
                          <span className="ml-2 font-medium text-orange-600">₹{(totals.operatorPayable - parseFloat(paymentAmount)).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Formula:</span>
                          <span className="ml-2 text-xs text-gray-500">Amount - Paid Amount</span>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700 mt-2">Status will be marked as &quot;Partial Paid&quot;</p>
                    </div>
                  )}
                  {paymentAmount && parseFloat(paymentAmount) >= totals.operatorPayable && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Full Payment Complete</p>
                          <p className="text-xs text-green-700">Settlement will be marked as &quot;Paid&quot;</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                
                {/* Settlement Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settlement Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  {errors.settlementMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.settlementMethod}</p>
                  )}
                </div>

                {/* Payment Collector Details */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-4">Payment Collector Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collector Name
                      </label>
                      <input
                        type="text"
                        value={paymentCollectorName}
                        onChange={(e) => setPaymentCollectorName(e.target.value)}
                        placeholder="Enter collector name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.paymentCollectorName && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentCollectorName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collector Mobile
                      </label>
                      <input
                        type="text"
                        value={paymentCollectorMobile}
                        onChange={(e) => setPaymentCollectorMobile(e.target.value)}
                        placeholder="Enter collector mobile number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {errors.paymentCollectorMobile && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentCollectorMobile}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank/Transfer Details */}
                {(settlementMethod === "bank_transfer" || settlementMethod === "upi" || settlementMethod === "cheque") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-4">Bank/Transfer Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reference Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Enter reference/transaction number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.referenceNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.referenceNumber}</p>
                        )}
                      </div>
                      
                      {settlementMethod === "bank_transfer" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="Enter bank name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.bankName && (
                              <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="Enter account number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.accountNumber && (
                              <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}


            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedTicketsData.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Process Settlement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
