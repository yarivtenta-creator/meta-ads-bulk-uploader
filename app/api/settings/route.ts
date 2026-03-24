import { NextRequest } from "next/server";
import { db, settings } from "@/db";
import { eq } from "drizzle-orm";
import { getAdAccounts, getPages } from "@/lib/meta-api";

// GET /api/settings — return the first settings row (or null)
export async function GET() {
  try {
    const rows = await db.select().from(settings).limit(1);
    return Response.json({ settings: rows[0] ?? null });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/settings — upsert settings
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      metaAccessToken?: string;
      adAccountId?: string;
      adAccountName?: string;
      facebookPageId?: string;
      facebookPageName?: string;
    };

    const rows = await db.select().from(settings).limit(1);

    if (rows.length === 0) {
      const [row] = await db
        .insert(settings)
        .values({
          metaAccessToken: body.metaAccessToken ?? null,
          adAccountId: body.adAccountId ?? null,
          adAccountName: body.adAccountName ?? null,
          facebookPageId: body.facebookPageId ?? null,
          facebookPageName: body.facebookPageName ?? null,
        })
        .returning();
      return Response.json({ settings: row });
    } else {
      const [row] = await db
        .update(settings)
        .set({
          ...(body.metaAccessToken !== undefined && {
            metaAccessToken: body.metaAccessToken,
          }),
          ...(body.adAccountId !== undefined && {
            adAccountId: body.adAccountId,
          }),
          ...(body.adAccountName !== undefined && {
            adAccountName: body.adAccountName,
          }),
          ...(body.facebookPageId !== undefined && {
            facebookPageId: body.facebookPageId,
          }),
          ...(body.facebookPageName !== undefined && {
            facebookPageName: body.facebookPageName,
          }),
          updatedAt: new Date(),
        })
        .where(eq(settings.id, rows[0].id))
        .returning();
      return Response.json({ settings: row });
    }
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/settings/adaccounts?token=... — fetch ad accounts from Meta
// (handled as a query param route so we keep this file simple — see below)

// GET /api/settings/test — verify token + fetch ad accounts & pages
export async function PUT(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token: string };
    if (!token) return Response.json({ error: "token required" }, { status: 400 });

    const [adAccounts, pages] = await Promise.all([
      getAdAccounts(token),
      getPages(token),
    ]);

    return Response.json({ adAccounts, pages });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 400 });
  }
}
