"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import OperatingList from "@/components/organization/OperatingList";
import AddOperatorModal from "./AddOperatorModal";
import EditOperatorModal from "./EditOperatorModal";
import { Operator } from "@/lib/actions/operators.actions";


export default function OperatorsPage() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenEdit(true);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e224c]">Operator Management</h1>
        <button
          onClick={() => setOpenAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3da9d4] text-white font-medium text-sm hover:bg-[#2d8bc4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Operator
        </button>
      </div>

      {/* Operator List */}
      <div className="flex-1 bg-white rounded-3xl border border-dashboard-border overflow-hidden">
        <OperatingList 
          onEdit={handleEdit} 
          refreshTrigger={refreshKey}
        />
      </div>

      {/* Modals */}
      <AddOperatorModal 
        open={openAdd} 
        onClose={() => setOpenAdd(false)}
        onSuccess={handleSuccess}
      />
      
      <EditOperatorModal
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setSelectedOperator(null);
        }}
        operator={selectedOperator}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
