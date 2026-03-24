import sharp from "sharp";

const GRAPH_API = "https://graph.facebook.com/v22.0";

// ─── Generic helpers ────────────────────────────────────────────────────────

function extractMetaError(data: Record<string, unknown>): string {
  if (data?.error) {
    const err = data.error as Record<string, unknown>;
    let msg = (err.error_user_msg as string) || (err.message as string) || "Unknown Meta error";
    if (err.error_data) msg += ` (${JSON.stringify(err.error_data)})`;
    return msg;
  }
  return "Unknown error";
}

export async function metaGet(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH_API}/${endpoint}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(extractMetaError(data));
  return data;
}

export async function metaPost(
  endpoint: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(extractMetaError(data));
  return data;
}

// ─── Account / Page helpers ─────────────────────────────────────────────────

export async function getAdAccounts(accessToken: string) {
  const data = await metaGet("me/adaccounts", accessToken, {
    fields: "id,name,account_status,currency",
  });
  return (data.data as Record<string, unknown>[]) ?? [];
}

export async function getPages(accessToken: string) {
  const data = await metaGet("me/accounts", accessToken, {
    fields: "id,name,access_token",
  });
  return (data.data as Record<string, unknown>[]) ?? [];
}

// ─── Campaign / Ad Set helpers ───────────────────────────────────────────────

export async function getCampaigns(adAccountId: string, accessToken: string) {
  const data = await metaGet(`${adAccountId}/campaigns`, accessToken, {
    fields: "id,name,status,objective",
    limit: "200",
  });
  return (data.data as Record<string, unknown>[]) ?? [];
}

export async function getAdSets(campaignId: string, accessToken: string) {
  const data = await metaGet(`${campaignId}/adsets`, accessToken, {
    fields: "id,name,status",
    limit: "200",
  });
  return (data.data as Record<string, unknown>[]) ?? [];
}

export async function getAdSetDetails(adSetId: string, accessToken: string) {
  return metaGet(adSetId, accessToken, {
    fields: [
      "id",
      "name",
      "campaign_id",
      "targeting",
      "billing_event",
      "optimization_goal",
      "bid_amount",
      "bid_strategy",
      "daily_budget",
      "lifetime_budget",
      "promoted_object",
      "destination_type",
      "attribution_spec",
      "status",
      "start_time",
      "end_time",
      "pacing_type",
    ].join(","),
  });
}

export async function createAdSet(
  adAccountId: string,
  accessToken: string,
  {
    name,
    campaignId,
    sourceAdSetId,
  }: { name: string; campaignId: string; sourceAdSetId: string }
) {
  const source = await getAdSetDetails(sourceAdSetId, accessToken);

  // Build copy payload — carry all relevant fields from source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {
    name,
    campaign_id: campaignId,
    status: "PAUSED",
  };

  const carry = [
    "targeting",
    "billing_event",
    "optimization_goal",
    "bid_amount",
    "bid_strategy",
    "daily_budget",
    "lifetime_budget",
    "promoted_object",
    "destination_type",
    "attribution_spec",
    "pacing_type",
  ] as const;

  for (const field of carry) {
    if (source[field] !== undefined) payload[field] = source[field];
  }

  return metaPost(`${adAccountId}/adsets`, accessToken, payload);
}

// ─── Media upload helpers ────────────────────────────────────────────────────

const CONVERT_MIME = new Set(["image/webp", "image/bmp", "image/tiff"]);

export async function uploadImageToMeta(
  adAccountId: string,
  accessToken: string,
  imageBuffer: Buffer,
  fileName: string
): Promise<string> {
  let buf = imageBuffer;
  let name = fileName;

  // Auto-convert unsupported formats to JPEG
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeGuess =
    ext === "webp"
      ? "image/webp"
      : ext === "bmp"
      ? "image/bmp"
      : ext === "tiff" || ext === "tif"
      ? "image/tiff"
      : "";

  if (CONVERT_MIME.has(mimeGuess)) {
    buf = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
    name = name.replace(/\.[^.]+$/, ".jpg");
  }

  const form = new FormData();
  form.append("access_token", accessToken);
  form.append(
    "filename",
    new Blob([new Uint8Array(buf)], { type: "image/jpeg" }),
    name
  );

  const res = await fetch(`${GRAPH_API}/${adAccountId}/adimages`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(extractMetaError(data));

  // Response: { images: { <filename>: { hash, url, ... } } }
  const images = data.images as Record<string, Record<string, unknown>>;
  const first = Object.values(images)[0];
  if (!first?.hash) throw new Error("Meta did not return an image hash");
  return first.hash as string;
}

export async function uploadVideoToMeta(
  adAccountId: string,
  accessToken: string,
  videoBuffer: Buffer,
  fileName: string
): Promise<string> {
  const form = new FormData();
  form.append("access_token", accessToken);
  form.append("title", fileName);
  form.append(
    "source",
    new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }),
    fileName
  );

  const res = await fetch(`${GRAPH_API}/${adAccountId}/advideos`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(extractMetaError(data));
  if (!data.id) throw new Error("Meta did not return a video ID");
  return data.id as string;
}

// ─── Ad Creative (Prompt 6) ──────────────────────────────────────────────────

export interface AdCreativeInput {
  adAccountId: string;
  accessToken: string;
  pageId: string;
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
  ctaType: string;
  websiteUrl: string;
  displayLink?: string;
  // image OR video
  imageHash?: string;
  videoId?: string;
  thumbnailUrl?: string;
}

export async function createAdCreative(input: AdCreativeInput): Promise<string> {
  const {
    adAccountId,
    accessToken,
    pageId,
    primaryTexts,
    headlines,
    descriptions,
    ctaType,
    websiteUrl,
    displayLink,
    imageHash,
    videoId,
    thumbnailUrl,
  } = input;

  const isMulti =
    primaryTexts.length > 1 || headlines.length > 1 || descriptions.length > 1;

  let objectStorySpec: Record<string, unknown>;

  if (isMulti) {
    // CASE 1 — asset_feed_spec
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetFeed: Record<string, any> = {
      bodies: primaryTexts.map((t) => ({ text: t })),
      titles: headlines.map((t) => ({ text: t })),
      descriptions: descriptions.length
        ? descriptions.map((t) => ({ text: t }))
        : undefined,
      call_to_action_types: [ctaType],
      link_urls: [
        {
          website_url: websiteUrl,
          ...(displayLink ? { display_url: displayLink } : {}),
        },
      ],
    };

    if (imageHash) {
      assetFeed.images = [{ hash: imageHash }];
      assetFeed.ad_formats = ["SINGLE_IMAGE"];
    } else if (videoId) {
      assetFeed.videos = [
        { video_id: videoId, ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}) },
      ];
      assetFeed.ad_formats = ["SINGLE_VIDEO"];
    }

    objectStorySpec = { page_id: pageId };

    const payload: Record<string, unknown> = {
      object_story_spec: objectStorySpec,
      asset_feed_spec: assetFeed,
    };

    const data = await metaPost(`${adAccountId}/adcreatives`, accessToken, payload);
    return data.id as string;
  } else {
    // CASE 2 — single variation
    if (imageHash) {
      objectStorySpec = {
        page_id: pageId,
        link_data: {
          image_hash: imageHash,
          link: websiteUrl,
          message: primaryTexts[0] ?? "",
          name: headlines[0] ?? "",
          description: descriptions[0] ?? "",
          call_to_action: { type: ctaType },
          ...(displayLink ? { caption: displayLink } : {}),
        },
      };
    } else if (videoId) {
      objectStorySpec = {
        page_id: pageId,
        video_data: {
          video_id: videoId,
          message: primaryTexts[0] ?? "",
          title: headlines[0] ?? "",
          link_description: descriptions[0] ?? "",
          call_to_action: { type: ctaType, value: { link: websiteUrl } },
          ...(thumbnailUrl ? { image_url: thumbnailUrl } : {}),
        },
      };
    } else {
      throw new Error("Must provide either imageHash or videoId");
    }

    const data = await metaPost(`${adAccountId}/adcreatives`, accessToken, {
      object_story_spec: objectStorySpec,
    });
    return data.id as string;
  }
}

// ─── Ad creation ─────────────────────────────────────────────────────────────

export async function createAd(
  adAccountId: string,
  accessToken: string,
  {
    name,
    adSetId,
    creativeId,
    status,
  }: { name: string; adSetId: string; creativeId: string; status: string }
) {
  return metaPost(`${adAccountId}/ads`, accessToken, {
    name,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status,
  });
}
