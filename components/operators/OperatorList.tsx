"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Phone,
  User,
  Building2,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { createOperator, updateOperator, deleteOperator } from "@/lib/actions/operators.actions";

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settlementCount?: number;
}

interface FormData {
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

export default function OperatorList({
  initialOperators,
}: {
  initialOperators: Operator[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [operatorToDelete, setOperatorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter operators based on search
  const filteredOperators = operators.filter((operator) => {
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      operator.name?.toLowerCase().includes(searchLower) ||
      operator.person_name?.toLowerCase().includes(searchLower) ||
      operator.mobile_number?.includes(searchLower)
    );
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOperators = filteredOperators.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    person_name: "",
    mobile_number: "",
    commission_percentage: 10,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      person_name: "",
      mobile_number: "",
      commission_percentage: 10,
      is_active: true,
    });
    setEditingOperator(null);
    setModalError("");
  };

  const handleEdit = (operator: Operator) => {
    setFormData({
      name: operator.name,
      person_name: operator.person_name || "",
      mobile_number: operator.mobile_number || "",
      commission_percentage: operator.commission_percentage,
      is_active: operator.is_active,
    });
    setEditingOperator(operator);
    setIsAddModalOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");

    try {
      // Validate mobile number
      if (formData.mobile_number && !/^[0-9]{10}$/.test(formData.mobile_number)) {
        throw new Error("Mobile number must be 10 digits");
      }

      // Validate commission percent
      if (formData.commission_percentage < 0 || formData.commission_percentage > 100) {
        throw new Error("Commission percent must be between 0 and 100");
      }

      if (editingOperator) {
        // Update existing operator
        try {
          await updateOperator(editingOperator.id, {
            operatorName: formData.name,
            contactPerson: formData.person_name,
            mobileNumber: formData.mobile_number,
            commissionPercent: formData.commission_percentage,
          });
          
          // Update local state
          setOperators(prev => prev.map(op => 
            op.id === editingOperator.id 
              ? { ...op, ...formData, updated_at: new Date().toISOString() }
              : op
          ));
          setIsAddModalOpen(false);
          resetForm();
        } catch (err: unknown) {
          setModalError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
      } else {
        // Create new operator
        try {
          await createOperator({
            operatorName: formData.name,
            contactPerson: formData.person_name,
            mobileNumber: formData.mobile_number,
            commissionPercent: formData.commission_percentage,
          });
          
          // Add to local state
          const newOperator: Operator = {
            id: Date.now().toString(), // Temporary ID, will be replaced by real one
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setOperators(prev => [newOperator, ...prev]);
          setIsAddModalOpen(false);
          resetForm();
        } catch (err: unknown) {
          setModalError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
      }
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!operatorToDelete) return;
    try {
      setLoadingId(operatorToDelete.id);
      setDeleteError(null);
      await deleteOperator(operatorToDelete.id);
      
      // Remove from local state
      setOperators(prev => prev.filter(op => op.id !== operatorToDelete.id));
      setOperatorToDelete(null);

      if (currentOperators.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete operator");
    } finally {
      setLoadingId(null);
    }
  }

  const toggleActive = async (operator: Operator) => {
    try {
      setLoadingId(operator.id);
      await updateOperator(operator.id, {
        operatorName: operator.name,
        contactPerson: operator.person_name,
        mobileNumber: operator.mobile_number,
        commissionPercent: operator.commission_percentage,
      });
      
      // Update local state
      setOperators(prev => prev.map(op => 
        op.id === operator.id 
          ? { ...op, is_active: !op.is_active, updated_at: new Date().toISOString() }
          : op
      ));
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to update operator status");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] relative z-0">
        {/* Header & Search Bar */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 shrink-0">
          <div className="relative w-full sm:flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary pl-10 text-sm w-full bg-white shadow-sm"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-brand flex items-center gap-2 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Operator
          </button>
        </div>

        {/* Operators Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
          {filteredOperators.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Building2 className="w-12 h-12 mb-3 text-slate-200" />
              <p className="text-sm font-medium">No operators found.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Operator</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Contact Person</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Mobile</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Commission</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Status</th>
                  <th className="px-4 py-4 font-bold whitespace-nowrap">Settlements</th>
                  <th className="px-4 py-4 font-bold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOperators.map((operator) => (
                  <tr
                    key={operator.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/operators/${operator.id}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#3da9d4]/10 flex items-center justify-center text-[#3da9d4] font-bold shrink-0 text-xs">
                          {(operator.name || "O").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">
                            {operator.name || "Unknown Operator"}
                          </span>
                          <span className="text-xs text-slate-500">
                            Created: {new Date(operator.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {operator.person_name || "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {operator.mobile_number || "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-700">
                        {operator.commission_percentage}%
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                          operator.is_active
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {operator.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/operators/${operator.id}/settlements`}
                        className="inline-flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        View Settlements
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(operator);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            operator.is_active
                              ? "text-orange-600 hover:bg-orange-100"
                              : "text-green-600 hover:bg-green-100"
                          }`}
                          title={operator.is_active ? "Deactivate" : "Activate"}
                        >
                          {loadingId === operator.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          href={`/operators/${operator.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(operator);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"
                          title="Edit Operator"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOperatorToDelete({
                              id: operator.id,
                              name: operator.name,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Operator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      {/* PAGINATION CONTROLS */}
      <div className="py-2 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
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
      </div>

      {/* Add/Edit Operator Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingOperator ? "Edit Operator" : "Add Operator"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editingOperator ? "Update operator details" : "Save directly to directory"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {modalError && (
                <div className="p-4 bg-rose-50 text-rose-600 text-base rounded-lg border border-rose-100 font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Operator Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-primary pl-12 w-full text-base"
                    placeholder="e.g., Express Travels"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Person
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.person_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                    className="input-primary pl-12 w-full text-base"
                    placeholder="e.g., Raj Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none gap-2">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600 text-base font-bold border-r border-slate-200 pr-3">
                      +91
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className="input-primary pl-20 w-full text-base font-medium tracking-wide"
                    placeholder="12345 67890"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Commission Percent *
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 0 }))}
                    className="input-primary w-full text-base"
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-base text-slate-700 font-medium">
                  Active (can book tickets)
                </label>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-base font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-brand px-8 py-3 flex items-center gap-3 shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {editingOperator ? "Update Operator" : "Create Operator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {operatorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Delete Operator
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Are you sure you want to delete{" "}
                <strong>&quot;{operatorToDelete.name}&quot;</strong>? This will completely
                remove it from the system.
              </p>

              {deleteError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-8 py-6 flex items-center justify-end gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setOperatorToDelete(null);
                  setDeleteError(null);
                }}
                disabled={loadingId === operatorToDelete.id}
                className="px-6 py-3 text-base font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loadingId === operatorToDelete.id}
                className="px-6 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-3 shadow-lg"
              >
                {loadingId === operatorToDelete.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Yes, Delete Operator"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
