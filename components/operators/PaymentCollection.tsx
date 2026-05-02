"use client";

import { useMemo, useState } from "react";
import { Search, CreditCard, User, DollarSign, Check, X } from "lucide-react";
import { getPaymentCollectionDetails, recordOperatorPayment } from "@/lib/actions/payment.actions";
import type { PaymentCollectionDetails } from "@/lib/actions/payment.actions";

export default function PaymentCollection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [details, setDetails] = useState<PaymentCollectionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectingPayment, setCollectingPayment] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    ticketId: string;
    amountPaid: string;
    paymentMethod: string;
    notes: string;
  } | null>(null);

  // Load data on mount
  useMemo(() => {
    const loadData = async () => {
      try {
        const data = await getPaymentCollectionDetails();
        setDetails(data);
      } catch (error) {
        console.error("Error loading payment collection details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get unique operators for filter
  const operators = useMemo(() => {
    const uniqueOperators = Array.from(new Map(
      details.map(d => [d.operator_id, { id: d.operator_id, name: d.operator_name }])
    ).values());
    return uniqueOperators;
  }, [details]);

  const filteredDetails = details.filter(detail => {
    const matchesSearch = !searchTerm || 
      detail.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      detail.operator_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperator = !selectedOperator || detail.operator_id === selectedOperator;
    
    return matchesSearch && matchesOperator;
  });

  const unpaidTickets = filteredDetails.filter(d => !d.payment_collected);

  const handleCollectPayment = (ticket: PaymentCollectionDetails) => {
    setPaymentForm({
      ticketId: ticket.ticket_id,
      amountPaid: ticket.operator_payable.toString(),
      paymentMethod: "Cash",
      notes: ""
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm) return;

    setCollectingPayment(paymentForm.ticketId);
    try {
      const formData = new FormData();
      formData.append('operatorId', selectedOperator || unpaidTickets[0]?.operator_id || '');
      formData.append('ticketId', paymentForm.ticketId);
      formData.append('amountPaid', paymentForm.amountPaid);
      formData.append('paymentMethod', paymentForm.paymentMethod);
      formData.append('notes', paymentForm.notes);

      await recordOperatorPayment(formData);
      
      // Refresh data
      const updatedData = await getPaymentCollectionDetails();
      setDetails(updatedData);
      
      setPaymentForm(null);
    } catch (error) {
      console.error("Error collecting payment:", error);
    } finally {
      setCollectingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading payment collection details...</div>
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
            placeholder="Search tickets, passengers, operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-9 py-2 text-sm w-full bg-white"
          />
        </div>
        
        <select
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          className="input-primary py-2 text-sm w-full lg:w-auto bg-white"
        >
          <option value="">All Operators</option>
          {operators.map(operator => (
            <option key={operator.id} value={operator.id}>
              {operator.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-sm">
          <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 font-medium">
              {unpaidTickets.length} Unpaid Tickets
            </span>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-4 py-3 font-bold whitespace-nowrap">Ticket</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Passenger</th>
              <th className="px-4 py-3 font-bold whitespace-nowrap">Operator</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Commission</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Payable</th>
              <th className="px-4 py-3 font-bold text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3 font-bold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDetails.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  {searchTerm || selectedOperator ? "No tickets matched your filters." : "No tickets found."}
                </td>
              </tr>
            ) : (
              filteredDetails.map((detail) => (
                <tr key={detail.ticket_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-semibold text-slate-900">{detail.ticket_number}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(detail.booking_date).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{detail.passenger_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{detail.operator_name}</div>
                      {detail.person_name && (
                        <div className="text-xs text-slate-500">{detail.person_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-700">
                    ₹{detail.ticket_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-emerald-600 font-medium">
                      ₹{detail.commission_amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-blue-600 font-semibold">
                      ₹{detail.operator_payable.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {detail.payment_collected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <Check className="w-3 h-3" />
                        Collected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                        <X className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {!detail.payment_collected ? (
                      <button
                        onClick={() => handleCollectPayment(detail)}
                        className="btn-brand flex items-center gap-1 px-3 py-1.5 text-sm"
                      >
                        <CreditCard className="w-3 h-3" />
                        Collect
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500">
                        {new Date(detail.payment_collected_at!).toLocaleDateString("en-GB")}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Collection Modal */}
      {paymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Collect Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentForm(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="grid gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    Ticket: {unpaidTickets.find(t => t.ticket_id === paymentForm.ticketId)?.ticket_number}
                  </div>
                  <div>Amount Due: ₹{paymentForm.amountPaid}</div>
                </div>
              </div>

              <label className="input-group">
                <span className="bg-slate-100 text-xs">Amount Paid</span>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="amountPaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({...paymentForm, amountPaid: e.target.value})}
                    required
                    className="input-primary pl-9"
                  />
                </div>
              </label>

              <label className="input-group">
                <span className="bg-slate-100 text-xs">Payment Method</span>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                  className="input-primary"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </label>

              <label className="input-group">
                <span className="bg-slate-100 text-xs">Notes</span>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Optional notes"
                  className="input-primary"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentForm(null)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-brand px-3 py-1.5 text-sm"
                  disabled={collectingPayment === paymentForm.ticketId}
                >
                  {collectingPayment === paymentForm.ticketId ? "Processing..." : "Collect Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
