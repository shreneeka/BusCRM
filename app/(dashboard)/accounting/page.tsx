import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountingTabs from "@/components/accounting/AccountingTabs";
import {
  getAccountingEntries,
  getAccountsWithBalances,
  getAccountingCategories,
} from "@/lib/supabase/accounting"

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [entries, categories, accounts] = await Promise.all([
    getAccountingEntries(),
    getAccountingCategories(),
    getAccountsWithBalances(),
  ]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <AccountingTabs
        initialEntries={entries}
        initialCategories={categories}
        initialAccounts={accounts}
      />
    </div>
  );
}
