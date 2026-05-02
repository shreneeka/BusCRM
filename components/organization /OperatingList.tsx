"use client";

import { useState } from "react";
import AddOperatorModal from "./AddOperatorModal";

export default function OperatorPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Operator Management</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          + Add Operator
        </button>
      </div>

      {/* Table (Basic) */}
      <div className="border rounded-xl p-4">
        <p className="text-sm text-gray-500">
          Operator list will appear here
        </p>
      </div>

      <AddOperatorModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}