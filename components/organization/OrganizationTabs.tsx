"use client";

import { useState } from "react";
import { UserCog, Plus } from "lucide-react";
import OperatingList from "./OperatingList";
import OperatorForm from "./OperatorForm";
import { Operator } from "@/lib/actions/operators.actions";

export default function OrganizationTabs({
  initialOperators,
}: {
  initialOperators?: Operator[];
}) {
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 pt-4 border-b border-slate-100 bg-white shrink-0">
        <h1 className="text-xl font-bold text-[#1e224c]">Operators Management</h1>
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

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <OperatingList 
          onEdit={handleEdit} 
          refreshTrigger={refreshKey}
        />
      </div>
    </div>
  );
}

