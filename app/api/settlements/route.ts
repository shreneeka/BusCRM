import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  calculateOperatorSettlement, 
  getAllOperatorsWithPendingSettlements,
  getOperatorSettlements,
  createSettlement,
  completeSettlement
} from "@/lib/actions/settlement.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');

    if (operatorId) {
      // Get specific operator settlement calculation
      const calculation = await calculateOperatorSettlement(operatorId);
      return NextResponse.json({ data: calculation });
    } else {
      // Get all operators with pending settlements and settlement history
      const [operators, settlements] = await Promise.all([
        getAllOperatorsWithPendingSettlements(),
        getOperatorSettlements()
      ]);
      
      return NextResponse.json({ 
        operators,
        settlements 
      });
    }
  } catch (error) {
    console.error("Settlement API GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlement data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operatorId, notes } = body;

    if (!operatorId) {
      return NextResponse.json(
        { error: "Operator ID is required" },
        { status: 400 }
      );
    }

    const result = await createSettlement(operatorId, notes);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        settlementId: result.settlementId 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Settlement API POST error:", error);
    return NextResponse.json(
      { error: "Failed to create settlement" },
      { status: 500 }
    );
  }
}
