"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OperatorSettlementsView from "@/components/operators/OperatorSettlementsView";

interface Operator {
  id: string;
  name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function OperatorSettlementsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperator();
  }, [params.id]);

  const fetchOperator = async () => {
    if (!params.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching operator:", error);
        setError("Failed to fetch operator details");
        return;
      }

      setOperator(data);
    } catch (error) {
      console.error("Unexpected error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading operator details...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Operator not found"}</p>
          <Link
            href="/operators"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Operators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/operators"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Operators
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {operator.name} - Settlements
                </h1>
                <p className="text-sm text-gray-500">
                  View and manage settlement history for {operator.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                operator.is_active
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {operator.is_active ? "Active" : "Inactive"}
              </span>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{operator.commission_percentage}%</span> commission
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Operator Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Operator Name</h3>
              <p className="text-lg font-semibold text-gray-900">{operator.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Person</h3>
              <p className="text-lg font-semibold text-gray-900">{operator.person_name || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Mobile Number</h3>
              <p className="text-lg font-semibold text-gray-900">{operator.mobile_number || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Settlements View */}
        <OperatorSettlementsView 
          operatorId={operator.id} 
          operatorName={operator.name} 
        />
      </div>
    </div>
  );
}
