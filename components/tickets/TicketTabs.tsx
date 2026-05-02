"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import TicketBookingForm from "./TicketBookingForm";
import TicketList from "./TicketList";

interface Ticket {
  id: string;
  passenger_name: string;
  mobile_number: string;
  pickup_location: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string | null;
  travel_type: "AC" | "Non-AC";
  ticket_number: string;
  account_id: string | null;
  account_type: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function TicketTabs({
  initialTickets,
}: {
  initialTickets: Ticket[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4]">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between gap-4 px-5 pt-4 border-b border-slate-100 bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ticket Management</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-sm"
        >
          <Plus className="w-3 h-3" />
          Add Tickets
        </button>
      </div>

      {/* Modal for Form */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white border-b border-slate-100 px-6 py-4">
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
            <div className="p-6">
              <TicketBookingForm onSuccess={() => setIsAddOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <TicketList initialTickets={initialTickets} />
      </div>
    </div>
  );
}