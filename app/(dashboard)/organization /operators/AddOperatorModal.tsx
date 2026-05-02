"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  operatorSchema,
  OperatorFormData,
} from "@/lib/validations/operator.schema";
import { createOperator } from "@/lib/actions/operator.actions";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function AddOperatorModal({ open, onClose }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
  });

  const onSubmit = async (data: OperatorFormData) => {
    await createOperator(data);
    reset();
    onClose();
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Add Operator</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <input
              placeholder="Operator Name"
              {...register("operatorName")}
              className="w-full border p-2 rounded"
            />
            <p className="text-red-500 text-xs">{errors.operatorName?.message}</p>
          </div>

          <div>
            <input
              placeholder="Contact Person"
              {...register("contactPerson")}
              className="w-full border p-2 rounded"
            />
            <p className="text-red-500 text-xs">{errors.contactPerson?.message}</p>
          </div>

          <div>
            <input
              placeholder="Mobile Number"
              {...register("mobileNumber")}
              className="w-full border p-2 rounded"
            />
            <p className="text-red-500 text-xs">{errors.mobileNumber?.message}</p>
          </div>

          <div>
            <input
              type="number"
              placeholder="Commission %"
              {...register("commission", { valueAsNumber: true })}
              className="w-full border p-2 rounded"
            />
            <p className="text-red-500 text-xs">{errors.commission?.message}</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="w-full border py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}