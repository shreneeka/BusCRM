"use client";

import { useState } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import SettlementList from "@/components/organization/SettlementList";
import PendingSettlements from "@/components/organization/PendingSettlements";

export default function SettlementsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("pending");

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e224c]">Operator Settlements</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "pending"
              ? "bg-[#3da9d4] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Settlements
          </div>
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "completed"
              ? "bg-[#3da9d4] text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed Settlements
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-3xl border border-dashboard-border overflow-hidden">
        {activeTab === "pending" ? (
          <PendingSettlements onRefresh={handleRefresh} />
        ) : (
          <SettlementList refreshTrigger={refreshKey} />
        )}
      </div>
    </div>
  );
}
