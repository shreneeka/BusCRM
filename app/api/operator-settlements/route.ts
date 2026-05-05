import { NextRequest, NextResponse } from "next/server";
import { 
  createOperatorSettlement, 
  getOperatorSettlementsList, 
  updateSettlementPayment 
} from "@/lib/actions/settlement.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operator_name = searchParams.get("operator_name");
    const is_paid = searchParams.get("is_paid");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    const filters: Parameters<typeof getOperatorSettlementsList>[0] = {};
    if (operator_name) filters.operator_name = operator_name;
    if (is_paid !== null) filters.is_paid = is_paid === "true";
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const result = await getOperatorSettlementsList(filters);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("Operator settlements GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch operator settlements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await createOperatorSettlement(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });
  } catch (error) {
    console.error("Operator settlements POST error:", error);
    return NextResponse.json(
      { error: "Failed to create operator settlement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { id } = await params;
    const { is_paid, payment_amount } = body;

    if (!id) {
      return NextResponse.json({ error: "Settlement ID required" }, { status: 400 });
    }

    const result = await updateSettlementPayment(id, is_paid, payment_amount);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Operator settlements PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update settlement payment" },
      { status: 500 }
    );
  }
}

