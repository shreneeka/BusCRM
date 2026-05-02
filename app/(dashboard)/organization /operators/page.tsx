"use client";

import { useState } from "react";
import AddOperatorModal from "./AddOperatorModal";

export default function OperatorsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Operator Management</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + Add Operator
        </button>
      </div>

      <div className="border p-4 rounded">
        <p>No operators added yet</p>
      </div>

      <AddOperatorModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}