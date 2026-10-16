// "Free tools" on every main-site page: header dropdown, mobile drawer group and footer links.
// Re-runnable: each block is located by its id or its old markup and replaced whole. Usage: node scripts/tools-menu.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TOOLS = [
  { href: "vitals-score.html", name: "Vitals Score", d: ["Check your website's health", "افحص صحة موقعك"] },
  { href: "forecast.html", name: "Vitals Forecast", d: ["Plan your numbers", "خطّط أرقامك"] }
];
const chev = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
const item = (t, pad) => `${pad}<a class="eco-item eco-item--text eco-item--tool" href="${t.href}"><span class="eco-item__txt"><span class="eco-item__name">${t.name}</span><span class="eco-item__d" data-en="${t.d[0].replace(/'/g, "&#39;")}" data-ar="${t.d[1]}">${t.d[0]}</span></span></a>`;

const header = pad => `${pad}<div class="nav__item nav__item--tools" data-eco>
${pad}  <button class="nav__link nav__trigger nav__link--pill" type="button" aria-expanded="false" aria-controls="toolsMenu"><span class="pulse-dot" aria-hidden="true"></span><span data-en="Free tools" data-ar="أدوات مجانية">Free tools</span>${chev}</button>
${pad}  <div class="eco-menu eco-menu--list eco-menu--tools" id="toolsMenu">
${TOOLS.map(t => item(t, pad + "    ")).join("\n")}
${pad}  </div>
${pad}</div>`;

const drawer = (pad, n) => `${pad}<div class="drawer__group drawer__group--tools">
${pad}  <button class="drawer__link drawer__toggle" type="button" aria-expanded="false" aria-controls="drawerTools"><span class="mono">${n}</span><span data-en="Free tools" data-ar="أدوات مجانية">Free tools</span>${chev}</button>
${pad}  <div class="drawer__sub" id="drawerTools" hidden>
${TOOLS.map(t => `${pad}    <a class="drawer__sublink" href="${t.href}">${t.name} <span class="drawer__d" data-en="${t.d[0].replace(/'/g, "&#39;")}" data-ar="${t.d[1]}">${t.d[0]}</span></a>`).join("\n")}
${pad}  </div>
${pad}</div>`;

let pages = 0;
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith(".html"))) {
  const p = path.join(ROOT, f);
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  // header: the old pill, or a previous dropdown
  s = s.replace(/^([ \t]*)<a class="nav__link nav__link--pill" href="vitals-score\.html">[^\n]*<\/a>$/m, (m, pad) => header(pad));
  s = s.replace(/^([ \t]*)<div class="nav__item nav__item--tools" data-eco>[\s\S]*?\n\1<\/div>$/m, (m, pad) => header(pad));
  // drawer: the old single link, or a previous group
  s = s.replace(/^([ \t]*)<a class="drawer__link" href="vitals-score\.html"><span class="mono">(\d+)<\/span>[^\n]*<\/a>$/m, (m, pad, n) => drawer(pad, n));
  s = s.replace(/^([ \t]*)<div class="drawer__group drawer__group--tools">[\s\S]*?aria-controls="drawerTools"><span class="mono">(\d+)<\/span>[\s\S]*?\n\1<\/div>$/m, (m, pad, n) => drawer(pad, n));
  // footer "Industries & tools": both tools listed
  s = s.replace(/^([ \t]*)<li><a href="vitals-score\.html" data-en="Free Vitals Score" data-ar="[^"]*">Free Vitals Score<\/a><\/li>(\n[ \t]*<li><a href="forecast\.html"[^\n]*)?$/m,
    (m, pad) => `${pad}<li><a href="vitals-score.html" data-en="Free Vitals Score" data-ar="فحص Vitals المجاني">Free Vitals Score</a></li>\n${pad}<li><a href="forecast.html" data-en="Vitals Forecast" data-ar="Vitals Forecast">Vitals Forecast</a></li>`);
  if (s !== before) { fs.writeFileSync(p, s); pages++; }
}
console.log("pages updated:", pages);
