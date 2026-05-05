"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  PhoneCall,
  CalendarClock,
  Users,
  MapPin,
  UserCog,
  LogOut,
  Ticket,
  ChevronLeft,
  Menu,
  ChevronUp,
  ChevronDown,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Enquiry", href: "/enquiry", icon: PhoneCall },
  { name: "Follow Ups", href: "/follow-ups", icon: CalendarClock },
  { name: "Confirmed Bookings", href: "/confirmed", icon: Ticket },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Cities", href: "/cities", icon: MapPin },
  { name: "Operators", href: "/operators", icon: UserCog },
  { name: "Accounting", href: "/accounting", icon: DollarSign },
  { name: "Users", href: "/users", icon: UserCog, adminOnly: true },
];

export default function Sidebar({
  userRole,
  userName = "User",
}: {
  userRole: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 1)
    .toUpperCase();

  return (
    <>
      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "peer h-screen bg-white border-r border-dashboard-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* HEADER AREA */}
        <div className="h-20 flex items-center px-4 border-b border-dashboard-border relative shrink-0">
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            {isCollapsed ? (
              <div
                className="mx-auto cursor-pointer text-slate-500 hover:text-[#3da9d4] transition-colors p-2"
                onClick={() => setIsCollapsed(false)}
              >
                <Menu size={24} strokeWidth={2} />
              </div>
            ) : (
              <>
                <Image
                  src="/SPT.png"
                  alt="Logo"
                  width={150}
                  height={35}
                  className="object-contain transition-opacity duration-300 opacity-100 ml-4"
                />
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="cursor-pointer text-slate-400 hover:text-[#3da9d4] transition-all p-2 mr-1"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* NAVIGATION LINKS WITH TOOLTIPS */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => {
              if (item.adminOnly && userRole !== "Admin") return null;
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer",
                        isActive
                          ? "bg-[#3da9d4]/10 text-[#3da9d4]"
                          : "text-slate-900 hover:bg-slate-50",
                        isCollapsed && "justify-center px-0",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-[#3da9d4]"
                            : "group-hover:text-[#3da9d4]",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate transition-all duration-300 ease-in-out",
                          isCollapsed
                            ? "w-0 opacity-0 invisible"
                            : "w-auto opacity-100 visible",
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </TooltipTrigger>

                  {/* Tooltip only shows up when the sidebar is collapsed */}
                  {isCollapsed && (
                    <TooltipContent
                      side="right"
                      className="bg-slate-900 text-white border-none ml-2"
                    >
                      <p className="text-xs font-semibold">{item.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* PROFILE & LOGOUT SECTION */}
        <div className="p-2 pb-2 border-t border-slate-100 shrink-0 bg-white">
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[#ee1c2e] text-white hover:bg-[#d41828] transition-colors shadow-sm animate-in fade-in duration-300"
                  >
                    <LogOut className="w-4 h-4 shrink-0 ml-1" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-slate-900 text-white border-none ml-2"
                >
                  <p className="text-xs font-semibold">Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="animate-in fade-in duration-300">
              <p className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 px-2">
                MY PROFILE
              </p>

              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div
                  onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                  className="group/profile flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-50/50 transition-colors z-10 relative bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-[#ebf6fa] flex items-center justify-center text-[#3da9d4] font-black text-[13px] shrink-0">
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[13px] font-bold text-[#1e224c] truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate font-medium mt-0.5">
                      {userRole}
                    </p>
                  </div>

                  <div className="shrink-0 transition-transform duration-300">
                    {isProfileExpanded ? (
                      <ChevronDown
                        className="w-4 h-4 text-slate-400 group-hover/profile:text-[#3da9d4] transition-colors"
                        strokeWidth={2}
                      />
                    ) : (
                      <ChevronUp
                        className="w-4 h-4 text-slate-400 group-hover/profile:text-[#3da9d4] transition-colors"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out bg-white",
                    isProfileExpanded
                      ? "max-h-20 opacity-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <div className="h-px bg-slate-100 mx-3" />

                  <div className="p-2 pt-2">
                    <button
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#ee1c2e] text-white hover:bg-[#d41828] transition-colors font-semibold text-[13px] shadow-sm"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2.5} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {mounted &&
        isLogoutModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 p-7">
              <div className="flex items-start gap-5 mb-7">
                <div className="w-[52px] h-[52px] rounded-full bg-[#ffeaec] flex items-center justify-center shrink-0">
                  <LogOut
                    className="w-6 h-6 text-[#ee1c2e] ml-1"
                    strokeWidth={2.5}
                  />
                </div>

                <div className="pt-1">
                  <h3 className="text-[19px] font-bold text-[#2c245c]">
                    Confirm Logout
                  </h3>
                  <p className="text-[14px] text-slate-500 mt-1.5 leading-relaxed pr-2">
                    Are you sure you want to logout? You will need to login
                    again to access your account.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3.5 rounded-[14px] border border-slate-200 text-slate-600 font-bold text-[15px] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex-1 py-3.5 rounded-[14px] bg-[#ee1c2e] text-white font-bold text-[15px] hover:bg-[#d41828] transition-colors shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
