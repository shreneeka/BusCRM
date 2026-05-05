"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Phone, MapPin, Calendar, Clock, Users, Bus, CreditCard, CheckCircle, XCircle, AlertCircle, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  operator_settlements?: Array<{
    id: string;
    payment_status: string;
    paid_amount: number;
    remaining_amount: number;
    operator_payable: number;
    commission_percentage: number;
  }>;
}

interface City {
  id: string;
  name: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            *,
            operator_settlements (
              id,
              payment_status,
              paid_amount,
              remaining_amount,
              operator_payable,
              commission_percentage
            )
          `)
          .eq("id", params.ticketId)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setTicket(data);
        }
      } catch (err) {
        setError("Failed to fetch ticket details");
      } finally {
        setLoading(false);
      }
    };

    if (params.ticketId) {
      fetchTicket();
    }
  }, [params.ticketId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Settled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Booked":
        return <CheckCircle className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      case "Settled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3da9d4]"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mb-3" />
        <p className="text-slate-600 font-medium">Ticket not found</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#3da9d4] text-white rounded-lg hover:bg-[#2d8bc4] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => router.back()}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ticket Details</h1>
          <p className="text-xs text-slate-500">Ticket #{ticket.ticket_number}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border font-medium text-xs animate-slideIn ${getStatusColor(
            ticket.status
          )}`}
        >
          {getStatusIcon(ticket.status)}
          {ticket.status}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Passenger Information */}
        <div className="lg:col-span-2 space-y-2">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-3 animate-slideUp">
            <h2 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-1">
              <div className="p-1 bg-[#3da9d4] rounded">
                <Users className="w-3 h-3 text-white" />
              </div>
              Passenger Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-slate-50 rounded">
                  <Users className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="font-medium text-sm text-slate-900">{ticket.passenger_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1 bg-slate-50 rounded">
                  <Phone className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Mobile</p>
                  <p className="font-medium text-sm text-slate-900">{ticket.mobile_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Information */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 p-3 animate-slideUp" style={{animationDelay: "0.1s"}}>
            <h2 className="text-base font-semibold text-orange-900 mb-2 flex items-center gap-1">
              <div className="p-1 bg-orange-500 rounded">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              Journey Information
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-xs text-slate-500">From</p>
                  </div>
                  <p className="font-medium text-sm text-slate-900">{ticket.pickup_location}</p>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <p className="text-xs text-slate-500">To</p>
                  </div>
                  <p className="font-medium text-sm text-slate-900">{ticket.drop_location}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-medium text-sm text-slate-900">
                      {new Date(ticket.journey_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="font-medium text-sm text-slate-900">{ticket.pickup_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Bus className="w-3 h-3 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-medium text-sm text-slate-900">{ticket.travel_type}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Information */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200 p-3 animate-slideUp" style={{animationDelay: "0.2s"}}>
            <h2 className="text-base font-semibold text-rose-900 mb-2 flex items-center gap-1">
              <div className="p-1 bg-rose-500 rounded">
                <Users className="w-3 h-3 text-white" />
              </div>
              Seat Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Seats</p>
                <p className="text-lg font-bold text-slate-900">{ticket.total_seats}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Seat Numbers</p>
                <div className="flex flex-wrap gap-1">
                  {ticket.seat_numbers?.map((seat, index) => (
                    <span
                      key={index}
                      className="px-1 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-2">
          {/* Payment Information */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-3 animate-slideUp" style={{animationDelay: "0.3s"}}>
            <h2 className="text-base font-semibold text-emerald-900 mb-2 flex items-center gap-1">
              <div className="p-1 bg-emerald-600 rounded">
                <span className="text-white font-bold text-xs">₹</span>
              </div>
              Payment Information
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-emerald-600">
                  {ticket.operator_settlements && ticket.operator_settlements.length > 0 ? (
                    ticket.operator_settlements[0].payment_status === 'partial' ? 'Paid Amount' :
                    ticket.operator_settlements[0].payment_status === 'done' ? 'Paid Amount' :
                    'Total Amount'
                  ) : 'Total Amount'}
                </p>
                <p className="text-xl font-bold text-emerald-900">
                  {ticket.operator_settlements && ticket.operator_settlements.length > 0 ? (
                    ticket.operator_settlements[0].payment_status === 'partial' ? (
                      `₹${((ticket.operator_settlements[0].operator_payable || 0) - (ticket.operator_settlements[0].remaining_amount || 0)).toLocaleString("en-IN")}`
                    ) : ticket.operator_settlements[0].payment_status === 'done' ? (
                      `₹${(ticket.operator_settlements[0].operator_payable || 0).toLocaleString("en-IN")}`
                    ) : (
                      `₹${ticket.amount.toLocaleString("en-IN")}`
                    )
                  ) : (
                    `₹${ticket.amount.toLocaleString("en-IN")}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Payment Type</p>
                <div className="flex items-center gap-1 mt-1">
                  <CreditCard className="w-3 h-3 text-emerald-500" />
                  <p className="font-medium text-emerald-900">{ticket.account_type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bus Information */}
          {ticket.bus_number && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3 animate-slideUp" style={{animationDelay: "0.4s"}}>
              <h2 className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-1">
                <Bus className="w-4 h-4 text-blue-600" />
                Bus Information
              </h2>
              <div>
                <p className="text-xs text-blue-600">Bus Number</p>
                <p className="font-medium text-blue-900">{ticket.bus_number}</p>
              </div>
            </div>
          )}

          {/* Booking Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-3 animate-slideUp" style={{animationDelay: "0.5s"}}>
            <h2 className="text-base font-semibold text-purple-900 mb-2">Booking Information</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-purple-600">Booking Date</p>
                <p className="font-medium text-purple-900 text-xs">
                  {new Date(ticket.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-600">Ticket Number</p>
                <p className="font-medium text-purple-900 font-mono text-xs">{ticket.ticket_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
