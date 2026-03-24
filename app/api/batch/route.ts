import { NextRequest } from "next/server";
import { db, uploadBatches } from "@/db";
import { eq, desc } from "drizzle-orm";

// GET /api/batch — return all batches newest-first
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(uploadBatches)
      .orderBy(desc(uploadBatches.createdAt));
    return Response.json({ batches: rows });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/batch — create a new batch
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { batchName: string };
    if (!body.batchName) {
      return Response.json({ error: "batchName required" }, { status: 400 });
    }
    const [row] = await db
      .insert(uploadBatches)
      .values({ batchName: body.batchName })
      .returning();
    return Response.json({ batch: row });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// PUT /api/batch — update batch settings
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: number;
      campaignId?: string;
      campaignName?: string;
      adSetId?: string;
      adSetName?: string;
      primaryTexts?: string[];
      headlines?: string[];
      descriptions?: string[];
      ctaType?: string;
      websiteUrl?: string;
      displayLink?: string;
      launchAsPaused?: boolean;
      enhancementsEnabled?: boolean;
    };

    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

    const [row] = await db
      .update(uploadBatches)
      .set({
        ...(body.campaignId !== undefined && { campaignId: body.campaignId }),
        ...(body.campaignName !== undefined && { campaignName: body.campaignName }),
        ...(body.adSetId !== undefined && { adSetId: body.adSetId }),
        ...(body.adSetName !== undefined && { adSetName: body.adSetName }),
        ...(body.primaryTexts !== undefined && { primaryTexts: body.primaryTexts }),
        ...(body.headlines !== undefined && { headlines: body.headlines }),
        ...(body.descriptions !== undefined && { descriptions: body.descriptions }),
        ...(body.ctaType !== undefined && { ctaType: body.ctaType }),
        ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl }),
        ...(body.displayLink !== undefined && { displayLink: body.displayLink }),
        ...(body.launchAsPaused !== undefined && { launchAsPaused: body.launchAsPaused }),
        ...(body.enhancementsEnabled !== undefined && {
          enhancementsEnabled: body.enhancementsEnabled,
        }),
        updatedAt: new Date(),
      })
      .where(eq(uploadBatches.id, body.id))
      .returning();

    return Response.json({ batch: row });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
