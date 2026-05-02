"use client";

import { useState, useEffect } from "react";
import OperatorTableWrapper from "./OperatorTableWrapper";
import OperatorFormWrapper from "./OperatorFormWrapper";

export default function OperatorsLayout() {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Listen for form show/hide events
    const handleShowForm = () => setShowForm(true);
    const handleHideForm = () => setShowForm(false);

    window.addEventListener('showOperatorForm', handleShowForm);
    window.addEventListener('hideOperatorForm', handleHideForm);
    
    return () => {
      window.removeEventListener('showOperatorForm', handleShowForm);
      window.removeEventListener('hideOperatorForm', handleHideForm);
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className={`${showForm ? 'flex-1' : 'flex-1 w-full'} min-h-0 h-full overflow-hidden`}>
        <OperatorTableWrapper />
      </div>

      {/* Always render OperatorFormWrapper so event listeners are active */}
      <div className={`w-full lg:w-100 shrink-0 min-h-0 h-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 ${showForm ? 'block' : 'hidden'}`}>
        <OperatorFormWrapper />
      </div>
    </div>
  );
}
