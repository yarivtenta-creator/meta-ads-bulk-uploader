import { NextRequest } from "next/server";
import { db, creatives } from "@/db";
import { eq } from "drizzle-orm";

// PUT /api/creative — update ad name for a creative
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { id: number; adName: string };
    if (!body.id || body.adName === undefined) {
      return Response.json({ error: "id and adName required" }, { status: 400 });
    }
    const [row] = await db
      .update(creatives)
      .set({ adName: body.adName, updatedAt: new Date() })
      .where(eq(creatives.id, body.id))
      .returning();
    return Response.json({ creative: row });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
