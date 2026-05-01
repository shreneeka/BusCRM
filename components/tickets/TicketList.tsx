"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Bus,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

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

export default function TicketList({
  initialTickets = [],
}: {
  initialTickets?: Ticket[];
}) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPickup, setFilterPickup] = useState("");
  const [filterDrop, setFilterDrop] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchType, filterStatus, filterPickup, filterDrop]);

const filteredTickets = tickets.filter((ticket) => {
    // Search query - match based on search type
    const query = searchQuery.toLowerCase().trim();
    const searchDigits = query.replace(/\D/g, ""); // Extract only digits for mobile search
    
    let matchesSearch = true;
    if (query !== "") {
      const mobileDigits = ticket.mobile_number.replace(/\D/g, "");
      switch (searchType) {
        case "mobile":
          matchesSearch = mobileDigits.includes(searchDigits);
          break;
        case "name":
          matchesSearch = ticket.passenger_name.toLowerCase().includes(query);
          break;
        case "ticket":
          matchesSearch = ticket.ticket_number.toLowerCase().includes(query);
          break;
        default: // all
          const matchesMobile = searchDigits !== "" && mobileDigits.includes(searchDigits);
          const matchesName = ticket.passenger_name.toLowerCase().includes(query);
          const matchesTicket = ticket.ticket_number.toLowerCase().includes(query);
          matchesSearch = matchesMobile || matchesName || matchesTicket;
          break;
      }
    }

    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;

    const matchesPickup =
      filterPickup === "" || ticket.pickup_location.toLowerCase().includes(filterPickup.toLowerCase());

    const matchesDrop =
      filterDrop === "" || ticket.drop_location.toLowerCase().includes(filterDrop.toLowerCase());

    return matchesSearch && matchesStatus && matchesPickup && matchesDrop;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Settled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Booked":
        return "bg-emerald-500";
      case "Cancelled":
        return "bg-rose-500";
      case "Settled":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4]">
      {/* Header & Search Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/50 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#3da9d4]" />
            Ticket Bookings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary pl-9 py-2 text-sm w-full bg-white"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="input-primary py-2 text-sm w-full bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Fields</option>
              <option value="mobile">Mobile Number</option>
              <option value="name">Passenger Name</option>
              <option value="ticket">Ticket Number</option>
            </select>
          </div>
          <div className="relative w-full sm:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-primary py-2 text-sm w-full bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Booked">Booked</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <input
              type="text"
              placeholder="Pickup Location"
              value={filterPickup}
              onChange={(e) => setFilterPickup(e.target.value)}
              className="input-primary py-2 text-sm w-full bg-white"
            />
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <input
              type="text"
              placeholder="Drop Location"
              value={filterDrop}
              onChange={(e) => setFilterDrop(e.target.value)}
              className="input-primary py-2 text-sm w-full bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <Bus className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No tickets found</p>
            <p className="text-slate-500 text-xs">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Start by booking a new ticket"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Passenger
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Pickup and Drop Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Journey
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Seats
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                    idx % 2 === 0 ? "" : ""
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusDot(
                          ticket.status
                        )}`}
                      />
                      <span className="font-bold text-slate-800 text-xs">
                        {ticket.ticket_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800 text-xs">
                        {ticket.passenger_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.mobile_number}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-700">
                      <span className="truncate">{ticket.pickup_location}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{ticket.drop_location}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-800">
                    {new Date(ticket.journey_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-slate-800">
                        {ticket.total_seats}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {ticket.travel_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-xs">
                      ₹{ticket.amount.toLocaleString("en-IN")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Footer Stats */}
      {filteredTickets.length > 0 && (
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                Total Revenue
              </p>
              <p className="text-sm font-bold text-slate-800">
                ₹
                {filteredTickets
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString("en-IN")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                Total Seats
              </p>
              <p className="text-sm font-bold text-slate-800">
                {filteredTickets.reduce((sum, t) => sum + t.total_seats, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                Booked
              </p>
              <p className="text-sm font-bold text-emerald-600">
                {filteredTickets.filter((t) => t.status === "Booked").length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                Cancelled
              </p>
              <p className="text-sm font-bold text-rose-600">
                {filteredTickets.filter((t) => t.status === "Cancelled").length}
              </p>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                <span className="text-xs">←</span>
              </button>
              <span className="text-xs text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              >
                <span className="text-xs">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
