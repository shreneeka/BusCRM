"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Phone,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OperatorSettlementForm from "./OperatorSettlementForm";

interface Settlement {
  id: string;
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
}

export default function SettlementProcessingScreen() {
  const supabase = createClient();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [showAddSettlement, setShowAddSettlement] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operator_settlements")
        .select("*")
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
  }, [supabase]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch = 
      settlement.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.mobile_number?.includes(searchTerm) ||
      settlement.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && settlement.is_paid) ||
      (filterStatus === "unpaid" && !settlement.is_paid);

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

  const markAsPaid = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from("operator_settlements")
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", settlementId);

      if (error) throw error;

      await fetchSettlements();
      alert("Settlement marked as paid");
    } catch (error) {
      console.error("Error marking settlement as paid:", error);
      alert("Failed to mark settlement as paid");
    }
  };

  const SettlementDetailsModal = ({ settlement }: { settlement: Settlement }) => {
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
              {/* Operator Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Operator Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Operator Name</p>
                    <p className="font-medium">{settlement.operator_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <p className="font-medium">{settlement.mobile_number || "N/A"}</p>
                  </div>
                </div>
              </div>

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
                    {settlement.is_paid ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">Paid</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <span className="text-orange-600 font-medium">Unpaid</span>
                      </>
                    )}
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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settlement Processing</h2>
          <p className="text-gray-600 mt-1">Manage operator settlements and payments</p>
        </div>
        <button
          onClick={() => setShowAddSettlement(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Settlement
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
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
            onChange={(e) => setFilterStatus(e.target.value as "all" | "paid" | "unpaid")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <button
            onClick={fetchSettlements}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Settlements List */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-lg font-medium mb-2">No settlements found</p>
            <p className="text-sm">
              {settlements.length === 0 
                ? "No settlements available. Create your first settlement."
                : "No settlements match your current filters."
              }
            </p>
            {settlements.length === 0 && (
              <button
                onClick={() => setShowAddSettlement(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Settlement
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Operator</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Commission</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Operator Payable</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Created At</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{settlement.operator_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {settlement.mobile_number || "N/A"}
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
                        {settlement.is_paid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Paid
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Unpaid
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(settlement.created_at)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
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
                        {!settlement.is_paid && (
                          <button
                            onClick={() => markAsPaid(settlement.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedSettlement && (
        <SettlementDetailsModal settlement={selectedSettlement} />
      )}

      {/* Add Settlement Modal */}
      {showAddSettlement && (
        <OperatorSettlementForm 
          onClose={() => setShowAddSettlement(false)}
          onSuccess={() => {
            setShowAddSettlement(false);
            fetchSettlements();
          }}
        />
      )}
    </div>
  );
}
