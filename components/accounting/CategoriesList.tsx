
"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, X, Tag, FileText, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AccountingCategory,
  createAccountingCategory,
  updateAccountingCategory,
  deleteAccountingCategory,
} from "@/lib/actions/accounting.actions";

type TypeFilter = "All" | "Income" | "Expense";
type StatusFilter = "All" | "Active" | "Inactive";

export default function CategoriesList({
  initialCategories,
  isAddOpen: externalIsAddOpen,
  setIsAddOpen: externalSetIsAddOpen,
}: {
  initialCategories: AccountingCategory[];
  isAddOpen?: boolean;
  setIsAddOpen?: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [editingCategory, setEditingCategory] =
    useState<AccountingCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const isAddOpen = externalIsAddOpen ?? false;
  const setIsAddOpen = externalSetIsAddOpen ?? (() => {});

  const filteredCategories = useMemo(() => {
    return initialCategories.filter((category) => {
      const matchesSearch =
        !searchTerm ||
        category.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesType =
        typeFilter === "All" || category.category_type === typeFilter;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && category.is_active) ||
        (statusFilter === "Inactive" && !category.is_active);
      return matchesSearch && matchesType && matchesStatus;
    });
}, [initialCategories, searchTerm, typeFilter, statusFilter]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

return (
    <div className="saas-card bg-white flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full sm:flex-1 sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 font-bold whitespace-nowrap">
                Category
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Type</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Created</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCategories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No categories match the current filter.
                </td>
              </tr>
) : (
              currentCategories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {category.name}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {category.category_type}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${category.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(category.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(category)}
                      className="text-slate-500 hover:text-slate-900"
                      title="Edit category"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <form action={deleteAccountingCategory}>
                      <input type="hidden" name="id" value={category.id} />
                      <button
                        type="submit"
                        className="text-rose-500 hover:text-rose-700"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
</table>
      </div>

      {/* Pagination Controls */}
      {filteredCategories.length > 0 && (
        <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">
            Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{" "}
            <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredCategories.length)}</strong> of{" "}
            <strong className="text-slate-700">{filteredCategories.length}</strong> categories
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

{isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
<form action={createAccountingCategory} className="grid gap-2">
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Name</span>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="input-primary pl-9"
                    placeholder="Category name"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Type</span>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select name="categoryType" required className="input-primary pl-9">
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Description</span>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="description"
                    type="text"
                    placeholder="Optional description"
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-brand px-3 py-1.5 text-sm">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
<form action={updateAccountingCategory} className="grid gap-2">
              <input type="hidden" name="id" value={editingCategory.id} />
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Name</span>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingCategory.name}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Type</span>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    name="categoryType"
                    defaultValue={editingCategory.category_type}
                    required
                    className="input-primary pl-9"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </label>
              <label className="input-group flex items-center gap-3">
                <input type="hidden" name="isActive" value="false" />
                <input
                  name="isActive"
                  type="checkbox"
                  value="true"
                  defaultChecked={editingCategory.is_active}
                  className="h-4 w-4 text-slate-900"
                />
                <span className="text-sm text-slate-700">
                  Keep category active
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-brand px-3 py-1.5 text-sm">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
)}
    </div>
  );
}
