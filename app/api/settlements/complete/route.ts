import { NextRequest, NextResponse } from "next/server";
import { completeSettlement } from "@/lib/actions/settlement.actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId } = body;

    if (!settlementId) {
      return NextResponse.json(
        { error: "Settlement ID is required" },
        { status: 400 }
      );
    }

    const result = await completeSettlement(settlementId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Settlement complete API error:", error);
    return NextResponse.json(
      { error: "Failed to complete settlement" },
      { status: 500 }
    );
  }
}
