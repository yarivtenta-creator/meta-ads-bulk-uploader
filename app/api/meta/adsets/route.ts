import { NextRequest } from "next/server";
import { db, settings } from "@/db";
import { getAdSets, createAdSet } from "@/lib/meta-api";

// GET /api/meta/adsets?campaignId=X
export async function GET(req: NextRequest) {
  try {
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    if (!campaignId) {
      return Response.json({ error: "campaignId required" }, { status: 400 });
    }

    const rows = await db.select().from(settings).limit(1);
    const s = rows[0];
    if (!s?.metaAccessToken) {
      return Response.json({ error: "Meta access token not configured" }, { status: 400 });
    }

    const adSets = await getAdSets(campaignId, s.metaAccessToken);
    return Response.json({ adSets });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/meta/adsets — create a new ad set by copying source
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name: string;
      campaignId: string;
      sourceAdSetId: string;
    };

    if (!body.name || !body.campaignId || !body.sourceAdSetId) {
      return Response.json(
        { error: "name, campaignId, and sourceAdSetId required" },
        { status: 400 }
      );
    }

    const rows = await db.select().from(settings).limit(1);
    const s = rows[0];
    if (!s?.metaAccessToken || !s?.adAccountId) {
      return Response.json({ error: "Meta settings not configured" }, { status: 400 });
    }

    const result = await createAdSet(s.adAccountId, s.metaAccessToken, {
      name: body.name,
      campaignId: body.campaignId,
      sourceAdSetId: body.sourceAdSetId,
    });

    return Response.json({ adSet: result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
