# Brand Vitals · website + Vitals GO

Two products in one repo, deployed together on Vercel:

| Path | What it is | Tech |
|---|---|---|
| `/` and `/ar/` | **brandvitals.io**: the agency website and its six sub-brands (Frames, Web, Stage, GO, Crew, Jobs), in English and Arabic | Static HTML/CSS/JS, edited from `/dashboard.html` |
| `/app/` | **Vitals GO**: client operations platform for agencies. Approvals with pin comments, client portal, team + client chat, content calendar, extra-work billing, reminders, integrations (email, WhatsApp, Slack, Teams, SMS, webhooks, Figma/Drive/video previews) | React + TypeScript (Vite), Supabase |
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
apps/hq/                  Vitals GO app (React), served at /app
apps/crew/                Vitals Crew app (React), served at /crew; reuses the GO design system
apps/jobs/             Vitals Jobs app (React), served at /recruit; reuses the GO design system
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
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vitals GO runs on a real database with accounts (without them HQ runs in demo mode inside the browser) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Vitals GO sends branded emails to clients (resend.com, free tier). Without it, email opens the sender's mail app |
| `PSI_API_KEY` | Speed and SEO scores in the Vitals Score tool (free key from Google Cloud: enable "PageSpeed Insights API") |

3. Redeploy after adding variables. Every push to `main` deploys automatically.
4. **Domain**: Settings → Domains → add `brandvitals.io`.

## Vitals GO: going live with Supabase

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

## Vitals GO: native integrations

All of these run on the server (`api/`), need the app to be live with Supabase, and are switched on by environment variables in Vercel. Tokens and API keys are encrypted (AES-256-GCM) and stored in `connection_secrets`, a table no app user can read.

**Base setup (once)**
1. Run the 4th migration: `supabase/migrations/20261014…_integrations_billing.sql`.
2. In Vercel add `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENC_KEY` (long random string), `APP_URL` (your domain), `SYNC_SECRET`, `CRON_SECRET`.
3. In the Supabase SQL editor, tell the database where to send sync events:
   ```sql
   insert into public.app_config values ('sync_url', 'https://brandvitals.io/api/sync'), ('sync_secret', '<same as SYNC_SECRET>')
   on conflict (key) do update set value = excluded.value;
   ```

| Integration | What it does | Set up |
|---|---|---|
| ClickUp | Task per deliverable in the project's list; client decisions as comments | ClickUp → Settings → Apps → Create app. Redirect: `https://<domain>/api/connect?action=callback&provider=clickup`. Add `CLICKUP_CLIENT_ID/SECRET`. Then in a project: ⋯ → Sync to ClickUp / Asana |
| Asana | Same for Asana; task completed on approval | developers.asana.com → My apps → Create. Same redirect with `provider=asana`. `ASANA_CLIENT_ID/SECRET` |
| Meta | Ad results next to the approved creative; auto-publish approved posts to Pages / Instagram on their publish date | developers.facebook.com → Create app (Business). Add Facebook Login; redirect with `provider=meta`. Permissions need App Review for other businesses: `ads_read`, `pages_manage_posts`, `instagram_content_publish`, … `META_APP_ID/SECRET` |
| Google Ads | Ad results (spend, clicks, conversions, ROAS) | Google Cloud OAuth client (web) with redirect `provider=google_ads`, plus a Google Ads API developer token. `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN` |
| Paymob · Tap · Stripe | Payment links for invoices; paid status from their webhooks | Each agency pastes its own keys in Integrations → Connected apps, and adds the webhook URL shown there in the provider's dashboard |
| AI | Summarize a conversation, draft a reply (Claude `claude-opus-5-5`, with server-side fallback if a request is declined) | `ANTHROPIC_API_KEY` |
| Voice notes → text | Transcribes Arabic and English voice notes | `ELEVENLABS_API_KEY` |

Publishing runs once a day (Vercel Cron, `vercel.json`); for hourly publishing upgrade the Vercel plan and change the schedule.

Tests: `npm run test:api` (server functions, no network) and `npm run test:db` (53 database checks).

## Vitals Crew: vetted talent marketplace

`apps/crew` is the Vitals Crew platform at `/crew/`, and `crew.html` is its public page. Three sides share one marketplace:

- **Clients** post a brief, receive a shortlist of three with the reviewer's reason for each, hire into escrow, and approve deliveries that already passed QA.
- **Talent** (freelancers or teams) sees reviewed briefs, sends proposals that go to the review team first, delivers, and is paid on approval.
- **The review team** vets applicants in four gates (portfolio, paid test, interview, then QA on every delivery), approves briefs, screens proposals into shortlists, and checks each delivery against a five-point checklist. The Brand Vitals in-house team can bid and is reviewed the same way.

Today it runs in demo mode: one shared store in the browser (`apps/crew/src/lib/store.ts`), with a switcher to view it as a client, a freelancer or a reviewer. Going live needs a Supabase schema for talents, applications, briefs, proposals and deliveries with row-level security per side, plus escrow through a payment provider (Paymob or Stripe Connect style payouts).

```bash
npm run dev:crew   # Vite dev server for the Crew app on :5174
```

## Vitals Jobs: creative and marketing jobs

`apps/recruit` is the Vitals Jobs hiring platform at `/jobs/`, and `jobs.html` is its public page. It works like a job board (formal profiles, apply in one step, no feed), with one step in the middle:

- **Candidates** build one profile (experience, education, skills, CV), apply with it, and follow each application through Applied, Screened by Brand Vitals, With the company, Interview and Offer. Everyone hears back within 48 hours; a "not a match" comes with the screener's reason.
- **Companies** post a job (salary range required) and only ever see applicants who passed screening, each with a fit score out of five and a note. They move people to interview, offer, hired or not selected.
- **Brand Vitals screening** reads every application first, scores the fit, and either sends it to the company or tells the candidate why not.

Demo mode only, like Crew: one shared store in the browser (`apps/jobs/src/store.ts`) with a "viewing as" switcher. Going live needs Supabase tables for companies, jobs, candidates and applications with row-level security that hides unscreened applications from companies.

```bash
npm run dev:recruit   # Vite dev server for the Vitals Jobs app (apps/recruit) on :5175
```

## Preview on GitHub Pages

The source repo stays private. `npm run deploy:pages` builds the site and pushes only the build output to the public repo `brandvitals-ui-ux-team.github.io`, live at https://brandvitals-ui-ux-team.github.io/. GitHub Pages is static, so server functions (`/api/*`) are not available there and both apps run in demo mode; use Vercel for production.
