"use client";

import { useState } from "react";
import {
  Users,
  Phone,
  Building2,
  Edit,
  Trash2,
  Search,
  Loader2,
  Plus,
  Calculator,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- TYPES ---
interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
}

interface OperatorTableProps {
  operators: Operator[];
  onEdit: (operator: Operator) => void;
  onDelete: (operator: Operator) => void;
  onAdd: () => void;
  loading?: boolean;
}

export default function OperatorTable({
  operators,
  onEdit,
  onDelete,
  onAdd,
  loading = false,
}: OperatorTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredOperators = operators.filter((operator) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      operator.operator_name?.toLowerCase().includes(query) ||
      operator.person_name?.toLowerCase().includes(query) ||
      operator.mobile_number?.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3da9d4]" />
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">No operators found</p>
        <p className="text-slate-500 text-xs">Create your first operator to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar with Add Button */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search operators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-primary pl-9 w-full"
            />
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3da9d4] text-white font-medium text-sm hover:bg-[#2d8bc4] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Operator
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredOperators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No operators found</p>
            <p className="text-slate-500 text-xs">Try adjusting your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#f0f9ff] rounded-full flex items-center justify-center mr-3">
                          <Building2 className="w-4 h-4 text-[#3da9d4]" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {operator.operator_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm text-slate-700">
                          {operator.person_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm text-slate-700">
                          {operator.mobile_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          operator.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {operator.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {new Date(operator.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push('/operator-settlement')}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Go to settlement"
                        >
                          <Calculator className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => onEdit(operator)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit operator"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => onDelete(operator)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete operator"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          Showing {filteredOperators.length} of {operators.length} operators
        </p>
      </div>
    </div>
  );
}
