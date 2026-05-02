import { checkDatabaseSchema } from "@/lib/check-database";

export async function POST() {
  try {
    const result = await checkDatabaseSchema();
    
    if (result.success) {
      return Response.json({ success: true, data: result.data });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Check database API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
