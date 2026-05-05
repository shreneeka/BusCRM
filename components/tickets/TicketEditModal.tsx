
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateTicket } from "@/lib/actions/ticket.actions";
import { X, MapPin, User, Phone, Calendar, Clock, Bus, Tag, Wallet, Users, Loader2, AlertCircle, Plus, CheckCircle2 } from "lucide-react";

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

export default function TicketEditModal({ 
  ticket, 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  ticket: Ticket | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
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
  const [selectedOperator, setSelectedOperator] = useState(""); 
  const [pickupArea, setPickupArea] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [accountType, setAccountType] = useState<"Cash" | "UPI">("Cash");
  const [seatNumbers, setSeatNumbers] = useState<string[]>([]);
  const [newSeatNumber, setNewSeatNumber] = useState("");

  const fetchOperators = useCallback(async () => {
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
  }, [supabase]);

  const fetchCities = useCallback(async () => {
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
  }, [supabase]);

  // Initialize form when ticket changes
  useEffect(() => {
    if (ticket) {
      setPassengerName(ticket.passenger_name);
      setMobileNumber(ticket.mobile_number);
      setPickupCity(ticket.pickup_city);
      setPickupArea(ticket.pickup_area || '');
      setDropCity(ticket.drop_city);
      setDropLocation(ticket.drop_location || '');
      setJourneyDate(ticket.journey_date);
      setTotalSeats(ticket.total_seats);
      setPickupTime(ticket.pickup_time);
      setBusNumber(ticket.bus_number);
      setTravelType(ticket.travel_type);
      setAmount(ticket.amount.toString());
      setSelectedOperator(ticket.operator_id || "");
      setAccountType((ticket.account_type as "Cash" | "UPI") || 'Cash');
      setSeatNumbers(ticket.seat_numbers || []);
    }
  }, [ticket]);

  // Fetch data
  useEffect(() => {
    if (isOpen) {
      fetchOperators();
      fetchCities();
    }
  }, [isOpen, fetchOperators, fetchCities]);

  const addSeatNumber = () => {
    if (newSeatNumber.trim() && !seatNumbers.includes(newSeatNumber.trim())) {
      setSeatNumbers([...seatNumbers, newSeatNumber.trim()]);
      setNewSeatNumber("");
    }
  };

  const removeSeatNumber = (seat: string) => {
    setSeatNumbers(seatNumbers.filter(s => s !== seat));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        passenger_name: passengerName,
        mobile_number: mobileNumber,
        pickup_city: pickupCity,
        pickup_area: pickupArea,
        drop_city: dropCity,
        drop_location: dropLocation,
        journey_date: journeyDate,
        total_seats: totalSeats,
        pickup_time: pickupTime,
        bus_number: busNumber,
        travel_type: travelType,
        amount: parseFloat(amount),
        operator_id: selectedOperator,
        account_type: accountType,
        seat_numbers: seatNumbers,
      };

      await updateTicket(ticket.id, updateData);
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to update ticket. Please try again.");
      console.error("Error updating ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                Edit Ticket
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-red-50 transition-colors p-1 rounded-lg"
                title="Remove this title"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Ticket #{ticket.ticket_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            )}

            {/* Basic Ticket Details */}
            <div className="border-b pb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passenger Name *
                    </label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup City *
                    </label>
                    <select
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drop City *
                    </label>
                    <select
                      value={dropCity}
                      onChange={(e) => setDropCity(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select city</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Area
                    </label>
                    <input
                      type="text"
                      value={pickupArea}
                      onChange={(e) => setPickupArea(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Dadar Station"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drop Location
                    </label>
                    <input
                      type="text"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bandra Station"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Details */}
            <div className="border-b pb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Journey Date *
                    </label>
                    <input
                      type="date"
                      value={journeyDate}
                      onChange={(e) => setJourneyDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pickup Time *
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bus & Payment Details */}
            <div className="border-b pb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bus Number
                    </label>
                    <input
                      type="text"
                      value={busNumber}
                      onChange={(e) => setBusNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Travel Type *
                    </label>
                    <select
                      value={travelType}
                      onChange={(e) => setTravelType(e.target.value as "AC" | "Non-AC")}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="Non-AC">Non-AC</option>
                      <option value="AC">AC</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Operator & Account Details */}
            <div className="border-b pb-3">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operator *
                    </label>
                    <select
                      value={selectedOperator}
                      onChange={(e) => setSelectedOperator(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as "Cash" | "UPI")}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>
            </div>
            </div>

            {/* Seat Numbers */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Number
                  </label>
                  <input
                    type="text"
                    value={newSeatNumber}
                    onChange={(e) => setNewSeatNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., A1"
                    onKeyPress={(e) => e.key === 'Enter' && addSeatNumber()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    &nbsp;
                  </label>
                  <div className="h-10 flex items-center">
                    &nbsp;
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {seatNumbers.map((seat, index) => (
                  <div key={seat} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => removeSeatNumber(seat)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={seat}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeSeatNumber(seat)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Total seats: <span className="font-semibold">{seatNumbers.length}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Update Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
