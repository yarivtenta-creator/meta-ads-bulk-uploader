import { db, creatives } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = parseInt(id, 10);
    if (isNaN(batchId)) {
      return Response.json({ error: "invalid id" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(creatives)
      .where(eq(creatives.batchId, batchId));
    return Response.json({ creatives: rows });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
