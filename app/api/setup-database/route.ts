import { setupDatabase } from "@/lib/setup-database";

export async function POST() {
  try {
    const result = await setupDatabase();
    
    if (result.success) {
      return Response.json({ success: true, message: result.message });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Setup API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
