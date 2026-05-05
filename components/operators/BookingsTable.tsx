"use client";

import { Loader2, AlertCircle, MapPin, Calendar } from "lucide-react";

interface Booking {
  id: string;
  passenger_name: string;
  pickup_city: string;
  drop_city: string;
  journey_date: string;
  booking_account: string;
  amount: number;
  paid_amount?: number;
  status: 'settled' | 'unsettled';
}

interface Props {
  bookings: Booking[];
  loading: boolean;
}

export default function BookingsTable({ bookings, loading }: Props) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-lg font-medium mb-2">No bookings found</p>
        <p className="text-sm">No bookings available for this operator.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Passenger</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Route & Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Booking Account</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{booking.passenger_name}</div>
              </td>
              <td className="py-3 px-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {booking.pickup_city} → {booking.drop_city}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(booking.journey_date)}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="font-mono text-sm text-gray-900">{booking.booking_account}</div>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">₹{booking.amount.toLocaleString()}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
