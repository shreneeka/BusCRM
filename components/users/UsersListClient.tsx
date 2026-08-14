"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, Phone, Edit, UserPlus, Shield } from "lucide-react";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // <-- Added Tooltip imports

export default function UsersListClient({
  initialUsers,
}: {
  initialUsers: any[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Filter Logic
  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mobile_number || "").includes(searchTerm);
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      {/* 1. SEARCH & FILTER HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-1 w-full gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              className="input-primary pl-9 py-2 text-sm w-full bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-primary py-2 text-sm w-auto bg-white shadow-sm font-medium"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-brand flex items-center gap-2 shrink-0 px-4 py-2.5 text-sm font-semibold shadow-sm"
        >
          <UserPlus className="w-[18px] h-[18px]" strokeWidth={2.5} /> Add User
        </button>
      </div>

      {/* 2. TABLE */}
      <div className="saas-card bg-white border-t-4 border-t-[#3da9d4] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-bold">Name</th>
              <th className="px-6 py-4 font-bold">Role</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Mobile</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#3da9d4] text-sm shrink-0">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-slate-800 text-sm">
                      {member.full_name}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border ${
                      member.role === "Admin"
                        ? "bg-purple-50 text-purple-600 border-purple-100"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {member.email}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {member.mobile_number || "—"}
                </td>

                {/* TOOLTIP ADDED HERE */}
                <td className="px-6 py-4 text-right">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setEditingUser(member)}
                          className="p-2 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="bg-slate-900 text-white border-none"
                      >
                        <p className="text-xs font-semibold">Edit User</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      <AddStaffModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          router.refresh();
        }}
      />
      {editingUser && (
        <EditStaffModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}
