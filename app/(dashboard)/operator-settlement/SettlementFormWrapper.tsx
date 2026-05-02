"use client";

import { useState, useEffect } from "react";
import { CreditCard, Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { getAccounts } from "@/lib/actions/ticket.actions";
import { getSettlementCalculations, settleOperatorPayment } from "@/lib/actions/settlement.actions";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

interface SettlementCalculation {
  operator_id: string;
  operator_name: string;
  commission_percent: number;
  ticket_count: number;
  total_amount: number;
  commission_amount: number;
  operator_payable: number;
  pending_count: number;
  pending_amount: number;
}

export default function SettlementFormWrapper() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      
      // Set default account if available
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSettlePayment = async (operatorId: string, operatorName: string) => {
    if (!selectedAccount) {
      alert("Please select an account");
      return;
    }

    setProcessing(true);
    setShowSuccess(false);
    
    try {
      const result = await settleOperatorPayment(operatorId, selectedAccount);
      
      if (result.success) {
        setSuccessMessage(`Payment settled successfully for ${operatorName}: ${result.message}`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // Trigger a refresh of the parent component
        window.location.reload();
      } else {
        alert(`Payment failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error settling payment:", error);
      alert("Failed to settle payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="saas-card bg-white p-5 flex flex-col border-t-4 border-t-[#3da9d4] shadow-sm relative overflow-hidden h-fit max-h-full">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Settlement Options</h2>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Configure payment settings
        </p>
      </div>

      <div className="flex flex-col min-h-0">
        <div className="flex flex-col gap-5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Account Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Payment Account *
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="input-primary pl-9 w-full text-sm py-2.5 appearance-none bg-white"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (₹{account.balance.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Info */}
            {selectedAccount && (() => {
              const account = accounts.find(a => a.id === selectedAccount);
              return account ? (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-[#3da9d4]" />
                    <span className="text-sm font-bold text-slate-800">{account.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-medium text-slate-700">{account.type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Balance:</span>
                      <span className="font-bold text-emerald-600">₹{account.balance.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-medium ${account.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div className="mt-4 pt-4 shrink-0 flex flex-col gap-3 bg-white border-t border-slate-100">
          {showSuccess && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase bg-emerald-50 py-2 rounded-lg border border-emerald-100 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> {successMessage}
            </div>
          )}

          <div className="text-xs text-slate-500 text-center">
            Select an account to settle operator payments. Click "Settle Payment" in the table to process payments.
          </div>
        </div>
      </div>
    </div>
  );
}
