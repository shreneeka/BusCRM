import UsersListClient from "@/components/users/UsersListClient";
import { getUsers } from "@/lib/actions/users.actions";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1),0_1px_10px_0_rgb(0,0,0,0.05)] border border-slate-200">
        <UsersListClient initialUsers={users} />
      </div>
    </div>
  );
}

