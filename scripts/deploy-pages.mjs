// Publishes the built site (dist/) as a GitHub Pages preview, without exposing the source:
// it pushes only the build output to the public repo <owner>.github.io, served at the root.
//
//   npm run build && node scripts/deploy-pages.mjs
//
// GitHub Pages is static, so this adds what Vercel normally does for us:
// - SPA fallback for /app/*, /crew/* and /recruit/* through 404.html (path restored in the app),
// - stubs for the old URLs Vercel redirects (approve.html, hq.html, live.html),
// - .nojekyll so folders and files are served as-is.
// Server functions (/api/*) don't exist on Pages; the apps run in demo mode there.
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const DIST = path.join(ROOT, "dist");
const OWNER = process.env.PAGES_OWNER || "brandvitals-Ui-Ux-Team";
const REPO = `${OWNER.toLowerCase()}.github.io`;
if (!fs.existsSync(path.join(DIST, "index.html"))) throw new Error("Run npm run build first.");

const out = fs.mkdtempSync(path.join(os.tmpdir(), "bv-pages-"));
fs.cpSync(DIST, out, { recursive: true });
fs.writeFileSync(path.join(out, ".nojekyll"), "");

// SPA fallback: a deep link like /crew/talent/jobs 404s on Pages; 404.html stores it and opens the app,
// which restores the path before the router starts.
const SAVE = `<script>(function(){var p=location.pathname,m=p.match(/^\\/(app|crew|recruit)(\\/.*)?$/);if(m&&p!=="/"+m[1]+"/"){sessionStorage.setItem("spa-path",p+location.search+location.hash);location.replace("/"+m[1]+"/");}})();</script>`;
const RESTORE = `<script>(function(){var r=sessionStorage.getItem("spa-path");if(r){sessionStorage.removeItem("spa-path");history.replaceState(null,"",r);}})();</script>`;
const f404 = path.join(out, "404.html");
fs.writeFileSync(f404, fs.readFileSync(f404, "utf8").replace(/<head>/i, "<head>\n  " + SAVE));
for (const app of ["app", "crew", "recruit"]) {
  const f = path.join(out, app, "index.html");
  if (fs.existsSync(f)) fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace(/<head>/i, "<head>\n    " + RESTORE));
}

// Old URLs that Vercel redirects (see vercel.json)
const stub = to => `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"><title>Moved</title><a href="${to}">${to}</a>`;
for (const [from, to] of [["approve.html", "/go.html"], ["hq.html", "/go.html"], ["live.html", "/events.html"], ["ar/approve.html", "/ar/go.html"], ["ar/hq.html", "/ar/go.html"], ["ar/live.html", "/ar/events.html"], ["approve/index.html", "/go.html"]]) {
  const f = path.join(out, from);
  if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, stub(to)); }
}

const run = cmd => execSync(cmd, { cwd: out, stdio: "inherit" });
try { execSync(`gh repo view ${OWNER}/${REPO}`, { stdio: "ignore" }); }
catch { execSync(`gh repo create ${OWNER}/${REPO} --public --description "Brand Vitals preview site (built output only)"`, { stdio: "inherit" }); }
run("git init -q -b main");
run("git add -A");
run(`git -c user.name="Brand Vitals" -c user.email="noreply@github.com" commit -q -m "Preview build ${new Date().toISOString()}"`);
run(`git push -q -f https://github.com/${OWNER}/${REPO}.git main`);
try { execSync(`gh api -X POST repos/${OWNER}/${REPO}/pages -f source[branch]=main -f source[path]=/`, { stdio: "ignore" }); } catch { /* already enabled */ }
console.log(`\nPublished. Live in a minute or two at https://${REPO}/`);
