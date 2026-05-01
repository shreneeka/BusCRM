import TicketBookingForm from "@/components/tickets/TicketBookingForm";
import TicketList from "@/components/tickets/TicketList";
import { getTickets } from "@/lib/actions/ticket.actions";

export default async function TicketsPage() {
  const allTickets = await getTickets();

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-144px)] animate-in fade-in duration-500">
      {/* Left Side: Ticket List */}
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <TicketList initialTickets={allTickets} />
      </div>

      {/* Right Side: Ticket Booking Form */}
      <div className="w-full lg:w-[400px] shrink-0 min-h-0 h-full overflow-y-auto custom-scrollbar">
        <TicketBookingForm />
      </div>
    </div>
  );
}
