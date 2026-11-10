// Top menu rules (UI fix spec 11.3), applied to every page's header, drawer and footer. Re-runnable.
// - one label for the brand menu: "Ecosystem" / "المنظومة"
// - main site order: Services · Work · Ecosystem · Insights · Free tools (drawer numbered to match)
// - sub-brand headers: a small "by Brand Vitals" link next to the logo
// - the theme toggle lives in the footer bar, not the header
// Usage: node scripts/nav.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUB_PAGES } from "./eco-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHEV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
const LABEL = `<span data-en="Ecosystem" data-ar="المنظومة">Ecosystem</span>`;
const MOON = `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>`;
const SUN = `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>`;
const THEME = `<button class="footer__theme theme-toggle" type="button" data-theme-toggle aria-label="Toggle color theme" data-ar-label="تبديل المظهر">${MOON}${SUN}<span data-en="Light / dark" data-ar="فاتح / غامق">Light / dark</span></button>`;

let changed = 0;
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith(".html") && x !== "dashboard.html")) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, "utf8");
  const before = s;

  // 1. one label: the header trigger and the drawer toggle for the ecosystem
  s = s.replace(/(<button class="nav__link nav__trigger)( sw-btn)?(" type="button" aria-expanded="false" aria-controls="ecoMenu">)[\s\S]*?<\/button>/, `$1$3${LABEL}${CHEV}</button>`);
  s = s.replace(/(aria-controls="drawerEco"><span class="mono">\d+<\/span>)<span[^>]*>[^<]*<\/span>/, `$1${LABEL}`);

  // 2. main-site order: Insights after the Ecosystem dropdown (header), and in the drawer
  const insights = s.match(/^[ \t]*<a class="nav__link" href="blog\.html" data-en="Insights" data-ar="[^"]*">Insights<\/a>\n/m);
  const ecoItem = s.match(/^([ \t]*)<div class="nav__item" data-eco>\n[ \t]*<button[^\n]*aria-controls="ecoMenu"[\s\S]*?\n\1<\/div>\n/m);
  if (insights && ecoItem && s.indexOf(insights[0]) < s.indexOf(ecoItem[0])) {
    s = s.replace(insights[0], "");
    s = s.replace(ecoItem[0], ecoItem[0] + insights[0]);
  }
  const dIns = s.match(/^[ \t]*<a class="drawer__link" href="blog\.html">[^\n]*\n/m);
  const dEco = s.match(/^([ \t]*)<div class="drawer__group">\n[ \t]*<button[^\n]*aria-controls="drawerEco"[\s\S]*?\n\1<\/div>\n/m);
  if (dIns && dEco && s.indexOf(dIns[0]) < s.indexOf(dEco[0])) {
    s = s.replace(dIns[0], "");
    s = s.replace(dEco[0], dEco[0] + dIns[0]);
  }
  // drawer numbers follow the order on the page
  const drawer = s.match(/<nav class="drawer"[\s\S]*?<\/nav>/);
  if (drawer) { let n = 0; s = s.replace(drawer[0], drawer[0].replace(/(<span class="mono">)\d+(<\/span>)/g, (m, a, b) => a + String(++n).padStart(2, "0") + b)); }

  // 3. sub-brand headers: the way back to the parent
  if (SUB_PAGES[f] && !s.includes('class="nav__parent"')) {
    s = s.replace(/(<a class="nav__logo"[\s\S]*?<\/a>)/, `$1\n      <a class="nav__parent" href="index.html" data-en="by Brand Vitals" data-ar="من Brand Vitals">by Brand Vitals</a>`);
  }

  // 4. theme toggle: out of the header, into the footer bar
  s = s.replace(/\n[ \t]*<button class="icon-btn theme-toggle" data-theme-toggle[^>]*>[\s\S]*?<\/button>/, "");
  if (!s.includes("footer__theme")) s = s.replace(/(<div class="footer__bar">\n[\s\S]*?<div class="legal">\n)/, `$1          ${THEME}\n`);

  if (s !== before) { fs.writeFileSync(p, s); changed++; }
}
console.log("pages updated:", changed);
