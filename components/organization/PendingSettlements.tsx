"use client";

import { useState, useEffect } from "react";
import { getPendingTickets, OperatorTicket } from "@/lib/actions/settlement.actions";
import SettlePaymentModal from "./SettlePaymentModal";
import {
  DollarSign,
  Calendar,
  Clock,
  Loader2,
  Search,
  User,
  Calculator,
  CheckCircle2,
} from "lucide-react";


export default function PendingSettlements({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const [pendingTickets, setPendingTickets] = useState<OperatorTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<OperatorTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPendingSettlements = async () => {
    setLoading(true);
    try {
      const data = await getPendingTickets();
      setPendingTickets(data);
    } catch (error) {
      console.error("Error fetching pending settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSettlements();
  }, []);

  const filteredTickets = pendingTickets.filter((ticket) => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) return true;
    
    return (
      (ticket.ticket_number?.toLowerCase().includes(query) || false) ||
      (ticket.passenger_name?.toLowerCase().includes(query) || false) ||
      (ticket.operators?.operator_name?.toLowerCase().includes(query) || false)
    );
  });

  // Calculate totals
  const totalAmount = filteredTickets.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommission = filteredTickets.reduce((sum, t) => {
    const commissionPercent = t.operators?.commission_percent || 10;
    return sum + (t.amount * commissionPercent) / 100;
  }, 0);
  const totalPayable = filteredTickets.reduce((sum, t) => {
    const commissionPercent = t.operators?.commission_percent || 10;
    return sum + (t.amount - (t.amount * commissionPercent) / 100);
  }, 0);

  const handleSettleClick = (ticket: OperatorTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleSettlementSuccess = () => {
    fetchPendingSettlements();
    onRefresh?.();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3da9d4]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ticket, passenger, operator..."
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
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Clock className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">
                {searchQuery ? "No pending settlements found" : "No pending settlements"}
              </p>
              <p className="text-slate-500 text-xs">
                {searchQuery ? "Try adjusting your search" : "All tickets have been settled"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredTickets.map((ticket) => {
                const commissionPercent = ticket.operators?.commission_percent || 10;
                const commissionAmount = (ticket.amount * commissionPercent) / 100;
                const operatorPayable = ticket.amount - commissionAmount;

                return (
                  <div
                    key={ticket.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          #{ticket.ticket_number}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {ticket.passenger_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600">
                            {ticket.operators?.operator_name || "No operator"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">
                          ₹{operatorPayable.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-slate-500">Payable</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Journey</p>
                          <p className="font-medium text-slate-700">
                            {new Date(ticket.journey_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="font-medium text-slate-800">
                            ₹{ticket.amount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">
                            Commission ({commissionPercent}%)
                          </p>
                          <p className="font-medium text-emerald-600">
                            ₹{commissionAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSettleClick(ticket)}
                        className="px-3 py-1.5 bg-[#3da9d4] text-white text-xs font-medium rounded-lg hover:bg-[#2d8bc4] transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Settle Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredTickets.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <p className="text-xs text-slate-500">
              Showing {filteredTickets.length} pending settlement
              {filteredTickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      {selectedTicket && (
        <SettlePaymentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSettlementSuccess}
          ticket={selectedTicket}
        />
      )}
    </>
  );
}
