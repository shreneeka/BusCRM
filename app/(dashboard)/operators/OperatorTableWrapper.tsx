"use client";

import { useState, useEffect } from "react";
import OperatorTable from "@/components/operators/OperatorTable";
import { getAllOperators, deleteOperator } from "@/lib/actions/operators.actions";

interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
}

export default function OperatorTableWrapper() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOperators();
  }, []);

  useEffect(() => {
    // Listen for refresh events from OperatorFormWrapper
    const handleRefreshEvent = () => {
      fetchOperators();
    };

    window.addEventListener('refreshOperators', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('refreshOperators', handleRefreshEvent);
    };
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const data = await getAllOperators();
      setOperators(data);
    } catch (error) {
      console.error("Error fetching operators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (operator: Operator) => {
    // Trigger edit mode in OperatorFormWrapper
    const event = new CustomEvent('editOperator', { detail: operator });
    window.dispatchEvent(event);
  };

  const handleAdd = () => {
    // Trigger add mode in OperatorFormWrapper
    const event = new CustomEvent('addOperator');
    window.dispatchEvent(event);
  };

  const handleDelete = async (operator: Operator) => {
    if (confirm(`Are you sure you want to delete "${operator.operator_name}"?`)) {
      try {
        await deleteOperator(operator.id);
        fetchOperators(); // Refresh the table
      } catch (error) {
        console.error("Error deleting operator:", error);
        alert("Failed to delete operator");
      }
    }
  };

  return (
    <OperatorTable
      operators={operators}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onAdd={handleAdd}
      loading={loading}
    />
  );
}
