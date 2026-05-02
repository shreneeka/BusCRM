"use client";

import { usePathname } from "next/navigation";

interface TopHeaderProps {
  userEmail?: string;
  userRole?: string;
}

export default function TopHeader({ userEmail, userRole }: TopHeaderProps) {
  const pathname = usePathname();

  // Helper function to figure out the page name based on the URL
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/leads":
        return "Lead Management";
      case "/follow-ups":
        return "Follow Ups";
      case "/customers":
        return "Customer Directory";
      case "/cities":
        return "City Management";
      case "/users":
        return "User Management";
      case "/tickets":
        return "Tickets";
      default:
        return "Shree Patel Travels";
    }
  };

  return (
    <header className="h-20 bg-white border-b border-[#e2e8f0] flex items-center px-8 sticky top-0 z-30">
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>
    </header>
  );
}
