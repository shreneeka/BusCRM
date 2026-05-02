"use client";

import { useState } from "react";
import { User, Phone, Building2, CheckCircle2, Loader2 } from "lucide-react";

// --- TYPES ---
interface OperatorFormData {
  operatorName: string;
  contactPerson: string;
  mobileNumber: string;
}

interface OperatorFormProps {
  onSubmit: (data: OperatorFormData) => void;
  onCancel: () => void;
  initialData?: OperatorFormData;
  isEditing?: boolean;
}

export default function OperatorForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: OperatorFormProps) {
  const [formData, setFormData] = useState<OperatorFormData>(
    initialData || {
      operatorName: "",
      contactPerson: "",
      mobileNumber: "",
    }
  );

  const [errors, setErrors] = useState<Partial<OperatorFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<OperatorFormData> = {};

    if (!formData.operatorName.trim()) {
      newErrors.operatorName = "Operator name is required";
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person name is required";
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (formData.mobileNumber.length < 10) {
      newErrors.mobileNumber = "Mobile number must be at least 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      await onSubmit(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving operator:", error);
      alert("Failed to save operator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof OperatorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="saas-card bg-white p-5 flex flex-col border-t-4 border-t-[#3da9d4] shadow-sm relative overflow-hidden h-fit max-h-full">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">
          {isEditing ? "Edit Operator" : "Create Operator"}
        </h2>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          {isEditing ? "Update operator details" : "Add a new operator"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="flex flex-col gap-5 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Operator Details */}
          <div className="space-y-4">
            {/* Operator Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Operator Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.operatorName}
                  onChange={(e) => handleChange("operatorName", e.target.value)}
                  className={`input-primary pl-9 w-full text-sm py-2.5 ${
                    errors.operatorName ? "border-red-300 focus:border-red-500" : ""
                  }`}
                  placeholder="Enter operator name"
                />
              </div>
              {errors.operatorName && (
                <p className="text-xs text-red-600 mt-1">{errors.operatorName}</p>
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
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange("contactPerson", e.target.value)}
                  className={`input-primary pl-9 w-full text-sm py-2.5 ${
                    errors.contactPerson ? "border-red-300 focus:border-red-500" : ""
                  }`}
                  placeholder="Enter contact person name"
                />
              </div>
              {errors.contactPerson && (
                <p className="text-xs text-red-600 mt-1">{errors.contactPerson}</p>
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
                <Phone className="absolute left-12 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange("mobileNumber", e.target.value)}
                  maxLength={10}
                  className={`input-primary pl-20 w-full text-sm py-2.5 font-bold tracking-wider ${
                    errors.mobileNumber ? "border-red-300 focus:border-red-500" : ""
                  }`}
                  placeholder="12345 67890"
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 shrink-0 flex flex-col gap-3 bg-white border-t border-slate-100">
          {showSuccess && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase bg-emerald-50 py-2 rounded-lg border border-emerald-100 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> Operator saved successfully!
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-[#3da9d4] text-white rounded-xl hover:bg-[#2d8bc4] transition-colors font-medium text-sm shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? "Update Operator" : "Create Operator"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
