"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, DollarSign, ArrowLeft, Plus, CreditCard, TrendingUp, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OperatorSettlementsView from "./OperatorSettlementsView";
import BookingsTable from "./BookingsTable";

interface OperatorDetails {
  totalTickets: number;
  activeRoutes: number;
  totalCities: number;
  averageTicketValue: number;
  lastActiveDate: string;
  email?: string;
  address?: string;
  website?: string;
}

interface Statistics {
  totalTickets: number;
  bookedTickets: number;
  settledTickets: number;
  totalAmount: number;
  bookedAmount: number;
  settledAmount: number;
  totalCommission: number;
  totalPaid: number;
  paidSettlements: number;
  pendingSettlements: number;
  commissionPercentage: number;
}

interface OperatorSummary {
  operator: {
    id: string;
    name: string;
    person_name: string;
    mobile_number: string;
    email?: string;
    address?: string;
    website?: string;
    commission_percentage: number;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
  };
  statistics: Statistics;
  details?: OperatorDetails;
}

interface Booking {
  id: string;
  passenger_name: string;
  pickup_city: string;
  drop_city: string;
  journey_date: string;
  booking_account: string;
  amount: number;
  paid_amount?: number;
  payment_status?: 'paid' | 'partial' | 'not_paid';
  status: 'settled' | 'unsettled';
}

interface Props {
  operatorSummary: OperatorSummary;
}

export default function OperatorView({ operatorSummary }: Props) {
  const { operator, statistics } = operatorSummary;
  const { settledAmount } = statistics;
  const [showSettlementForm, setShowSettlementForm] = useState(false);
  const [settlementData, setSettlementData] = useState({
    paid_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
    reference_number: '',
    bank_name: '',
    account_number: '',
    payment_collector_name: '',
    payment_collector_mobile: ''
  });
  const [activeTab, setActiveTab] = useState<'bookings' | 'settlements'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Calculate actual unsettled amount from bookings
  const calculateUnsettledAmount = useCallback(() => {
    const totalBooked = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalPaid = bookings.reduce((sum, booking) => sum + (booking.paid_amount || 0), 0);
    return totalBooked - totalPaid;
  }, [bookings]);

  const actualUnsettledAmount = calculateUnsettledAmount();
  const supabase = createClient();

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('operator_id', operator.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const formattedBookings: Booking[] = (data || []).map(ticket => {
        const paidAmount = ticket.payment_status === 'paid' ? ticket.amount : 
                          ticket.payment_status === 'partial' ? (ticket.partial_amount || 0) : 0;
        
        return {
          id: ticket.id,
          passenger_name: ticket.passenger_name || 'N/A',
          pickup_city: ticket.pickup_city,
          drop_city: ticket.drop_city,
          journey_date: ticket.journey_date,
          booking_account: ticket.booking_reference || `BK-${ticket.id.slice(-8)}`,
          amount: ticket.amount || 0,
          paid_amount: paidAmount,
          payment_status: ticket.payment_status || 'not_paid',
          status: ticket.is_settled ? 'settled' : 'unsettled'
        };
      });
      
      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  }, [operator.id, supabase]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Update settlement data with actual unsettled amount when bookings change
  useEffect(() => {
    const unsettledAmount = calculateUnsettledAmount();
    if (unsettledAmount > 0) {
      setSettlementData(prev => ({
        ...prev,
        paid_amount: unsettledAmount.toString()
      }));
    }
  }, [bookings, calculateUnsettledAmount]);

  const handleSettlementSubmit = async () => {
    try {
      const settlementPayload: Record<string, string | number | boolean> = {
        operator_name: operator.name,
        mobile_number: operator.mobile_number,
        total_amount: actualUnsettledAmount,
        commission_percentage: operator.commission_percentage,
        commission_amount: actualUnsettledAmount * (operator.commission_percentage / 100),
        operator_payable: actualUnsettledAmount - (actualUnsettledAmount * (operator.commission_percentage / 100)),
        paid_amount: parseFloat(settlementData.paid_amount),
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_status: 'done',
        settlement_method: settlementData.payment_method,
        notes: settlementData.notes,
        created_at: new Date().toISOString()
      };
      
      // Add optional fields if they exist
      if (settlementData.reference_number) {
        settlementPayload.reference_number = settlementData.reference_number;
      }
      if (settlementData.bank_name) {
        settlementPayload.bank_name = settlementData.bank_name;
      }
      if (settlementData.account_number) {
        settlementPayload.account_number = settlementData.account_number;
      }
      if (settlementData.payment_collector_name) {
        settlementPayload.payment_collector_name = settlementData.payment_collector_name;
        settlementPayload.payment_collected_at = new Date().toISOString();
      }
      if (settlementData.payment_collector_mobile) {
        settlementPayload.payment_collector_mobile = settlementData.payment_collector_mobile;
      }

      const { error } = await supabase
        .from('operator_settlements')
        .insert(settlementPayload);

      if (error) throw error;

      // Reset form
      setSettlementData({
        paid_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: '',
        reference_number: '',
        bank_name: '',
        account_number: '',
        payment_collector_name: '',
        payment_collector_mobile: ''
      });
      setShowSettlementForm(false);
      
      // Refresh data
      fetchBookings();
      window.location.reload();
    } catch (error) {
      console.error('Error creating settlement:', error);
    }
  };

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/operators"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Operators
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {operator.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Business Overview
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettlementForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Settlement
              </button>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                operator.is_active
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {operator.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Business Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="text-xl font-bold text-purple-700">{operator.commission_percentage}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Settlements</p>
                <p className="text-xl font-bold text-blue-700">{statistics.paidSettlements || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-xl font-bold text-green-700">₹{settledAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unsettled Amount</p>
                <p className="text-xl font-bold text-orange-700">₹{actualUnsettledAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'bookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setActiveTab('settlements')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'settlements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Settlement History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'bookings' ? (
              <BookingsTable bookings={bookings} loading={loadingBookings} />
            ) : (
              <OperatorSettlementsView 
                operatorId={operator.id} 
                operatorName={operator.name} 
              />
            )}
          </div>
        </div>

        {/* Settlement Form Modal */}
        {showSettlementForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Add Settlement</h2>
                    <p className="text-sm text-gray-600">Process payment for {operator.name}</p>
                  </div>
                  <button
                    onClick={() => setShowSettlementForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Payment Details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Paid Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={settlementData.paid_amount}
                            readOnly
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Auto-filled with remaining unpaid amount</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            value={settlementData.payment_date}
                            onChange={(e) => setSettlementData({...settlementData, payment_date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={settlementData.payment_method}
                            onChange={(e) => setSettlementData({...settlementData, payment_method: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="cheque">Cheque</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Collector Details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Collector Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Collector Name
                        </label>
                        <input
                          type="text"
                          value={settlementData.payment_collector_name}
                          onChange={(e) => setSettlementData({...settlementData, payment_collector_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Collector Mobile
                        </label>
                        <input
                          type="text"
                          value={settlementData.payment_collector_mobile}
                          onChange={(e) => setSettlementData({...settlementData, payment_collector_mobile: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter mobile"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notes (Optional)</h3>
                    <textarea
                      value={settlementData.notes}
                      onChange={(e) => setSettlementData({...settlementData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSettlementForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettlementSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Settlement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settlements Section - Hidden as it's now in tabs */}
        {/* <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Settlement History
            </h2>
          </div>
          <OperatorSettlementsView 
            operatorId={operator.id} 
            operatorName={operator.name} 
          />
        </div> */}
      </div>
    </div>
  );
}
