import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const batchStatusEnum = pgEnum("batch_status", [
  "draft",
  "uploading",
  "complete",
  "error",
]);

export const creativeStatusEnum = pgEnum("creative_status", [
  "pending",
  "uploading",
  "complete",
  "error",
]);

export const fileTypeEnum = pgEnum("file_type", ["image", "video"]);

// ---------- Tables ----------

/**
 * Stores the user's Meta API credentials and selected account context.
 * Treated as a single-row config (only one row expected).
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  metaAccessToken: text("meta_access_token"),
  adAccountId: text("ad_account_id"),
  adAccountName: text("ad_account_name"),
  facebookPageId: text("facebook_page_id"),
  facebookPageName: text("facebook_page_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One row per bulk-upload session.
 * Arrays (primary texts, headlines, descriptions, error log) are stored as jsonb.
 */
export const uploadBatches = pgTable("upload_batches", {
  id: serial("id").primaryKey(),
  batchName: text("batch_name").notNull(),

  // Campaign
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),

  // Ad set
  adSetId: text("ad_set_id"),
  adSetName: text("ad_set_name"),

  // Ad copy — stored as string arrays in jsonb
  primaryTexts: jsonb("primary_texts").$type<string[]>().default([]).notNull(),
  headlines: jsonb("headlines").$type<string[]>().default([]).notNull(),
  descriptions: jsonb("descriptions").$type<string[]>().default([]).notNull(),

  // Ad settings
  ctaType: text("cta_type"),
  websiteUrl: text("website_url"),
  displayLink: text("display_link"),
  launchAsPaused: boolean("launch_as_paused").default(true).notNull(),
  enhancementsEnabled: boolean("enhancements_enabled").default(false).notNull(),

  // Job state
  status: batchStatusEnum("status").default("draft").notNull(),
  adsCreated: integer("ads_created").default(0).notNull(),
  adsErrored: integer("ads_errored").default(0).notNull(),
  errorLog: jsonb("error_log").$type<string[]>().default([]).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Each creative (image or video) file that belongs to a batch.
 * Meta IDs are populated after successful upload.
 */
export const creatives = pgTable("creatives", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => uploadBatches.id, { onDelete: "cascade" }),

  // File metadata
  fileName: text("file_name").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  thumbnailPath: text("thumbnail_path"), // populated for videos

  // Generated ad name (derived from file name or user-defined pattern)
  adName: text("ad_name").notNull(),

  // Meta IDs — filled after creation via the Marketing API
  metaAdId: text("meta_ad_id"),
  metaCreativeId: text("meta_creative_id"),

  // Job state
  status: creativeStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Types ----------

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

export type UploadBatch = typeof uploadBatches.$inferSelect;
export type NewUploadBatch = typeof uploadBatches.$inferInsert;

export type Creative = typeof creatives.$inferSelect;
export type NewCreative = typeof creatives.$inferInsert;
