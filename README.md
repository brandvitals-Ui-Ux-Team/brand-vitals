# Brand Vitals · website + Vitals Approve

Two products in one repo, deployed together on Vercel:

| Path | What it is | Tech |
|---|---|---|
| `/` and `/ar/` | **brandvitals.io**: the agency website and its four sub-brands (Studio, Web, Live, HQ), in English and Arabic | Static HTML/CSS/JS, edited from `/dashboard.html` |
| `/app/` | **Vitals Approve**: client operations platform for agencies. Approvals with pin comments, client portal, team + client chat, content calendar, extra-work billing, reminders, integrations (email, WhatsApp, Slack, Teams, SMS, webhooks, Figma/Drive/video previews) | React + TypeScript (Vite), Supabase |
| `/api/*` | Serverless functions for the free **Vitals Score** tool | Node (Vercel Functions) |

## Quick start (local)

```bash
npm install
npm run build        # builds HQ into dist/app and the site into dist/
node server.js       # http://localhost:8944  (site, /app and /api like production)
```

`npm run dev:hq` runs the HQ app alone with hot reload on http://localhost:5173/app/.

## Repo layout

```
*.html                    site pages (source of truth, edited by the dashboard)
assets/css, assets/js     site styles and scripts (main.js = i18n, forms, analytics)
assets/js/dashboard.js    the CMS at /dashboard.html (edits pages, commits to GitHub)
assets/js/vitals-score.js the free Vitals Score tool
api/inspect.js            reads a site's HTML: SEO, Arabic readiness, tracking pixels (SSRF-guarded)
api/psi.js                Google PageSpeed Insights proxy (keeps the API key server-side)
apps/hq/                  Vitals Approve app (React)
supabase/migrations/      HQ database schema with row-level security
supabase/tests/           runs the schema on real Postgres (PGlite) and tests RLS + client flows
scripts/build-site.mjs    builds dist/: copies the site and generates Arabic pages under /ar/
scripts/gen-pages.mjs     one-off generator for service/industry/case/article pages
scripts/check-site.mjs    QA: broken links, titles, descriptions, hreflang, Arabic twins
```

## How the bilingual site works

Every page is written once with `data-en` / `data-ar` attributes. The build creates a real Arabic copy of each page at `/ar/<page>.html` (`lang="ar" dir="rtl"`, Arabic title and description), adds `hreflang` links between the two, and writes a sitemap with both languages. The language button moves between the two URLs, so Google indexes Arabic and English separately.

## Deploy (Vercel)

1. vercel.com → **Add New → Project** → import this GitHub repo. Settings are read from `vercel.json`, so you don't need to change anything.
2. **Settings → Environment Variables** (optional, enables more features):

| Variable | What it enables |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vitals Approve runs on a real database with accounts (without them HQ runs in demo mode inside the browser) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Vitals Approve sends branded emails to clients (resend.com, free tier). Without it, email opens the sender's mail app |
| `PSI_API_KEY` | Speed and SEO scores in the Vitals Score tool (free key from Google Cloud: enable "PageSpeed Insights API") |

3. Redeploy after adding variables. Every push to `main` deploys automatically.
4. **Domain**: Settings → Domains → add `brandvitals.io`.

## Vitals Approve: going live with Supabase

1. Create a free project at supabase.com.
2. SQL Editor → run the files in `supabase/migrations/` in order (`20261011…_vitals_hq.sql`, `20261012…_approve_v2.sql`, `20261013…_channels_chat_integrations.sql`). All are safe to re-run. On Supabase the last one also turns on live chat updates and database-delivered webhooks (pg_net).
3. Authentication → URL Configuration → set Site URL to `https://brandvitals.io/app/`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API) to Vercel and redeploy.

Never use the `service_role` key in the app. The anon key is safe: every table is protected by row-level security, and clients only reach their own review page through an unguessable token. `npm run test:db` proves this on a real Postgres engine.

The website's lead forms and visitor stats use the same Supabase project. Connect them from the dashboard: Settings → Database.

## The dashboard (CMS)

`/dashboard.html` edits the site in the browser and publishes to this repo in one commit (Vercel redeploys automatically).

- Enter the access code (it only locks the screen; change it in Settings).
- Settings → Connection: paste a GitHub fine-grained token with **Contents: read and write** on this repo.
- Settings → Tracking & ads: paste GA4 / GTM / Meta Pixel / Clarity IDs and publish. The site then loads them with a consent banner (Google Consent Mode v2) and sends `generate_lead` / `Lead` and WhatsApp-contact events.

> `npm run gen:pages` regenerates the service, industry, case and article pages from `scripts/content/*` and overwrites edits made to those pages in the dashboard. Use it only to add new generated pages.

## Tests

```bash
npm run check      # site QA on dist/
npm run test:db    # HQ schema + RLS + client review/change-order flows on Postgres
npm test           # build + both
```

## Before launch

- Case study narratives (`case-*.html`) are written from the one-line summaries on the Work page. Have the account team review them and add client names where permitted.
- `150+ brands` on the home page is the agency's own claim; keep it accurate.
- The demo workspace in HQ uses fictional sample clients.
