// Writes one token block per brand (dark + light) into assets/css/brands.css, between
// /* @tokens:start */ and /* @tokens:end */, from scripts/palette.mjs. Usage: node scripts/brand-tokens.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PALETTES } from "./palette.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "assets/css/brands.css");
const ORDER = ["frames", "web", "stage", "go", "crew", "jobs"];
const vars = o => Object.entries(o).map(([k, v]) => `--${k}: ${v};`).join(" ");
const block = ORDER.map(k => {
  const p = PALETTES[k];
  return `/* ${k} · ${p.idea} · opens ${p.theme} */
body[data-brand="${k}"] { ${vars(p.dark)} }
[data-theme="light"] body[data-brand="${k}"] { ${vars(p.light)} }`;
}).join("\n");
let s = fs.readFileSync(file, "utf8");
const re = /\/\* @tokens:start \*\/[\s\S]*?\/\* @tokens:end \*\//;
if (!re.test(s)) throw new Error("token markers missing in brands.css");
s = s.replace(re, `/* @tokens:start */\n${block}\n/* @tokens:end */`);
fs.writeFileSync(file, s);
console.log("brand tokens written:", ORDER.join(", "));
