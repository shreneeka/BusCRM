"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Bus,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Filter,
  Trash2,
  Eye,
  X,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  Plus,
  Edit,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OperatorSettlementForm from "@/components/settlements/OperatorSettlementForm";

interface Ticket {
  id: string;
  ticket_number: string;
  passenger_name: string;
  mobile_number: string;
  pickup_city: string;
  pickup_area: string;
  drop_city: string;
  drop_location: string;
  journey_date: string;
  booking_date: string;
  seat_numbers: string[];
  total_seats: number;
  pickup_time: string;
  bus_number: string;
  travel_type: "AC" | "Non-AC";
  account_id: string | null;
  account_type: string;
  amount: number;
  operator_id: string;
  created_at: string;
  updated_at: string;
  // Settlement information
  settlement_status?: string;
  payment_status?: string;
  paid_amount?: number;
  remaining_amount?: number;
  operator_settlements?: Array<{
    id: string;
    payment_status: string;
    paid_amount: number;
    remaining_amount: number;
    operator_payable: number;
    commission_percentage: number;
  }>;
}

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

export default function TicketListUpdated({
  initialTickets = [],
  searchTerm = "",
  filterStatus = "all",
  filterOperator = "",
  setSearchTerm,
  setFilterStatus,
  setFilterOperator,
  selectedTickets,
  setSelectedTickets,
  showSettlementModal,
  setShowSettlementModal,
}: {
  initialTickets?: Ticket[];
  searchTerm?: string;
  filterStatus?: "all" | "pending" | "paid" | "partial" | "not_paid";
  filterOperator?: string;
  setSearchTerm?: (value: string) => void;
  setFilterStatus?: (value: "all" | "pending" | "paid" | "partial" | "not_paid") => void;
  setFilterOperator?: (value: string) => void;
  selectedTickets?: Set<string>;
  setSelectedTickets?: (tickets: Set<string>) => void;
  showSettlementModal?: boolean;
  setShowSettlementModal?: (show: boolean) => void;
}) {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddSettlementModal, setShowAddSettlementModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchOperators();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setDbError(null);
    try {
      // First check if we can connect to the database
      const { data: testData, error: testError } = await supabase
        .from('tickets')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Database connection test failed:', testError);
        setDbError('Unable to connect to database. Please check your connection.');
        setTickets([]);
        return;
      }

      // If connection works, fetch the actual data with settlement information
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          passenger_name,
          mobile_number,
          pickup_city,
          pickup_area,
          drop_city,
          drop_location,
          journey_date,
          booking_date,
          seat_numbers,
          total_seats,
          pickup_time,
          bus_number,
          travel_type,
          account_id,
          account_type,
          amount,
          operator_id,
          created_at,
          updated_at,
          operators (
            id,
            name,
            person_name,
            mobile_number,
            commission_percentage
          ),
          operator_settlements (
            id,
            payment_status,
            paid_amount,
            remaining_amount,
            operator_payable,
            commission_percentage,
            is_paid
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error fetching tickets:", error);
        setDbError('Failed to fetch tickets data.');
        setTickets([]);
        return;
      }
      
      console.log("Successfully fetched tickets:", data?.length || 0, "tickets");
      setTickets(data || []);
      setDbError(null);
    } catch (error) {
      console.error("Unexpected error fetching tickets:", error);
      setDbError('An unexpected error occurred while loading tickets.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      // First check if operators table exists
      const { data: testData, error: testError } = await supabase
        .from('operators')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Operators table not accessible:', testError);
        setOperators([]);
        return;
      }

      // If table exists, fetch the data
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .order("name");

      if (error) {
        console.error("Database error fetching operators:", error);
        setOperators([]);
        return;
      }
      
      console.log("Successfully fetched operators:", data?.length || 0, "operators");
      setOperators(data || []);
    } catch (error) {
      console.error("Unexpected error fetching operators:", error);
      setOperators([]);
    }
  };

  const getOperatorName = (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    return operator?.name || "Unknown Operator";
  };

  const getOperatorDetails = (operatorId: string) => {
    return operators.find(op => op.id === operatorId);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.mobile_number.includes(searchTerm) ||
      ticket.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOperatorName(ticket.operator_id).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || true; // Remove status filtering since columns don't exist
    const matchesOperator = !filterOperator || ticket.operator_id === filterOperator;

    return matchesSearch && matchesStatus && matchesOperator;
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

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // Remove seconds
  };

  const getSettlementStatusBadge = (ticket: Ticket) => {
    if (!ticket.operator_settlements || ticket.operator_settlements.length === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unpaid
        </span>
      );
    }

    const settlement = ticket.operator_settlements[0];
    
    if (settlement.is_paid || settlement.payment_status === 'done') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </span>
      );
    } else if (settlement.payment_status === 'partial') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Partial Paid
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unpaid
        </span>
      );
    }
  };

  const deleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting ticket:", error);
        alert("Failed to delete ticket");
        return;
      }

      await fetchTickets();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket");
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    if (!selectedTickets || !setSelectedTickets) return;
    
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = () => {
    if (!selectedTickets || !setSelectedTickets) return;
    
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t.id)));
    }
  };

  const handleSettlement = async () => {
    if (!selectedTickets || selectedTickets.size === 0) {
      alert("Please select at least one ticket for settlement");
      return;
    }

    setShowSettlementModal(true);
  };

  const TicketDetailsModal = ({ ticket }: { ticket: Ticket }) => {
    const operator = getOperatorDetails(ticket.operator_id);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Ticket Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ticket Number</p>
                    <p className="font-medium">{ticket.ticket_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passenger Name</p>
                    <p className="font-medium">{ticket.passenger_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <p className="font-medium">{ticket.mobile_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bus Number</p>
                    <p className="font-medium">{ticket.bus_number}</p>
                  </div>
                </div>
              </div>

              {/* Journey Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Journey Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Pickup:</strong> {ticket.pickup_city}, {ticket.pickup_area}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Drop:</strong> {ticket.drop_city}, {ticket.drop_location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Journey Date:</strong> {formatDate(ticket.journey_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Pickup Time:</strong> {formatTime(ticket.pickup_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Travel Type:</strong> {ticket.travel_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Seat Information</h4>
                <div className="flex flex-wrap gap-2">
                  {ticket.seat_numbers.map((seat) => (
                    <span
                      key={seat}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total Seats: {ticket.total_seats}
                </p>
              </div>

              {/* Operator Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Operator Information</h4>
                {operator && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Operator Name</p>
                        <p className="font-medium">{operator.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{operator.person_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mobile Number</p>
                        <p className="font-medium">{operator.mobile_number || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Commission</p>
                        <p className="font-medium">{operator.commission_percentage}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(ticket.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="font-medium">{ticket.account_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booking Date</p>
                    <p className="font-medium">{formatDate(ticket.booking_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full overflow-hidden relative">
      {/* Tickets List */}
      <div className="mt-6">
        {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-lg font-medium mb-2">No tickets found</p>
          <p className="text-sm">
            {tickets.length === 0 
              ? "No tickets available. Try creating some tickets first."
              : "No tickets match your current filters."
            }
          </p>
          {tickets.length === 0 && (
            <button
              onClick={() => window.location.href = '/tickets'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-center py-3 px-2 font-medium text-gray-700 w-12">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {selectedTickets.size === filteredTickets.length && filteredTickets.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Ticket #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Passenger</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Journey</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Operator</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => handleSelectTicket(ticket.id)}
                      className="flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {selectedTickets.has(ticket.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 text-xs">{ticket.ticket_number}</div>
                    <div className="text-xs text-gray-500">{ticket.bus_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 text-xs">{ticket.passenger_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {ticket.mobile_number}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {ticket.pickup_city}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-400 mx-auto" />
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {ticket.drop_city}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(ticket.journey_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatTime(ticket.pickup_time)}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 text-xs">
                      {getOperatorName(ticket.operator_id)}
                    </div>
                                      </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 text-xs">{formatCurrency(ticket.amount)}</div>
                    <div className="text-xs text-gray-500">{ticket.total_seats} seats</div>
                  </td>
                  <td className="py-3 px-4">
                    {getSettlementStatusBadge(ticket)}
                    {ticket.operator_settlements && ticket.operator_settlements.length > 0 && ticket.operator_settlements[0].payment_status === 'partial' && (
                      <div className="mt-1 text-xs text-orange-600">
                        Remaining: {formatCurrency(ticket.operator_settlements[0].remaining_amount || 0)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetails(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit Ticket"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTicket(ticket.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
      {showDetails && selectedTicket && (
        <TicketDetailsModal ticket={selectedTicket} />
      )}

      {/* Settlement Modal */}
      {showSettlementModal && (
        <SettlementModal 
          selectedTickets={selectedTickets ? Array.from(selectedTickets) : []}
          onClose={() => {
            if (setShowSettlementModal) setShowSettlementModal(false);
            if (setSelectedTickets) setSelectedTickets(new Set());
          }}
          onSuccess={() => {
            if (setShowSettlementModal) setShowSettlementModal(false);
            if (setSelectedTickets) setSelectedTickets(new Set());
            fetchTickets();
          }}
          onAddSettlement={() => setShowAddSettlementModal(true)}
        />
      )}

      {/* Operator Settlement Form */}
      {showAddSettlementModal && (
        <OperatorSettlementForm 
          onClose={() => setShowAddSettlementModal(false)}
          onSuccess={() => {
            setShowAddSettlementModal(false);
            fetchTickets();
          }}
          selectedTicketIds={selectedTickets ? Array.from(selectedTickets) : []}
        />
      )}
    </div>
  );
}

// Settlement Modal Component
function SettlementModal({ 
  selectedTickets, 
  onClose, 
  onSuccess,
  onAddSettlement 
}: { 
  selectedTickets: string[];
  onClose: () => void;
  onSuccess: () => void;
  onAddSettlement?: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState<any[]>([]);

  useEffect(() => {
    fetchSettlementData();
  }, [selectedTickets]);

  const fetchSettlementData = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          passenger_name,
          mobile_number,
          pickup_city,
          pickup_area,
          drop_city,
          drop_location,
          journey_date,
          booking_date,
          seat_numbers,
          total_seats,
          pickup_time,
          bus_number,
          travel_type,
          account_id,
          account_type,
          amount,
          operator_id,
          created_at,
          updated_at,
          operators(
            name,
            person_name,
            mobile_number,
            commission_percentage
          )
        `)
        .in("id", selectedTickets);

      if (error) {
        console.error("Database error fetching settlement data:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        // Don't throw error, just log it and continue with empty data
        setSettlements([]);
        return;
      }
      
      console.log("Successfully fetched settlement data:", data?.length || 0, "tickets");
      setSettlements(data || []);
    } catch (error) {
      console.error("Unexpected error fetching settlement data:", error);
      // Set empty array to prevent UI crashes
      setSettlements([]);
    }
  };

  const processSettlement = async () => {
    setLoading(true);
    try {
      // Group tickets by operator
      const operatorGroups = settlements.reduce((acc: any, ticket: any) => {
        const operatorId = ticket.operator_id;
        if (!acc[operatorId]) {
          acc[operatorId] = {
            operator: ticket.operators,
            tickets: [],
            totalAmount: 0,
            totalCommission: 0
          };
        }
        acc[operatorId].tickets.push(ticket);
        acc[operatorId].totalAmount += ticket.amount;
        const commissionRate = ticket.operators?.commission_percentage || 10;
        acc[operatorId].totalCommission += ticket.amount * commissionRate / 100;
        return acc;
      }, {});

      // Process settlements for each operator
      for (const [operatorId, group] of Object.entries(operatorGroups)) {
        const operatorGroup = group as any;
        const operator = operatorGroup.operator;
        
        // Update tickets status (remove non-existent columns)
        await supabase
          .from("tickets")
          .update({ 
            updated_at: new Date().toISOString()
          })
          .in("id", operatorGroup.tickets.map((t: any) => t.id));

        // Create accounting entries for commission (10% or operator's commission, whichever is higher)
        for (const ticket of operatorGroup.tickets) {
          const commissionRate = Math.max(10, operator.commission_percentage);
          const commissionAmount = ticket.amount * commissionRate / 100;

          // Get commission category and cash account
          const { data: categories } = await supabase
            .from("accounting_categories")
            .select("id")
            .eq("name", "Commission")
            .eq("category_type", "Income")
            .single();

          const { data: accounts } = await supabase
            .from("accounts")
            .select("id")
            .eq("name", "Cash")
            .eq("account_type", "Asset")
            .single();

          // Create accounting entry for commission
          if (categories && accounts) {
            await supabase.from("accounting_entries").insert({
              category_id: categories.id,
              account_id: accounts.id,
              amount: commissionAmount,
              type: "income",
              description: `Commission from ${operator.name} - ${ticket.ticket_number}`,
              reference_id: ticket.id,
              reference_type: "ticket",
              entry_date: new Date().toISOString(),
            });
          }
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error processing settlement:", error);
      alert("Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperatorSettlementForm 
      selectedTicketIds={selectedTickets}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

