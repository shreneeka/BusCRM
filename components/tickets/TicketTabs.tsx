"use client";

import { useState, useEffect } from "react";
import { Plus, Ticket, Search, CreditCard } from "lucide-react";
import TicketBookingForm from "./TicketBookingForm";
import TicketListUpdated from "./TicketListUpdated";
import { createClient } from "@/lib/supabase/client";

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string;
  travel_type: "AC" | "Non-AC";
  account_id: string | null;
  account_type: string;
  amount: number;
  operator_id: string;
  settlement_status: "pending" | "paid";
  settlement_timestamp: string | null;
  payment_status: "paid" | "partial" | "not_paid";
  settlement_processed_at: string | null;
  created_at: string;
}

export default function TicketTabs({
  initialTickets,
}: {
  initialTickets: Ticket[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "partial" | "not_paid">("all");
  const [filterOperator, setFilterOperator] = useState<string>("");
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  const fetchOperators = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .order("name");

      if (error) {
        console.error("Database error fetching operators:", error);
        setOperators([]);
        return;
      }
      
      setOperators(data || []);
    } catch (error) {
      console.error("Unexpected error fetching operators:", error);
      setOperators([]);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4]">
      {/* Header with Tabs and Filters */}
      <div className="p-3 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "pending" | "paid" | "partial" | "not_paid")}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Settlement</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="not_paid">Not Paid</option>
            </select>

            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Operators</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedTickets && selectedTickets.size > 0 && (
              <>
                <span className="text-sm text-gray-600 font-medium">
                  {selectedTickets.size} ticket{selectedTickets.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setShowSettlementModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                  title={`Settle ${selectedTickets.size} selected ticket${selectedTickets.size > 1 ? 's' : ''}`}
                >
                  <CreditCard className="w-4 h-4" />
                  Settle Selected
                </button>
                <button
                  onClick={() => setSelectedTickets(new Set())}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  title="Clear selection"
                >
                  Clear
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="btn-brand flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Form */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between bg-white border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book New Ticket</h3>
                <p className="text-xs text-slate-500 mt-1">Fill in the details below to create a ticket</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TicketBookingForm onSuccess={() => setIsAddOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <TicketListUpdated 
          initialTickets={initialTickets}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          filterOperator={filterOperator}
          setSearchTerm={setSearchTerm}
          setFilterStatus={setFilterStatus}
          setFilterOperator={setFilterOperator}
          selectedTickets={selectedTickets}
          setSelectedTickets={setSelectedTickets}
          showSettlementModal={showSettlementModal}
          setShowSettlementModal={setShowSettlementModal}
        />
      </div>
    </div>
  );
}