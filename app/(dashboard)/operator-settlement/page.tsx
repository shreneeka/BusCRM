import SettlementTable from "@/components/settlement/SettlementTable";
import SettlementFormWrapper from "./SettlementFormWrapper";
import { getSettlementCalculations } from "@/lib/actions/settlement.actions";

export default async function OperatorSettlementPage() {
  const calculations = await getSettlementCalculations();

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-144px)] animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <SettlementTable
          calculations={calculations}
          processing={false}
        />
      </div>

      <div className="w-full lg:w-100 shrink-0 min-h-0 h-full overflow-y-auto custom-scrollbar">
        <SettlementFormWrapper />
      </div>
    </div>
  );
}
