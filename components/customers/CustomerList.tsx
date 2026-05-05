"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Phone,
  User,
  Calendar,
  UserPlus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { addManualCustomer } from "@/lib/actions/lead.actions";

interface Customer {
  id: string;
  name?: string;
  mobile_number?: string;
  created_at: string;
}

export default function CustomerList({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ROCK-SOLID SEARCH FILTER
  const filteredCustomers = initialCustomers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const customerName = (customer.name || "").toLowerCase();
    const mobile = (customer.mobile_number || "").toLowerCase();

    return customerName.includes(searchLower) || mobile.includes(searchLower);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Handle Form Submission
  async function handleAddCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const rawMobile = formData.get("mobile_number") as string;
    const mobile_number = `+91 ${rawMobile}`;

    try {
      const result = await addManualCustomer(name, mobile_number);
      if (result?.error) {
        setModalError(result.error);
      } else {
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setModalError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4]">
      {/* 1. Header & Search Bar */}
      <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full sm:flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-brand flex items-center gap-2 shrink-0 py-2.5 px-5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* 2. Directory Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <User className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-sm font-medium">No customers found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Number</th>
                <th className="px-6 py-4 font-bold text-right">Added On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#3da9d4]/10 flex items-center justify-center text-[#3da9d4] font-bold shrink-0 text-sm">
                        {(customer.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-bold text-slate-800 text-sm hover:text-blue-600 hover:underline transition-colors"
                      >
                        {customer.name || "Unknown Customer"}
                      </Link>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm text-slate-600 font-medium flex items-center gap-2 hover:text-blue-600 hover:underline transition-colors"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      {customer.mobile_number || "N/A"}
                    </Link>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm text-slate-500 flex items-center justify-end gap-1.5 font-medium hover:text-blue-600 hover:underline transition-colors"
                    >
                      <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                      {new Date(customer.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </Link>
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
            {filteredCustomers.length === 0 ? 0 : startIndex + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-700">
            {Math.min(startIndex + itemsPerPage, filteredCustomers.length)}
          </strong>{" "}
          of{" "}
          <strong className="text-slate-700">{filteredCustomers.length}</strong>{" "}
          customers
        </span>

        {/* CHANGED: gap-2 to gap-1 to pull buttons closer */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            // CHANGED: py-1.5 to py-1, px-3 to px-2.5
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          {/* CHANGED: py-1.5 to py-1, px-4 to px-3 */}
          <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg shadow-sm">
            {currentPage} / {Math.max(1, totalPages)}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            // CHANGED: py-1.5 to py-1, px-3 to px-2.5
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Add Customer
                </h3>
                <p className="text-xs text-slate-500">
                  Save directly to directory
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100 font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    name="name"
                    className="input-primary pl-9 w-full"
                    placeholder="e.g. Rahul Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 text-sm font-bold border-r border-slate-200 pr-2">
                      +91
                    </span>
                  </div>
                  <input
                    required
                    type="tel"
                    name="mobile_number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className="input-primary pl-[76px] w-full font-medium tracking-wide"
                    placeholder="12345 67890"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-brand px-6 py-2.5 flex items-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
