// SEO guard: makes sure a redesign never removes what search engines and AI assistants read.
//
//   node scripts/seo-guard.mjs --save [dir]   record the fingerprint of a built site (default dist/) as the baseline
//   node scripts/seo-guard.mjs [dir]          compare a built site with the baseline; exits 1 if anything was lost
//
// The fingerprint is everything a crawler or an AI assistant uses to understand a page: its address, title,
// description, canonical and language links, headings, structured data (including every FAQ question),
// and how much readable text it has. Colours, layout and motion are not in it, so design can change freely.
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const args = process.argv.slice(2);
const save = args.includes("--save");
const ROOT = path.resolve(args.find(a => !a.startsWith("--")) || "dist");
const BASE = path.resolve("seo-baseline.json");
const TEXT_DROP = 0.15; // a page may lose up to 15% of its words before it is flagged

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []);
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

function types(node, out = []) {
  if (Array.isArray(node)) node.forEach(n => types(n, out));
  else if (node && typeof node === "object") {
    if (node["@type"]) out.push(...[].concat(node["@type"]));
    Object.values(node).forEach(v => types(v, out));
  }
  return out;
}
function questions(node, out = []) {
  if (Array.isArray(node)) node.forEach(n => questions(n, out));
  else if (node && typeof node === "object") {
    if ([].concat(node["@type"] || []).includes("Question") && node.name) out.push(clean(node.name));
    Object.values(node).forEach(v => questions(v, out));
  }
  return out;
}

function fingerprint(root) {
  const pages = {};
  for (const file of walk(root)) {
    const url = "/" + path.relative(root, file).split(path.sep).join("/");
    const $ = load(fs.readFileSync(file, "utf8"));
    const robots = clean($('meta[name="robots"]').attr("content"));
    if (/noindex/i.test(robots)) continue; // pages we hide from search are not part of the promise
    const ld = [];
    $('script[type="application/ld+json"]').each((_, el) => { try { ld.push(JSON.parse($(el).text())); } catch { ld.push({ "@type": "BROKEN" }); } });
    const body = $("main").length ? $("main").clone() : $("body").clone();
    body.find("script,style,noscript,svg").remove();
    pages[url] = {
      title: clean($("title").text()),
      description: clean($('meta[name="description"]').attr("content")),
      canonical: clean($('link[rel="canonical"]').attr("href")),
      lang: clean($("html").attr("lang")),
      hreflang: $('link[rel="alternate"][hreflang]').map((_, el) => $(el).attr("hreflang") + " " + $(el).attr("href")).get().sort(),
      h1: $("h1").map((_, el) => clean($(el).text())).get(),
      h2: $("h2").map((_, el) => clean($(el).text())).get(),
      schema: [...new Set(types(ld))].sort(),
      faq: questions(ld),
      og: clean($('meta[property="og:title"]').attr("content")),
      words: clean(body.text()).split(" ").filter(Boolean).length
    };
  }
  const read = (f) => fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), "utf8") : "";
  const files = {
    sitemap: [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).sort(),
    robots: read("robots.txt").split(/\r?\n/).map(clean).filter(Boolean),
    llms: [...read("llms.txt").matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]).sort(),
    llmsWords: clean(read("llms.txt")).split(" ").length,
    llmsFullWords: clean(read("llms-full.txt")).split(" ").length
  };
  return { pages, files };
}

const now = fingerprint(ROOT);
if (save) {
  fs.writeFileSync(BASE, JSON.stringify(now, null, 1));
  console.log(`baseline saved: ${Object.keys(now.pages).length} pages → seo-baseline.json`);
  process.exit(0);
}
if (!fs.existsSync(BASE)) { console.error("No seo-baseline.json yet. Run: node scripts/seo-guard.mjs --save"); process.exit(1); }
const was = JSON.parse(fs.readFileSync(BASE, "utf8"));

const lost = [], changed = [], closed = [];
// Sub-brands switched off in the dashboard are closed on purpose; they come back when the owner opens them.
const launch = (JSON.parse(fs.readFileSync("cms/config.json", "utf8")).launch) || {};
const isClosed = (url) => Object.entries(launch).some(([k, on]) => !on && new RegExp("/" + k + "\\.html$").test(url));
const squash = (s) => s.replace(/\s+/g, "");
const missing = (a, b) => a.filter(x => !b.includes(x));
for (const [url, a] of Object.entries(was.pages)) {
  const b = now.pages[url];
  if (!b) { (isClosed(url) ? closed : lost).push(`${url}: the page is gone (or is now hidden from search)`); continue; }
  for (const k of ["title", "description", "canonical", "lang", "og"]) {
    if (a[k] && !b[k]) lost.push(`${url}: ${k} is missing`);
    else if (a[k] !== b[k]) changed.push(`${url}: ${k} changed\n      was: ${a[k]}\n      now: ${b[k]}`);
  }
  // Rewording a heading or a question (or translating it) is a change to review; having fewer is a loss.
  if (b.faq.length < a.faq.length) lost.push(`${url}: FAQ questions fell from ${a.faq.length} to ${b.faq.length}`);
  else if (missing(a.faq, b.faq).length) changed.push(`${url}: ${missing(a.faq, b.faq).length} FAQ question(s) reworded or translated`);
  if (missing(a.h1.map(squash), b.h1.map(squash)).length) changed.push(`${url}: main heading changed\n      was: ${a.h1.join(" / ")}\n      now: ${b.h1.join(" / ")}`);
  for (const k of ["hreflang", "schema"]) {
    const gone = missing(a[k], b[k]);
    if (gone.length) lost.push(`${url}: ${k} lost ${gone.length}: ${gone.slice(0, 3).join(" | ")}${gone.length > 3 ? " …" : ""}`);
  }
  const h2 = missing(a.h2, b.h2);
  if (h2.length) changed.push(`${url}: ${h2.length} section heading(s) removed or reworded: ${h2.slice(0, 3).join(" | ")}${h2.length > 3 ? " …" : ""}`);
  if (b.h1.length !== 1) lost.push(`${url}: has ${b.h1.length} main headings (must be exactly 1)`);
  if (a.words && b.words < a.words * (1 - TEXT_DROP)) lost.push(`${url}: readable text fell from ${a.words} to ${b.words} words`);
}
for (const k of ["sitemap", "robots", "llms"]) {
  const gone = missing(was.files[k], now.files[k]).filter(l => !isClosed(l));
  if (gone.length) lost.push(`${k}: lost ${gone.length} line(s): ${gone.slice(0, 4).join(" | ")}${gone.length > 4 ? " …" : ""}`);
}
for (const k of ["llmsWords", "llmsFullWords"]) {
  if (now.files[k] < was.files[k] * (1 - TEXT_DROP)) lost.push(`${k}: fell from ${was.files[k]} to ${now.files[k]}`);
}
const added = Object.keys(now.pages).filter(u => !was.pages[u]);

if (changed.length) console.log(`\n${changed.length} thing(s) changed (review, not a failure):\n  - ` + changed.join("\n  - "));
if (closed.length) console.log(`\n${closed.length} page(s) closed on purpose from the dashboard (Settings, "Pages open or closed"): ${closed.map(c => c.split(":")[0]).join(", ")}`);
if (added.length) console.log(`\n${added.length} new page(s): ${added.slice(0, 12).join(", ")}${added.length > 12 ? " …" : ""}`);
if (lost.length) {
  console.error(`\n✗ ${lost.length} thing(s) search engines and AI assistants rely on were LOST:\n  - ` + lost.join("\n  - "));
  process.exit(1);
}
console.log(`\n✓ SEO guard: all ${Object.keys(was.pages).length} baseline pages kept their address, title, description, language links, headings, structured data, FAQ questions and text.`);
