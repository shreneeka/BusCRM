"use client";

import { ArrowLeft, Phone, User, Calendar, Mail, MapPin, Building, Clock, Edit, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  name?: string;
  mobile_number?: string;
  email?: string;
  address?: string;
  company?: string;
  created_at: string;
  updated_at?: string;
}

interface CustomerViewProps {
  customer: Customer;
}

export default function CustomerView({ customer }: CustomerViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Customer Details</h1>
          <p className="text-sm text-slate-500 mt-1">Customer ID: {customer.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Customer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Avatar and Basic Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {(customer.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {customer.name || "Unknown Customer"}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                {customer.mobile_number || "N/A"}
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Full Name</p>
              <p className="font-medium text-slate-900">
                {customer.name || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Mobile Number</p>
              <p className="font-medium text-slate-900">
                {customer.mobile_number || "Not provided"}
              </p>
            </div>
            {customer.email && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{customer.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location & Company */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-green-500" />
            Location & Company
          </h3>
          <div className="space-y-4">
            {customer.company && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Company</p>
                <p className="font-medium text-slate-900">{customer.company}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Address</p>
                <p className="font-medium text-slate-900">{customer.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Timeline Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Customer Since</p>
              <p className="font-medium text-slate-900">
                {new Date(customer.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(customer.created_at).toLocaleTimeString("en-IN")}
              </p>
            </div>
            {customer.updated_at && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Last Updated</p>
                <p className="font-medium text-slate-900">
                  {new Date(customer.updated_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(customer.updated_at).toLocaleTimeString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-slate-600">Total Bookings</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">₹0</p>
              <p className="text-sm text-slate-600">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
