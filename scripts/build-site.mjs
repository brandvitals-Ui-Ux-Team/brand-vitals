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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");
const SITE = "https://brandvitals.io";

// Pages that exist in English only (tools and system pages).
const NO_AR = new Set(["dashboard.html", "404.html"]);
// Files and folders that never ship.
const SKIP = new Set(["node_modules", "dist", "apps", "scripts", "supabase", "api", ".git", ".github", ".vercel", ".impeccable",
  "package.json", "package-lock.json", "server.js", "README.md", "SITEMAP.md", "vercel.json", ".gitignore", "docs"]);

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
  head.append(`\n  <link rel="alternate" hreflang="en" href="${pageUrl(file, "en")}" data-build>`);
  head.append(`\n  <link rel="alternate" hreflang="ar" href="${pageUrl(file, "ar")}" data-build>`);
  head.append(`\n  <link rel="alternate" hreflang="x-default" href="${pageUrl(file, "en")}" data-build>\n`);
}

const LOCAL_ASSET = /^(assets|cms)\//;
const toParent = v => (LOCAL_ASSET.test(v) ? "../" + v : v);

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
      if (a === "href" && (v === "dashboard.html" || NO_AR.has(v))) { $el.attr(a, "../" + v); continue; }
      $el.attr(a, toParent(v));
    }
    const ss = $el.attr("srcset");
    if (ss) $el.attr("srcset", ss.split(",").map(s => toParent(s.trim())).join(", "));
  });
  $("[style*='url(']").each((_, el) => {
    const $el = $(el);
    $el.attr("style", $el.attr("style").replace(/url\((['"]?)(assets\/)/g, "url($1../$2"));
  });
  // Inline JSON-LD keeps absolute URLs; mark the language.
  addAlternates($, file, "ar");
  return $.html();
}

function toEnglish(html, file) {
  const $ = cheerio.load(html);
  addAlternates($, file, "en");
  return $.html();
}

function sitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [];
  for (const file of pages) {
    const pri = file === "index.html" ? "1.0" : /^(solutions|work|contact|vitals-score|hq)\.html$/.test(file) ? "0.9" : file === "privacy.html" ? "0.3" : "0.7";
    for (const lang of ["en", "ar"]) {
      rows.push(`  <url>
    <loc>${pageUrl(file, lang)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${lang === "en" ? pri : (pri * 0.9).toFixed(1)}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${pageUrl(file, "en")}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${pageUrl(file, "ar")}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(file, "en")}"/>
  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.join("\n")}
</urlset>
`;
}

// ---------------------------------------------------------------------------
// The apps (Vitals GO in dist/app, Vitals Crew in dist/crew, Vitals Recruit in dist/recruit) are built first; keep them.
const APP_DIRS = new Set(["app", "crew", "recruit"]);
if (fs.existsSync(OUT)) {
  for (const e of fs.readdirSync(OUT)) if (!APP_DIRS.has(e)) fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
}
copyTree(ROOT, OUT);

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
const indexable = [];
fs.mkdirSync(path.join(OUT, "ar"), { recursive: true });
for (const file of pages) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  fs.writeFileSync(path.join(OUT, file), toEnglish(html, file));
  if (NO_AR.has(file)) continue;
  fs.writeFileSync(path.join(OUT, "ar", file), toArabic(html, file));
  if (!/noindex/i.test(html.match(/<meta name="robots"[^>]*>/)?.[0] || "")) indexable.push(file);
}
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap(indexable));
console.log(`site built → dist/  (${pages.length} pages, ${pages.length - NO_AR.size} Arabic, ${indexable.length * 2} sitemap URLs)`);
