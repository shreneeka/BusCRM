"use client";

import { useMemo, useState } from "react";
import { getPaymentStatistics, getOperatorPaymentSummary } from "@/lib/actions/payment.actions";
import { TrendingUp, Users, CreditCard, Calendar, DollarSign, PieChart } from "lucide-react";

export default function PaymentStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useMemo(() => {
    const loadData = async () => {
      try {
        const [statsData, summariesData] = await Promise.all([
          getPaymentStatistics(),
          getOperatorPaymentSummary()
        ]);
        setStats(statsData);
        setSummaries(summariesData);
      } catch (error) {
        console.error("Error loading statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading statistics...</div>
      </div>
    );
  }

  const collectionRate = stats.totalTickets > 0 
    ? (stats.totalPaidTickets / stats.totalTickets) * 100 
    : 0;

  const averageTicketValue = stats.totalTickets > 0 
    ? stats.totalAmount / stats.totalTickets 
    : 0;

  return (
    <div className="saas-card bg-white flex flex-col h-full p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Collection Statistics</h2>
        <p className="text-sm text-slate-600">Overview of operator payment collection performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-800">
              ₹{stats.totalAmount.toFixed(0)}
            </span>
          </div>
          <div className="text-sm font-medium text-emerald-700">Total Revenue</div>
          <div className="text-xs text-emerald-600 mt-1">From {stats.totalTickets} tickets</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-800">
              ₹{stats.totalCollected.toFixed(0)}
            </span>
          </div>
          <div className="text-sm font-medium text-blue-700">Amount Collected</div>
          <div className="text-xs text-blue-600 mt-1">{stats.totalPaidTickets} payments</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-amber-600" />
            <span className="text-2xl font-bold text-amber-800">
              ₹{stats.totalPending.toFixed(0)}
            </span>
          </div>
          <div className="text-sm font-medium text-amber-700">Pending Collection</div>
          <div className="text-xs text-amber-600 mt-1">{stats.totalUnpaidTickets} tickets</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-800">
              {collectionRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm font-medium text-purple-700">Collection Rate</div>
          <div className="text-xs text-purple-600 mt-1">{stats.totalOperators} operators</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            Financial Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Average Ticket Value</span>
              <span className="font-semibold text-slate-900">₹{averageTicketValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Average Collection per Operator</span>
              <span className="font-semibold text-slate-900">
                ₹{stats.totalOperators > 0 ? (stats.totalCollected / stats.totalOperators).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Pending per Operator</span>
              <span className="font-semibold text-slate-900">
                ₹{stats.totalOperators > 0 ? (stats.totalPending / stats.totalOperators).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-600" />
            Collection Overview
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Collected Amount</span>
                <span className="text-sm font-medium text-emerald-700">
                  {stats.totalAmount > 0 ? ((stats.totalCollected / stats.totalAmount) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${stats.totalAmount > 0 ? (stats.totalCollected / stats.totalAmount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Pending Amount</span>
                <span className="text-sm font-medium text-amber-700">
                  {stats.totalAmount > 0 ? ((stats.totalPending / stats.totalAmount) * 100).toFixed(1) : '0'}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${stats.totalAmount > 0 ? (stats.totalPending / stats.totalAmount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Operators */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Performing Operators</h3>
        <div className="space-y-2">
          {summaries
            .sort((a, b) => b.collected_amount - a.collected_amount)
            .slice(0, 5)
            .map((operator, index) => {
              const operatorCollectionRate = operator.total_tickets > 0 
                ? (operator.paid_tickets / operator.total_tickets) * 100 
                : 0;
              
              return (
                <div key={operator.operator_id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3da9d4] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{operator.operator_name}</div>
                      <div className="text-xs text-slate-500">
                        {operator.total_tickets} tickets ({operator.paid_tickets} paid)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600">₹{operator.collected_amount.toFixed(2)}</div>
                    <div className="text-xs text-slate-500">{operatorCollectionRate.toFixed(1)}% rate</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
