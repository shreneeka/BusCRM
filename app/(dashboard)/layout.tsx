import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 1. Fetch both role and full_name from the database
  const { data: userData } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "Staff";

  const userName = userData?.full_name || "User";

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={userRole} userName={userName} />

        <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ml-64 peer-data-[collapsed=true]:ml-20">
          <main className="flex-1 overflow-hidden flex flex-col [&>*]:h-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
