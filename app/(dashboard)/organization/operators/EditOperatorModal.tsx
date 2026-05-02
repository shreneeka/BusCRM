"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { operatorSchema, OperatorFormData } from "@/lib/validations/operator/schema";
import { updateOperator, Operator } from "@/lib/actions/operators.actions";
import { createPortal } from "react-dom";
import { Loader2, X, User, CheckCircle2 } from "lucide-react";


interface EditOperatorModalProps {
  open: boolean;
  onClose: () => void;
  operator: Operator | null;
  onSuccess?: () => void;
}

export default function EditOperatorModal({
  open,
  onClose,
  operator,
  onSuccess,
}: EditOperatorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (open && operator) {
      setMounted(true);
    }
  }, [open, operator]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
  });

  // Set form values when operator changes
  useEffect(() => {
    if (operator) {
      setValue("operatorName", operator.operator_name || "");
      setValue("contactPerson", operator.person_name || "");
      setValue("mobileNumber", operator.mobile_number?.replace(/\D/g, "") || "");
    }
  }, [operator, setValue]);

  const onSubmit = async (data: OperatorFormData) => {
    if (!operator) return;

    try {
      await updateOperator(operator.id, data);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error updating operator:", error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!mounted || !open || !operator) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="saas-card bg-white w-full max-w-md shadow-lg border-t-4 border-t-[#3da9d4]">
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Operator</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Update operator details
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Operator Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Operator Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register("operatorName")}
                className="input-primary pl-10 w-full text-sm py-2.5"
                placeholder="Enter operator name"
              />
            </div>
            {errors.operatorName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.operatorName.message}
              </p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Contact Person *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register("contactPerson")}
                className="input-primary pl-10 w-full text-sm py-2.5"
                placeholder="Enter contact person name"
              />
            </div>
            {errors.contactPerson && (
              <p className="text-red-500 text-xs mt-1">
                {errors.contactPerson.message}
              </p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Mobile Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-100 mr-2">
                <span className="text-slate-500 text-sm font-bold">+91</span>
              </div>
              <input
                {...register("mobileNumber")}
                className="input-primary pl-12 w-full text-sm py-2.5 font-bold tracking-wider"
                placeholder="98765 43210"
                maxLength={10}
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mobileNumber.message}
              </p>
            )}
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase bg-emerald-50 py-2 rounded-lg border border-emerald-100 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> Operator updated successfully!
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full border border-slate-200 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-brand flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
