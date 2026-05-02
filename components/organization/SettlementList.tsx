"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSettlementCalculations } from "@/lib/actions/settlement.actions";
import { DollarSign, Calendar, CheckCircle2, Clock, Loader2, Search } from "lucide-react";

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

export default function SettlementList({
  onRefresh,
  refreshTrigger = 0,
}: {
  onRefresh?: () => void;
  refreshTrigger?: number;
}) {
const [settlements, setSettlements] = useState<SettlementCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const data = await getSettlementCalculations();
      setSettlements(data);
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    fetchSettlements();
  }, [refreshTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredSettlements = settlements.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    return s.operator_name.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSettlements = filteredSettlements.slice(startIndex, startIndex + itemsPerPage);

// Calculate totals based on filtered (not paginated) data
  const totalAmount = filteredSettlements.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalCommission = filteredSettlements.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const totalPayable = filteredSettlements.reduce((sum, s) => sum + (s.operator_payable || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3da9d4]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by operator name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary pl-9 py-2 text-sm w-full bg-white"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Total Amount</p>
            <p className="text-lg font-bold text-slate-800">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Commission</p>
            <p className="text-lg font-bold text-emerald-600">
              ₹{totalCommission.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Payable</p>
            <p className="text-lg font-bold text-[#3da9d4]">
              ₹{totalPayable.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredSettlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <DollarSign className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">
              {searchQuery ? "No settlements found" : "No settlements yet"}
            </p>
            <p className="text-slate-500 text-xs">
              {searchQuery ? "Try adjusting your filters" : "Settlements will appear after ticket booking and payment"}
            </p>
          </div>
) : (
          <div className="p-4 space-y-3">
            {currentSettlements.map((settlement) => (
              <div
                key={settlement.operator_id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {settlement.operator_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {settlement.pending_count > 0 ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-700 font-medium">
                            {settlement.pending_count} pending
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs text-emerald-700 font-medium">Settled</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">
                      ₹{settlement.operator_payable.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-500">Payable</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Tickets</p>
                      <p className="font-medium text-slate-700">
                        {settlement.ticket_count} total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-medium text-slate-800">
                        ₹{settlement.total_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs text-slate-500">
                        Commission ({settlement.commission_percent}%)
                      </p>
                      <p className="font-medium text-emerald-600">
                        ₹{settlement.commission_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3da9d4]" />
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="font-medium text-slate-700">
                        {settlement.pending_count > 0 ? "Pending" : "Completed"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

{/* Footer & Pagination */}
      {filteredSettlements.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <strong className="text-slate-700">
              {filteredSettlements.length === 0 ? 0 : startIndex + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-700">
              {Math.min(startIndex + itemsPerPage, filteredSettlements.length)}
            </strong>{" "}
            of <strong className="text-slate-700">{filteredSettlements.length}</strong>{" "}
            settlements
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg shadow-sm">
              {currentPage} / {Math.max(1, totalPages)}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
