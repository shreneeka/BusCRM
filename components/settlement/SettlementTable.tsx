"use client";

import { useState } from "react";
import {
  Users,
  DollarSign,
  Calculator,
  CheckCircle2,
  Search,
  Loader2,
  CreditCard,
  Database,
} from "lucide-react";

// --- TYPES ---
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

interface SettlementTableProps {
  calculations: SettlementCalculation[];
  onSettlePayment?: (operatorId: string) => void;
  processing: boolean;
}

export default function SettlementTable({
  calculations,
  onSettlePayment,
  processing,
}: SettlementTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [settingUpDb, setSettingUpDb] = useState(false);

  const filteredCalculations = calculations.filter((calc) => {
    const query = searchQuery.toLowerCase().trim();
    return calc.operator_name.toLowerCase().includes(query);
  });

  const handleSetupDatabase = async () => {
    setSettingUpDb(true);
    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (result.success) {
        window.location.reload(); // Refresh to show the updated data
      } else {
        console.error('Database setup failed:', result.error);
      }
    } catch (error) {
      console.error('Error setting up database:', error);
    } finally {
      setSettingUpDb(false);
    }
  };

  if (calculations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calculator className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">No settlements found</p>
        <p className="text-slate-500 text-xs mb-4">Database setup may be required</p>
        
        <button
          onClick={handleSetupDatabase}
          disabled={settingUpDb}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3da9d4] text-white text-sm font-medium rounded-lg hover:bg-[#2d8bc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {settingUpDb ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up database...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Setup Database
            </>
          )}
        </button>
        
        <div className="text-xs text-slate-400 max-w-md">
          <p className="mb-2">If setup doesn't work, ensure:</p>
          <ol className="text-left list-decimal list-inside space-y-1">
            <li>Supabase is running locally</li>
            <li>Database migrations are applied</li>
            <li>Operators table exists with sample data</li>
            <li>Tickets are marked as &quot;Booked&quot; status</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-primary pl-9 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredCalculations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No operators found</p>
            <p className="text-slate-500 text-xs">Try adjusting your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Commission (10%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Operator Payable
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCalculations.map((calc) => (
                  <tr key={calc.operator_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#f0f9ff] rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-[#3da9d4]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {calc.operator_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {calc.pending_count} pending tickets
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-slate-700">{calc.ticket_count}</p>
                        <p className="text-xs text-slate-500">
                          {calc.pending_count} pending
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-800">
                          ₹{calc.total_amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Calculator className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className="text-sm font-medium text-emerald-600">
                          ₹{calc.commission_amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-[#3da9d4] mr-2" />
                        <span className="text-sm font-medium text-[#3da9d4]">
                          ₹{calc.operator_payable.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => onSettlePayment?.(calc.operator_id)}
                          disabled={processing || calc.pending_count === 0}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3da9d4] text-white text-xs font-medium rounded-lg hover:bg-[#2d8bc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {calc.pending_count === 0 ? "Settled" : "Settle Payment"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          Showing {filteredCalculations.length} of {calculations.length} operators
        </p>
      </div>
    </div>
  );
}
