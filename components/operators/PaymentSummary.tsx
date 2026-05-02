"use client";

import { useMemo, useState } from "react";
import { Search, Users, CreditCard, Calendar, TrendingUp, Phone } from "lucide-react";
import { getOperatorPaymentSummary } from "@/lib/actions/payment.actions";
import type { PaymentSummary } from "@/lib/actions/payment.actions";

export default function PaymentSummary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [summaries, setSummaries] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useMemo(() => {
    const loadData = async () => {
      try {
        const data = await getOperatorPaymentSummary();
        setSummaries(data);
      } catch (error) {
        console.error("Error loading payment summary:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredSummaries = summaries.filter(summary =>
    summary.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.mobile_number?.includes(searchTerm)
  );

  const totalStats = useMemo(() => {
    return {
      totalOperators: summaries.length,
      totalTickets: summaries.reduce((sum, s) => sum + s.total_tickets, 0),
      totalPaidTickets: summaries.reduce((sum, s) => sum + s.paid_tickets, 0),
      totalUnpaidTickets: summaries.reduce((sum, s) => sum + s.unpaid_tickets, 0),
      totalAmount: summaries.reduce((sum, s) => sum + s.total_amount, 0),
      totalCollected: summaries.reduce((sum, s) => sum + s.collected_amount, 0),
      totalPending: summaries.reduce((sum, s) => sum + s.pending_amount, 0),
    };
  }, [summaries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading payment summary...</div>
      </div>
    );
  }

  return (
    <div className="saas-card bg-white flex flex-col h-full">
      {/* Search and Stats */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-slate-50/50 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">Total Amount</span>
            </div>
            <div className="text-lg font-bold text-emerald-800 mt-1">
              ₹{totalStats.totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-semibold">Collected</span>
            </div>
            <div className="text-lg font-bold text-blue-800 mt-1">
              ₹{totalStats.totalCollected.toFixed(2)}
            </div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold">Pending</span>
            </div>
            <div className="text-lg font-bold text-amber-800 mt-1">
              ₹{totalStats.totalPending.toFixed(2)}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold">Operators</span>
            </div>
            <div className="text-lg font-bold text-purple-800 mt-1">
              {totalStats.totalOperators}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 font-bold whitespace-nowrap">Operator</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Contact</th>
              <th className="px-4 py-3 font-bold text-center whitespace-nowrap">Tickets</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Total Amount</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Collected</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Pending</th>
              <th className="px-4 py-3 font-bold text-center whitespace-nowrap">Collection Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {searchTerm ? "No operators matched your search." : "No operators found."}
                </td>
              </tr>
            ) : (
              filteredSummaries.map((summary) => {
                const collectionRate = summary.total_tickets > 0 
                  ? (summary.paid_tickets / summary.total_tickets) * 100 
                  : 0;
                
                return (
                  <tr key={summary.operator_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">{summary.operator_name}</div>
                        {summary.person_name && (
                          <div className="text-xs text-slate-500">{summary.person_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{summary.mobile_number || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-slate-700 font-medium">{summary.total_tickets}</span>
                        <span className="text-xs text-slate-500">
                          ({summary.paid_tickets}/{summary.unpaid_tickets})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-700">
                      ₹{summary.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-emerald-600">
                        ₹{summary.collected_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${summary.pending_amount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        ₹{summary.pending_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`w-full max-w-[60px] bg-slate-200 rounded-full h-2`}>
                          <div 
                            className={`h-2 rounded-full ${
                              collectionRate >= 80 ? 'bg-emerald-500' : 
                              collectionRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(collectionRate, 100)}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs font-medium text-slate-600">
                          {collectionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
