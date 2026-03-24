import { NextRequest } from "next/server";
import { db, creatives } from "@/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function adNameFromFilename(filename: string): string {
  // Remove extension
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function detectFileType(mime: string): "image" | "video" | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const batchId = formData.get("batchId");
    if (!batchId) {
      return Response.json({ error: "batchId required" }, { status: 400 });
    }

    const batchIdNum = parseInt(batchId as string, 10);
    if (isNaN(batchIdNum)) {
      return Response.json({ error: "invalid batchId" }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "uploads", batchId as string);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return Response.json({ error: "no files provided" }, { status: 400 });
    }

    const created = [];

    for (const file of files) {
      const mime = file.type;
      const fileType = detectFileType(mime);
      if (!fileType) continue; // skip unknown types

      const safeName = sanitizeFilename(file.name);
      const filePath = join(uploadDir, safeName);
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));

      const adName = adNameFromFilename(file.name);

      const [record] = await db
        .insert(creatives)
        .values({
          batchId: batchIdNum,
          fileName: file.name,
          fileType,
          mimeType: mime,
          filePath,
          fileSize: file.size,
          adName,
          status: "pending",
        })
        .returning();

      created.push(record);
    }

    return Response.json({ creatives: created });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
