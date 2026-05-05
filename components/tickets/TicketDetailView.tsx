"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Phone, DollarSign, Bus, X } from "lucide-react";

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

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
}

export default function TicketDetailView({ ticket }: { ticket: Ticket }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    const displayMinutes = m.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passenger Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Passenger Information</h3>
                  <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Name:</span>
                      <span className="text-sm text-slate-900">{ticket.passenger_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Mobile:</span>
                      <span className="text-sm text-slate-900">{ticket.mobile_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Total Seats:</span>
                      <span className="text-sm text-slate-900">{ticket.total_seats}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Route:</span>
                      <span className="text-sm text-slate-900">{ticket.pickup_city} → {ticket.drop_city}</span>
                    </div>
                  </div>
                </div>

                {/* Journey Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Details</h3>
                  <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Journey Date:</span>
                      <span className="text-sm text-slate-900">{formatDate(ticket.journey_date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Pickup Time:</span>
                      <span className="text-sm text-slate-900">{formatTime(ticket.pickup_time)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bus className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Bus Number:</span>
                      <span className="text-sm text-slate-900">{ticket.bus_number || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Travel Type:</span>
                      <span className="text-sm text-slate-900">{ticket.travel_type}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Amount:</span>
                      <span className="text-sm text-slate-900">{formatCurrency(ticket.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
