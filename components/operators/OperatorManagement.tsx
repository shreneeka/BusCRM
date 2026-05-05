"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Users,
  Phone,
  User,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Percent,
} from "lucide-react";

interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percentage: number;
  is_active: boolean;
}

export default function OperatorManagement() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    operator_name: "",
    person_name: "",
    mobile_number: "",
    commission_percentage: 10,
    is_active: true,
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("operators")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Database error:", error);
        setError("Failed to connect to database. Please ensure Supabase is running.");
        setOperators([]);
      } else {
        setOperators(data || []);
        console.log("Fetched operators:", data?.length || 0);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(error.message || "Failed to fetch operators");
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      operator_name: "",
      person_name: "",
      mobile_number: "",
      commission_percentage: 10,
      is_active: true,
    });
    setEditingOperator(null);
    setShowForm(false);
  };

  const handleEdit = (operator: Operator) => {
    setFormData({
      operator_name: operator.operator_name,
      person_name: operator.person_name || "",
      mobile_number: operator.mobile_number || "",
      commission_percentage: operator.commission_percentage,
      is_active: operator.is_active,
    });
    setEditingOperator(operator);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate mobile number
      if (formData.mobile_number && !/^[0-9]{10}$/.test(formData.mobile_number)) {
        throw new Error("Mobile number must be 10 digits");
      }

      // Validate commission percent
      if (formData.commission_percentage < 0 || formData.commission_percentage > 100) {
        throw new Error("Commission percent must be between 0 and 100");
      }

      if (editingOperator) {
        // Update existing operator
        const { error } = await supabase
          .from("operators")
          .update({
            operator_name: formData.operator_name,
            person_name: formData.person_name,
            mobile_number: formData.mobile_number,
            commission_percentage: formData.commission_percentage,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingOperator.id);

        if (error) throw error;
        setSuccess("Operator updated successfully!");
      } else {
        // Create new operator
        const { error } = await supabase
          .from("operators")
          .insert({
            operator_name: formData.operator_name,
            person_name: formData.person_name,
            mobile_number: formData.mobile_number,
            commission_percentage: formData.commission_percentage,
            is_active: formData.is_active,
          });

        if (error) throw error;
        setSuccess("Operator created successfully!");
      }

      await fetchOperators();
      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to save operator");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this operator? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("operators")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setSuccess("Operator deleted successfully!");
      await fetchOperators();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to delete operator");
    }
  };

  const toggleActive = async (operator: Operator) => {
    try {
      const { error } = await supabase
        .from("operators")
        .update({ 
          is_active: !operator.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", operator.id);

      if (error) throw error;
      
      await fetchOperators();
      setSuccess(`Operator ${operator.is_active ? 'deactivated' : 'activated'} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Failed to update operator status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Operator Management
          </h2>
          <p className="text-gray-600">Manage travel operators and their commission rates</p>
        </div>
        <button
          onClick={() => {
            console.log('Add Operator button clicked');
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Operator
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Add/Edit Form - Always visible for testing */}
      {true && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingOperator ? "Edit Operator" : "Add New Operator"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Name *
                </label>
                <input
                  type="text"
                  value={formData.operator_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Express Travels"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={formData.person_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Raj Kumar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Commission Percent *
                </label>
                <input
                  type="number"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active (can book tickets)
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingOperator ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {editingOperator ? "Update Operator" : "Create Operator"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Operators List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading operators...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-red-600 mb-2">{error}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Please check the following:</p>
              <p>1. Supabase is running: <code className="bg-gray-100 px-1 rounded">npx supabase start</code></p>
              <p>2. Database is migrated: <code className="bg-gray-100 px-1 rounded">npx supabase db push</code></p>
              <p>3. Operators table exists</p>
            </div>
            <button
              onClick={fetchOperators}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="mb-4">No operators found. Add your first operator to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Operator
            </button>
          </div>
        ) : (
          operators.map((operator) => (
            <div
              key={operator.id}
              className={`p-4 border rounded-lg ${operator.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-75'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {operator.operator_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      operator.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {operator.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{operator.person_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{operator.mobile_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Percent className="w-4 h-4" />
                      <span className="font-medium">{operator.commission_percentage}% commission</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(operator.created_at).toLocaleDateString()}
                    {operator.updated_at !== operator.created_at && (
                      <span className="ml-4">
                        Updated: {new Date(operator.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(operator)}
                    className={`p-2 rounded-lg transition-colors ${
                      operator.is_active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={operator.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(operator)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(operator.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
