"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calculator,
  CreditCard,
} from "lucide-react";

interface OperatorSettlement {
  id: string;
  ticket_id: string;
  operator_name: string;
  total_amount: number;
  commission_amount: number;
  commission_percentage: number;
  operator_payable: number;
  paid_amount: number | null;
  remaining_amount: number;
  payment_status: 'pending' | 'partial' | 'done';
  is_paid: boolean;
  settlement_method: string;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  amount: number;
  operator_id: string;
  payment_status?: string;
  operator_settlements?: Array<{
    id: string;
    payment_status: string;
    paid_amount: number;
    remaining_amount: number;
    operator_payable: number;
    commission_percentage: number;
  }>;
}

interface PartialPaymentModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PartialPaymentModal({ 
  ticket, 
  onClose, 
  onSuccess 
}: PartialPaymentModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [currentSettlement, setCurrentSettlement] = useState<{
  id: string;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number;
  operator_payable: number;
  commission_percentage: number;
} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Always fetch the latest settlement data from database
    const fetchLatestSettlement = async () => {
      try {
        const { data: latestSettlement } = await supabase
          .from('operator_settlements')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        console.log('📋 Latest settlement fetched:', latestSettlement);
        setCurrentSettlement(latestSettlement);
        
        // Check if payment is already done and close modal if so
        if (ticket.payment_status === 'paid' || (latestSettlement && latestSettlement.payment_status === 'done')) {
          alert('Payment is already completed for this ticket.');
          onClose();
          return;
        }
      } catch (error) {
        console.log('No existing settlement found for ticket:', ticket.id);
        setCurrentSettlement(null);
      }
    };
    
    fetchLatestSettlement();
  }, [ticket, onClose]);

  const getRemainingAmount = () => {
    console.log('💳 Calculating remaining amount:', { 
      ticketId: ticket.id, 
      ticketAmount: ticket.amount,
      currentSettlement,
      settlementRemaining: currentSettlement?.remaining_amount 
    });
    
    if (currentSettlement) {
      return currentSettlement.remaining_amount || 0;
    }
    // If no settlement exists, the full amount is remaining
    return ticket.amount;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const remainingAmount = getRemainingAmount();
    const paymentAmountNum = parseFloat(paymentAmount);

    if (!paymentAmount || paymentAmountNum <= 0) {
      newErrors.paymentAmount = "Please enter a valid payment amount";
    } else if (paymentAmountNum > remainingAmount) {
      newErrors.paymentAmount = `Payment amount cannot exceed remaining amount of ₹${remainingAmount.toFixed(2)}`;
    }

    if (!settlementMethod) {
      newErrors.settlementMethod = "Please select settlement method";
    }

    if ((settlementMethod === "bank_transfer" || settlementMethod === "upi" || settlementMethod === "cheque") && !referenceNumber) {
      newErrors.referenceNumber = "Reference number is required for digital payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentAmountNum = parseFloat(paymentAmount);
      const remainingAmount = getRemainingAmount();
      // Use small epsilon for floating point comparison
      const isFullyPaid = (remainingAmount - paymentAmountNum) <= 0.01;
      
      console.log('💰 Payment calculation:', {
        paymentAmount: paymentAmountNum,
        remainingAmount,
        remainingAfterPayment: remainingAmount - paymentAmountNum,
        isFullyPaid
      });

      // Always check for existing settlement first
      console.log(`🔍 Checking for existing settlement for ticket ${ticket.id}`);
      const { data: existingSettlement, error: fetchError } = await supabase
        .from('operator_settlements')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('📊 Settlement query result:', { existingSettlement, fetchError });

      if (existingSettlement) {
        // Update existing settlement
        console.log('🔄 Updating existing settlement:', existingSettlement.id);
        console.log('💰 Payment details:', { isFullyPaid, paymentAmountNum, currentPaid: existingSettlement.paid_amount, remaining: existingSettlement.remaining_amount });
        
        const { updateSettlementPayment } = await import("@/lib/actions/settlement.actions");
        
        const result = await updateSettlementPayment(
          existingSettlement.id,
          isFullyPaid,
          paymentAmountNum
        );

        console.log('✅ Update result:', result);

        if (!result.success) {
          console.error('❌ Update failed:', result.error);
          throw new Error(result.error || "Failed to update payment");
        }
      } else {
        // Create new settlement record
        console.log('Creating new settlement for ticket:', ticket.id);
        const { data: ticketData } = await supabase
          .from('tickets')
          .select(`
            *,
            operators!inner(
              name,
              commission_percentage,
              mobile_number
            )
          `)
          .eq('id', ticket.id)
          .single();

        if (!ticketData || !ticketData.operators) {
          throw new Error('Operator information not found for this ticket');
        }
        
        // Apply commission for first payment
        const commissionRate = ticketData.operators.commission_percentage || 10;
        const commissionAmount = ticket.amount * commissionRate / 100;
        const operatorPayable = ticket.amount - commissionAmount;

        // Use the createOperatorSettlement function to ensure expense entries are created
        const { createOperatorSettlement } = await import("@/lib/actions/settlement.actions");
        
        const result = await createOperatorSettlement({
          operator_name: ticketData.operators.name,
          mobile_number: ticketData.operators.mobile_number,
          total_amount: ticket.amount,
          commission_percentage: commissionRate,
          commission_amount: commissionAmount,
          operator_payable: operatorPayable,
          is_paid: isFullyPaid,
          paid_at: isFullyPaid ? new Date().toISOString() : undefined,
          payment_status: isFullyPaid ? 'done' : (paymentAmountNum > 0 ? 'partial' : 'pending'),
          settlement_method: settlementMethod,
          reference_number: referenceNumber || undefined,
          notes: notes.trim() || undefined,
          ticket_ids: [ticket.id],
          // Set paid_amount for partial payments
          ...(paymentAmountNum > 0 && !isFullyPaid ? {
            paid_amount: paymentAmountNum,
            remaining_amount: operatorPayable - paymentAmountNum
          } : {})
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to create settlement record");
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const remainingAmount = getRemainingAmount();
  const paymentAmountNum = parseFloat(paymentAmount) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Ticket #{ticket.ticket_number} - {ticket.passenger_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{ticket.amount.toFixed(2)}</span>
              </div>
              {currentSettlement && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-medium text-purple-600">
                    {currentSettlement.payment_status === 'partial' ? '0%' : `${currentSettlement.commission_percentage}%`} 
                    {currentSettlement.payment_status === 'partial' ? (
                      <span className="text-xs text-gray-500 block">No commission on second+ payment</span>
                    ) : (
                      <span className="text-xs text-gray-500 block"> (₹{(ticket.amount * currentSettlement.commission_percentage / 100).toFixed(2)})</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Already Paid:</span>
                <span className="font-medium text-green-600">
                  ₹{(currentSettlement?.paid_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-medium">Remaining Amount:</span>
                <span className="font-bold text-orange-600">₹{remainingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
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
                  step="0.01"
                  max={remainingAmount}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.paymentAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentAmount}</p>
              )}
              {paymentAmountNum > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Maximum allowed: ₹{remainingAmount.toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method <span className="text-red-500">*</span>
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

            {(settlementMethod === "bank_transfer" || settlementMethod === "upi" || settlementMethod === "cheque") && (
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
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Payment Preview */}
            {paymentAmountNum > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Payment Preview</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount to pay:</span>
                    <span className="font-medium text-blue-600">₹{paymentAmountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining after payment:</span>
                    <span className="font-medium text-orange-600">
                      ₹{(remainingAmount - paymentAmountNum).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status after payment:</span>
                    <span className={`font-medium ${
                      remainingAmount - paymentAmountNum <= 0 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {remainingAmount - paymentAmountNum <= 0 ? 'Fully Paid' : 'Partial Paid'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || paymentAmountNum <= 0 || paymentAmountNum > remainingAmount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{paymentAmountNum.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
