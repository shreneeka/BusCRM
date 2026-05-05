"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Users, X, Loader2 } from "lucide-react";
import { searchOperatorsByName } from "@/lib/actions/ticket.actions";

interface Operator {
  id: string;
  name?: string; // For backward compatibility
  operator_name: string;
  person_name: string;
  mobile_number: string;
  commission_percent: number;
  commission_percentage?: number; // For backward compatibility
}

interface OperatorSearchSelectorProps {
  label: string;
  selectedOperatorId: string;
  onSelect: (operatorId: string | null) => void; // already supports null
  name?: string;
}

export default function OperatorSearchSelector({
  label,
  selectedOperatorId,
  onSelect,
  name = "operator_id",
}: OperatorSearchSelectorProps) {
  const [search, setSearch] = useState("");
  const [operatorSuggestions, setOperatorSuggestions] = useState<Operator[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (search && search.length >= 2) {
      debounceTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const suggestions = await searchOperatorsByName(search);
          console.log("Search results:", suggestions);
          // Map the response to match our interface
          const mappedSuggestions = suggestions.map((op: any) => ({
            ...op,
            operator_name: op.name || op.operator_name || '',
            commission_percent: op.commission_percentage || op.commission_percent || 0
          }));
          setOperatorSuggestions(mappedSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Operator search error:", error);
          setOperatorSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setOperatorSuggestions([]);
      setShowSuggestions(!!(search && search.length > 0));
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  const handleSelectOperator = useCallback((operator: Operator) => {
    console.log("Selected operator:", operator);
    onSelect(operator.id);
    setSearch(operator.operator_name || operator.name || '');
    setShowSuggestions(false);
  }, [onSelect]);

  const handleClear = () => {
    onSelect(null);
    setSearch("");
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full z-40">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
        {label}
      </label>
      <input type="hidden" name={name} value={selectedOperatorId || ""} />
      <div className="relative">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="input-primary pl-9 bg-white text-sm py-2 pr-8 w-full"
          placeholder="Search Operator by name or phone..."
          value={search || ""}
          autoComplete="off"
          onChange={(e) => {
            const value = e.target.value || "";
            console.log("Search input:", value);
            setSearch(value);
            if (selectedOperatorId) onSelect(null);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {selectedOperatorId && search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            title="Clear selection"
          >
            <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-1 z-50">
          <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isSearching ? (
              <div className="px-4 py-3 text-center text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching operators...
              </div>
            ) : operatorSuggestions.length > 0 ? (
              operatorSuggestions.map((operator) => (
                <button
                  key={operator.id}
                  type="button"
                  onClick={() => handleSelectOperator(operator)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start justify-between gap-3 last:rounded-b-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{operator.operator_name || operator.name}</p>
                    <p className="text-xs text-slate-500 truncate">{operator.person_name} • {operator.mobile_number}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap shrink-0 hover:bg-emerald-100 transition-colors">
                    {operator.commission_percent || operator.commission_percentage}%
                  </span>
                </button>
              ))
            ) : search.length >= 2 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center border-t border-slate-100">
                No operators found for "{search}"
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

