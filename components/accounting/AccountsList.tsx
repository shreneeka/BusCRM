"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Pencil, X, Building2, Wallet, CreditCard, IndianRupee, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AccountSummary,
  createAccountingAccount,
  updateAccountingAccount,
} from "@/lib/actions/accounting.actions";

export default function AccountsList({
  initialAccounts,
  isAddOpen: externalIsAddOpen,
  setIsAddOpen: externalSetIsAddOpen,
}: {
  initialAccounts: AccountSummary[];
  isAddOpen?: boolean;
  setIsAddOpen?: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
>("All");
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const isAddOpen = externalIsAddOpen ?? false;
  const setIsAddOpen = externalSetIsAddOpen ?? (() => {});

  const filteredAccounts = useMemo(() => {
    return initialAccounts.filter((account) => {
      const matchesSearch =
        !searchTerm ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && account.is_active) ||
        (statusFilter === "Inactive" && !account.is_active);
      return matchesSearch && matchesStatus;
    });
}, [initialAccounts, searchTerm, statusFilter]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

return (
    <div className="saas-card bg-white flex flex-col h-full">
      {/* Filters */}
      <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full sm:flex-1 sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "All" | "Active" | "Inactive")
          }
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
              <th className="px-4 py-3 font-bold whitespace-nowrap">Name</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Type</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Opening</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">
                Total In
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">
                Total Out
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Balance</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No accounts match the filter.
                </td>
              </tr>
) : (
              currentAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-4 font-medium text-slate-700 text-sm">
                    {account.name}
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-sm">{account.type}</td>
                  <td className="px-4 py-4 text-slate-700 text-sm">
                    ₹{account.opening_balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-emerald-600 text-sm">
                    ₹{account.total_in.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-rose-600 text-sm">
                    ₹{account.total_out.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900 text-sm">
                    ₹{account.current_balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setEditingAccount(account)}
                      className="text-slate-500 hover:text-slate-900"
                      title="Edit account"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
</table>
      </div>

      {/* Pagination Controls */}
      {filteredAccounts.length > 0 && (
        <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">
            Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{" "}
            <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredAccounts.length)}</strong> of{" "}
            <strong className="text-slate-700">{filteredAccounts.length}</strong> accounts
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
                  Create account
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
<form action={createAccountingAccount} className="grid gap-2">
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Name</span>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    className="input-primary pl-9"
                    placeholder="Account name"
                  />
                </div>
              </label>
<label className="input-group">
                <span className="bg-slate-100 text-xs">Type</span>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select name="type" required className="input-primary pl-9">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Opening Balance</span>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="openingBalance"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
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

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
<form action={updateAccountingAccount} className="grid gap-2">
              <input type="hidden" name="id" value={editingAccount.id} />
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Name</span>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingAccount.name}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group flex items-center gap-3">
                <input type="hidden" name="isActive" value="false" />
                <input
                  name="isActive"
                  type="checkbox"
                  value="true"
                  defaultChecked={editingAccount.is_active}
                  className="h-4 w-4 text-slate-900"
                />
                <span className="text-sm text-slate-700">
                  Set account active
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
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
