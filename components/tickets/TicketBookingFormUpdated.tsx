"use client";
 
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicket, getOperators, searchOperatorsByMobile } from "@/lib/actions/ticket.actions";
import { getAccounts } from "@/lib/actions/ticket.actions";
import OperatorSearchSelector from "@/components/operators/OperatorSearchSelector";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  User,
  Users,
  Tag,
  Wallet,
} from "lucide-react";

interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  is_active: boolean;
}

interface OperatorSuggestion {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface City {
  id: string;
  name: string;
}

interface FormData {
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  passenger_name: string;
  mobile_number: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string;
  travel_type: "AC" | "Non-AC";
  ticket_number: string;
  account_id: string;
  account_type: "Cash" | "UPI" | "Other";
  amount: number;
  operator_id: string;
}


export default function TicketBookingFormUpdated() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [mobileOperatorSuggestions, setMobileOperatorSuggestions] = useState<any[]>([]);
  const [showMobileOperatorSuggestions, setShowMobileOperatorSuggestions] = useState(false);
  const [isSearchingMobileOperator, setIsSearchingMobileOperator] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchTimerRef = useRef<NodeJS.Timeout>();
  
  const [formData, setFormData] = useState<FormData>({
    pickup_city: "",
    pickup_area: "",
    drop_city: "",
    drop_location: "",
    journey_date: "",
    booking_date: new Date().toISOString().split('T')[0],
    passenger_name: "",
    mobile_number: "",
    seat_numbers: [],
    total_seats: 0,
    pickup_time: "",
    bus_number: "",
    travel_type: "AC",
    ticket_number: "",
    account_id: "",
    account_type: "Cash",
    amount: 0,
    operator_id: "",

  const [newSeatNumber, setNewSeatNumber] = useState("");

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
    fetchCities();
  }, []);

  // Mobile operator search with debouncing
  useEffect(() => {
    if (mobileSearchTimerRef.current) {
      clearTimeout(mobileSearchTimerRef.current);
    }

    if (formData.mobile_number.length >= 3) {
      mobileSearchTimerRef.current = setTimeout(async () => {
        setIsSearchingMobileOperator(true);
        try {
          const suggestions = await searchOperatorsByMobile(formData.mobile_number);
          console.log("Mobile operator search results:", suggestions);
          setMobileOperatorSuggestions(suggestions);
          setShowMobileOperatorSuggestions(true);
        } catch (error) {
          console.error("Mobile operator search error:", error);
          setMobileOperatorSuggestions([]);
        } finally {
          setIsSearchingMobileOperator(false);
        }
      }, 300);
    } else {
      setMobileOperatorSuggestions([]);
      setShowMobileOperatorSuggestions(false);
    }

    return () => {
      if (mobileSearchTimerRef.current) {
        clearTimeout(mobileSearchTimerRef.current);
      }
    };
  }, [formData.mobile_number]);

  // Click outside handler for mobile operator suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileOperatorSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOperators = async () => {
    try {
      const data = await getOperators();
      setOperators(data);
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
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
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMobileOperatorSelect = (operator: any) => {
    console.log("Selected mobile operator:", operator);
    // Auto-fill operator field
    handleInputChange("operator_id", operator.id);
    setShowMobileOperatorSuggestions(false);
  };

  const handleMobileOperatorClear = () => {
    setShowMobileOperatorSuggestions(false);
  };

  const addSeatNumber = () => {
    if (newSeatNumber.trim() && !formData.seat_numbers.includes(newSeatNumber.trim())) {
      setFormData(prev => ({
        ...prev,
        seat_numbers: [...prev.seat_numbers, newSeatNumber.trim()],
        total_seats: prev.seat_numbers.length + 1
      }));
      setNewSeatNumber("");
    }
  };

  const removeSeatNumber = (seat: string) => {
    setFormData(prev => ({
      ...prev,
      seat_numbers: prev.seat_numbers.filter(s => s !== seat),
      total_seats: Math.max(0, prev.seat_numbers.length - 1)
    }));
  };

  const generateTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `T\${timestamp}\${random}`;
  };

  const calculateAmount = () => {
    const basePrice = formData.travel_type === "AC" ? 800 : 500;
    return formData.total_seats * basePrice;
  };

  useEffect(() => {
    const amount = calculateAmount();
    if (formData.amount !== amount) {
      setFormData(prev => ({ ...prev, amount }));
    }
  }, [formData.total_seats, formData.travel_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      // Operator now optional
      // if (!formData.operator_id) {
      //   throw new Error("Please select an operator");
      // }
      if (!formData.account_id) {
        throw new Error("Please select an account");
      }
      if (!formData.ticket_number.trim()) {
        throw new Error("Ticket No is required");
      }

      const ticketData = {
        ...formData,
        ticket_number: formData.ticket_number || generateTicketNumber(),
        journey_date: new Date(formData.journey_date).toISOString(),
        booking_date: new Date(formData.booking_date).toISOString(),
        pickup_time: formData.pickup_time + ":00",
        operator_id: formData.operator_id || null,
      };

      await createTicket(ticketData as any);
      setSuccess(true);
      
      setFormData({
        pickup_city: "",
        pickup_area: "",
        drop_city: "",
        drop_location: "",
        journey_date: "",
        booking_date: new Date().toISOString().split('T')[0],
        passenger_name: "",
        mobile_number: "",
        seat_numbers: [],
        total_seats: 0,
        pickup_time: "",
        bus_number: "",
        travel_type: "AC",
        ticket_number: "",
        account_id: "",
        account_type: "Cash",
        amount: 0,
        operator_id: "",
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const selectedOperator = operators.find(op => op.id === formData.operator_id);
  const selectedAccount = accounts.find(acc => acc.id === formData.account_id);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-transparent">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Travel Ticket Booking</h2>
        <p className="text-sm text-gray-600">Book a new travel ticket with operator and payment details</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Ticket booked successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

            {/* Basic Ticket Details */}
            <div className="border-b pb-3">
              <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Basic Ticket Details
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booking Date *
                    </label>
                    <input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => handleInputChange("booking_date", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket No *
                    </label>
                    <input
                      type="text"
                      value={formData.ticket_number}
                      onChange={(e) => handleInputChange("ticket_number", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter ticket number (required)"
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
                      value={formData.pickup_city}
                      onChange={(e) => handleInputChange("pickup_city", e.target.value)}
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
                      Pickup Area
                    </label>
                    <input
                      type="text"
                      value={formData.pickup_area}
                      onChange={(e) => handleInputChange("pickup_area", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Connaught Place"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drop City *
                    </label>
                    <select
                      value={formData.drop_city}
                      onChange={(e) => handleInputChange("drop_city", e.target.value)}
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
                      Drop Location
                    </label>
                    <input
                      type="text"
                      value={formData.drop_location}
                      onChange={(e) => handleInputChange("drop_location", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bandra Station"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile_number}
                      onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passenger Name *
                    </label>
                    <input
                      type="text"
                      value={formData.passenger_name}
                      onChange={(e) => handleInputChange("passenger_name", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter passenger name"
                      required
                    />
                  </div>
                </div>

            <div>
              <OperatorSearchSelector 
                label="Operator (Optional)"
                selectedOperatorId={formData.operator_id}
                onSelect={(id) => handleInputChange("operator_id", id ?? null)}
              />
              {selectedOperator && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <strong>{selectedOperator.operator_name}</strong> - {selectedOperator.person_name} ({selectedOperator.mobile_number}), {selectedOperator.commission_percent}% commission
                </div>
              )}
            </div>

            <div ref={mobileSearchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobile_number}
                onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                onFocus={() => setShowMobileOperatorSuggestions(true)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9876543210 (or operator mobile)"
                pattern="[0-9]{10}"
                required
              />
              
              {/* Mobile Operator Suggestions - Matches Customer NO behavior */}
              {showMobileOperatorSuggestions && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="max-h-48 overflow-y-auto">
                    {isSearchingMobileOperator ? (
                      <div className="px-4 py-3 text-center text-sm text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching operators...
                      </div>
                    ) : mobileOperatorSuggestions.length > 0 ? (
                      mobileOperatorSuggestions.map((operator) => (
                        <button
                          key={operator.id}
                          type="button"
                          onClick={() => handleMobileOperatorSelect(operator)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{operator.operator_name}</p>
                            <p className="text-xs text-slate-500 truncate">{operator.person_name} • {operator.mobile_number}</p>
                          </div>
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                            {operator.commission_percent}%
                          </span>
                        </button>
                      ))
                    ) : formData.mobile_number.length >= 3 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        No operators found for "{formData.mobile_number}"
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Time
              </label>
              <input
                type="time"
                value={formData.pickup_time}
                onChange={(e) => handleInputChange("pickup_time", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Number
              </label>
              <input
                type="text"
                value={formData.bus_number}
                onChange={(e) => handleInputChange("bus_number", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., DL01AB1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Type
              </label>
              <select
                value={formData.travel_type}
                onChange={(e) => handleInputChange("travel_type", e.target.value as "AC" | "Non-AC")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Date *
              </label>
              <input
                type="date"
                value={formData.booking_date}
                onChange={(e) => handleInputChange("booking_date", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket No *
              </label>
              <input
                type="text"
                value={formData.ticket_number}
                onChange={(e) => handleInputChange("ticket_number", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter ticket number (required)"
                required
              />
            </div>
          </div>

          {/* Seat Numbers */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seat Numbers
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSeatNumber}
                onChange={(e) => setNewSeatNumber(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A1, B2"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSeatNumber())}
              />
              <button
                type="button"
                onClick={addSeatNumber}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.seat_numbers.map((seat) => (
                <span
                  key={seat}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {seat}
                  <button
                    type="button"
                    onClick={() => removeSeatNumber(seat)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Seats: {formData.total_seats}</p>
          </div>
        </div>

        
        {/* Payment Details */}
        <div className="pt-2">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Payment Details
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Selection
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => handleInputChange("account_type", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Booking Ticket...
              </span>
            ) : (
              "Book Ticket"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
