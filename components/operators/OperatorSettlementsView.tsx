"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OperatorSettlement {
  id: string;
  ticket_id: string;
  operator_name: string;
  mobile_number: string;
  total_amount: number;
  commission_percentage: number;
  commission_amount: number;
  operator_payable: number;
  is_paid: boolean;
  paid_at: string | null;
  payment_status: string;
  settlement_method: string;
  reference_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  payment_collector_name: string | null;
  payment_collector_mobile: string | null;
  payment_collected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_amount?: number;
  remaining_amount?: number;
}

interface Props {
  operatorId: string;
  operatorName: string;
}

export default function OperatorSettlementsView({ operatorId, operatorName }: Props) {
  const supabase = createClient();
  const [settlements, setSettlements] = useState<OperatorSettlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<OperatorSettlement | null>(null);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operator_settlements")
        .select("*")
        .eq("operator_name", operatorName)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching settlements:", error);
        setSettlements([]);
        return;
      }

      setSettlements(data || []);
    } catch (error) {
      console.error("Unexpected error fetching settlements:", error);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [operatorId]);

  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch = 
      settlement.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && (settlement.is_paid || settlement.payment_status === 'done')) ||
      (filterStatus === "unpaid" && !settlement.is_paid && settlement.payment_status !== 'partial') ||
      (filterStatus === "partial" && settlement.payment_status === 'partial');

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusDisplay = (settlement: OperatorSettlement) => {
    if (settlement.payment_status === 'partial') {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
        text: "Partial Paid",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800"
      };
    } else if (settlement.is_paid || settlement.payment_status === 'done') {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        text: "Paid",
        bgColor: "bg-green-100",
        textColor: "text-green-800"
      };
    } else {
      return {
        icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
        text: "Unpaid",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800"
      };
    }
  };

  const SettlementDetailsModal = ({ settlement }: { settlement: OperatorSettlement }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Settlement Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Financial Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Financial Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(settlement.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Percentage</p>
                    <p className="font-medium">{settlement.commission_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Amount</p>
                    <p className="font-medium text-green-600">{formatCurrency(settlement.commission_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Operator Payable</p>
                    <p className="font-medium text-blue-600">{formatCurrency(settlement.operator_payable)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = getStatusDisplay(settlement);
                      return (
                        <>
                          {status.icon}
                          <span className={`font-medium ${status.textColor}`}>{status.text}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-1 font-medium capitalize">{settlement.payment_status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Method:</span>
                      <span className="ml-1 font-medium capitalize">{settlement.settlement_method.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {settlement.payment_status === 'partial' && (
                    <div className="bg-yellow-50 rounded-lg p-3 mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            {formatCurrency(settlement.operator_payable)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid Amount:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {settlement.paid_amount ? formatCurrency(settlement.paid_amount) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining:</span>
                          <span className="ml-2 font-medium text-orange-600">
                            {settlement.remaining_amount ? formatCurrency(settlement.remaining_amount) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Formula:</span>
                          <span className="ml-2 text-xs text-gray-500">Amount - Paid Amount</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {settlement.paid_at && (
                    <p className="text-sm text-gray-600">
                      Paid on: {formatDateTime(settlement.paid_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Bank/Transfer Details */}
              {(settlement.reference_number || settlement.bank_name || settlement.account_number) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Bank/Transfer Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {settlement.reference_number && (
                        <div>
                          <p className="text-sm text-gray-500">Reference Number</p>
                          <p className="font-medium">{settlement.reference_number}</p>
                        </div>
                      )}
                      {settlement.bank_name && (
                        <div>
                          <p className="text-sm text-gray-500">Bank Name</p>
                          <p className="font-medium">{settlement.bank_name}</p>
                        </div>
                      )}
                      {settlement.account_number && (
                        <div>
                          <p className="text-sm text-gray-500">Account Number</p>
                          <p className="font-medium">{settlement.account_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Collector Details */}
              {settlement.is_paid && (settlement.payment_collector_name || settlement.payment_collector_mobile || settlement.payment_collected_at) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Collector Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {settlement.payment_collector_name && (
                        <div>
                          <p className="text-sm text-gray-500">Collector Name</p>
                          <p className="font-medium">{settlement.payment_collector_name}</p>
                        </div>
                      )}
                      {settlement.payment_collector_mobile && (
                        <div>
                          <p className="text-sm text-gray-500">Collector Mobile</p>
                          <p className="font-medium">{settlement.payment_collector_mobile}</p>
                        </div>
                      )}
                      {settlement.payment_collected_at && (
                        <div>
                          <p className="text-sm text-gray-500">Collection Date & Time</p>
                          <p className="font-medium">{formatDateTime(settlement.payment_collected_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Timestamps</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium">{formatDateTime(settlement.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Updated At</p>
                    <p className="font-medium">{formatDateTime(settlement.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {settlement.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Notes</h4>
                  <p className="text-gray-700">{settlement.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculate totals
  const totals = settlements.reduce(
    (acc, settlement) => {
      acc.totalAmount += settlement.total_amount;
      acc.totalCommission += settlement.commission_amount;
      acc.totalOperatorPayable += settlement.operator_payable;
      acc.paidSettlements += settlement.is_paid ? 1 : 0;
      return acc;
    },
    { 
      totalAmount: 0, 
      totalCommission: 0, 
      totalOperatorPayable: 0,
      paidSettlements: 0
    }
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Settlement History
        </h3>
        <button
          onClick={fetchSettlements}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          title="Refresh"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Settlements</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{settlements.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Total Amount</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.totalAmount)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Commission Earned</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.totalCommission)}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">Paid Settlements</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{totals.paidSettlements}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search settlements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "paid" | "unpaid" | "partial")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Settlements Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading settlements...</span>
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-lg font-medium mb-2">No settlements found</p>
            <p className="text-sm">
              {settlements.length === 0 
                ? "No settlements available for this operator."
                : "No settlements match your current filters."
              }
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Commission</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Operator Payable</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.map((settlement) => (
                <tr key={settlement.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {formatDate(settlement.created_at)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{formatCurrency(settlement.total_amount)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">{formatCurrency(settlement.commission_amount)}</div>
                      <div className="text-gray-500">{settlement.commission_percentage}%</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-blue-900">{formatCurrency(settlement.operator_payable)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const status = getStatusDisplay(settlement);
                        return (
                          <>
                            {status.icon}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                              {status.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm capitalize">{settlement.settlement_method.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono">{settlement.reference_number || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedSettlement(settlement);
                        setShowDetails(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedSettlement && (
        <SettlementDetailsModal settlement={selectedSettlement} />
      )}
    </div>
  );
}
