# Meta App Setup Guide

This guide walks you through creating a Meta developer app and generating a System User access token. Most people get stuck here — follow every step carefully.

---

## Step 1 — Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** → **Create App**.
3. Select app type: **Business**.
4. Enter an app name (e.g., "My Ad Uploader") and your contact email.
5. Click **Create App**.

---

## Step 2 — Connect to Business Manager

1. In your new app's dashboard, go to **Settings → Basic**.
2. Under **Business Account**, click **Add** and select your Business Manager.
3. If you don't have one, create one at [business.facebook.com](https://business.facebook.com).

---

## Step 3 — Add the Ads Use Case

1. In your app dashboard, click **Add Use Case** or go to **Products**.
2. Find **"Create & manage ads"** (Marketing API) and click **Set Up**.
3. This adds the Marketing API product to your app.

---

## Step 4 — Create a System User Token

System User tokens don't expire and are ideal for server-side apps.

1. Go to [business.facebook.com](https://business.facebook.com) → **Settings** → **Users** → **System Users**.
2. Click **Add** → name it (e.g., "Ad Uploader Bot") → Role: **Admin**.
3. Click **Generate New Token** next to your system user.
4. Select your app from the dropdown.
5. Enable these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `pages_show_list`
6. Click **Generate Token** and **copy it** — you won't see it again.

> Store this token securely. It grants full access to your ad account.

---

## Step 5 — Add a Privacy Policy URL

Meta requires a privacy policy before you can go live.

1. Go to **App Settings → Basic**.
2. In the **Privacy Policy URL** field, paste a URL. A Google Doc set to public works fine:
   - Create a Google Doc → Share → Anyone with link can view → Copy link.
3. Click **Save Changes**.

---

## Step 6 — PUBLISH THE APP (Critical!)

> **This is the #1 mistake people make. Development mode CANNOT create real ads.**

1. In your app dashboard, look for the **Live/Development** toggle at the top.
2. Switch it to **Live**.
3. Meta may ask you to confirm your privacy policy URL — confirm it.
4. Your app is now live and can create ads.

If you skip this step, all API calls will return permission errors.

---

## Step 7 — Paste Your Token in the App

1. Open the Meta Ads Bulk Uploader.
2. Go to **Settings**.
3. Paste your System User token.
4. Click **Fetch Accounts** to load your ad accounts and pages.
5. Select your ad account and Facebook page.
6. Click **Save Settings**.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `#200 - Permission error` | App is in Development mode | Switch app to Live mode |
| `Invalid OAuth access token` | Wrong or expired token | Generate a new System User token |
| `No ad accounts found` | Token missing `ads_read` permission | Regenerate token with correct permissions |
| `No pages found` | Token missing `pages_show_list` | Regenerate token with correct permissions |

---

## Permissions Summary

| Permission | Purpose |
|---|---|
| `ads_management` | Create and manage ads |
| `ads_read` | Read ad account data |
| `business_management` | Access Business Manager |
| `pages_show_list` | List Facebook pages |
