"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  getAllOperatorsWithPendingSettlements, 
  createSettlement, 
  completeSettlement,
  getOperatorSettlementsList
} from "@/lib/actions/settlement.actions";
import { formatCurrency } from "@/lib/utils";
import { Calculator, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface OperatorWithSettlement {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  pending_tickets: Array<{
    id: string;
    amount: number;
    payment_received_by: string;
    settlement_status: string;
  }>;
  total_amount: number;
  total_commission: number;
  you_owed_amount: number;
  operator_owed_amount: number;
  net_balance: number;
}

interface Settlement {
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

export default function OperatorSettlementList() {
  const [operators, setOperators] = useState<OperatorWithSettlement[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState<OperatorWithSettlement | null>(null);
  const [settlementNotes, setSettlementNotes] = useState("");
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [operatorsData, settlementsData] = await Promise.all([
        getAllOperatorsWithPendingSettlements(),
        getOperatorSettlementsList()
      ]);
      setOperators(operatorsData);
      setSettlements(settlementsData.success ? (settlementsData.data || []) : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to fetch settlement data" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSettlement = async () => {
    if (!selectedOperator) return;

    setIsCreatingSettlement(true);
    try {
      const result = await createSettlement(selectedOperator.id, settlementNotes);
      if (result.success) {
        setMessage({ type: "success", text: "Settlement created successfully!" });
        setSelectedOperator(null);
        setSettlementNotes("");
        await fetchData();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to create settlement" });
      }
    } catch (error) {
      console.error("Error creating settlement:", error);
      setMessage({ type: "error", text: "Failed to create settlement" });
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const handleCompleteSettlement = async (settlementId: string) => {
    try {
      const result = await completeSettlement(settlementId);
      if (result.success) {
        setMessage({ type: "success", text: "Settlement completed successfully!" });
        await fetchData();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to complete settlement" });
      }
    } catch (error) {
      console.error("Error completing settlement:", error);
      setMessage({ type: "error", text: "Failed to complete settlement" });
    }
  };

  if (loading) {
    return <div className="p-6">Loading settlement data...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Pending Settlements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Settlements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operators.length === 0 ? (
            <p className="text-muted-foreground">No pending settlements</p>
          ) : (
            <div className="space-y-4">
              {operators.map((operator) => (
                <div key={operator.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{operator.operator_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {operator.person_name} • {operator.mobile_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Commission: {operator.commission_percent}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {operator.net_balance >= 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-semibold">
                              Operator pays you
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-semibold">
                              You pay operator
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(Math.abs(operator.net_balance))}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tickets</p>
                      <p className="font-semibold">{operator.pending_tickets.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(operator.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="font-semibold">{formatCurrency(operator.total_commission)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Balance</p>
                      <p className={`font-semibold ${operator.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(operator.net_balance))}
                      </p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full"
                        onClick={() => setSelectedOperator(operator)}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Settle Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Settle with {operator.operator_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Settlement Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Tickets:</span>
                              <span>{operator.pending_tickets.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Amount:</span>
                              <span>{formatCurrency(operator.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Commission:</span>
                              <span>{formatCurrency(operator.total_commission)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>
                                {operator.net_balance >= 0 ? "Operator pays you:" : "You pay operator:"}
                              </span>
                              <span className={operator.net_balance >= 0 ? "text-green-600" : "text-red-600"}>
                                {formatCurrency(Math.abs(operator.net_balance))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any notes about this settlement..."
                            value={settlementNotes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettlementNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          onClick={handleCreateSettlement}
                          disabled={isCreatingSettlement}
                        >
                          {isCreatingSettlement ? "Creating..." : "Create Settlement"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Settlement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-muted-foreground">No settlement history</p>
          ) : (
            <div className="space-y-4">
              {settlements.map((settlement) => (
                <div key={settlement.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{settlement.operator_name || 'Unknown Operator'}</h3>
                      <p className="text-sm text-muted-foreground">
                        1 ticket • {formatCurrency(settlement.total_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={settlement.is_paid ? "default" : "secondary"}
                      >
                        {settlement.is_paid ? "Paid" : settlement.payment_status === 'partial' ? "Partial Paid" : "Pending"}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(settlement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Operator payable</span>
                      <span className="font-semibold">
                        {formatCurrency(settlement.operator_payable)}
                      </span>
                    </div>
                    
                    {!settlement.is_paid && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteSettlement(settlement.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
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

                  {settlement.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      Note: {settlement.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
