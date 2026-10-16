# Pricing notes

Starting prices set on 2026-10-16 so the pages stop saying "on request". They are working numbers, not final.
Change them here first, then in every place listed. EN and AR live in the same `data-en` / `data-ar` pair; the build regenerates `/ar/`.

| What | Value now | Where it lives |
|---|---|---|
| Vitals GO, Starter (1–5 active clients) | EGP 1,500 / month | `go.html` plans (`.go-plan__price`), GO FAQ answer + JSON-LD offers in `go.html` |
| Vitals GO, Studio (6–15 active clients) | EGP 4,500 / month | same |
| Vitals GO, Agency (16–40 active clients) | EGP 9,500 / month | same (the app itself only says "you pay by active clients" in `apps/hq/src/pages/Team.tsx`) |
| Vitals Crew platform fee | 20% of the job | `crew.html`, `products.html`, `terms.html`, `apps/crew/src/lib/store.ts` (`FEE = 0.2`) |
| Vitals Web packages | from EGP 25,000 / 60,000 / 90,000 | `WEB_PACKAGES` in `assets/js/main.js` and the static cards inside `[data-web-packages]` in `web.html` (keep both in step) |
| Vitals Frames plans | from EGP 30,000 / 60,000 / 110,000 per month | price row of the plans table in `frames.html` |
| Smallest budget in the brief forms | 30,000 EGP / month | budget `<select>` in `index.html` and `contact.html` (smaller budgets are pointed to the Web packages) |
| Vitals Stage budgets (SAR) | Under 50,000 · 50,000–150,000 · 150,000–400,000 · 400,000+ | hidden `select[data-cur-options]` in `stage.html` |
| Vitals Forecast benchmarks | `null` until we have real numbers | `assets/data/forecast-benchmarks.json` (see `assets/data/README.md`) |

Rule: never publish a result, client count or benchmark that we can't back with a real record.
