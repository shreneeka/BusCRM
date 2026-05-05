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
  Edit,
  Trash2,
  Eye,
  X,
  ExternalLink,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
}

interface City {
  id: string;
  name: string;
}

export default function TicketList({
  initialTickets = [],
}: {
  initialTickets?: Ticket[];
}) {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPickup, setFilterPickup] = useState("");
  const [filterDrop, setFilterDrop] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Checkbox states
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  
  // Modal states
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

// Fetch cities for dropdown
  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from("cities").select("*").order("name");
      if (data) setCities(data);
    }
    fetchCities();
  }, []);

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

  // Checkbox handlers
  const handleSelectAll = () => {
    const currentTicketIds = currentTickets.map(t => t.id);
    if (currentTicketIds.every(id => selectedTickets.has(id))) {
      // Deselect all current tickets
      const newSelected = new Set(selectedTickets);
      currentTicketIds.forEach(id => newSelected.delete(id));
      setSelectedTickets(newSelected);
    } else {
      // Select all current tickets
      const newSelected = new Set(selectedTickets);
      currentTicketIds.forEach(id => newSelected.add(id));
      setSelectedTickets(newSelected);
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const isAllCurrentSelected = currentTickets.length > 0 && currentTickets.every(t => selectedTickets.has(t.id));
  const isSomeCurrentSelected = currentTickets.some(t => selectedTickets.has(t.id));

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
    <div className="bg-white flex flex-col h-full">
      {/* Header & Search Bar */}
<div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2">
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
          <div className="relative flex-1 sm:flex-none sm:w-40">
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
          <div className="relative flex-1 sm:flex-none sm:w-40">
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
          <div className="relative flex-1 sm:flex-none sm:w-44">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterPickup}
              onChange={(e) => setFilterPickup(e.target.value)}
              className="input-primary pl-9 py-2 text-sm w-full bg-white appearance-none cursor-pointer"
            >
              <option value="">From Location</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none sm:w-44">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterDrop}
              onChange={(e) => setFilterDrop(e.target.value)}
              className="input-primary pl-9 py-2 text-sm w-full bg-white appearance-none cursor-pointer"
            >
              <option value="">To Location</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
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
          <table className="w-full text-left border-collapse table-compact">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th className="text-center w-12">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-slate-600 hover:text-[#3da9d4] transition-colors"
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : isSomeCurrentSelected ? (
                      <div className="w-4 h-4 border-2 border-[#3da9d4] rounded bg-[#3da9d4]/10" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th>Ticket</th>
                <th>Passenger</th>
                <th>Route</th>
                <th>Journey</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    idx % 2 === 0 ? "" : ""
                  }`}
                >
                  <td className="text-center">
                    <button
                      onClick={() => handleSelectTicket(ticket.id)}
                      className="flex items-center justify-center text-slate-600 hover:text-[#3da9d4] transition-colors"
                    >
                      {selectedTickets.has(ticket.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusDot(
                          ticket.status
                        )}`}
                      />
                      <a
                        href={`/tickets/${ticket.id}`}
                        className="font-bold text-slate-800 text-sm hover:text-[#3da9d4] transition-colors flex items-center gap-1 group"
                      >
                        {ticket.ticket_number}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {ticket.passenger_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ticket.mobile_number}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm text-slate-700">
                      <span className="truncate">{ticket.pickup_location}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{ticket.drop_location}</span>
                    </div>
                  </td>
                  <td className="text-sm text-slate-800">
                    {new Date(ticket.journey_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-800">
                        {ticket.total_seats}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md whitespace-nowrap">
                        {ticket.travel_type}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-sm">
                      ₹{ticket.amount.toLocaleString("en-IN")}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge-compact ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditTicket(ticket)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 rounded transition-colors"
                        title="Edit Ticket"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ticket.id)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-rose-600 rounded transition-colors"
                        title="Cancel Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Footer Stats */}
      {filteredTickets.length > 0 && (
        <div className="pagination-compact space-y-4">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="page-indicator">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Ticket Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ticket Details</h3>
                <p className="text-xs text-slate-500 mt-1">{viewTicket.ticket_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewTicket(null)}
                className="text-slate-500 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Passenger</p>
                  <p className="font-medium text-slate-800">{viewTicket.passenger_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Mobile</p>
                  <p className="font-medium text-slate-800">{viewTicket.mobile_number}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">From</p>
                  <p className="font-medium text-slate-800">{viewTicket.pickup_location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">To</p>
                  <p className="font-medium text-slate-800">{viewTicket.drop_location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Journey Date</p>
                  <p className="font-medium text-slate-800">
                    {new Date(viewTicket.journey_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Pickup Time</p>
                  <p className="font-medium text-slate-800">{viewTicket.pickup_time}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Seats</p>
                  <p className="font-medium text-slate-800">
                    {viewTicket.total_seats} ({viewTicket.seat_numbers?.join(", ")})
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Travel Type</p>
                  <p className="font-medium text-slate-800">{viewTicket.travel_type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Amount</p>
                  <p className="font-bold text-slate-800">₹{viewTicket.amount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Payment Type</p>
                  <p className="font-medium text-slate-800">{viewTicket.account_type}</p>
                </div>
                {viewTicket.bus_number && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Bus Number</p>
                    <p className="font-medium text-slate-800">{viewTicket.bus_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(
                      viewTicket.status
                    )}`}
                  >
                    {viewTicket.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Booking Date</p>
                  <p className="font-medium text-slate-800">
                    {new Date(viewTicket.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {editTicket && (
        <EditTicketModal
          ticket={editTicket}
          cities={cities}
          onClose={() => setEditTicket(null)}
          onSave={(updated) => {
            setTickets((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            setEditTicket(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Ticket?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to cancel this ticket? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  No, Keep It
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from("tickets")
                        .update({ status: "Cancelled" })
                        .eq("id", deleteConfirm);
                      if (!error) {
                        setTickets((prev) =>
                          prev.map((t) =>
                            t.id === deleteConfirm
                              ? { ...t, status: "Cancelled" }
                              : t
                          )
                        );
                      }
                    } catch (err) {
                      console.error("Error cancelling ticket:", err);
                    } finally {
                      setDeleteConfirm(null);
                    }
                  }}
                  className="flex-1 px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
)}
    </div>
  );
}

// Edit Ticket Modal Component
function EditTicketModal({
  ticket,
  cities,
  onClose,
  onSave,
}: {
  ticket: Ticket;
  cities: City[];
  onClose: () => void;
  onSave: (ticket: Ticket) => void;
}) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    passenger_name: ticket.passenger_name,
    mobile_number: ticket.mobile_number,
    pickup_location: ticket.pickup_location,
    drop_location: ticket.drop_location,
    journey_date: ticket.journey_date,
    pickup_time: ticket.pickup_time,
    total_seats: ticket.total_seats,
    seat_numbers: ticket.seat_numbers?.join(", ") || "",
    bus_number: ticket.bus_number || "",
    travel_type: ticket.travel_type,
    amount: ticket.amount,
    account_type: ticket.account_type,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const seatArray = formData.seat_numbers
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const { error } = await supabase.from("tickets").update({
        passenger_name: formData.passenger_name,
        mobile_number: formData.mobile_number,
        pickup_location: formData.pickup_location,
        drop_location: formData.drop_location,
        journey_date: formData.journey_date,
        pickup_time: formData.pickup_time,
        total_seats: formData.total_seats,
        seat_numbers: `{${seatArray.map((s) => `"${s}"`).join(",")}}`,
        bus_number: formData.bus_number || null,
        travel_type: formData.travel_type,
        amount: formData.amount,
        account_type: formData.account_type,
      }).eq("id", ticket.id);

      if (!error) {
        onSave({
          ...ticket,
          ...formData,
          seat_numbers: seatArray,
        });
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between sticky top-0 bg-white border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">{ticket.ticket_number}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Passenger Name *
              </label>
              <input
                type="text"
                value={formData.passenger_name}
                onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                From Location *
              </label>
              <select
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              >
                <option value="">Select Location</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                To Location *
              </label>
              <select
                value={formData.drop_location}
                onChange={(e) => setFormData({ ...formData, drop_location: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              >
                <option value="">Select Location</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Journey Date *
              </label>
              <input
                type="date"
                value={formData.journey_date}
                onChange={(e) => setFormData({ ...formData, journey_date: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pickup Time *
              </label>
              <input
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Total Seats *
              </label>
              <input
                type="number"
                value={formData.total_seats}
                onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })}
                className="input-primary w-full text-sm py-2"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Seat Numbers
              </label>
              <input
                type="text"
                value={formData.seat_numbers}
                onChange={(e) => setFormData({ ...formData, seat_numbers: e.target.value })}
                className="input-primary w-full text-sm py-2"
                placeholder="A1, A2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bus Number
              </label>
              <input
                type="text"
                value={formData.bus_number}
                onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                className="input-primary w-full text-sm py-2"
                placeholder="DL-01-AB-1234"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Travel Type *
              </label>
              <select
                value={formData.travel_type}
                onChange={(e) => setFormData({ ...formData, travel_type: e.target.value as "AC" | "Non-AC" })}
                className="input-primary w-full text-sm py-2"
                required
              >
                <option value="Non-AC">Non-AC</option>
                <option value="AC">AC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="input-primary w-full text-sm py-2"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Type *
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                className="input-primary w-full text-sm py-2"
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-white bg-[#3da9d4] hover:bg-[#2882a8] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
