"use client";

import { Eye, Phone, User, Building2, DollarSign, Ticket, Calendar, CheckCircle2, Clock, ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import OperatorSettlementsView from "./OperatorSettlementsView";


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
    commission_percentage: number;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
  };
  statistics: Statistics;
}

interface Props {
  operatorSummary: OperatorSummary;
}

export default function OperatorView({ operatorSummary }: Props) {
  const { operator, statistics } = operatorSummary;
  const { totalTickets, bookedAmount, settledAmount, totalCommission, pendingSettlements, commissionPercentage } = statistics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3da9d4] to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {operator.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{operator.name}</h1>
            <p className="text-lg text-slate-600 flex items-center gap-2">
              <User className="w-5 h-5" />
              {operator.person_name || "No contact person"}
            </p>
            <span className={`inline-flex px-3 py-1 mt-2 text-sm font-semibold rounded-full ${
              operator.is_active 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-slate-100 text-slate-600"
            }`}>
              {operator.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/operators/${operator.id}/edit`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">
            <Edit2 className="w-4 h-4" />
            Edit
          </Link>
          <Link 
            href="/operators" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Link>
        </div>
      </div>

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Contact</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{operator.mobile_number || "N/A"}</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Commission Rate</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{commissionPercentage}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Created</h3>
          </div>
          <p className="text-lg text-slate-900 font-medium">
            {new Date(operator.created_at).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {operator.updated_at && (
            <p className="text-sm text-slate-500 mt-1">
              Updated: {new Date(operator.updated_at).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Ticket className="w-7 h-7" />
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Total Tickets</p>
                <p className="text-2xl font-bold text-slate-900">{totalTickets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Booked Amount</p>
                <p className="text-2xl font-bold text-slate-900">₹{bookedAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Pending Settlements</p>
                <p className="text-2xl font-bold text-slate-900">{pendingSettlements}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-100 p-6 rounded-2xl border border-purple-200 shadow-sm group hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Total Commission</p>
                <p className="text-2xl font-bold text-purple-700">₹{totalCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settlements Section */}
      <OperatorSettlementsView 
        operatorId={operator.id} 
        operatorName={operator.name} 
      />
    </div>
  );
}
