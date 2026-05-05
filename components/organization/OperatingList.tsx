"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Users, Phone, User, Loader2, Search, Edit, Trash2, Percent, MoreVertical, AlertCircle } from "lucide-react";
import { getAllOperators, deleteOperator, Operator } from "@/lib/actions/operators.actions";


export default function OperatingList({
  onEdit,
  refreshTrigger = 0,
}: {
  onEdit?: (operator: Operator) => void;
  refreshTrigger?: number;
}) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const itemsPerPage = 15;

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const data = await getAllOperators();
      console.log('Fetched operators:', data?.length || 0, data);
      setOperators(data);
      setError("");
    } catch (error) {
      console.error("Error fetching operators:", error);
      setError("Failed to connect to database. Please ensure Supabase is running.");
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this operator?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteOperator(id);
      await fetchOperators();
    } catch (error) {
      console.error("Error deleting operator:", error);
    } finally {
      setDeletingId(null);
    }
  };

useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredOperators = operators.filter((operator) => {
    const query = searchQuery.toLowerCase().trim();
    
    let matchesSearch = true;
    if (query) {
      matchesSearch =
        operator.operator_name?.toLowerCase().includes(query) ||
        operator.person_name?.toLowerCase().includes(query) ||
        operator.mobile_number?.includes(query);
    }

    return matchesSearch && operator.is_active;
  });

  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOperators = filteredOperators.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3da9d4]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <div className="text-sm text-gray-600 mt-1 space-y-1">
                <p>Please check:</p>
                <p>1. Supabase is running: <code className="bg-gray-100 px-1 rounded">npx supabase start</code></p>
                <p>2. Database migrated: <code className="bg-gray-100 px-1 rounded">npx supabase db push</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search operators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        <button
          type="button"
          onClick={() => window.location.href = '/organization'}
          className="px-4 py-2 bg-[#3da9d4] text-white rounded-lg hover:bg-[#2882a8] transition-colors flex items-center gap-2 text-sm"
        >
          <Users className="w-4 h-4" />
          Add Operator
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredOperators.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">
              {searchQuery ? "No operators found" : "No operators added yet"}
            </p>
            <p className="text-slate-500 text-xs mb-4">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first operator to get started"}
            </p>
            <button
              type="button"
              onClick={() => window.location.href = '/organization'}
              className="px-4 py-2 bg-[#3da9d4] text-white rounded-lg hover:bg-[#2882a8] transition-colors flex items-center gap-2 mx-auto text-sm"
            >
              <Users className="w-4 h-4" />
              Add Operator
            </button>
          </div>
) : (
          <div className="p-4 space-y-3">
            {currentOperators.map((operator) => (
              <div
                key={operator.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm">
                      {operator.operator_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          operator.is_active
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          operator.is_active
                            ? "text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {operator.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(operator)}
                        className="p-2 text-slate-500 hover:text-[#3da9d4] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(operator.id)}
                      disabled={deletingId === operator.id}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Deactivate"
                    >
                      {deletingId === operator.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Contact Person</p>
                      <p className="font-medium text-slate-700">
                        {operator.person_name || "-"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Mobile</p>
                      <p className="font-medium text-slate-700">
                        {operator.mobile_number || "-"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 col-span-2">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Commission</p>
                      <p className="font-medium text-slate-700">
                        Commission ({operator.commission_percent}%) 
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

{/* Pagination & Footer Stats */}
      {filteredOperators.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <strong className="text-slate-700">
              {filteredOperators.length === 0 ? 0 : startIndex + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-700">
              {Math.min(startIndex + itemsPerPage, filteredOperators.length)}
            </strong>{" "}
            of <strong className="text-slate-700">{filteredOperators.length}</strong>{" "}
            operators
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg shadow-sm">
              {currentPage} / {Math.max(1, totalPages)}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
