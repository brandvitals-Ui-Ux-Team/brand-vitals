// Section 12 (SEO / GEO) blocks on the service and industry pages, from scripts/content/geo-*.mjs:
// an answer-first summary and "Last updated" date in the hero, then Egypt vs Saudi Arabia, how we approach
// it, what you receive at each stage, how it's priced, key terms (linked to the glossary), related pages,
// and the FAQ grown to 8-10 questions with FAQPage JSON-LD to match.
// Re-runnable: every block it adds carries data-geo / data-geo-faq and is removed before it is added again.
// Usage: node scripts/geo.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import services, { MARKET } from "./content/geo-services.mjs";
import industries from "./content/geo-industries.mjs";
import glossary from "./content/glossary.mjs";
import arOnly from "./content/geo-ar.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const UPDATED = { iso: "2026-10-16", en: "16 October 2026", ar: "16 أكتوبر 2026" };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const t = (en, ar, tag = "span", cls = "", extra = "") => `<${tag}${cls ? ` class="${cls}"` : ""}${extra} data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</${tag}>`;
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const PLUS = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>';
const TERM = Object.fromEntries(glossary.map(g => [g.id, g]));

const NAMES = {
  "performance-marketing.html": ["Performance marketing", "تسويق الأداء"], "google-ads.html": ["Google Ads", "إعلانات جوجل"],
  "seo.html": ["SEO", "السيو"], "branding.html": ["Branding", "تصميم الهوية"], "web-cro.html": ["Websites and CRO", "المواقع وتحسين التحويل"],
  "analytics-tracking.html": ["Analytics and tracking", "التحليلات والتتبع"], "ecommerce-marketing.html": ["E-commerce marketing", "تسويق التجارة الإلكترونية"],
  "real-estate-marketing.html": ["Real estate marketing", "تسويق العقارات"], "healthcare-marketing.html": ["Healthcare marketing", "التسويق الطبي"]
};
// A page's own title, for link lists (the part before " | ").
const titleOf = f => {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  const en = (s.match(/data-title-en="([^"]*)"/) || [])[1] || f;
  const ar = (s.match(/data-title-ar="([^"]*)"/) || [])[1] || en;
  const clean = v => v.replace(/&amp;/g, "&").split(" | ")[0].trim();
  return [clean(en), clean(ar)];
};
const head = (eyebrow, h2, lead) => `        <div class="section-head" data-reveal>
          ${t(eyebrow[0], eyebrow[1], "p", "eyebrow")}
          ${t(h2[0], h2[1], "h2")}${lead ? `\n          ${t(lead[0], lead[1], "p", "lead")}` : ""}
        </div>`;
const section = (key, inner, cls = "section section--tight") => `    <section class="${cls}" data-geo="${key}">
      <div class="container">
${inner}
      </div>
    </section>`;

export function blocks(file, c) {
  const [nEn, nAr] = NAMES[file];
  const rows = [MARKET.platforms, MARKET.buying, MARKET.language, MARKET.payment, MARKET.seasons, c.marketExtra].filter(Boolean);
  const market = section("market", `${head(["Egypt and Saudi Arabia", "مصر والسعودية"], [`${nEn} in Egypt and Saudi Arabia.`, `${nAr} في مصر والسعودية.`], c.marketLead)}
        <div class="geo-table" data-reveal data-stack="plain">
          <div class="geo-table__row geo-table__head"><span></span>${t("Egypt", "مصر", "b")}${t("Saudi Arabia", "السعودية", "b")}</div>
${rows.map(([topic, eg, sa]) => `          <div class="geo-table__row">${t(topic[0], topic[1], "span", "geo-table__k")}${t(eg[0], eg[1])}${t(sa[0], sa[1])}</div>`).join("\n")}
        </div>
        <p class="micro geo-src">${t("From our market notes: ", "من ملاحظات السوق عندنا: ")}<a href="index.html#markets">${t("Where we work", "إحنا شغالين فين")}</a> · <a href="egypt-vs-saudi-marketing.html">${t("Egypt vs Saudi Arabia marketing guide", "دليل التسويق في مصر والسعودية")}</a></p>`);
  const explain = section("explain", `        <div class="geo-prose">
${c.explain.map(([h, p]) => `          ${t(h[0], h[1], "h2", "", " data-reveal")}\n          ${t(p[0], p[1], "p")}`).join("\n")}
        </div>`);
  const deliver = section("deliver", `${head(["What you receive", "هتستلم إيه"], ["What you get at each stage.", "هتستلم إيه في كل مرحلة."])}
        <ol class="geo-steps" data-reveal>
${c.deliver.map(([st, items], i) => `          <li><span class="geo-steps__n mono">${String(i + 1).padStart(2, "0")}</span>${t(st[0], st[1], "h3")}<ul>${items.map(([en, ar]) => t(en, ar, "li")).join("")}</ul></li>`).join("\n")}
        </ol>`);
  const priced = section("priced", `        <div class="geo-prose">
          ${t("Pricing", "الأسعار", "p", "eyebrow")}
          ${t(`How ${nEn.toLowerCase().replace(/^seo$/, "SEO").replace(/^google ads$/, "Google Ads")} is priced.`, `سعر ${nAr} بيتحسب إزاي.`, "h2")}
${c.priced.map(([en, ar]) => `          ${t(en, ar, "p")}`).join("\n")}
          <p><a class="link-arrow" href="products.html">${t("How we price", "إزاي بنسعّر")}${ARROW}</a></p>
        </div>`);
  const terms = section("terms", `${head(["Key terms", "مصطلحات مهمة"], ["Terms used on this page.", "مصطلحات في الصفحة دي."])}
        <dl class="geo-terms" data-reveal>
${c.terms.map(id => { const g = TERM[id]; if (!g) throw new Error("glossary: " + id); return `          <div><dt><a href="glossary.html#${id}" data-en="${esc(g.en)}" data-ar="${esc(g.ar)}">${esc(g.en)}</a></dt>${t(g.d[0], g.d[1], "dd")}</div>`; }).join("\n")}
        </dl>
        <p><a class="link-arrow" href="glossary.html">${t("The full glossary", "كل المصطلحات")}${ARROW}</a></p>`);
  const L = c.links;
  const kind = { s: ["Service", "خدمة"], i: ["Industry", "مجال"], p: ["Article", "مقال"], t: ["Free tool", "أداة مجانية"] };
  const linkItems = [...L.services.map(f => ["s", f]), ["i", L.industry], ...L.posts.map(f => ["p", f]), ["t", L.tool]];
  const links = section("links", `${head(["Keep exploring", "كمّل"], ["Related services, industries and reading.", "خدمات ومجالات ومقالات ليها علاقة."])}
        <ul class="geo-links" data-reveal>
${linkItems.map(([k, f]) => { const [en, ar] = titleOf(f); return `          <li><a href="${f}">${t(kind[k][0], kind[k][1], "small")}${t(en, ar, "span")}</a></li>`; }).join("\n")}
        </ul>`);
  return [market, explain, deliver, priced, terms, links].join("\n\n");
}

const faqItem = ([qEn, qAr, aEn, aAr], only = "") => `          <div class="acc-item" data-geo-faq${only ? ` data-only="${only}"` : ""}>
            <button class="acc-item__btn" aria-expanded="false">${t(qEn, qAr)}${PLUS}</button>
            <div class="acc-item__panel"><div>${t(aEn, aAr, "p")}</div></div>
          </div>`;

/** Arabic-only section and FAQs (scripts/content/geo-ar.mjs): Saudi search phrasing, and Arabic pages at least as long as English. */
export function arSection(file) {
  const a = arOnly[file];
  if (!a) return "";
  return `    <section class="section section--tight" data-geo="ar-only" data-only="ar">
      <div class="container geo-prose">
        ${t(a.h2, a.h2, "h2", "", " data-reveal")}
${a.ps.map(p => `        ${t(p, p, "p")}`).join("\n")}
      </div>
    </section>`;
}
export const arFaq = file => (arOnly[file]?.faq || []).map(([q, a]) => faqItem([q, q, a, a], "ar"));

/** Rebuild the FAQPage node (and date the page) inside the page's JSON-LD from the visible accordion. */
export function syncSchema(s, file, { dated = true } = {}) {
  const m = s.match(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/);
  if (!m) return s;
  const data = JSON.parse(m[2]);
  const graph = data["@graph"] || [data];
  const qa = [...s.matchAll(/<button class="acc-item__btn"[^>]*><span data-en="([^"]*)"[^>]*>[\s\S]*?<div class="acc-item__panel"><div><p data-en="([^"]*)"/g)]
    .map(x => [x[1], x[2]].map(v => v.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<")));
  let faq = graph.find(n => n["@type"] === "FAQPage");
  if (qa.length) {
    if (!faq) { faq = { "@type": "FAQPage" }; graph.push(faq); }
    faq.mainEntity = qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }));
  }
  if (dated) {
    const url = "https://brandvitals.io/" + (file === "index.html" ? "" : file);
    let wp = graph.find(n => n["@type"] === "WebPage");
    if (!wp) { wp = { "@type": "WebPage", "@id": url + "#webpage", url }; graph.push(wp); }
    wp.name = (s.match(/data-title-en="([^"]*)"/) || [])[1]?.replace(/&amp;/g, "&") || wp.name;
    wp.dateModified = UPDATED.iso;
    wp.inLanguage = "en";
    wp.isPartOf = { "@id": "https://brandvitals.io/#website" };
    wp.publisher = { "@id": "https://brandvitals.io/#org" };
  }
  if (!data["@graph"]) Object.assign(data, graph[0]);
  return s.replace(m[0], `${m[1]}\n${JSON.stringify(data, null, 2).replace(/^/gm, "  ")}\n  ${m[3]}`);
}

/** Strip every block this script added, so it can add them again. */
export function strip(s) {
  return s
    .replace(/\n\n?[ \t]*<section class="[^"]*" data-geo="[^"]*"[^>]*>[\s\S]*?\n    <\/section>/g, "")
    .replace(/\n[ \t]*<p class="[^"]*" data-geo="[^"]*"[^>]*>[\s\S]*?<\/p>/g, "")
    .replace(/\n {10}<div class="acc-item" data-geo-faq[^>]*>[\s\S]*?\n {10}<\/div>/g, "");
}

export function hero(s, c) {
  // answer-first summary and the visible "Last updated" date, right after the hero lead
  return s.replace(/(<section class="page-hero[\s\S]*?<p class="lead"[^>]*>[\s\S]*?<\/p>)/, `$1
        <p class="answer-lead" data-geo="answer" data-en="${esc(c.answer[0])}" data-ar="${esc(c.answer[1])}">${esc(c.answer[0])}</p>
        <p class="micro geo-updated" data-geo="updated"><time datetime="${UPDATED.iso}" data-en="Last updated ${UPDATED.en}" data-ar="آخر تحديث ${UPDATED.ar}">Last updated ${UPDATED.en}</time></p>`);
}

export function faq(s, items, extra = []) {
  const html = [...items.map(i => faqItem(i)), ...extra];
  if (!html.length) return s;
  return s.replace(/(<div class="acc" data-reveal>\n)([\s\S]*?)(\n {8}<\/div>)/, (m, open, body, close) => open + body + "\n" + html.join("\n") + close);
}

const isMain = import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`;
if (isMain) {
  let n = 0;
  for (const [file, c] of Object.entries({ ...services, ...industries })) {
    const p = path.join(ROOT, file);
    let s = strip(fs.readFileSync(p, "utf8"));
    s = hero(s, c);
    const anchor = s.match(/\n    <section[^>]*>(?:(?!<section)[\s\S])*?<p class="eyebrow" data-en="Proof"/);
    if (!anchor) throw new Error(file + ": no Proof section");
    s = s.replace(anchor[0], "\n" + blocks(file, c) + "\n\n" + arSection(file) + "\n" + anchor[0]);
    s = faq(s, c.faq, arFaq(file));
    s = syncSchema(s, file);
    fs.writeFileSync(p, s);
    n++;
  }
  console.log("service and industry pages updated:", n);
}
