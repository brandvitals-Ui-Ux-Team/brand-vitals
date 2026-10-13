// QA for the built site (run after `npm run build:site`):
//  - every internal link and asset in every page resolves to a file in dist/
//  - every indexable page has a title, a meta description and hreflang alternates
//  - every English page has an Arabic twin with lang="ar" dir="rtl"
// Usage: npm run check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
if (!fs.existsSync(DIST)) { console.error("dist/ not found. Run npm run build:site first."); process.exit(1); }
const problems = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === "app" ? [] : walk(path.join(dir, e.name))) : [path.join(dir, e.name)]);
const pages = walk(DIST).filter(f => f.endsWith(".html"));

for (const file of pages) {
  const rel = path.relative(DIST, file).replace(/\\/g, "/");
  const $ = cheerio.load(fs.readFileSync(file, "utf8"));
  const noindex = /noindex/i.test($('meta[name="robots"]').attr("content") || "");
  if (!noindex && rel !== "dashboard.html") {
    if (!$("title").text().trim()) problems.push(`${rel}: missing <title>`);
    if (!($('meta[name="description"]').attr("content") || "").trim()) problems.push(`${rel}: missing meta description`);
    if ($('link[rel="alternate"][hreflang]').length < 3) problems.push(`${rel}: missing hreflang alternates`);
    if (rel.startsWith("ar/") && ($("html").attr("lang") !== "ar" || $("html").attr("dir") !== "rtl")) problems.push(`${rel}: Arabic page without lang=ar dir=rtl`);
    if (!rel.startsWith("ar/") && !fs.existsSync(path.join(DIST, "ar", rel))) problems.push(`${rel}: no Arabic twin`);
  }
  $("[href],[src]").each((_, el) => {
    for (const a of ["href", "src"]) {
      let v = $(el).attr(a);
      if (!v || /^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(v)) continue;
      v = v.split("#")[0].split("?")[0];
      if (!v) continue;
      if (v.startsWith("/app") || v.startsWith("/crew/") || v.startsWith("/jobs/") || v.startsWith("/api/")) continue; // SPA routes
      const target = v.startsWith("/") ? path.join(DIST, v) : path.join(path.dirname(file), v);
      const resolved = target.endsWith(path.sep) || v.endsWith("/") ? path.join(target, "index.html") : target;
      if (!fs.existsSync(resolved)) problems.push(`${rel}: broken ${a} → ${v}`);
    }
  });
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n  ` + [...new Set(problems)].join("\n  "));
  process.exit(1);
}
console.log(`✓ ${pages.length} pages checked: links, assets, titles, descriptions, hreflang and Arabic twins all OK`);
