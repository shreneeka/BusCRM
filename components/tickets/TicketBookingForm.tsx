"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { createTicket, getAccounts, getOperators } from "@/lib/actions/ticket.actions";
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
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  is_active: boolean;
}

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  mobile_number: string;
}

interface Location {
  id: string;
  name: string;
}

function LocationSelector({
  label,
  name,
  locations,
  onAddLocation,
  selectedLocation,
  onSelect,
  alignMenu = "left",
}: {
  label: string;
  name: string;
  locations: Location[];
  onAddLocation: (name: string) => Promise<Location | null>;
  selectedLocation: Location | null;
  onSelect: (location: Location | null) => void;
  alignMenu?: "left" | "right";
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(selectedLocation ? selectedLocation.name : "");
  }, [selectedLocation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch(selectedLocation ? selectedLocation.name : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedLocation]);

  const filteredLocations = locations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );

  const hasExactMatch = locations.some(
    (l) => l.name.toLowerCase() === search.trim().toLowerCase(),
  );

  const handleSelect = (location: Location) => {
    onSelect(location);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!search.trim()) return;
    setIsAdding(true);
    const newLocation = await onAddLocation(search.trim());
    if (newLocation) {
      onSelect(newLocation);
      setIsOpen(false);
    }
    setIsAdding(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
        {label} *
      </label>
      <input type="hidden" name={name} value={selectedLocation?.id || ""} />
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
          className={`absolute z-50 mt-1 w-[240px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 ${alignMenu === "right" ? "right-0" : "left-0"}`}
        >
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {location.name}
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
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
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

export default function TicketBookingForm() {
  const supabase = createClient();

  // Basic Details
  const [passengerName, setPassengerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropLocation, setDropLocation] = useState<Location | null>(null);
  const [journeyDate, setJourneyDate] = useState("");
  const [seatNumbers, setSeatNumbers] = useState("");
  const [totalSeats, setTotalSeats] = useState(1);
  const [pickupTime, setPickupTime] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [travelType, setTravelType] = useState<"AC" | "Non-AC">("Non-AC");
  const [ticketNumber, setTicketNumber] = useState("");

  // Locations
  const [locations, setLocations] = useState<Location[]>([]);

  // Payment Details
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accountType, setAccountType] = useState<"Cash" | "UPI">("Cash");
  const [amount, setAmount] = useState("");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<{
    id: string;
    name: string;
    mobile_number: string;
  }[]>([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const todayStr = new Date().toISOString().split("T")[0];

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

  async function fetchLocations() {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("pickup_location, drop_location")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        const uniqueLocations = new Map<string, Location>();
        
        data.forEach((ticket: any) => {
          if (ticket.pickup_location) {
            const key = ticket.pickup_location.toLowerCase();
            if (!uniqueLocations.has(key)) {
              uniqueLocations.set(key, {
                id: ticket.pickup_location,
                name: ticket.pickup_location,
              });
            }
          }
          if (ticket.drop_location) {
            const key = ticket.drop_location.toLowerCase();
            if (!uniqueLocations.has(key)) {
              uniqueLocations.set(key, {
                id: ticket.drop_location,
                name: ticket.drop_location,
              });
            }
          }
        });

        setLocations(Array.from(uniqueLocations.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  }

  async function handleAddLocation(locationName: string): Promise<Location | null> {
    // Add to state immediately (locations are created on-the-fly)
    const newLocation: Location = {
      id: locationName,
      name: locationName,
    };
    setLocations((prev) =>
      [...prev, newLocation].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return newLocation;
  }

  useEffect(() => {
    async function loadData() {
      const [accountsData, operatorsData] = await Promise.all([
        getAccounts(),
        getOperators(),
      ]);
      setAccounts(accountsData);
      setOperators(operatorsData);
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0].id);
        setAccountType(accountsData[0].type === "Cash" ? "Cash" : "UPI");
      }
      await fetchLocations();
    }
    loadData();
  }, []);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!passengerName.trim()) newErrors.push("Passenger name is required");
    if (!mobileNumber.trim() || mobileNumber.length !== 10)
      newErrors.push("Mobile number must be exactly 10 digits");
    if (!pickupLocation) newErrors.push("Pickup location is required");
    if (!dropLocation) newErrors.push("Drop location is required");
    if (!journeyDate) newErrors.push("Journey date is required");
    if (!seatNumbers.trim()) newErrors.push("Seat numbers are required");
    if (totalSeats < 1 || totalSeats > 70)
      newErrors.push("Total seats must be between 1 and 70");
    if (!pickupTime) newErrors.push("Pickup time is required");
    if (!travelType) newErrors.push("Travel type is required");
    if (!ticketNumber.trim()) newErrors.push("Ticket number is required");
    if (!selectedAccount) newErrors.push("Account is required");
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
        pickup_location: pickupLocation?.name || "",
        drop_location: dropLocation?.name || "",
        journey_date: journeyDate,
        seat_numbers: seatArray,
        total_seats: totalSeats,
        pickup_time: pickupTime,
        bus_number: busNumber || undefined,
        travel_type: travelType,
        ticket_number: ticketNumber,
        account_id: selectedAccount,
        account_type: accountType,
        amount: parseFloat(amount),
        operator_id: selectedOperator || undefined,
      });

      // Reset form
      setPassengerName("");
      setMobileNumber("");
      setPickupLocation(null);
      setDropLocation(null);
      setJourneyDate("");
      setSeatNumbers("");
      setTotalSeats(1);
      setPickupTime("");
      setBusNumber("");
      setTravelType("Non-AC");
      setTicketNumber("");
      setAmount("");
      setSelectedOperator("");
      setErrors([]);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      setErrors(["Failed to create ticket. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  }

return (
    <div className="saas-card bg-white p-5 flex flex-col border-t-4 border-t-[#3da9d4] shadow-sm relative overflow-hidden h-fit max-h-full">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">New Ticket</h2>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          Log a new bus ticket booking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="flex flex-col gap-5 overflow-y-auto pr-1">
          {/* Customer Details */}
          <div className="space-y-4">
            <MobileNumberSelector
              label="Mobile Number"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Passenger Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="input-primary pl-10 w-full text-sm py-2.5"
                  placeholder="Full Name"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 my-1 shrink-0" />

          {/* Route Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <LocationSelector
                label="From"
                name="pickup_location_id"
                locations={locations}
                onAddLocation={handleAddLocation}
                selectedLocation={pickupLocation}
                onSelect={setPickupLocation}
                alignMenu="left"
              />
              <LocationSelector
                label="To"
                name="drop_location_id"
                locations={locations}
                onAddLocation={handleAddLocation}
                selectedLocation={dropLocation}
                onSelect={setDropLocation}
                alignMenu="right"
              />
            </div>
          </div>

          {/* Journey Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
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
                className="input-primary pl-8 w-full text-sm py-2"
              />
            </div>
          </div>

          {/* Pickup Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Pickup Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                required
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="input-primary pl-8 w-full text-sm py-2"
              />
            </div>
          </div>

          {/* Seat Numbers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Seat Numbers *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                required
                type="text"
                value={seatNumbers}
                onChange={(e) => setSeatNumbers(e.target.value)}
                className="input-primary pl-8 w-full text-sm py-2"
                placeholder="A1, A2, B1"
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">comma-separated</p>
          </div>

          {/* Total Seats */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Total Seats *
            </label>
            <input
              required
              type="number"
              value={totalSeats}
              onChange={(e) => setTotalSeats(Math.max(1, Math.min(70, parseInt(e.target.value) || 1)))}
              min={1}
              max={70}
              className="input-primary w-full text-sm py-2"
            />
          </div>

          {/* Bus Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Bus Number
            </label>
            <div className="relative">
              <Bus className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="input-primary pl-8 w-full text-sm py-2"
                placeholder="DL-01-AB-1234"
              />
            </div>
          </div>

          {/* Travel Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Travel Type *
            </label>
            <select
              required
              value={travelType}
              onChange={(e) => setTravelType(e.target.value as "AC" | "Non-AC")}
              className="input-primary w-full text-sm py-2"
            >
              <option value="Non-AC">Non-AC</option>
              <option value="AC">AC</option>
            </select>
          </div>

          {/* Ticket Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Ticket Number *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                required
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="input-primary pl-8 w-full text-sm py-2"
                placeholder="TKT-001"
              />
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Account *
            </label>
            <select
              required
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                const account = accounts.find((a) => a.id === e.target.value);
                if (account) {
                  setAccountType(account.type === "Cash" ? "Cash" : "UPI");
                }
              }}
              className="input-primary w-full text-sm py-2"
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Payment Type *
            </label>
            <select
              required
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "Cash" | "UPI")}
              className="input-primary w-full text-sm py-2"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
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
                className="input-primary pl-8 w-full text-sm py-2"
                placeholder="0.00"
              />
            </div>
          </div>

        {/* Operator (Optional) */}
        {operators.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Operator (Optional)
            </label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="input-primary w-full text-sm py-2"
            >
              <option value="">No Operator</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.commission_percentage}%)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#3da9d4] hover:bg-[#2882a8] text-white font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-4"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Book Ticket
            </>
          )}
        </button>
      </div>
    </form>
    </div>
  );
}
