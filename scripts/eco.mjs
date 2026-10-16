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

const item = (b, pad, parent = false) =>
  `${pad}<a class="eco-item${parent ? " eco-item--parent" : ""}" href="${b.href}"><img loading="lazy" decoding="async" src="${b.mark}" alt="" width="38" height="38"><span class="eco-item__txt"><span class="eco-item__name">${esc(b.name)}${badge(b)}</span>${t(b.d, "span", "eco-item__d")}</span></a>`;
const list = (pad, headTag, headCls) => [
  item(PARENT, pad, true),
  ...GROUPS.flatMap(g => [`${pad}${t(g.head, headTag, headCls)}`, ...g.brands.map(b => item(b, pad))])
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
  // header mega menu: keep its first heading, rebuild the rest
  swap(/(<div class="eco-menu" id="ecoMenu">\s*\n(\s*)<p class="eco-menu__head"[^>]*>[^<]*<\/p>\n)[\s\S]*?(\n\s*<\/div>)/, (m, open, pad, close) => open + list(pad, "p", "eco-menu__head") + close);
  // mobile drawer
  swap(/(<div class="drawer__sub" id="drawerEco" hidden>\n)(\s*)[\s\S]*?(\n\s*<\/div>)/, (m, open, pad, close) => open + list(pad, "p", "eco-menu__head eco-menu__head--drawer") + close);
  // footer column (Ecosystem on the main site, Brands on sub-brand pages)
  swap(/(<h2 class="footer__h"[^>]*data-en="(?:Ecosystem|Brands)"[^>]*>[^<]*<\/h2>\s*<ul>\n)(\s*)[\s\S]*?(\n\s*<\/ul>)/, (m, open, pad, close) => open + footer(current, pad) + close);
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
