// GET /api/psi?url=https://example.com
// Proxies Google PageSpeed Insights (mobile) with the server-side key in the
// PSI_API_KEY environment variable, so the key never reaches the browser.
// Free key: Google Cloud Console → enable "PageSpeed Insights API" → Credentials.
const CATEGORIES = ["performance", "seo", "accessibility", "best-practices"];

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const q = new URL(req.url, "http://x").searchParams.get("url") || "";
  if (!/^https?:\/\/[^\s/]+\.[^\s]+/i.test(q) || q.length > 2048) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Invalid url" })); }
  const key = process.env.PSI_API_KEY || "";
  const p = new URLSearchParams({ url: q, strategy: "mobile" });
  CATEGORIES.forEach(c => p.append("category", c));
  if (key) p.set("key", key);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 55000);
    const r = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + p, { signal: ctrl.signal });
    clearTimeout(timer);
    const text = await r.text();
    let body = {};
    try { body = JSON.parse(text); } catch { /* Google sometimes answers rate limits with HTML */ }
    if (!r.ok || !body.lighthouseResult) {
      res.statusCode = r.ok ? 502 : r.status;
      return res.end(JSON.stringify({ error: (body.error && body.error.message) || "PageSpeed unavailable (HTTP " + r.status + ")", keyConfigured: !!key }));
    }
    // Only what the score needs: categories + the audits used for advice.
    const lr = body.lighthouseResult || {};
    const keep = ["largest-contentful-paint", "first-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"];
    const audits = {};
    for (const k of keep) if (lr.audits && lr.audits[k]) audits[k] = { score: lr.audits[k].score, displayValue: lr.audits[k].displayValue };
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.end(JSON.stringify({ lighthouseResult: { categories: lr.categories, audits, finalUrl: lr.finalUrl } }));
  } catch (e) {
    res.statusCode = 504;
    res.end(JSON.stringify({ error: e.name === "AbortError" ? "PageSpeed timed out" : String(e.message || e) }));
  }
}
