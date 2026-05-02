"use client";

import { useState } from "react";
import { settleOperatorPayment, OperatorTicket } from "@/lib/actions/settlement.actions";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";


interface SettlePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticket: OperatorTicket;
}

export default function SettlePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  ticket,
}: SettlePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate settlement amounts
  const totalAmount = ticket.amount;
  const commissionPercent = ticket.operators?.commission_percent || 10;
  const commissionAmount = (totalAmount * commissionPercent) / 100;
  const operatorPayable = totalAmount - commissionAmount;

  const handleSettlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!ticket.operators?.operator_name) {
        throw new Error("Operator information is missing");
      }

      // Get account for settlement (using first account for now)
      const supabase = createClient();
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (!accounts || accounts.length === 0) {
        throw new Error("No active account found for settlement");
      }

      const result = await settleOperatorPayment(
        ticket.operator_id,
        accounts[0].id
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error("Failed to settle payment");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to settle payment";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#1e224c]">
            Settle Operator Payment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ticket Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Ticket Details</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Ticket:</span>
                <span className="font-medium text-slate-800">
                  #{ticket.ticket_number}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Passenger:</span>
                <span className="font-medium text-slate-800">
                  {ticket.passenger_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Journey:</span>
                <span className="font-medium text-slate-800">
                  {new Date(ticket.journey_date).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Operator Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3">Operator Details</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Operator:</span>
                <span className="font-medium text-slate-800">
                  {ticket.operators?.operator_name || "Not assigned"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Commission:</span>
                <span className="font-medium text-emerald-600">
                  {commissionPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Calculation */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Settlement Calculation
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Amount:</span>
                <span className="font-bold text-slate-800">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Commission ({commissionPercent}%):
                </span>
                <span className="font-bold text-emerald-600">
                  ₹{commissionAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">
                    Operator Payable:
                  </span>
                  <span className="font-bold text-lg text-[#3da9d4]">
                    ₹{operatorPayable.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Important Note */}
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Important Note
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Upon settlement, the operator payable amount (₹
                  {operatorPayable.toLocaleString("en-IN")}) will be deducted from
                  the account balance, and the commission amount (₹
                  {commissionAmount.toLocaleString("en-IN")}) will be retained as
                  income.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSettlePayment}
              disabled={loading || !ticket.operators}
              className="flex-1 px-4 py-2.5 bg-[#3da9d4] text-white rounded-xl hover:bg-[#2d8bc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Settle Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
