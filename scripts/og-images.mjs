// Open Graph images (UI fix spec 12.6): one 1200 x 630 image per public page and language, type only on
// the page's brand background (no photos), and the og:image / twitter:image tags pointing at them.
// EN images go to assets/img/og/<page>.jpg, Arabic to assets/img/og/ar/<page>.jpg (the build swaps them in
// through data-ar). The homepage and the sub-brand pages keep their designed English images.
// Needs Chrome: set CHROME_PATH if it isn't in the default Windows location. Usage: node scripts/og-images.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { PALETTES } from "./palette.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "assets/img/og");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const KEEP_EN = { "index.html": "bv", "frames.html": "frames", "web.html": "web", "stage.html": "stage", "go.html": "go", "crew.html": "crew" };
const SKIP = new Set(["dashboard.html", "404.html"]);
const dataUri = f => "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT, f)).toString("base64");
const dec = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const KIND = f =>
  /^blog-/.test(f) ? ["Article", "مقال"] : /^case-/.test(f) ? ["Case study", "دراسة حالة"] :
  /-marketing\.html$/.test(f) && f !== "performance-marketing.html" && f !== "egypt-vs-saudi-marketing.html" ? ["Industry", "مجال"] :
  ["performance-marketing.html", "google-ads.html", "seo.html", "branding.html", "web-cro.html", "analytics-tracking.html"].includes(f) ? ["Service", "خدمة"] :
  ["vitals-score.html", "forecast.html"].includes(f) ? ["Free tool", "أداة مجانية"] :
  ["glossary.html", "egypt-vs-saudi-marketing.html"].includes(f) ? ["Guide", "دليل"] : null;

function card({ lang, title, desc, kind, brand, logo }) {
  const p = PALETTES[brand] || PALETTES.bv;
  const ar = lang === "ar";
  const bg = brand === "bv" ? "#05080B" : p.dark.bg;
  return `<!doctype html><html lang="${lang}" dir="${ar ? "rtl" : "ltr"}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@600;700&family=Inter:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${bg};color:${p.dark.text};font-family:${ar ? "'IBM Plex Sans Arabic'," : ""}Inter,sans-serif;padding:72px 80px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
.logo{height:${brand === "bv" ? 64 : 58}px;display:flex;align-items:center;gap:14px;font:700 34px Alexandria,sans-serif;color:${p.dark.text}}
.logo img{height:100%}
.logo img.mark{height:52px;border-radius:13px}
main{align-self:center;display:grid;gap:22px}
.kind{font:500 22px ${ar ? "'IBM Plex Sans Arabic'," : ""}Inter,sans-serif;letter-spacing:${ar ? 0 : ".12em"};text-transform:uppercase;color:${p.dark["accent-text"] || p.dark.accent}}
h1{font:700 ${title.length > 48 ? 58 : 66}px/1.12 Alexandria,${ar ? "'IBM Plex Sans Arabic'," : ""}sans-serif;letter-spacing:${ar ? 0 : "-.02em"};max-width:1040px}
p{font-size:27px;line-height:1.45;color:${p.dark["text-2"]};max-width:980px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
footer{display:flex;justify-content:space-between;align-items:center;font-size:24px;color:${p.dark["text-2"]}}
footer i{display:block;width:240px;height:6px;border-radius:3px;background:${p.dark.accent}}
</style></head><body>
<div class="logo">${logo}</div>
<main>${kind ? `<div class="kind">${esc(kind)}</div>` : ""}<h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ""}</main>
<footer><span dir="ltr">brandvitals.io</span><i></i></footer>
</body></html>`;
}

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html") && !SKIP.has(f));
const browser = await puppeteer.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
fs.mkdirSync(path.join(OUT, "ar"), { recursive: true });
let made = 0, tagged = 0;
for (const f of pages) {
  let s = fs.readFileSync(path.join(ROOT, f), "utf8");
  if (/name="robots" content="[^"]*noindex/.test(s)) continue;
  const name = f.replace(/\.html$/, "");
  const brand = (s.match(/<body[^>]*data-brand="([a-z]+)"/) || [])[1] || "bv";
  const logo = brand === "jobs"
    ? `<img class="mark" src="${dataUri("assets/img/brands/jobs-mark.svg")}"><span>Vitals Hire</span>`
    : `<img src="${dataUri(brand === "bv" ? "assets/img/logo-light.svg" : `assets/img/brands/${brand}-light.svg`)}">`;
  const tEn = dec((s.match(/data-title-en="([^"]*)"/) || [])[1] || name).split(" | ").filter(x => x !== "Brand Vitals").join(" · ");
  const tAr = dec((s.match(/data-title-ar="([^"]*)"/) || [])[1] || tEn).split(" | ").filter(x => x !== "Brand Vitals").join(" · ");
  const dm = s.match(/<meta name="description" content="([^"]*)"(?: data-ar="([^"]*)")?/) || [];
  const kind = KIND(f);
  const jobs = [["ar", tAr, dec(dm[2] || dm[1] || ""), kind && kind[1], path.join(OUT, "ar", name + ".jpg")]];
  if (!KEEP_EN[f]) jobs.push(["en", tEn, dec(dm[1] || ""), kind && kind[0], path.join(OUT, name + ".jpg")]);
  for (const [lang, title, desc, k, out] of jobs) {
    await page.setContent(card({ lang, title, desc, kind: k, brand, logo }), { waitUntil: "load", timeout: 60000 });
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))]));
    await page.screenshot({ path: out, type: "jpeg", quality: 82 });
    made++;
  }
  // point the page's tags at its images (Arabic through data-ar, which the build swaps in)
  const enImg = `https://brandvitals.io/assets/img/og/${KEEP_EN[f] ? KEEP_EN[f] : name}.jpg`;
  const arImg = `https://brandvitals.io/assets/img/og/ar/${name}.jpg`;
  const tags = `<meta property="og:image" content="${enImg}" data-ar="${arImg}">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta name="twitter:image" content="${enImg}" data-ar="${arImg}">`;
  const before = s;
  s = s.replace(/\n[ \t]*<meta property="og:image(?::width|:height)?" content="[^"]*"[^>]*>/g, "").replace(/\n[ \t]*<meta name="twitter:image" content="[^"]*"[^>]*>/g, "");
  s = s.replace(/<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary_large_image">');
  if (/<meta property="og:url"/.test(s)) s = s.replace(/(\n[ \t]*<meta property="og:url" content="[^"]*">)/, `$1\n  ${tags}`);
  else s = s.replace("</head>", `  ${tags}\n</head>`);
  if (!s.includes(tags)) throw new Error(f + ": image tags not placed");
  if (s !== before) { fs.writeFileSync(path.join(ROOT, f), s); tagged++; }
}
await browser.close();
console.log("images:", made, "· pages tagged:", tagged);
