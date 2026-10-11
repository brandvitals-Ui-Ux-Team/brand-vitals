# Brand Vitals ecosystem: sitemap and page wireframes

Branded house. Brand Vitals is the master brand; four sub-brands are endorsed by it
("A Brand Vitals company" / "إحدى شركات Brand Vitals"). Every page keeps the shared
header, mobile drawer and footer (master theme). Each sub-brand page sets
`<body data-brand="…">`, and its theme applies to `<main>` only.

All copy is bilingual through the existing `data-en` / `data-ar` mechanism. No invented
clients, metrics, testimonials or prices. Prices always read "Tailored quote".

## Shared changes (all pages)

| Where | Change |
| --- | --- |
| Header nav | New "Ecosystem / الكيانات" item with a dropdown of five entries (symbol + name + one-line descriptor). Vitals HQ carries an "Early access" badge. Keyboard: Enter/Space/ArrowDown opens, arrows move, Esc closes and returns focus, Tab leaves. |
| Mobile drawer | "Ecosystem" becomes an accordion listing the same five entries. |
| Footer | New "Ecosystem" column linking all five. |
| Home | New section "One ecosystem, one growth system" with a card per sub-brand in its accent color. |
| Dashboard (CMS) | The four pages are registered so they can be edited and published like the rest. |

## Dropdown entries

1. Brand Vitals · Growth agency → `index.html`
2. Vitals Studio · Production studio → `studio.html`
3. Vitals Web · Websites, launched fast → `web.html`
4. Vitals Live · Brand experiences and events → `live.html`
5. Vitals HQ · Agency and client platform (badge: Early access) → `hq.html`

## Home: new section (between "Who we work with" and FAQ)

**08 · One ecosystem, one growth system / منظومة واحدة، نظام نمو واحد**
Purpose: show the umbrella. Each unit is a specialist; together they cover the full
journey from strategy to production to launch to results.
Content: section head + four cards (symbol, name, descriptor, two-line pitch, "Explore"),
each in its sub-brand accent, plus a journey strip: Strategy (Brand Vitals) → Production
(Studio) → Launch (Web / Live) → Results (Brand Vitals, tracked in HQ).

---

## studio.html · Vitals Studio (cinematic, warm)

Theme: bg #0B0A09, surface #161311, text #F4EDE4, muted #A39A8F, accent tungsten #FF8A3D.
Motif: frame corner marks, timecode labels, REC dot, letterbox bars between sections, grain.

1. **Hero.** Logo + endorsement. Timecode label, REC dot. "Content made to perform." Sub
   copy. CTAs: "Book a production call" (→ form) / "See the work" (→ selected work).
   A framed "viewfinder" panel with corner marks and a running timecode.
2. **What we produce.** Five cards: Ad creatives and UGC-style content; Brand films and
   campaign shoots; Product and e-commerce photography; Motion and animation; Monthly
   social content systems. Each with a one-line outcome.
3. **Who it's for.** Three columns: brands without a production team; in-house teams that
   need output at volume; agencies that need a reliable production partner.
4. **How it works.** Timecode timeline: Brief → Pre-production → Shoot → Edit and versions
   → Delivered in every format and ratio.
5. **Monthly production plans.** Starter / Growth / Scale, defined by deliverables per
   month, turnaround and revisions. Price: "Tailored quote".
6. **The edge.** "Creative informed by performance data": briefs and iterations use real
   campaign results from Brand Vitals.
7. **Selected work.** One real project: Luxury real estate (Saudi Arabia), which included
   film production. Links to the Work page entry.
8. **FAQ.** Turnaround, usage rights, revisions, locations and crew, raw files.
9. **Final CTA + form.** Production call request (name, phone, email, company, what you
   need, monthly volume, notes). Submits through the site form mechanism; until the
   database is connected it hands off to WhatsApp with "Hi Vitals Studio, …".

## web.html · Vitals Web (precise, technical)

Theme: bg #070B14, surface #0F1626, text #EAF0FF, muted #8C9AB8, accent #4D7CFF,
mint #3DDBB0 for live/launched states.
Motif: blueprint grid, browser-chrome frames, code brackets, week ruler.

1. **Hero.** Logo + endorsement. "Websites that launch in weeks, not months." Sub copy.
   CTAs: "Pick a package" (→ packages) / "Talk to us" (WhatsApp). A browser-chrome frame
   showing a page "building" with a "Launched" mint status.
2. **Packages.** Launch / Business / Commerce, rendered from one JS object
   (`WEB_PACKAGES` in main.js): included items, delivery in weeks, revision rounds,
   "Tailored quote", "Choose this package" (prefills the form).
3. **Included in every site.** Mobile-first; Arabic RTL + English; SEO foundations;
   analytics and conversion tracking; fast loading; editable content; launch support.
4. **Process.** Week ruler: Kickoff → Structure and content → Design → Build → Review →
   Launch.
5. **Need something custom?** Custom platforms go to Brand Vitals' Web and Experience team
   (→ Services).
6. **FAQ.** Hosting, domain, who owns the site, edits after launch, timeline delays.
7. **Final CTA + form.** Package, name, phone, email, company, current site, notes.

## live.html · Vitals Live (atmospheric, stage)

Theme: bg #0A0710, surface #150F1E, text #F5F0FF, muted #A396B8, accent violet #B266FF,
spotlight warm #FFD27A.
Motif: spotlight cones and beams (CSS), stage-floor perspective lines, slow ambient light
(off for reduced motion). No event photos, no portfolio.

1. **Hero.** Logo + endorsement. "Brand moments people remember." Sub copy. CTAs: "Tell us
   about your event" (→ form) / "How we work" (→ the loop). Stage with two spotlight beams.
2. **What we create.** Launch events; Activations and pop-ups; Corporate and conferences;
   Exhibition booths.
3. **The full loop.** Concept → Creative and design → Partner production → Live day →
   Content captured by Vitals Studio → Amplified by Brand Vitals. Message: most event
   companies stop when the lights go off.
4. **What you get.** Concept deck; visual identity for the event; spatial and booth design
   direction; content plan; post-event campaign.
5. **FAQ.** Budget ranges handled, lead time, cities and countries, who executes.
6. **Final CTA + event brief form.** Name, phone, email, company, event type, city, date,
   guests, budget, idea.

## hq.html · Vitals HQ (product, clean, light-first)

Theme (light default): bg #F6F7F5, surface #FFFFFF, text #0E1512, muted #5E6B66, accent
signal green derived from the master teal. Dark variant uses the master dark background.
Motif: product UI cards, status pills (Approved / Changes requested / Out of scope),
check marks, a thin pulse line. Status: Early access.

1. **Hero.** Logo + endorsement + "Early access" pill. "Where agency work gets approved,
   not just assigned." Sub copy. CTAs: "Join early access" (→ form) / "See how it works"
   (→ features). Product UI card with approval pills.
2. **The problem.** Five scattered tool cards (project tool, WhatsApp, email,
   spreadsheets, reporting dashboard) that collapse into one card on scroll.
3. **Four core features**, each with an HTML/CSS UI illustration and fictional data:
   Approval Ledger; Scope Guard; WhatsApp-native client loop; Results next to the work.
4. **Built for this region.** AR/EN side-by-side approvals; Ramadan, Eid and national-day
   aware calendar (Egypt and GCC); EGP and SAR invoicing with local gateways.
5. **Works with your current tools.** A layer on top, not a forced migration.
6. **Pricing model.** Per client workspace; unlimited client guests free. "Add every
   client. Never pay for a seat they barely use."
7. **Approach comparison.** "General project tools" vs "Vitals HQ" across eight rows.
   No competitor names.
8. **Early access form.** Agency name, team size, active clients, tools used today,
   email, WhatsApp.
9. **FAQ.** Launch timing, data privacy, migration, pricing.

## SEO per page

Unique `<title>` and `data-title-en/ar`, meta description, canonical, OG and Twitter
tags, favicon set from the sub-brand symbol, Organization `parentOrganization` schema
pointing to Brand Vitals. Added to `sitemap.xml`.
