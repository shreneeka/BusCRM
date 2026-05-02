"use client";

import { useMemo, useState } from "react";
import { Search, Calendar, User, CreditCard, Filter, ChevronLeft, ChevronRight, Eye, X, FileText } from "lucide-react";
import { getOperatorPaymentsHistory } from "@/lib/actions/payment.actions";
import type { OperatorPayment } from "@/lib/actions/payment.actions";

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [payments, setPayments] = useState<OperatorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPayment, setViewingPayment] = useState<OperatorPayment | null>(null);
  const itemsPerPage = 15;

  // Load data on mount
  useMemo(() => {
    const loadData = async () => {
      try {
        const data = await getOperatorPaymentsHistory();
        setPayments(data);
      } catch (error) {
        console.error("Error loading payment history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.ticket?.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.ticket?.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.operator?.operator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

      const paymentDate = new Date(payment.payment_date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const matchesFrom = !fromDate || paymentDate >= fromDate;
      const matchesTo = !toDate || paymentDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    }).sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [payments, searchTerm, dateFrom, dateTo]);

  // Reset to page 1 when search/filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amount_paid, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="saas-card bg-white flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-primary py-2 text-sm w-full lg:w-auto bg-white"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-primary py-2 text-sm w-full lg:w-auto bg-white"
            placeholder="To"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setDateFrom("");
              setDateTo("");
            }}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 hover:bg-[#3da9d4]/5 transition-colors"
            title="Reset Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 font-medium">
              Total: ₹{totalCollected.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 font-bold whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Ticket</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Passenger</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Operator</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Method</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {searchTerm || dateFrom || dateTo ? "No payments matched your filters." : "No payments found."}
                </td>
              </tr>
            ) : (
              currentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-slate-700">
                    <div>
                      <div className="font-medium">
                        {new Date(payment.payment_date).toLocaleDateString("en-GB")}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(payment.payment_date).toLocaleTimeString("en-GB", {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {payment.ticket?.ticket_number || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{payment.ticket?.passenger_name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-slate-900">
                        {payment.operator?.operator_name || "-"}
                      </div>
                      {payment.operator?.person_name && (
                        <div className="text-xs text-slate-500">{payment.operator.person_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                    ₹{payment.amount_paid.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      <CreditCard className="w-3 h-3" />
                      {payment.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setViewingPayment(payment)}
                      className="text-slate-500 hover:text-slate-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredPayments.length > 0 && (
        <div className="py-3 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">
            Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{" "}
            <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, filteredPayments.length)}</strong> of{" "}
            <strong className="text-slate-700">{filteredPayments.length}</strong> payments
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

      {/* Payment Details Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-lg font-bold text-emerald-600">
                    ₹{viewingPayment.amount_paid.toFixed(2)}
                  </span>
                  <p className="text-xs text-slate-500">{viewingPayment.payment_method}</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Payment Date:</span>
                  <span className="text-sm text-slate-700">
                    {new Date(viewingPayment.payment_date).toLocaleString("en-GB")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Operator:</span>
                  <span className="text-sm text-slate-700">{viewingPayment.operator?.operator_name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Passenger:</span>
                  <span className="text-sm text-slate-700">{viewingPayment.ticket?.passenger_name || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Ticket:</span>
                  <span className="text-sm text-slate-700">{viewingPayment.ticket?.ticket_number || "-"}</span>
                </div>
                {viewingPayment.notes && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">Notes:</span>
                    <span className="text-sm text-slate-700">{viewingPayment.notes}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
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
