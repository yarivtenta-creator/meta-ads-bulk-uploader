import { db, settings } from "@/db";
import { getCampaigns } from "@/lib/meta-api";

// GET /api/meta/campaigns — fetch campaigns using saved settings
export async function GET() {
  try {
    const rows = await db.select().from(settings).limit(1);
    const s = rows[0];
    if (!s?.metaAccessToken || !s?.adAccountId) {
      return Response.json(
        { error: "Meta access token and ad account not configured" },
        { status: 400 }
      );
    }
    const campaigns = await getCampaigns(s.adAccountId, s.metaAccessToken);
    return Response.json({ campaigns });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
