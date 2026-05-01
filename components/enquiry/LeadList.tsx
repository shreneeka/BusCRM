"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/lead.actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  User,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  PhoneCall,
  RefreshCw,
  Info,
} from "lucide-react";

export default function LeadList({
  initialLeads,
  defaultStatus = "",
  cities = [],
  showCityFilters = true,
  showStatusFilter = true,
  emptyMessage = "No leads found.",
  isFollowUpPage = false,
}: {
  initialLeads: any[];
  defaultStatus?: string;
  cities?: { id: string; name: string }[];
  showCityFilters?: boolean;
  showStatusFilter?: boolean;
  emptyMessage?: string;
  isFollowUpPage?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isFollowUpRoute =
    isFollowUpPage || (pathname && pathname.toLowerCase().includes("follow"));

  const [activeTab, setActiveTab] = useState<"Main" | "AutoClosed">("Main");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState(defaultStatus);
  const [filterFromCity, setFilterFromCity] = useState("");
  const [filterToCity, setFilterToCity] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [statusModal, setStatusModal] = useState<any>(null); // For Booked/Cancelled
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [followUpLead, setFollowUpLead] = useState<any>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [infoLead, setInfoLead] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    filterType,
    filterStatus,
    filterFromCity,
    filterToCity,
    filterDate,
  ]);

  useEffect(() => {
    if (followUpLead) {
      setNextFollowUpDate(followUpLead.next_follow_up_date || "");
    }
  }, [followUpLead]);

  const openDrawer = (lead: any) => {
    setFollowUpLead(lead);
    setTimeout(() => setIsDrawerOpen(true), 10);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setFollowUpLead(null);
      setFollowUpNote("");
      setNextFollowUpDate("");
    }, 300);
  };

  const openInfoModal = (lead: any) => {
    setInfoLead(lead);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    setTimeout(() => {
      setInfoLead(null);
    }, 300);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus(defaultStatus);
    setFilterFromCity("");
    setFilterToCity("");
    setFilterDate("");
    setCurrentPage(1);
  };

  const filteredLeads = initialLeads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.customer_name?.toLowerCase() || "").includes(searchLower) ||
      (lead.mobile_number || "").includes(searchLower);

    const matchesType = filterType ? lead.type === filterType : true;
    const matchesFrom = filterFromCity
      ? lead.from_city_id === filterFromCity
      : true;
    const matchesTo = filterToCity ? lead.to_city_id === filterToCity : true;
    const matchesDate = filterDate ? lead.journey_date === filterDate : true;

    // Detect if this lead is specifically Auto Closed
    const isLeadAutoClosed =
      lead.status === "New" && lead.journey_date < todayStr;

    // TAB LOGIC (Only applies if not on the Follow Ups page)
    if (!isFollowUpRoute) {
      if (activeTab === "AutoClosed" && !isLeadAutoClosed) return false;
      if (activeTab === "Main" && isLeadAutoClosed) return false;
    }

    // STATUS LOGIC
    let matchesStatus = true;
    if (filterStatus && (activeTab === "Main" || isFollowUpRoute)) {
      if (filterStatus === "New") {
        matchesStatus = lead.status === "New" && lead.journey_date >= todayStr;
      } else {
        matchesStatus = lead.status === filterStatus;
      }
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesFrom &&
      matchesTo &&
      matchesDate
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLeads = filteredLeads.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  async function confirmStatusChange() {
    if (!statusModal) return;
    try {
      setLoadingId(statusModal.id);
      await updateLeadStatus(
        statusModal.id,
        statusModal.status,
        statusModal.noteValue,
        undefined,
      );
      setStatusModal(null);
      router.refresh();
    } catch (error: any) {
      alert("Failed to update status: " + error.message);
    } finally {
      setLoadingId(null);
    }
  }

  // Follow-Up Drawer Submission
  async function handleFollowUpSubmit() {
    if (!followUpLead || !followUpNote.trim()) return;
    try {
      setLoadingId(followUpLead.id);

      await updateLeadStatus(
        followUpLead.id,
        "Follow Up",
        followUpNote,
        nextFollowUpDate || null,
      );

      // INSTANT UI UPDATE
      const newTimestamp = new Date()
        .toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
        .toUpperCase();
      const newFutureDate = nextFollowUpDate
        ? new Date(nextFollowUpDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "NONE";
      const newNoteString = `[${newTimestamp}] ${followUpNote}@@@${newFutureDate}`;

      setFollowUpLead((prev: any) => ({
        ...prev,
        notes: prev.notes ? `${prev.notes}|||${newNoteString}` : newNoteString,
        next_follow_up_date: nextFollowUpDate || prev.next_follow_up_date,
      }));

      setFollowUpNote("");
      setNextFollowUpDate("");
      router.refresh();
    } catch (error: any) {
      alert("Failed to log note: " + error.message);
    } finally {
      setLoadingId(null);
    }
  }

  const getEnquiryNote = (notes: string) => {
    if (!notes) return null;
    const noteArray = notes.split("|||").filter(Boolean);
    if (noteArray.length === 0) return null;
    const firstNoteStr = noteArray[0];

    const match = firstNoteStr.match(/^\[.*?\]\s*([\s\S]*?)(?:@@@|$)/);
    const noteText = match && match[1] ? match[1].trim() : null;
    return noteText === "—" ? null : noteText;
  };

  // HELPER: Extract the most recent note text for the Reason column
  const getLatestNote = (notes: string) => {
    if (!notes) return "—";
    const noteArray = notes.split("|||").filter(Boolean);
    if (noteArray.length === 0) return "—";
    const lastNoteStr = noteArray[noteArray.length - 1];

    const match = lastNoteStr.match(/^\[.*?\]\s*([\s\S]*?)(?:@@@|$)/);
    return match && match[1] ? match[1].trim() : "—";
  };

  const getStatusBadge = (status: string, journeyDate: string) => {
    if (status === "New" && journeyDate < todayStr) {
      return (
        <span className="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200 uppercase tracking-wide whitespace-nowrap shadow-sm inline-block">
          Auto Closed
        </span>
      );
    }
    switch (status) {
      case "New":
        return (
          <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 uppercase tracking-wide whitespace-nowrap shadow-sm inline-block">
            New
          </span>
        );
      case "Follow Up":
        return (
          <span className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-600 font-bold border border-amber-100 uppercase tracking-wide whitespace-nowrap shadow-sm inline-block">
            Follow Up
          </span>
        );
      case "Booked":
        return (
          <span className="text-[10px] px-2 py-1 rounded-md bg-blue-50 text-blue-600 font-bold border border-blue-100 uppercase tracking-wide whitespace-nowrap shadow-sm inline-block">
            Booked
          </span>
        );
      case "Cancelled":
        return (
          <span className="text-[10px] px-2 py-1 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-100 uppercase tracking-wide whitespace-nowrap shadow-sm inline-block">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const renderTimelineNotes = (leadData: any) => {
    if (!leadData || (!leadData.notes && !leadData.cancellation_reason)) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No previous interactions.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-slate-200">
        {(leadData.notes || leadData.cancellation_reason)
          .split("|||")
          .filter(Boolean)
          .map((noteStr: string, index: number) => {
            let timestamp = null;
            let actualNote = noteStr;
            let futureDate = null;

            const timeMatch = actualNote.match(/^\[(.*?)\]\s*([\s\S]*)$/);
            if (timeMatch) {
              timestamp = timeMatch[1];
              actualNote = timeMatch[2];
            }

            if (actualNote.includes("@@@")) {
              const parts = actualNote.split("@@@");
              actualNote = parts[0];
              if (parts[1] && parts[1] !== "NONE") {
                futureDate = parts[1];
              }
            }

            return (
              <div
                key={index}
                className="relative pl-[32px] animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="absolute left-[6px] top-4 w-[20px] h-[20px] bg-white border-2 border-[#3da9d4] rounded-full flex items-center justify-center z-10">
                  <div className="w-[6px] h-[6px] bg-[#3da9d4] rounded-full" />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {actualNote}
                  </div>

                  {futureDate && (
                    <div className="text-sm text-slate-700 font-medium mt-1.5">
                      <span className="font-bold text-slate-800">
                        Next Follow-Up date:{" "}
                      </span>
                      <span className="text-[#3da9d4] font-bold">
                        {futureDate}
                      </span>
                    </div>
                  )}

                  {timestamp && (
                    <div className="text-[11px] font-bold text-[#8ba3b8] uppercase tracking-wider mt-3 pt-3 border-t border-slate-100 flex items-center">
                      {timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] overflow-hidden relative">
      {!isFollowUpRoute && (
        <div className="flex items-center gap-6 px-5 pt-4 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={() => setActiveTab("Main")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "Main"
                ? "border-[#3da9d4] text-[#3da9d4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Main Leads
          </button>
          <button
            onClick={() => setActiveTab("AutoClosed")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "AutoClosed"
                ? "border-slate-400 text-slate-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Auto Closed
          </button>
        </div>
      )}

      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-3 items-center bg-slate-50/50 shrink-0">
        <div className="relative w-full xl:flex-1 min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name/mobile..."
            className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="input-primary py-2 text-sm w-full xl:w-auto bg-white shadow-sm font-medium"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Ticket">Ticket</option>
          <option value="Parcel">Parcel</option>
        </select>

        {showStatusFilter && activeTab === "Main" && (
          <select
            className="input-primary py-2 text-sm w-full xl:w-auto bg-white shadow-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        )}

        {showCityFilters && cities.length > 0 && (
          <div className="flex w-full xl:w-auto gap-3">
            <select
              className="input-primary py-2 text-sm flex-1 xl:w-auto bg-white shadow-sm font-medium"
              value={filterFromCity}
              onChange={(e) => setFilterFromCity(e.target.value)}
            >
              <option value="">From City</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="input-primary py-2 text-sm flex-1 xl:w-auto bg-white shadow-sm font-medium"
              value={filterToCity}
              onChange={(e) => setFilterToCity(e.target.value)}
            >
              <option value="">To City</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 w-full xl:w-auto shrink-0">
          <input
            type="date"
            className="input-primary py-2 text-sm w-full xl:w-auto bg-white shadow-sm font-medium"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button
            onClick={resetFilters}
            className="p-2.5 text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:text-[#3da9d4] hover:border-[#3da9d4]/30 hover:bg-[#3da9d4]/5 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLE LIST */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <User className="w-12 h-12 mb-3 text-slate-200" />
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-sm">
                <th className="px-4 py-4 font-bold whitespace-nowrap">Name</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">Type</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">
                  Mobile Number
                </th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">From and To</th>
                <th className="px-4 py-4 font-bold whitespace-nowrap">
                  Journey Date
                </th>

                <th className="px-4 py-4 font-bold text-slate-500 leading-tight min-w-[130px]">
                  <span className="whitespace-nowrap">No. of Seats /</span>
                  <br />
                  <span className="whitespace-nowrap">No. of Parcels</span>
                </th>

                {showStatusFilter && (
                  <th className="px-4 py-4 font-bold whitespace-nowrap">
                    Status
                  </th>
                )}
                <th className="px-4 py-4 font-bold whitespace-nowrap">
                  Next Follow-Up
                </th>

                {isFollowUpRoute && (
                  <th className="px-4 py-4 font-bold">Follow-Up Note</th>
                )}

                <th className="px-4 py-4 font-bold text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLeads.map((lead) => {
                const isAutoClosed =
                  lead.status === "New" && lead.journey_date < todayStr;

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#3da9d4]/10 flex items-center justify-center text-[#3da9d4] font-bold shrink-0 text-xs">
                          {(lead.customer_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">
                          {lead.customer_name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                          lead.type === "Ticket"
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : "bg-orange-50 text-orange-600 border border-orange-100"
                        }`}
                      >
                        {lead.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-600 font-medium">
                        {lead.mobile_number}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-700 font-semibold flex items-center gap-1.5">
                        {lead.from_city?.name}{" "}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />{" "}
                        {lead.to_city?.name}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-slate-600 font-medium">
                        {new Date(lead.journey_date).toLocaleDateString(
                          "en-GB",
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-700">
                        {lead.type === "Ticket" ? (
                          <span>{lead.number_of_seats || 0} Seats</span>
                        ) : (
                          <span>{lead.parcel_count || 0} Parcels</span>
                        )}
                      </div>
                    </td>

                    {showStatusFilter && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(lead.status, lead.journey_date)}
                      </td>
                    )}

                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.status !== "Booked" &&
                      lead.status !== "Cancelled" &&
                      lead.next_follow_up_date ? (
                        <span className="text-sm text-slate-700 font-medium">
                          {new Date(
                            lead.next_follow_up_date,
                          ).toLocaleDateString("en-GB")}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300 font-medium">
                          —
                        </span>
                      )}
                    </td>

                    {isFollowUpRoute && (
                      <td className="px-4 py-3 min-w-[200px] whitespace-normal break-words">
                        <div className="text-sm text-slate-600 leading-snug">
                          {getLatestNote(lead.notes)}
                        </div>
                      </td>
                    )}

                    {/* ACTION BUTTONS WITH TOOLTIPS */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <TooltipProvider delayDuration={0}>
                        <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {getEnquiryNote(lead.notes) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openInfoModal(lead)}
                                  className="p-1.5 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs font-semibold">
                                  View Note
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* 2. THE REST OF THE ACTIONS */}
                          {lead.status === "Cancelled" &&
                          (lead.notes || lead.cancellation_reason) ? (
                            <div className="flex items-center justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openDrawer(lead)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 bg-rose-50 shadow-sm"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="text-xs font-semibold">
                                    View Cancellation Reason
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : lead.status === "Booked" ||
                            lead.status === "Cancelled" ? (
                            <span className="text-xs text-slate-400 italic font-medium ml-2 mr-1">
                              Completed
                            </span>
                          ) : (
                            <>
                              {/* HIDE BOOK BUTTON IF AUTO CLOSED OR FOLLOW UP ROUTE */}
                              {!isFollowUpRoute && !isAutoClosed && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        setStatusModal({
                                          id: lead.id,
                                          status: "Booked",
                                          title: "Mark Booked",
                                          placeholder:
                                            "Add final booking details...",
                                        })
                                      }
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs font-semibold">
                                      Mark as Booked
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* FOLLOW UP BUTTON ALWAYS SHOWS */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openDrawer(lead)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs font-semibold">
                                    View / Add Follow Up
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              {/* HIDE CANCEL BUTTON IF AUTO CLOSED OR FOLLOW UP ROUTE */}
                              {!isFollowUpRoute && !isAutoClosed && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() =>
                                        setStatusModal({
                                          id: lead.id,
                                          status: "Cancelled",
                                          title: "Cancel Lead",
                                          placeholder:
                                            "Why was this cancelled?...",
                                        })
                                      }
                                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p className="text-xs font-semibold">
                                      Cancel Lead
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </div>
                      </TooltipProvider>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="py-2 px-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
        <span className="text-sm text-slate-500 font-medium">
          Showing{" "}
          <strong className="text-slate-700">
            {filteredLeads.length === 0 ? 0 : startIndex + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-700">
            {Math.min(startIndex + itemsPerPage, filteredLeads.length)}
          </strong>{" "}
          of <strong className="text-slate-700">{filteredLeads.length}</strong>{" "}
          leads
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="px-3 py-1 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg shadow-sm">
            {currentPage} / {Math.max(1, totalPages)}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">
                {statusModal.title}
              </h3>
              <textarea
                autoFocus
                className="input-primary h-28 w-full resize-none text-sm"
                placeholder={statusModal.placeholder}
                onChange={(e) =>
                  setStatusModal({ ...statusModal, noteValue: e.target.value })
                }
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setStatusModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={loadingId === statusModal.id}
                className="btn-brand px-6 py-2 text-sm flex items-center gap-2"
              >
                {loadingId === statusModal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInfoModalOpen && infoLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#3da9d4] border border-blue-100">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Initial Enquiry Note
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {infoLead.customer_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3da9d4]"></div>
                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed pl-2">
                  {getEnquiryNote(infoLead.notes)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={closeInfoModal}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {followUpLead && (
        <div
          className={`fixed inset-0 z-[100] flex justify-end transition-opacity duration-300 ease-in-out ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeDrawer}
          />

          <div
            className={`relative bg-white w-full max-w-[500px] h-full shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
              isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    followUpLead.status === "Cancelled"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}
                >
                  {followUpLead.status === "Cancelled" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <PhoneCall className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {followUpLead.status === "Cancelled"
                      ? "Cancellation Details"
                      : "Log Follow-Up"}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {followUpLead.customer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
              {renderTimelineNotes(followUpLead)}
            </div>

            {followUpLead.status !== "Cancelled" &&
              followUpLead.status !== "Booked" && (
                <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Interaction Note *
                    </label>
                    <textarea
                      autoFocus
                      className="input-primary w-full text-sm resize-none"
                      rows={3}
                      placeholder="What was discussed on the call?..."
                      value={followUpNote}
                      onChange={(e) => setFollowUpNote(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#3da9d4] uppercase tracking-wider mb-1.5">
                        Set Reminder (Optional)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          min={todayStr}
                          value={nextFollowUpDate}
                          onChange={(e) => setNextFollowUpDate(e.target.value)}
                          className="input-primary pl-9 w-full h-[42px]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleFollowUpSubmit}
                      disabled={
                        !followUpNote.trim() || loadingId === followUpLead.id
                      }
                      className="btn-brand py-2.5 px-6 flex items-center justify-center gap-2 shadow-md text-sm font-bold shrink-0 h-[42px] min-w-[130px]"
                    >
                      {loadingId === followUpLead.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Log Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
