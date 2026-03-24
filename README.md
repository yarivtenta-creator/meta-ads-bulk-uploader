# Meta Ads Bulk Uploader

**Upload dozens of Facebook/Instagram ads in minutes instead of hours.**

Free, open-source tool. No monthly fees.

---

## Features

- 📁 Drag-and-drop image and video upload (bulk)
- ✍️ Multiple text variations — Meta rotates them automatically
- 🎬 Custom video thumbnails
- 📋 Copy existing ad set settings to create new ones
- ⏸️ Launch ads as paused for review first
- 🔄 Full history of all upload batches
- 🖼️ Auto-converts WebP/BMP/TIFF to JPEG (Meta doesn't accept WebP)
- 🌑 Clean dark UI

---

## Quick Start

### On Replit

1. Import this repo into [Replit](https://replit.com) via **Import from GitHub**.
2. Set your `DATABASE_URL` in Replit's **Secrets** tab.
3. Run `npm run db:push` in the Shell to create tables.
4. Click **Run** — the app starts on port 3000.
5. Go to **Settings**, paste your Meta token, and configure your account.

### Local Setup

```bash
# 1. Clone
git clone <repo-url>
cd meta-ads-bulk-uploader

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local .env.local.example
# Edit .env.local and set DATABASE_URL

# 4. Push database schema
npm run db:push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ⚠️ Meta App Must Be in Live Mode

> Development mode **cannot** create real ads. You must publish your Meta app.

See [META-APP-SETUP.md](./META-APP-SETUP.md) for the full step-by-step guide.

---

## Tech Stack

- **Next.js 16** (App Router)
- **PostgreSQL** + **Drizzle ORM**
- **Tailwind CSS v4**
- **sharp** for image conversion
- **Meta Marketing API v22**

---

## Support

Join the community on [Scale AI on Skool](https://skool.com) for help and updates.

---

## Setup Checklist

- [ ] Meta Developer account at [developers.facebook.com](https://developers.facebook.com)
- [ ] Create App → Business type → Connect Business Manager
- [ ] Add "Create & manage ads" use case
- [ ] Generate System User Token with: `ads_management`, `ads_read`, `business_management`, `pages_show_list`
- [ ] Add a Privacy Policy URL
- [ ] **Publish the app (switch to Live mode)** ← most important step
- [ ] Deploy (Replit import or local PostgreSQL)
- [ ] Settings page → paste token, select ad account and page
- [ ] Upload ads → drag, drop, configure, launch
