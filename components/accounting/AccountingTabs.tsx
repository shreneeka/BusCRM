"use client";

import { useState } from "react";
import { Plus, Receipt, Building2, Tag } from "lucide-react";
import {
  AccountingCategory,
  AccountingEntry,
  AccountSummary,
} from "@/lib/actions/accounting.actions";
import EntriesList from "./EntriesList";
import AccountsList from "./AccountsList";
import CategoriesList from "./CategoriesList";

const tabs = [
  { key: "Entries", label: "Entries", icon: Receipt },
  { key: "Accounts", label: "Accounts", icon: Building2 },
  { key: "Categories", label: "Categories", icon: Tag },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AccountingTabs({
  initialEntries,
  initialCategories,
  initialAccounts,
}: {
  initialEntries: AccountingEntry[];
  initialCategories: AccountingCategory[];
  initialAccounts: AccountSummary[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("Entries");
  const [addType, setAddType] = useState<"Income" | "Expense">("Income");
  const [isAddOpen, setIsAddOpen] = useState(false);

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

        <div className="flex items-center gap-1.5">
          {activeTab === "Entries" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setAddType("Income");
                  setIsAddOpen(true);
                }}
                className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Plus className="w-3 h-3" /> Add Income
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddType("Expense");
                  setIsAddOpen(true);
                }}
                className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Plus className="w-3 h-3" /> Add Expense
              </button>
            </>
          )}
          {activeTab === "Accounts" && (
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(true);
              }}
              className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Plus className="w-3 h-3" /> Add Account
            </button>
          )}
          {activeTab === "Categories" && (
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(true);
              }}
              className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-sm"
            >
              <Plus className="w-3 h-3" /> Add Category
            </button>
)}
        </div>
      </div>

      {activeTab === "Entries" && (
        <EntriesList
          initialEntries={initialEntries}
          accounts={initialAccounts}
          categories={initialCategories}
          addType={addType}
          setAddType={setAddType}
          isAddOpen={isAddOpen}
          setIsAddOpen={setIsAddOpen}
        />
      )}
      {activeTab === "Accounts" && (
        <AccountsList
          initialAccounts={initialAccounts}
          isAddOpen={isAddOpen}
          setIsAddOpen={setIsAddOpen}
        />
      )}
      {activeTab === "Categories" && (
        <CategoriesList
          initialCategories={initialCategories}
          isAddOpen={isAddOpen}
          setIsAddOpen={setIsAddOpen}
        />
      )}
    </div>
  );
}
