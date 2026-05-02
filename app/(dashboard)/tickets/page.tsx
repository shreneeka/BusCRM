import TicketTabs from "@/components/tickets/TicketTabs";
import { getTickets } from "@/lib/actions/ticket.actions";

export default async function TicketsPage() {
  const allTickets = await getTickets();

  return (
    <div className="h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <TicketTabs initialTickets={allTickets} />
    </div>
  );
}
