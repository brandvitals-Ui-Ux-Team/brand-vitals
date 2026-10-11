// GET /api/inspect?url=https://example.com
// Fetches a public web page server-side and reports SEO, Arabic-readiness and
// marketing-tracking signals for the Vitals Score tool. Read-only, no storage.
// Guards: http(s) only, public IPs only (checked on every redirect hop),
// 8 s timeout, 1.5 MB body cap.
import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function assertPublic(u) {
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http and https URLs are allowed");
  if (u.username || u.password) throw new Error("Credentials in URLs are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("Host not allowed");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some(a => isPrivateIp(a.address))) throw new Error("Host not allowed");
}

async function fetchPage(start) {
  let url = new URL(start);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    for (let hop = 0; hop < 5; hop++) {
      await assertPublic(url);
      const res = await fetch(url, {
        redirect: "manual", signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandVitalsScore/1.0; +https://brandvitals.io/vitals-score.html)", Accept: "text/html,application/xhtml+xml" }
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location"), url);
        continue;
      }
      const reader = res.body?.getReader();
      let size = 0; const chunks = [];
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > MAX_BYTES) { ctrl.abort(); break; }
          chunks.push(value);
        }
      }
      const html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString("utf8");
      return { status: res.status, finalUrl: url.toString(), html, type: res.headers.get("content-type") || "" };
    }
    throw new Error("Too many redirects");
  } finally { clearTimeout(timer); }
}

const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")); return m ? (m[2] ?? m[3] ?? m[4] ?? "").trim() : null; };
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) || [];

export function analyze(html, finalUrl) {
  const head = html.slice(0, 400_000);
  const htmlTag = tags(head, "html")[0] || "";
  const metas = tags(head, "meta");
  const links = tags(head, "link");
  const meta = n => { const t = metas.find(m => (attr(m, "name") || attr(m, "property") || "").toLowerCase() === n); return t ? attr(t, "content") : null; };
  const hreflang = links.filter(l => /alternate/i.test(attr(l, "rel") || "") && attr(l, "hreflang"))
    .map(l => ({ lang: attr(l, "hreflang").toLowerCase(), href: attr(l, "href") }));
  const title = (head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/\s+/g, " ").trim() || "";
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  const has = re => re.test(html);
  return {
    finalUrl,
    https: finalUrl.startsWith("https://"),
    lang: (attr(htmlTag, "lang") || "").toLowerCase(),
    dir: (attr(htmlTag, "dir") || "").toLowerCase(),
    title, titleLength: title.length,
    description: meta("description") || "",
    canonical: (links.find(l => (attr(l, "rel") || "").toLowerCase() === "canonical") && attr(links.find(l => (attr(l, "rel") || "").toLowerCase() === "canonical"), "href")) || "",
    viewport: !!meta("viewport"),
    ogTitle: !!meta("og:title"), ogImage: !!meta("og:image"),
    h1Count: (html.match(/<h1\b/gi) || []).length,
    schemaCount: (html.match(/application\/ld\+json/gi) || []).length,
    hreflang,
    hasArabicAlternate: hreflang.some(h => h.lang.startsWith("ar")),
    hasXDefault: hreflang.some(h => h.lang === "x-default"),
    arabicRatio: arabicChars + latinChars ? +(arabicChars / (arabicChars + latinChars)).toFixed(3) : 0,
    langToggleOnly: /data-ar=|data-lang|lang-?toggle|wpml|gtranslate|weglot/i.test(html) && !hreflang.some(h => h.lang.startsWith("ar")),
    tracking: {
      ga4: has(/gtag\/js\?id=G-|['"]G-[A-Z0-9]{6,}['"]/),
      gtm: has(/googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/),
      googleAds: has(/AW-\d{6,}/),
      metaPixel: has(/connect\.facebook\.net\/[^"']*fbevents\.js|fbq\(\s*['"]init/),
      tiktokPixel: has(/analytics\.tiktok\.com|ttq\.load/),
      snapPixel: has(/sc-static\.net\/scevent|snaptr\(/),
      clarity: has(/clarity\.ms\/tag/),
      hotjar: has(/static\.hotjar\.com|hjid/)
    },
    whatsapp: has(/wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i)
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const q = new URL(req.url, "http://x").searchParams.get("url") || "";
    if (!q || q.length > 2048) { res.statusCode = 400; return res.end(JSON.stringify({ error: "Missing url" })); }
    const target = /^https?:\/\//i.test(q) ? q : "https://" + q;
    const page = await fetchPage(target);
    if (!/html/i.test(page.type) && !/<html/i.test(page.html)) {
      res.statusCode = 422; return res.end(JSON.stringify({ error: "That address did not return a web page", status: page.status }));
    }
    res.end(JSON.stringify(Object.assign({ status: page.status }, analyze(page.html, page.finalUrl))));
  } catch (e) {
    res.statusCode = 422;
    res.end(JSON.stringify({ error: e.name === "AbortError" ? "The site took too long to respond" : String(e.message || e) }));
  }
}
