"use client";

import { ArrowLeft, MapPin, Edit, Trash2, Building, Users, Calendar, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface City {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

interface CityViewProps {
  city: City;
}

export default function CityView({ city }: CityViewProps) {
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
          <h1 className="text-2xl font-bold text-slate-900">City Details</h1>
          <p className="text-sm text-slate-500 mt-1">City ID: {city.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit City"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete City"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* City Avatar and Basic Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
            <MapPin className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {city.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building className="w-4 h-4" />
              <span>City Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            City Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">City Name</p>
              <p className="font-medium text-slate-900 text-lg">{city.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">City ID</p>
              <p className="font-medium text-slate-900 font-mono">{city.id}</p>
            </div>
          </div>
        </div>

        {/* Timeline Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Timeline Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Added On</p>
              <p className="font-medium text-slate-900">
                {new Date(city.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(city.created_at).toLocaleTimeString("en-IN")}
              </p>
            </div>
            {city.updated_at && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Last Updated</p>
                <p className="font-medium text-slate-900">
                  {new Date(city.updated_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(city.updated_at).toLocaleTimeString("en-IN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Usage Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-slate-600">Total Bookings</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-slate-600">As Origin</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-sm text-slate-600">As Destination</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">0</p>
              <p className="text-sm text-slate-600">Active Routes</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" />
              Edit City Details
            </button>
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              View Usage Report
            </button>
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              View All Routes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
