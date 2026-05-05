"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Pencil,
  Trash2,
  X,
  Eye,
  Wallet,
  Tag,
  IndianRupee,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link,
} from "lucide-react";
import {
  AccountingEntry,
  AccountingCategory,
  AccountSummary,
  createAccountingEntry,
  updateAccountingEntry,
  deleteAccountingEntry,
} from "@/lib/actions/accounting.actions";

type EntryTypeFilter = "All" | "Income" | "Expense";

export default function EntriesList({
  initialEntries,
  accounts,
  categories,
  addType: externalAddType,
  setAddType: externalSetAddType,
  isAddOpen: externalIsAddOpen,
  setIsAddOpen: externalSetIsAddOpen,
}: {
  initialEntries: AccountingEntry[];
  accounts: AccountSummary[];
  categories: AccountingCategory[];
  addType?: "Income" | "Expense";
  setAddType?: (type: "Income" | "Expense") => void;
  isAddOpen?: boolean;
  setIsAddOpen?: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] =
    useState<EntryTypeFilter>("All");
  const [accountFilter, setAccountFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<AccountingEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const isAddOpen = externalIsAddOpen ?? false;
  const setIsAddOpen = externalSetIsAddOpen ?? (() => {});
  const addType = externalAddType ?? "Income";
  const setAddType = externalSetAddType ?? (() => {});

  const filteredEntries = useMemo(() => {
    return initialEntries
      .filter((entry) => {
        const textMatch = entry.description
          ? entry.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase().trim())
          : false;
        const accountMatch = entry.account?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());
        const categoryMatch = entry.category?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim());
        const query = searchTerm.trim().toLowerCase();

        const matchesSearch =
          !query || textMatch || accountMatch || categoryMatch;
        const matchesType =
          entryTypeFilter === "All" || entry.entry_type === entryTypeFilter;
        const matchesAccount =
          !accountFilter || entry.account_id === accountFilter;
        const matchesCategory =
          !categoryFilter || entry.category_id === categoryFilter;

const entryDate = new Date(entry.entry_date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        const matchesFrom = !fromDate || entryDate >= fromDate;
        const matchesTo = !toDate || entryDate <= toDate;

        return (
          matchesSearch &&
          matchesType &&
          matchesAccount &&
          matchesCategory &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort(
        (a, b) =>
          new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
      );
}, [
    initialEntries,
    searchTerm,
    entryTypeFilter,
    accountFilter,
    categoryFilter,
    dateFrom,
    dateTo,
  ]);

// Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entryTypeFilter, accountFilter, categoryFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const totals = useMemo(() => {
    const totalIncome = filteredEntries
      .filter((entry) => entry.entry_type === "Income")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalExpense = filteredEntries
      .filter((entry) => entry.entry_type === "Expense")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      totalTransactions: filteredEntries.length,
    };
  }, [filteredEntries]);

return (
    <div className="saas-card bg-white flex flex-col h-full">
{/* Filters */}
      <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full sm:flex-1 sm:w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        <select
          value={entryTypeFilter}
          onChange={(e) =>
            setEntryTypeFilter(e.target.value as EntryTypeFilter)
          }
          className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
<select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
        >
          <option value="">All Categories</option>
          {categories
            .filter((c) => c.is_active)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.category_type})
              </option>
            ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-primary py-2 text-sm w-full sm:w-auto bg-white"
            placeholder="To"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setEntryTypeFilter("All");
              setAccountFilter("");
              setCategoryFilter("");
              setDateFrom("");
              setDateTo("");
            }}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 hover:bg-[#3da9d4]/5 transition-colors"
            title="Reset Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 font-bold whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Type</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Account</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">
                Category
              </th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Remarks</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No entries matched the current filters.
                </td>
              </tr>
) : (
              currentEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-4 text-slate-700 text-sm">
                    {new Date(entry.entry_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.entry_type === "Income"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {entry.entry_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700 text-sm">
                    {entry.account?.name || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-700 text-sm">
                    {entry.category?.name || "-"}
                  </td>
                  <td
                    className={
                      "px-4 py-4 font-semibold text-sm " +
                      (entry.entry_type === "Income"
                        ? "text-emerald-600"
                        : "text-rose-600")
                    }
                  >
                    ₹{entry.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-sm">
                    {entry.remarks || "-"}
                  </td>
<td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingEntry(entry)}
                        className="text-slate-500 hover:text-slate-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEntry(entry)}
                        className="text-slate-500 hover:text-slate-900"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <form action={deleteAccountingEntry}>
                        <input type="hidden" name="id" value={entry.id} />
                        <button
                          type="submit"
                          className="text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
</table>
      </div>

      {/* Pagination Controls */}
      {filteredEntries.length > 0 && (
        <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">
            Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{" "}
            <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredEntries.length)}</strong> of{" "}
            <strong className="text-slate-700">{filteredEntries.length}</strong> entries
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
                  Add {addType}
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
<form action={createAccountingEntry} className="grid gap-2">
              <input type="hidden" name="entryType" value={addType} />
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Account</span>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select name="accountId" required className="input-primary pl-9">
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Category</span>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select name="categoryId" required className="input-primary pl-9">
                    <option value="">Select category</option>
                    {categories
                      .filter((c) => c.category_type === addType && c.is_active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    {categories
                      .filter((c) => c.category_type !== addType && c.is_active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.category_type})
                        </option>
                      ))}
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Amount</span>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Date</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="entryDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Remarks</span>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="description"
                    type="text"
                    placeholder="Optional notes"
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

{editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit transaction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
<form action={updateAccountingEntry} className="grid gap-2">
              <input type="hidden" name="id" value={editingEntry.id} />
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Account</span>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    name="accountId"
                    defaultValue={editingEntry.account_id}
                    required
                    className="input-primary pl-9"
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Category</span>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    name="categoryId"
                    defaultValue={editingEntry.category_id}
                    required
                    className="input-primary pl-9"
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((c) => c.is_active)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.category_type})
                        </option>
                      ))}
                  </select>
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Amount</span>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editingEntry.amount}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Date</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="entryDate"
                    type="date"
                    defaultValue={new Date(editingEntry.entry_date)
                      .toISOString()
                      .slice(0, 10)}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <label className="input-group">
                <span className="bg-slate-100 text-xs">Remarks</span>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="description"
                    type="text"
                    defaultValue={editingEntry.description || ""}
                    className="input-primary pl-9"
                  />
                </div>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
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

      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  View Transaction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEntry(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-lg ${viewingEntry.entry_type === "Income" ? "bg-emerald-100" : "bg-rose-100"}`}>
                  {viewingEntry.entry_type === "Income" ? (
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <IndianRupee className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div>
                  <span className={`text-lg font-bold ${viewingEntry.entry_type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>
                    {viewingEntry.entry_type === "Income" ? "+" : "-"}₹{Number(viewingEntry.amount).toFixed(2)}
                  </span>
                  <p className="text-xs text-slate-500">{viewingEntry.entry_type}</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Account:</span>
                  <span className="text-sm text-slate-700">{viewingEntry.account?.name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Category:</span>
                  <span className="text-sm text-slate-700">{viewingEntry.category?.name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Date:</span>
                  <span className="text-sm text-slate-700">{new Date(viewingEntry.entry_date).toLocaleDateString("en-GB")}</span>
                </div>
{viewingEntry.description && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">Remarks:</span>
                    <span className="text-sm text-slate-700">{viewingEntry.description}</span>
                  </div>
                )}
                {/* Ticket Link Info */}
                {viewingEntry.ticket && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <Link className="w-4 h-4 text-[#3da9d4]" />
                    <span className="text-xs font-semibold text-[#3da9d4] uppercase">Linked Ticket:</span>
                    <a
                      href={`/tickets/${viewingEntry.ticket.id}`}
                      className="text-sm font-bold text-[#3da9d4] hover:underline flex items-center gap-1"
                    >
                      {viewingEntry.ticket.ticket_number}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-slate-500">
                      ({viewingEntry.ticket.passenger_name})
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewingEntry(null)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
