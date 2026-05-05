"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateTicket } from "@/lib/actions/ticket.actions";
import { ArrowLeft, X, MapPin, User, Phone, Calendar, Clock, Bus, Tag, Wallet, Users } from "lucide-react";

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
  commission_percentage: number;
}

interface City {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
}

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [passengerName, setPassengerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [dropCity, setDropCity] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
  const [totalSeats, setTotalSeats] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [travelType, setTravelType] = useState<"AC" | "Non-AC">("Non-AC");
  const [amount, setAmount] = useState("");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  useEffect(() => {
    fetchTicket();
    fetchOperators();
    fetchCities();
    fetchAccounts();
  }, [params.ticketId]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", params.ticketId)
        .single();

      if (error) {
        setError(error.message);
      } else if (data) {
        setTicket(data);
        // Initialize form with ticket data
        setPassengerName(data.passenger_name);
        setMobileNumber(data.mobile_number);
        setPickupCity(data.pickup_city);
        setDropCity(data.drop_city);
        setJourneyDate(data.journey_date);
        setTotalSeats(data.total_seats);
        setPickupTime(data.pickup_time);
        setBusNumber(data.bus_number || "");
        setTravelType(data.travel_type);
        setAmount(data.amount.toString());
        setSelectedOperator(data.operator_id || "");
      }
    } catch (err) {
      setError("Failed to fetch ticket details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      setOperators(data || []);
    } catch (err) {
      console.error("Error fetching operators:", err);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setCities(data || []);
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setSubmitting(true);
    setError(null);

    try {
      const updateData = {
        passenger_name: passengerName,
        mobile_number: mobileNumber,
        pickup_city: pickupCity,
        drop_city: dropCity,
        journey_date: journeyDate,
        total_seats: totalSeats,
        pickup_time: pickupTime,
        bus_number: busNumber,
        travel_type: travelType,
        amount: parseFloat(amount),
        operator_id: selectedOperator,
      };

      await updateTicket(ticket.id, updateData);
      router.push("/tickets");
    } catch (err) {
      setError("Failed to update ticket. Please try again.");
      console.error("Error updating ticket:", err);
    } finally {
      setSubmitting(false);
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
        <X className="w-12 h-12 text-rose-500 mb-3" />
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
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Tickets
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Ticket</h1>
                <p className="text-sm text-gray-500">Ticket #{ticket.ticket_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Passenger Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">Passenger Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passenger Name *
                    </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
                </div>
              </div>

              {/* Route Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h2 className="text-base font-semibold text-gray-900">Route Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup City *
                    </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="">Select pickup city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drop City *
                    </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={dropCity}
                  onChange={(e) => setDropCity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="">Select drop city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
                </div>
              </div>

              {/* Journey Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h2 className="text-base font-semibold text-gray-900">Journey Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Journey Date *
                    </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time *
                    </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Seats *
                    </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Bus className="w-4 h-4 text-orange-600" />
                  <h2 className="text-base font-semibold text-gray-900">Additional Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bus Number
                    </label>
              <div className="relative">
                <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Type *
                    </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={travelType}
                  onChange={(e) => setTravelType(e.target.value as "AC" | "Non-AC")}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  required
                >
                  <option value="Non-AC">Non-AC</option>
                  <option value="AC">AC</option>
                </select>
              </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
                </div>
              </div>

              {/* Operator Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-base font-semibold text-gray-900">Operator Information</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operator *
                  </label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select operator</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Update Ticket
                    </>
                  )}
                </button>
          </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
