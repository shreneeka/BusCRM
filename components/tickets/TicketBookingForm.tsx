"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicket, getOperators, getAccounts } from "@/lib/actions/ticket.actions";
import OperatorSearchSelector from "@/components/operators/OperatorSearchSelector";
import {
  Loader2,
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  Bus,
  Tag,
  Wallet,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Divide,
  X,
} from "lucide-react";

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Customer {
  id: string;
  name: string;
  mobile_number: string;
  commission_percent?: number;
}

interface City {
  id: string;
  name: string;
}

function CitySelector({
  label,
  name,
  cities,
  onAddCity,
  selectedCity,
  onSelect,
  alignMenu = "left",
}: {
  label: string;
  name: string;
  cities: City[];
  onAddCity: (name: string) => Promise<City | null>;
  selectedCity: City | null;
  onSelect: (city: City | null) => void;
  alignMenu?: "left" | "right";
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(selectedCity ? selectedCity.name : "");
  }, [selectedCity]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch(selectedCity ? selectedCity.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCity]);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasExactMatch = cities.some(
    (c) => c.name.toLowerCase() === search.trim().toLowerCase(),
  );

  const handleSelect = (city: City) => {
    onSelect(city);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!search.trim()) return;
    setIsAdding(true);
    const newCity = await onAddCity(search.trim());
    if (newCity) {
      onSelect(newCity);
      setIsOpen(false);
    }
    setIsAdding(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
        {label} *
      </label>
      <input type="hidden" name={name} value={selectedCity?.id || ""} />
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="input-primary pl-9 bg-white text-sm py-2"
          placeholder="Select Location"
          value={search}
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);
            onSelect(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute z-[60] mt-1 w-[240px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 ${alignMenu === "right" ? "right-0" : "left-0"}`}
        >
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {city.name}
              </button>
            ))}
          </div>
          {!hasExactMatch && search.trim() !== "" && (
            <div className="p-2 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddNew}
                disabled={isAdding}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#3da9d4] bg-[#3da9d4]/10 hover:bg-[#3da9d4]/20 rounded-lg transition-colors"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add "{search}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileNumberSelector({
  label,
  mobileNumber,
  onMobileChange,
  onCustomerSelect,
  customers,
  formatPassengerName,
}: {
  label: string;
  mobileNumber: string;
  onMobileChange: (mobile: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  customers: Customer[];
  formatPassengerName: (name: string) => string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalized = mobileNumber.replace(/\D/g, "");
  const isMobileTooShort = normalized.length > 0 && normalized.length < 10;
  const isMobileInvalidLength = normalized.length > 0 && normalized.length !== 10;

  useEffect(() => {
    setSearch(mobileNumber);
  }, [mobileNumber]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (customer: Customer) => {
    const mobileDigits = customer.mobile_number.replace(/\D/g, "").slice(-10);
    onMobileChange(mobileDigits);
    onCustomerSelect(customer);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
        {label} *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-100 mr-2">
          <span className="text-slate-500 text-sm font-bold">+91</span>
        </div>
        <input
          required
          type="tel"
          className="input-primary pl-12 bg-white text-sm py-2.5 w-full font-bold tracking-wider"
          placeholder="9876543210"
          value={search}
          autoComplete="off"
          maxLength={10}
          onChange={(e) => {
            const num = e.target.value.replace(/\D/g, "").slice(0, 10);
            setSearch(num);
            onMobileChange(num);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && customers.length > 0 && (
        <div className="absolute z-[60] mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between"
              >
                <span className="font-bold text-slate-800">
                  {formatPassengerName(customer.name)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {customer.mobile_number}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export default function TicketBookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createClient();

  // Basic Details
  const [passengerName, setPassengerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [operatorId, setOperatorId] = useState(""); 
  const [pickupLocation, setPickupLocation] = useState<City | null>(null);
  const [dropLocation, setDropLocation] = useState<City | null>(null);
  const [journeyDate, setJourneyDate] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [seatNumbers, setSeatNumbers] = useState("");
  const [totalSeats, setTotalSeats] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [travelType, setTravelType] = useState<"AC" | "Non-AC">("Non-AC");
  const [ticketNumber, setTicketNumber] = useState("");

  // Cities
  const [cities, setCities] = useState<City[]>([]);

  // Payment Details
  const [accountType, setAccountType] = useState<"Cash" | "UPI" | "Other">("Cash");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [operators, setOperators] = useState<Operator[]>([]); 
  const [customerSuggestions, setCustomerSuggestions] = useState<{
    id: string;
    name: string;
    mobile_number: string;
  }[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const todayStr = new Date().toISOString().split("T")[0];

  // Initialize booking date with today's date
  useEffect(() => {
    setBookingDate(new Date().toISOString().split("T")[0]);
  }, []);

  const formatPassengerName = (name: string) =>
    name
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")                                           
      .map((part) =>
        part.length > 0
          ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`
          : ""
      )
      .join(" ");

const fetchCustomerSuggestions = async (digits: string) => {
    if (digits.length < 3) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, mobile_number")
        .ilike("mobile_number", `%${digits}%`)
        .limit(5);

      if (!error && data) {
        setCustomerSuggestions(data);
      } else {
        setCustomerSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching customer suggestions:", err);
      setCustomerSuggestions([]);
    }
  };



  const handleCustomerSelect = (customer: Customer) => {
    setPassengerName(formatPassengerName(customer.name));
  };



  async function fetchCities() {
    const { data } = await supabase.from("cities").select("*").order("name");
    if (data) setCities(data);
  }

  async function handleAddCity(cityName: string): Promise<City | null> {
    const { data, error } = await supabase
      .from("cities")
      .insert([{ name: cityName }])
      .select()
      .single();
    if (!error && data) {
      setCities((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return data;
    }
    return null;
  }

  useEffect(() => {
    async function loadData() {
      const operatorsData = await getOperators();
      setOperators(operatorsData);
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      await fetchCities();
    }
    loadData();
  }, []);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!passengerName.trim()) newErrors.push("Passenger name is required");
    if (!mobileNumber.trim()) newErrors.push("Customer mobile number is required");
    else if (mobileNumber.length !== 10) newErrors.push("Customer mobile number must be exactly 10 digits");
    // Operator is optional as per requirement
    // if (!operatorId) newErrors.push("Operator is required");
    if (!pickupLocation) newErrors.push("Pickup location is required");
    if (!dropLocation) newErrors.push("Drop location is required");
    if (!bookingDate) newErrors.push("Booking date is required");
    if (!journeyDate) newErrors.push("Journey date is required");
    if (!seatNumbers.trim()) newErrors.push("Seat numbers are required");
    if (totalSeats < 1 || totalSeats > 70)
      newErrors.push("Total seats must be between 1 and 70");
    if (!pickupTime) newErrors.push("Pickup time is required");
    if (!travelType) newErrors.push("Travel type is required");
    if (!ticketNumber.trim()) newErrors.push("Ticket number is required");
    if (!amount || parseFloat(amount) <= 0)
      newErrors.push("Valid amount is required");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const seatArray = seatNumbers
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const formattedName = formatPassengerName(passengerName);

      await createTicket({
        passenger_name: formattedName,
        mobile_number: `+91 ${mobileNumber}`,
        pickup_city: pickupLocation?.name || "",
        pickup_location: pickupLocation?.name || "",
        drop_city: dropLocation?.name || "",
        drop_location: dropLocation?.name || "",
        journey_date: journeyDate,
        booking_date: bookingDate,
        seat_numbers: seatArray,
        total_seats: totalSeats,
        pickup_time: pickupTime,
        bus_number: busNumber || "",
        travel_type: travelType,
        ticket_number: ticketNumber,
        account_id: selectedAccount && selectedAccount.trim() ? selectedAccount : null,
        account_type: accountType,
        amount: parseFloat(amount),
        operator_id: operatorId && operatorId.trim() ? operatorId : null,
        operator_name: operators.find(op => op.id === operatorId)?.name,
      }); 

      // Reset form
      setPassengerName("");
      setMobileNumber("");
      setOperatorId("");
      setPickupLocation(null);
      setDropLocation(null);
      setJourneyDate(""); 
      setBookingDate(new Date().toISOString().split("T")[0]); 
      setSeatNumbers("");
      setTotalSeats(1);
      setPickupTime("");
      setBusNumber("");
      setTravelType("Non-AC");
      setTicketNumber("");
      setAmount("");
      setSelectedAccount("");
      setOperatorId("");
      setErrors([]); 

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrors(["Failed to create ticket. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }

return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 max-w-full overflow-visible">
      {errors.length > 0 && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          <strong className="block font-semibold mb-1">Please fix the following:</strong>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {showSuccess && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
          ✓ Ticket booked successfully.
        </div>
      )}

      {/* Operator Name - 1 field */}
      <div className="p-1">
        <OperatorSearchSelector
          label="Operator Name *"
          selectedOperatorId={operatorId}
          onSelect={(id) => setOperatorId(id ?? null)}
        />
      </div>

      {/* Customer Mobile & Passenger Name - 2 columns */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <MobileNumberSelector
          label="Customer Mobile"
          mobileNumber={mobileNumber}
          onMobileChange={(num) => {
            setMobileNumber(num);
            fetchCustomerSuggestions(num);
          }}
          onCustomerSelect={handleCustomerSelect}
          customers={customerSuggestions}
          formatPassengerName={formatPassengerName}
        />
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Passenger Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              required
              type="text"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              className="pl-10 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="Full Name"
            />
          </div>
        </div>
      </div>
      {mobileNumber.trim().length > 0 && mobileNumber.trim().length !== 10 && (
        <div className="text-[11px] text-rose-600 mt-1">
          Customer mobile must be exactly 10 digits.
        </div>
      )}

      {/* Route Details - 2 columns */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <CitySelector
          label="From"
          name="pickup_location_id"
          cities={cities}
          onAddCity={handleAddCity}
          selectedCity={pickupLocation}
          onSelect={setPickupLocation}
          alignMenu="left"
        />
        <CitySelector
          label="To"
          name="drop_location_id"
          cities={cities}
          onAddCity={handleAddCity}
          selectedCity={dropLocation}
          onSelect={setDropLocation}
          alignMenu="right"
        />
      </div>

      {/* Date & Time fields */}
      <div className="grid grid-cols-3 gap-1 p-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Booking Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              required
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              max={todayStr}
              className="input-primary pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Journey Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              required
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              min={todayStr}
              className="input-primary pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Pickup Time *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              required
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="input-primary pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Seat Details - 2 columns */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Seat Numbers *
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              required
              type="text"
              value={seatNumbers}
              onChange={(e) => setSeatNumbers(e.target.value)}
              className="pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="A1, A2, B1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Total Seats *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={totalSeats}
              onChange={(e) => setTotalSeats(Math.max(1, Math.min(70, parseInt(e.target.value) || 1)))}
              min={1}
              max={70}
              className="pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bus Details - 2 columns */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Bus Number
          </label>
          <div className="relative">
            <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              className="pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="DL-01-AB-1234"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Travel Type *
          </label>
          <select
            required
            value={travelType}
            onChange={(e) => setTravelType(e.target.value as "AC" | "Non-AC")}
            className="w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="Non-AC">Non-AC</option>
            <option value="AC">AC</option>
          </select>
        </div>
      </div>

      {/* Ticket & Payment - 2 columns */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md transition-all p-3 rounded-lg">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Ticket Number *
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              required
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              className="pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="TKT-001"
            />
          </div>
        </div>
      </div>

      {/* Account Selection & Amount - 2 columns */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Account Selection
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "Cash" | "UPI" | "Other")}
              className="pl-9 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Amount (₹) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              ₹
            </span>
            <input
              required
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              step={0.01}
              className="pl-8 w-full text-sm py-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm hover:bg-slate-100 hover:shadow-md focus:bg-white focus:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="0.00"
            />
          </div>
        </div>
      </div> 

      

      

      {/* Submit Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#3da9d4] hover:bg-[#2882a8] text-white font-semibold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
}
