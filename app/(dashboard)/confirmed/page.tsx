import LeadList from "@/components/enquiry/LeadList";
import { getLeads } from "@/lib/actions/lead.actions";
import { getCities } from "@/lib/actions/lead.actions";

export default async function ConfirmedPage() {
  const [leads, cities] = await Promise.all([
    getLeads(),
    getCities()
  ]);

  return (
    <div className="h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <LeadList 
        initialLeads={leads.filter(l => l.status === "Booked")} 
        cities={cities}
        showStatusFilter={false}
        emptyMessage="No confirmed bookings found."
      />
    </div>
  );
}

