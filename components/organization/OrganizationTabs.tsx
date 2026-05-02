"use client";

import { useState } from "react";
import { UserCog, DollarSign, Plus } from "lucide-react";
import OperatingList from "./OperatingList";
import SettlementList from "./SettlementList";
import OperatorForm from "./OperatorForm";
import { Operator } from "@/lib/actions/operators.actions";


interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_location: string;
  drop_location: string;
  journey_date: string;
  amount: number;
  status: string;
  operator_id: string | null;
}

export default function OrganizationTabs({
  initialOperators,
  initialSettlements,
}: {
  initialOperators?: Operator[];
  initialSettlements?: Ticket[];
}) {
  const [activeTab, setActiveTab] = useState<"operators" | "settlements">("operators");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsAddOpen(true);
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4]">
      {/* Header with Tab Navigation */}
      <div className="flex items-center justify-between gap-4 px-5 pt-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("operators")}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "operators"
                ? "bg-[#3da9d4] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <UserCog className="w-4 h-4" />
            Operators
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settlements")}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "settlements"
                ? "bg-[#3da9d4] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Settlements
          </button>
        </div>
        
        {activeTab === "operators" && (
          <button
            type="button"
            onClick={() => {
              setSelectedOperator(null);
              setIsAddOpen(true);
            }}
            className="btn-brand flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Plus className="w-3 h-3" />
            Add Operator
          </button>
        )}
      </div>

      {/* Operator Form Modal */}
      {isAddOpen && (
        <OperatorForm
          operator={selectedOperator}
          onSuccess={() => {
            handleSuccess();
            setIsAddOpen(false);
            setSelectedOperator(null);
          }}
          onClose={() => {
            setIsAddOpen(false);
            setSelectedOperator(null);
          }}
        />
      )}

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === "operators" ? (
          <OperatingList 
            onEdit={handleEdit} 
            refreshTrigger={refreshKey}
          />
        ) : (
          <SettlementList 
            onRefresh={handleSuccess}
            refreshTrigger={refreshKey}
          />
        )}
      </div>
    </div>
  );
}
