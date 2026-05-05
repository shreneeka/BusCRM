import OperatorView from "@/components/operators/OperatorView";
import { getOperatorSummary } from "@/lib/actions/operators.actions";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function OperatorDetailPage({ params }: Props) {
  let operatorSummary;
  try {
    operatorSummary = await getOperatorSummary(params.id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.1)]">
        <OperatorView operatorSummary={operatorSummary} />
      </div>
    </div>
  );
}

