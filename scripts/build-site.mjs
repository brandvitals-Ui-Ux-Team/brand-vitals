// Builds the deployable site into dist/.
//  - Copies the static site as-is (the CMS keeps editing the source files).
//  - Generates a real Arabic version of every page under /ar/ from the
//    data-ar attributes, so Arabic content is indexable on its own URLs.
//  - Adds canonical + hreflang alternates and regenerates sitemap.xml.
// Usage: node scripts/build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { buildSa, alternates, SA_FILES } from "./build-sa.mjs";
import { launchState, gateHtml, soonSource, saRedirect, gateApps } from "./launch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");
const SITE = "https://brandvitals.io";

// Pages that exist in English only (tools and system pages).
const NO_AR = new Set(["dashboard.html", "404.html"]);
// Files and folders that never ship.
const SKIP = new Set(["node_modules", "dist", "apps", "scripts", "supabase", "api", ".git", ".github", ".vercel", ".impeccable",
  "package.json", "package-lock.json", "server.js", "README.md", "SITEMAP.md", "PRICING-NOTES.md", "tests", "vercel.json", ".gitignore", "docs", ".env.example", ".gitattributes"]);

const pageUrl = (file, lang) => {
  const name = file === "index.html" ? "" : file;
  return SITE + (lang === "ar" ? "/ar/" : "/") + name;
};

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (src === ROOT && SKIP.has(entry.name)) continue;
    const s = path.join(src, entry.name), d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Replaces whatever a previous build injected (keeps builds idempotent even if
// a built page ever gets committed back through the CMS).
const stripBuildBlocks = $ => $("[data-build]").remove();

function addAlternates($, file, lang) {
  stripBuildBlocks($);
  const head = $("head");
  const robots = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  const indexable = !robots.includes("noindex");
  $('link[rel="canonical"]').attr("href", pageUrl(file, lang));
  $('meta[property="og:url"]').attr("content", pageUrl(file, lang));
  if (!indexable || NO_AR.has(file)) return;
  // en, ar (generic Arabic = the Egyptian /ar/ site), ar-EG, ar-SA where a Saudi page exists, x-default
  for (const [l, h] of alternates(file)) head.append(`\n  <link rel="alternate" hreflang="${l}" href="${h}" data-build>`);
  head.append("\n");
}

const LOCAL_ASSET = /^(assets|cms)\//;
const toParent = v => (LOCAL_ASSET.test(v) ? "../" + v : v);


// Arabic for aria-label and alt text. A page can also set data-ar-label / data-ar-alt on the element itself.
const AR_A11Y = {
  "Toggle color theme": "تبديل المظهر", "Switch language": "تغيير اللغة", "Primary": "القائمة الرئيسية", "Open menu": "فتح القائمة", "Mobile": "قائمة الجوال",
  "Back to top": "العودة للأعلى", "Breadcrumb": "مسار التنقل", "Screens": "الشاشات", "Projects": "المشاريع", "Platforms we run": "المنصات التي نديرها",
  "Filter case studies": "تصفية دراسات الحالة", "Filter articles by market": "تصفية المقالات حسب السوق",
  "Clothing e-commerce store": "متجر ملابس إلكتروني", "Digital menu design": "تصميم منيو رقمي", "Fresh Valley website redesign": "إعادة تصميم موقع Fresh Valley",
  "Frosty Foods website redesign": "إعادة تصميم موقع Frosty Foods", "meats.com.sa website redesign": "إعادة تصميم موقع meats.com.sa",
  "Mohamed Ahmed": "محمد أحمد", "Mohamed Tarek": "محمد طارق",
  "Extra work: anything outside the agreement, priced and approved": "الشغل الإضافي: أي حاجة برا الاتفاق، بسعرها وبموافقة العميل",
  "Send for approval: pick the client, name the work, drop the file": "ابعت للموافقة: اختار العميل، سمّي الشغل، ونزّل الملف",
  "The Vitals GO dashboard: every deliverable with its light, time to green and extra work earned": "لوحة Vitals GO: كل تسليمة بلونها، والوقت لحد الأخضر، والشغل الإضافي",
  "The client's review page with a big GO button": "صفحة مراجعة العميل بزرار GO كبير",
  "Vitals GO, extra work screen": "Vitals GO، شاشة الشغل الإضافي", "Vitals GO, invoices screen": "Vitals GO، شاشة الفواتير", "Vitals GO, review screen": "Vitals GO، شاشة المراجعة"
};
const SUFFIX = [[", desktop, scroll to see the full page", "، نسخة الكمبيوتر، مرّر لرؤية الصفحة كاملة"], [", mobile, scroll to see the full page", "، نسخة الموبايل، مرّر لرؤية الصفحة كاملة"], [", desktop", "، نسخة الكمبيوتر"], [", mobile", "، نسخة الموبايل"], [", Home", "، الرئيسية"]];
function arA11y(v) {
  if (AR_A11Y[v]) return AR_A11Y[v];
  for (const [en, ar] of SUFFIX) if (v.endsWith(en)) { const base = v.slice(0, -en.length); return (AR_A11Y[base] || base) + ar; }
  return null;
}

function toArabic(html, file) {
  const $ = cheerio.load(html);
  const root = $("html");
  root.attr("lang", "ar").attr("dir", "rtl");
  const titleAr = root.attr("data-title-ar");
  if (titleAr) $("title").text(titleAr);

  // Text and attribute translations (mirrors I18n.apply in main.js).
  $("[data-en]").each((_, el) => {
    const $el = $(el);
    const ar = $el.attr("data-ar");
    if (ar == null) return;
    const attr = $el.attr("data-i18n-attr");
    if (attr) $el.attr(attr, ar);
    else $el.text(ar);
  });
  $("[data-en-ph]").each((_, el) => {
    const $el = $(el);
    $el.attr("placeholder", $el.attr("data-ar-ph") || "");
  });
  $("[aria-label]").each((_, el) => { const $el = $(el); const ar = $el.attr("data-ar-label") || arA11y($el.attr("aria-label")); if (ar) $el.attr("aria-label", ar); });
  $("img[alt]").each((_, el) => { const $el = $(el); const ar = $el.attr("data-ar-alt") || arA11y($el.attr("alt")); if (ar) $el.attr("alt", ar); });
  // Meta tags carry their Arabic copy in data-ar.
  $("meta[data-ar]").each((_, el) => { $(el).attr("content", $(el).attr("data-ar")); });
  $('meta[property="og:locale"]').attr("content", "ar_EG");
  $('meta[property="og:locale:alternate"]').attr("content", "en_US");
  $("[data-lang-toggle]").text("EN").attr("aria-label", "Switch to English");

  // Pages live one folder down: point local assets at the parent folder.
  $("[src],[href],[srcset],[poster],[data-src]").each((_, el) => {
    const $el = $(el);
    for (const a of ["src", "href", "poster", "data-src"]) {
      const v = $el.attr(a);
      if (!v) continue;
      if (a === "href" && NO_AR.has(v.split(/[?#]/)[0])) { $el.attr(a, "../" + v); continue; }
      $el.attr(a, toParent(v));
    }
    const ss = $el.attr("srcset");
    if (ss) $el.attr("srcset", ss.split(",").map(s => toParent(s.trim())).join(", "));
  });
  $("[style*='url(']").each((_, el) => {
    const $el = $(el);
    $el.attr("style", $el.attr("style").replace(/url\((['"]?)(assets\/)/g, "url($1../$2"));
  });
  $('[data-only="en"]').remove();
  // Inline JSON-LD: Arabic language, Arabic FAQ, this version's URL.
  addAlternates($, file, "ar");
  localizeLd($, file, "ar");
  return $.html();
}

function toEnglish(html, file) {
  const $ = cheerio.load(html);
  $('[data-only="ar"]').remove();
  addAlternates($, file, "en");
  localizeLd($, file, "en");
  return $.html();
}

// JSON-LD follows the page's language: inLanguage is the page's own, the page's URLs point at this
// version, and the FAQPage questions mirror the FAQ that is visible on this version.
function localizeLd($, file, lang) {
  const base = "https://brandvitals.io/";
  const own = base + (file === "index.html" ? "" : file);
  const here = lang === "en" ? own : base + "ar/" + (file === "index.html" ? "" : file);
  const faq = $(".acc .acc-item").map((_, el) => ({ q: $(el).find(".acc-item__btn > span").first().text().trim(), a: $(el).find(".acc-item__panel p").first().text().trim() })).get().filter(x => x.q && x.a);
  $('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try { data = JSON.parse($(el).html()); } catch { return; }
    const walk = n => {
      if (Array.isArray(n)) return n.forEach(walk);
      if (!n || typeof n !== "object") return;
      if ("inLanguage" in n) n.inLanguage = lang;
      if (n["@type"] === "FAQPage" && faq.length) n.mainEntity = faq.map(x => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } }));
      if (lang !== "en" && (n["@type"] === "WebPage" || n["@type"] === "Article" || n["@type"] === "BlogPosting")) {
        for (const k of ["url", "@id"]) if (typeof n[k] === "string" && n[k].startsWith(own)) n[k] = here + n[k].slice(own.length);
        if (n["@type"] === "WebPage") n.name = $("title").text();
      }
      Object.values(n).forEach(walk);
    };
    walk(data);
    $(el).text("\n" + JSON.stringify(data, null, 2) + "\n  ");
  });
}

function sitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [];
  for (const file of pages) {
    const pri = file === "index.html" ? "1.0" : /^(solutions|work|contact|vitals-score|hq)\.html$/.test(file) ? "0.9" : file === "privacy.html" ? "0.3" : "0.7";
    const alt = alternates(file).map(([l, h]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join("\n");
    const locs = [[pageUrl(file, "en"), pri], [pageUrl(file, "ar"), (pri * 0.9).toFixed(1)]];
    if (SA_FILES.has(file) && !LAUNCH.closedPage(file)) locs.push([SITE + "/sa/" + (file === "index.html" ? "" : file), (pri * 0.9).toFixed(1)]);
    for (const [loc, p] of locs) rows.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p}</priority>
${alt}
  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.join("\n")}
</urlset>
`;
}

// ---------------------------------------------------------------------------
// The apps (Vitals GO in dist/app, Vitals Crew in dist/crew, Vitals Hire in dist/recruit) are built first; keep them.
const APP_DIRS = new Set(["app", "crew", "jobs"]);
if (fs.existsSync(OUT)) {
  for (const e of fs.readdirSync(OUT)) if (!APP_DIRS.has(e)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
}
copyTree(ROOT, OUT);

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
const indexable = [];
fs.mkdirSync(path.join(OUT, "ar"), { recursive: true });
// Sub-brands switched off in the dashboard (cms/config.json → launch) show a "Coming soon" page and greyed-out links.
const LAUNCH = launchState(ROOT);
for (const file of pages) {
  const soon = LAUNCH.closedPage(file);
  const html = soon ? soonSource(soon, file) : fs.readFileSync(path.join(ROOT, file), "utf8");
  fs.writeFileSync(path.join(OUT, file), gateHtml(toEnglish(html, file), LAUNCH, "en"));
  if (NO_AR.has(file)) continue;
  fs.writeFileSync(path.join(OUT, "ar", file), gateHtml(toArabic(html, file), LAUNCH, "ar"));
  if (!/noindex/i.test(html.match(/<meta name="robots"[^>]*>/)?.[0] || "")) indexable.push(file);
}
const saPages = buildSa(OUT);
for (const file of saPages) {
  const f = path.join(OUT, "sa", file);
  fs.writeFileSync(f, LAUNCH.closedPage(file) ? saRedirect(file) : gateHtml(fs.readFileSync(f, "utf8"), LAUNCH, "ar"));
}
gateApps(OUT, LAUNCH);
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap(indexable));
const shut = [...LAUNCH.closedByPage.values()];
console.log(`site built → dist/  (${pages.length} pages, ${pages.length - NO_AR.size} Arabic, ${saPages.length} Saudi, ${indexable.length * 2 + saPages.length} sitemap URLs)${shut.length ? " · coming soon: " + shut.join(", ") : ""}`);
