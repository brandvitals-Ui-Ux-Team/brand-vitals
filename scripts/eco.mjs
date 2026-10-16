// Rebuilds every ecosystem list in the source HTML from scripts/eco-data.mjs, grouped into Studios and Platforms.
// Safe to re-run: each list is located by its container and replaced whole. Usage: node scripts/eco.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PARENT, GROUPS, SUB_PAGES } from "./eco-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const t = ([en, ar], tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</${tag}>`;
const badge = b => b.badge ? ` <em class="eco-badge" data-en="${esc(b.badge[0])}" data-ar="${esc(b.badge[1])}">${esc(b.badge[0])}</em>` : "";

const END = "<!-- eco:end -->";
const item = (b, pad, parent = false) =>
  `${pad}<a class="eco-item${parent ? " eco-item--parent" : ""}" href="${b.href}"><img loading="lazy" decoding="async" src="${b.mark}" alt="" width="38" height="38"><span class="eco-item__txt"><span class="eco-item__name">${esc(b.name)}${badge(b)}</span>${t(b.d, "span", "eco-item__d")}</span></a>`;
// header: one wide panel, Brand Vitals on top, then Studios and Platforms side by side
const mega = pad => [
  item(PARENT, pad, true),
  `${pad}<div class="eco-menu__cols">`,
  ...GROUPS.flatMap(g => [`${pad}  <div class="eco-menu__col">`, `${pad}    ${t(g.head, "p", "eco-menu__head")}`, ...g.brands.map(b => item(b, pad + "    ")), `${pad}  </div>`]),
  `${pad}</div>`,
  pad + END
].join("\n");
// mobile drawer: the parent, then each group as a row of three marks with names (a 2 × 3 grid)
const grid = pad => [
  `${pad}<a class="drawer__parent" href="${PARENT.href}"><img loading="lazy" decoding="async" src="${PARENT.mark}" alt="" width="32" height="32"><span><b>${esc(PARENT.name)}</b>${t(PARENT.d, "small")}</span></a>`,
  ...GROUPS.flatMap(g => [`${pad}${t(g.short, "p", "eco-menu__head eco-menu__head--drawer")}`, `${pad}<div class="drawer__grid">${g.brands.map(b =>
    `<a class="drawer__mark" href="${b.href}"><img loading="lazy" decoding="async" src="${b.mark}" alt="" width="44" height="44"><span>${esc(b.name)}</span></a>`).join("")}</div>`]),
  pad + END
].join("\n");

// compact family row at the bottom of sub-brand pages: the parent, then all six brands by group
const famRow = (current, pad) => [
  `${pad}<a class="fam-row__parent" href="${PARENT.href}"><img src="${PARENT.mark}" alt="" width="28" height="28"><span>${t(["A Brand Vitals company", "من شركات Brand Vitals"])}</span></a>`,
  ...GROUPS.map(g => `${pad}<div class="fam-row__grp">${t(g.short, "span", "fam-row__h")}${g.brands.map(b =>
    `<a class="fam-row__i" href="${b.href}"${b.key === current ? ' aria-current="page"' : ""}><img src="${b.mark}" alt="" width="28" height="28"><span>${esc(b.name)}</span></a>`).join("")}</div>`)
].join("\n");

const footer = (current, pad) => [
  `${pad}<li><a href="${PARENT.href}">${esc(PARENT.name)}</a></li>`,
  ...GROUPS.flatMap(g => [`${pad}${t(g.short, "li", "footer__grp")}`, ...g.brands.filter(b => b.key !== current).map(b => `${pad}<li><a href="${b.href}">${esc(b.name)}</a></li>`)])
].join("\n");

function rebuild(file, s) {
  const current = SUB_PAGES[file] || null;
  let n = 0;
  const swap = (re, fn) => { s = s.replace(re, (...m) => { n++; return fn(...m); }); };
  // header mega menu (contents end at the marker; before the first run, at the first closing div)
  // (a block already in the new layout ends at the marker; an old flat list ends at its first closing div)
  const megaHtml = pad => `${pad}<div class="eco-menu eco-menu--mega" id="ecoMenu">\n` + mega(pad + "  ");
  swap(/^([ \t]*)<div class="eco-menu eco-menu--mega" id="ecoMenu">[\s\S]*?<!-- eco:end -->/m, (m, pad) => megaHtml(pad));
  swap(/^([ \t]*)<div class="eco-menu" id="ecoMenu">[\s\S]*?(?=\n[ \t]*<\/div>)/m, (m, pad) => megaHtml(pad));
  // mobile drawer
  const gridHtml = pad => `${pad}<div class="drawer__sub drawer__sub--eco" id="drawerEco" hidden>\n` + grid(pad + "  ");
  swap(/^([ \t]*)<div class="drawer__sub drawer__sub--eco" id="drawerEco" hidden>[\s\S]*?<!-- eco:end -->/m, (m, pad) => gridHtml(pad));
  swap(/^([ \t]*)<div class="drawer__sub" id="drawerEco" hidden>[\s\S]*?(?=\n[ \t]*<\/div>)/m, (m, pad) => gridHtml(pad));
  // footer column, headed "Ecosystem" everywhere
  swap(/(<h2 class="footer__h"[^>]*data-en="(?:Ecosystem|Brands)"[^>]*>[^<]*<\/h2>\s*<ul>\n)(\s*)[\s\S]*?(\n\s*<\/ul>)/, (m, open, pad, close) =>
    open.replace(/<h2 class="footer__h"[^>]*>[^<]*<\/h2>/, '<h2 class="footer__h" data-en="Ecosystem" data-ar="المنظومة">Ecosystem</h2>') + footer(current, pad) + close);
  // family row at the bottom of sub-brand pages
  swap(/(<nav class="fam-row" data-fam>)[\s\S]*?\n([ \t]*)(<\/nav>)/, (m, open, pad, close) => open + "\n" + famRow(current, pad + "  ") + "\n" + pad + close);
  return [s, n];
}

let total = 0;
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith(".html") && x !== "dashboard.html" && x !== "404.html")) {
  const p = path.join(ROOT, f);
  const before = fs.readFileSync(p, "utf8");
  const [after, n] = rebuild(f, before);
  total += n;
  if (after !== before) fs.writeFileSync(p, after);
}
console.log("ecosystem lists rebuilt:", total);
