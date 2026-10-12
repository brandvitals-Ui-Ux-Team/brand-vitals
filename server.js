// Local preview server that mirrors production (Vercel):
//   - serves the built site from dist/ (run `npm run build:site` first, or `npm run dev`)
//   - /api/* runs the serverless functions in api/
//   - /app/*, /crew/* and /recruit/* fall back to the Vitals GO, Crew and Recruit single-page apps
// Usage: node server.js [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = fs.existsSync(path.join(HERE, "dist")) ? path.join(HERE, "dist") : HERE;
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8944;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"
};

const send = (res, file, status = 200) => fs.readFile(file, (err, data) => {
  if (err) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(status, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
  res.end(data);
});

http.createServer(async (req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath.startsWith("/api/")) {
    const fn = path.join(HERE, "api", path.basename(urlPath) + ".js");
    if (!fs.existsSync(fn)) { res.writeHead(404); return res.end("{}"); }
    const mod = await import(pathToFileURL(fn).href);
    return mod.default(req, res);
  }
  const spa = ["app", "crew", "recruit"].find(a => urlPath === "/" + a || urlPath.startsWith("/" + a + "/"));
  if (spa) {
    const f = path.join(ROOT, path.normalize(urlPath));
    if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) return send(res, f);
    return send(res, path.join(ROOT, spa, "index.html"));
  }
  if (urlPath.endsWith("/")) urlPath += "index.html";
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isFile()) return send(res, filePath);
    if (!err && st.isDirectory()) return send(res, path.join(filePath, "index.html"));
    send(res, path.join(ROOT, "404.html"), 404);
  });
}).listen(PORT, () => console.log(`Brand Vitals preview → http://localhost:${PORT}  (serving ${path.relative(HERE, ROOT) || "."})`));
