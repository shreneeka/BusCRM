"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCog, DollarSign, Plus } from "lucide-react";

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState("operators");

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e224c]">Organization</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/organization/operators"
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "operators"
              ? "bg-[#3da9d4] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Operators
          </div>
        </Link>
        <Link
          href="/organization/settlements"
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "settlements"
              ? "bg-[#3da9d4] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Settlements
          </div>
        </Link>
      </div>

{/* Content Area */}
      <div className="flex-1 bg-white rounded-3xl border border-dashboard-border p-6">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#f0f9ff] flex items-center justify-center mb-4">
            <UserCog className="w-8 h-8 text-[#3da9d4]" />
          </div>
          <h2 className="text-xl font-bold text-[#1e224c] mb-2">
            Organization Management
          </h2>
          <p className="text-slate-500 max-w-md mb-6">
            Manage your organization operators, view details, and configure
            settings.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/organization/operators"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3da9d4] text-white font-medium text-sm hover:bg-[#2d8bc4] transition-colors"
            >
              <UserCog className="w-4 h-4" />
              Go to Operators
            </Link>
            <Link
              href="/organization/settlements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Go to Settlements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
