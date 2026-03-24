import { NextRequest } from "next/server";
import { db, settings, uploadBatches, creatives } from "@/db";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import {
  uploadImageToMeta,
  uploadVideoToMeta,
  createAdCreative,
  createAd,
} from "@/lib/meta-api";

export async function POST(req: NextRequest) {
  try {
    const { batchId } = (await req.json()) as { batchId: number };
    if (!batchId) return Response.json({ error: "batchId required" }, { status: 400 });

    // 1. Load settings
    const settingsRows = await db.select().from(settings).limit(1);
    const s = settingsRows[0];
    if (!s?.metaAccessToken || !s?.adAccountId || !s?.facebookPageId) {
      return Response.json(
        { error: "Meta access token, ad account, and Facebook page must be configured" },
        { status: 400 }
      );
    }

    // 2. Load batch
    const batchRows = await db
      .select()
      .from(uploadBatches)
      .where(eq(uploadBatches.id, batchId))
      .limit(1);
    const batch = batchRows[0];
    if (!batch) return Response.json({ error: "Batch not found" }, { status: 404 });

    if (!batch.adSetId) return Response.json({ error: "Ad set not selected" }, { status: 400 });
    if (!batch.websiteUrl) return Response.json({ error: "Website URL not set" }, { status: 400 });
    if (!batch.primaryTexts?.length) return Response.json({ error: "Primary text required" }, { status: 400 });
    if (!batch.headlines?.length) return Response.json({ error: "Headline required" }, { status: 400 });

    // 3. Mark batch as uploading
    await db
      .update(uploadBatches)
      .set({ status: "uploading", updatedAt: new Date() })
      .where(eq(uploadBatches.id, batchId));

    // 4. Fetch creatives for this batch
    const creativeRows = await db
      .select()
      .from(creatives)
      .where(eq(creatives.batchId, batchId));

    let adsCreated = 0;
    let adsErrored = 0;
    const errorLog: string[] = [];

    for (const creative of creativeRows) {
      try {
        // a. Read file from disk
        const fileBuffer = await readFile(creative.filePath);

        let imageHash: string | undefined;
        let videoId: string | undefined;
        let thumbnailUrl: string | undefined;

        // b. Upload to Meta
        if (creative.fileType === "image") {
          imageHash = await uploadImageToMeta(
            s.adAccountId,
            s.metaAccessToken,
            fileBuffer,
            creative.fileName
          );
        } else {
          videoId = await uploadVideoToMeta(
            s.adAccountId,
            s.metaAccessToken,
            fileBuffer,
            creative.fileName
          );

          // c. Upload custom thumbnail if present
          if (creative.thumbnailPath) {
            const thumbBuf = await readFile(creative.thumbnailPath);
            const thumbHash = await uploadImageToMeta(
              s.adAccountId,
              s.metaAccessToken,
              thumbBuf,
              `thumb_${creative.fileName}`
            );
            // Use hash as thumbnail via adimages URL is not directly supported;
            // We'll pass the thumbHash as image_hash for thumbnail reference
            // Meta requires an image_url for video thumbnails — use the adimage URL
            // For now, skip custom thumb URL (Meta serves default)
            thumbnailUrl = thumbHash
              ? `https://graph.facebook.com/v22.0/${s.adAccountId}/adimages?hash=${thumbHash}&access_token=${s.metaAccessToken}`
              : undefined;
          }
        }

        // d. Create ad creative
        const creativeId = await createAdCreative({
          adAccountId: s.adAccountId,
          accessToken: s.metaAccessToken,
          pageId: s.facebookPageId,
          primaryTexts: batch.primaryTexts as string[],
          headlines: batch.headlines as string[],
          descriptions: (batch.descriptions as string[]) ?? [],
          ctaType: batch.ctaType ?? "LEARN_MORE",
          websiteUrl: batch.websiteUrl,
          displayLink: batch.displayLink ?? undefined,
          imageHash,
          videoId,
          thumbnailUrl,
        });

        // e. Create the ad
        const adStatus = batch.launchAsPaused ? "PAUSED" : "ACTIVE";
        const adResult = await createAd(s.adAccountId, s.metaAccessToken, {
          name: creative.adName,
          adSetId: batch.adSetId,
          creativeId,
          status: adStatus,
        });

        // f. Update creative record
        await db
          .update(creatives)
          .set({
            metaCreativeId: creativeId,
            metaAdId: adResult.id as string,
            status: "complete",
            updatedAt: new Date(),
          })
          .where(eq(creatives.id, creative.id));

        adsCreated++;
      } catch (err) {
        const msg = `${creative.adName}: ${String(err)}`;
        console.error("[launch]", msg);
        errorLog.push(msg);
        adsErrored++;

        await db
          .update(creatives)
          .set({
            status: "error",
            errorMessage: String(err),
            updatedAt: new Date(),
          })
          .where(eq(creatives.id, creative.id));
      }
    }

    // 5. Update batch final state
    const finalStatus =
      adsCreated === 0 && adsErrored > 0
        ? "error"
        : "complete";

    await db
      .update(uploadBatches)
      .set({
        status: finalStatus,
        adsCreated,
        adsErrored,
        errorLog,
        updatedAt: new Date(),
      })
      .where(eq(uploadBatches.id, batchId));

    return Response.json({ adsCreated, adsErrored, errorLog });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
