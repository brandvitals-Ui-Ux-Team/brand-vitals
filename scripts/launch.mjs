// Which sub-brands are open to visitors. The switches live in cms/config.json under "launch" and are
// flipped from the dashboard (Settings → Pages on the site). Anything not switched on stays closed.
//
// A closed brand, on every built page (English, Arabic, Saudi):
//   - every link or button to its page or app is greyed out and can't be clicked or focused,
//     with a "Coming soon" tag where the link doesn't already say so;
//   - its page shows a "Coming soon" screen (noindex, left out of the sitemap);
//   - its app (/app, /crew, /jobs) sends visitors to that screen.
// An open brand loses its "Coming soon" badges in the menus and cards.
// Called by build-site.mjs. Opening an app again needs the full `npm run build` (it rebuilds the apps).
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { GROUPS } from "./eco-data.mjs";
import { esc, head, pageShell } from "./lib/chrome.mjs";

const APPS = { go: "app", crew: "crew", jobs: "jobs" };
const BRANDS = Object.fromEntries(GROUPS.flatMap(g => g.brands).map(b => [b.key, b]));
// Open unless the config says otherwise: only the brands live today. Everything else starts closed.
export const DEFAULT_LAUNCH = { frames: true, web: true, stage: false, go: false, crew: false, jobs: false };

export function launchState(root) {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(path.join(root, "cms", "config.json"), "utf8")).launch || {}; } catch { /* no config yet */ }
  const open = {};
  for (const k of Object.keys(DEFAULT_LAUNCH)) open[k] = typeof saved[k] === "boolean" ? saved[k] : DEFAULT_LAUNCH[k];
  const closedByPage = new Map(Object.entries(open).filter(([, v]) => !v).map(([k]) => [BRANDS[k].href, k]));
  const openByPage = new Map(Object.entries(open).filter(([, v]) => v).map(([k]) => [BRANDS[k].href, k]));
  const closedApps = new Map(Object.entries(APPS).filter(([k]) => !open[k]).map(([k, dir]) => [dir, k]));
  return { open, closedByPage, openByPage, closedApps, closedPage: file => closedByPage.get(file) || null };
}

// "../ar/go.html#faq", "/go.html", "https://brandvitals.io/sa/stage.html", "/app/", "/crew/join" → brand key or null
function target(href, map, apps) {
  const p = href.replace(/^https?:\/\/(www\.)?brandvitals\.io/i, "").split(/[?#]/)[0];
  if (/^[a-z]+:/i.test(p)) return { key: null };
  const app = p.match(/^\/(app|crew|jobs)(\/|$)/);
  if (app) return { key: apps.get(app[1]) || null };
  const file = p.replace(/^(\.\.\/)+/, "").replace(/^\//, "").replace(/^(ar|sa)\//, "");
  return { key: map.get(file) || null };
}

const SOON = { en: "Coming soon", ar: "قريبًا" };
const isSoonText = s => /coming soon|قريبًا|قريبا/i.test(s);

/** Greys out links to closed brands and drops "Coming soon" badges from open ones. lang: "en" | "ar". */
export function gateHtml(html, L, lang) {
  const $ = cheerio.load(html);
  $("a[href]").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href");
    const closed = target(href, L.closedByPage, L.closedApps).key;
    if (closed) {
      $a.removeAttr("href").removeAttr("target").removeAttr("rel").removeAttr("data-magnetic").removeAttr("data-tilt").removeAttr("data-consult");
      $a.attr({ role: "link", "aria-disabled": "true", "data-soon": closed, title: SOON[lang] }).addClass("is-soon");
      if (!isSoonText($a.text())) $a.append(`<em class="soon-tag">${SOON[lang]}</em>`);
      return;
    }
    if (target(href, L.openByPage, new Map()).key) $a.find(".eco-badge").filter((_, b) => isSoonText($(b).text())).remove();
  });
  return $.html();
}

/** Bilingual source for a closed brand's page; build-site translates it like any other page. */
export function soonSource(key, file) {
  const b = BRANDS[key];
  const [dEn, dAr] = b.d;
  const main = `    <section class="soon-page grid-field">
      <div class="orb orb--a float-slow" aria-hidden="true" style="top:8%; inset-inline-end:6%;"></div>
      <div class="container soon-page__in">
        <img class="soon-page__mark" src="${b.mark}" alt="" width="72" height="72">
        <p class="soon-page__brand">${esc(b.name)}</p>
        <p class="soon-chip"><span class="soon-chip__dot" aria-hidden="true"></span><span data-en="Coming soon" data-ar="قريبًا">Coming soon</span></p>
        <h1 class="soon-page__t" data-en="${esc(dEn)}." data-ar="${esc(dAr)}.">${esc(dEn)}.</h1>
        <p class="lead" data-en="${esc(b.name)} isn't open yet. When it launches, it will be announced here first." data-ar="${esc(b.name)} لسه ما اتفتحش. أول ما يبدأ هنعلن عنه هنا.">${esc(b.name)} isn't open yet. When it launches, it will be announced here first.</p>
        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="index.html"><span data-en="Back to Brand Vitals" data-ar="ارجع لـ Brand Vitals">Back to Brand Vitals</span></a>
          <a class="btn btn--ghost btn--lg" href="contact.html"><span data-en="Talk to us" data-ar="كلّمنا">Talk to us</span></a>
        </div>
      </div>
    </section>`;
  const h = head({
    file, titleEn: `${b.name} · Coming soon | Brand Vitals`, titleAr: `${b.name} · قريبًا | Brand Vitals`,
    descEn: `${b.name} by Brand Vitals: ${dEn}. Coming soon.`, descAr: `${b.name} من Brand Vitals: ${dAr}. قريبًا.`
  }).replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/, "");
  return pageShell({ head: h, main });
}

/** Saudi twin of a closed page: no Saudi content, just the Arabic "Coming soon" screen. */
export const saRedirect = file => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=../ar/${file}"><link rel="canonical" href="https://brandvitals.io/ar/${file}"><title>قريبًا | Brand Vitals</title></head>
<body><a href="../ar/${file}">قريبًا</a></body></html>
`;

/** Closed apps send every route to the brand's "Coming soon" page, in the visitor's language. */
export function gateApps(OUT, L) {
  for (const [dir, key] of L.closedApps) {
    const f = path.join(OUT, dir, "index.html");
    if (!fs.existsSync(path.dirname(f))) continue;
    const page = BRANDS[key].href;
    fs.writeFileSync(f, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${esc(BRANDS[key].name)} · Coming soon</title><link rel="canonical" href="https://brandvitals.io/${page}">
<script>(function(){var l="";try{l=localStorage.getItem("oso-lang")||"";}catch(e){}location.replace((l==="ar"?"/ar/":"/")+"${page}");})();</script>
<noscript><meta http-equiv="refresh" content="0; url=/${page}"></noscript></head>
<body><a href="/${page}">${esc(BRANDS[key].name)}: coming soon</a></body></html>
`);
  }
}
