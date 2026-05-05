import CustomerView from "@/components/customers/CustomerView";
import { getCustomerById } from "@/lib/actions/lead.actions";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  
  if (!customerId) {
    notFound();
  }
  
  let customer;
  try {
    customer = await getCustomerById(customerId);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1)]">
        <CustomerView customer={customer} />
      </div>
    </div>
  );
}
