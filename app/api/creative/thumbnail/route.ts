import { NextRequest } from "next/server";
import { db, creatives } from "@/db";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

// POST /api/creative/thumbnail — upload a custom thumbnail for a video creative
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const creativeId = formData.get("creativeId");
    const file = formData.get("thumbnail") as File | null;

    if (!creativeId || !file) {
      return Response.json({ error: "creativeId and thumbnail required" }, { status: 400 });
    }

    const idNum = parseInt(creativeId as string, 10);
    if (isNaN(idNum)) {
      return Response.json({ error: "invalid creativeId" }, { status: 400 });
    }

    const rows = await db.select().from(creatives).where(eq(creatives.id, idNum)).limit(1);
    if (!rows[0]) {
      return Response.json({ error: "creative not found" }, { status: 404 });
    }

    // Save thumbnail beside the original file
    const thumbDir = dirname(rows[0].filePath);
    if (!existsSync(thumbDir)) {
      await mkdir(thumbDir, { recursive: true });
    }

    const thumbName = `thumb_${rows[0].id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const thumbPath = join(thumbDir, thumbName);
    const buf = await file.arrayBuffer();
    await writeFile(thumbPath, Buffer.from(buf));

    const [updated] = await db
      .update(creatives)
      .set({ thumbnailPath: thumbPath, updatedAt: new Date() })
      .where(eq(creatives.id, idNum))
      .returning();

    return Response.json({ creative: updated });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
