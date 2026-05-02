"use client";

import { useState } from "react";
import { CreditCard, Users, History, TrendingUp } from "lucide-react";
import PaymentSummary from "./PaymentSummary";
import PaymentCollection from "./PaymentCollection";
import PaymentHistory from "./PaymentHistory";
import PaymentStatistics from "./PaymentStatistics";

const tabs = [
  { key: "summary", label: "Summary", icon: TrendingUp },
  { key: "collection", label: "Collection", icon: CreditCard },
  { key: "history", label: "History", icon: History },
  { key: "statistics", label: "Statistics", icon: Users },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function PaymentCollectionTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-0 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-[#3da9d4] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "summary" && <PaymentSummary />}
      {activeTab === "collection" && <PaymentCollection />}
      {activeTab === "history" && <PaymentHistory />}
      {activeTab === "statistics" && <PaymentStatistics />}
    </div>
  );
}
