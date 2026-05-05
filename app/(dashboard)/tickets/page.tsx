import TicketTabs from "@/components/tickets/TicketTabs";
import { getTickets } from "@/lib/actions/ticket.actions";

export default async function TicketsPage() {
  let allTickets: any[] = [];
  
  try {
    allTickets = await getTickets() || [];
  } catch (error) {
    console.error("Error loading tickets page:", error);
    allTickets = [];
  }

  return (
    <div className="h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <TicketTabs initialTickets={allTickets} />
    </div>
  );
}
