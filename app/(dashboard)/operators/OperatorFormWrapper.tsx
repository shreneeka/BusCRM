"use client";

import { useState, useEffect } from "react";
import OperatorForm from "@/components/operators/OperatorForm";
import { createOperator, updateOperator } from "@/lib/actions/operators.actions";

interface Operator {
  id: string;
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
}

export default function OperatorFormWrapper() {
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Listen for edit events from OperatorTableWrapper
    const handleEditEvent = (event: CustomEvent<Operator>) => {
      setEditingOperator(event.detail);
      setShowForm(true);
      // Trigger show event for layout
      window.dispatchEvent(new CustomEvent('showOperatorForm'));
    };

    // Listen for add events from OperatorTableWrapper
    const handleAddEvent = () => {
      setEditingOperator(null);
      setShowForm(true);
      // Trigger show event for layout
      window.dispatchEvent(new CustomEvent('showOperatorForm'));
    };

    window.addEventListener('editOperator', handleEditEvent as EventListener);
    window.addEventListener('addOperator', handleAddEvent as EventListener);
    
    return () => {
      window.removeEventListener('editOperator', handleEditEvent as EventListener);
      window.removeEventListener('addOperator', handleAddEvent as EventListener);
    };
  }, []);

  const handleFormSubmit = async (data: { operatorName: string; contactPerson: string; mobileNumber: string }) => {
    try {
      if (editingOperator) {
        await updateOperator(editingOperator.id, data);
        // Trigger a refresh in the table
        const event = new CustomEvent('refreshOperators');
        window.dispatchEvent(event);
      } else {
        await createOperator(data);
        // Trigger a refresh in the table
        const event = new CustomEvent('refreshOperators');
        window.dispatchEvent(event);
      }
      setEditingOperator(null);
      setShowForm(false);
      // Trigger hide event for layout
      window.dispatchEvent(new CustomEvent('hideOperatorForm'));
    } catch (error) {
      console.error("Error saving operator:", error);
      alert("Failed to save operator");
    }
  };

  const handleFormCancel = () => {
    setEditingOperator(null);
    setShowForm(false);
    // Trigger hide event for layout
    window.dispatchEvent(new CustomEvent('hideOperatorForm'));
  };

  // Always render the component but use CSS to show/hide
  // The parent (OperatorsLayout) controls visibility via hidden class
  // This ensures event listeners are always active

  return (
    <OperatorForm
      onSubmit={handleFormSubmit}
      onCancel={handleFormCancel}
      initialData={editingOperator ? {
        operatorName: editingOperator.operator_name,
        contactPerson: editingOperator.person_name,
        mobileNumber: editingOperator.mobile_number,
      } : undefined}
      isEditing={!!editingOperator}
    />
  );
}
