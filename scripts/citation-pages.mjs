// Pages built for citation (UI fix spec 12.5): glossary.html and egypt-vs-saudi-marketing.html.
// Generated from scripts/content/glossary.mjs and scripts/content/market-guide.mjs on the shared chrome
// (header, drawer and footer come from index.html via scripts/lib/chrome.mjs). Re-run after editing the
// content files. Usage: node scripts/citation-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { esc, bi, ARROW, head, pageShell, crumbs, breadcrumbNav, faqBlock, faqSchema, ctaBand } from "./lib/chrome.mjs";
import glossary from "./content/glossary.mjs";
import guide from "./content/market-guide.mjs";
import { UPDATED, arSection, arFaq, faq } from "./geo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORG = { "@id": "https://brandvitals.io/#org" };
const write = (file, html) => {
  html = faq(html, [], arFaq(file));
  html = html.replace(/dashboard\.html\?brand=bv&amp;page=index\.html/g, `dashboard.html?brand=bv&amp;page=${file}`);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log("  wrote", file);
};
const titleOf = f => {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  const g = k => ((s.match(new RegExp(`data-title-${k}="([^"]*)"`)) || [])[1] || f).replace(/&amp;/g, "&").split(" | ")[0].trim();
  return [g("en"), g("ar")];
};
const hero = ({ crumb, eyebrow, h1, lead, answer }) => `    <section class="page-hero grid-field">
      <div class="orb orb--a float-slow" style="top:-20%; inset-inline-end:-8%;" data-parallax="0.06"></div>
      <div class="container">
        ${breadcrumbNav(crumb)}
        ${bi("p", eyebrow[0], eyebrow[1], 'class="eyebrow"')}
        <h1 class="page-hero__title" style="margin-top:1rem">${bi("span", h1[0], h1[1])}</h1>
        ${bi("p", lead[0], lead[1], 'class="lead"')}
        ${bi("p", answer[0], answer[1], 'class="answer-lead"')}
        <p class="micro geo-updated"><time datetime="${UPDATED.iso}" data-en="Last updated ${UPDATED.en}" data-ar="آخر تحديث ${UPDATED.ar}">Last updated ${UPDATED.en}</time></p>
      </div>
    </section>`;
const webPage = (file, name) => ({ "@type": "WebPage", "@id": `https://brandvitals.io/${file}#webpage`, url: `https://brandvitals.io/${file}`, name, dateModified: UPDATED.iso, inLanguage: "en", isPartOf: { "@id": "https://brandvitals.io/#website" }, publisher: ORG });

// ---------------------------------------------------------------- glossary
{
  const file = "glossary.html";
  const url = "https://brandvitals.io/" + file;
  const GROUPS = [["measure", "Money and measurement", "الفلوس والقياس"], ["tracking", "Tracking", "التتبع"], ["media", "Paid media and creative", "الإعلانات والكرييتيف"], ["web", "Websites and search", "المواقع والبحث"], ["brand", "Brand", "البراند"], ["markets", "Egypt and Saudi Arabia", "مصر والسعودية"]];
  const title = ["Marketing Glossary: ROAS, CPA, GA4 and More | Brand Vitals", "قاموس التسويق: ROAS وCPA وGA4 وغيرهم | Brand Vitals"];
  const desc = ["Plain definitions of the marketing terms used on the Brand Vitals site, from ROAS and break-even ROAS to Conversions API, hreflang and cash on delivery.",
    "تعريفات بسيطة لمصطلحات التسويق المستخدمة في موقع Brand Vitals، من ROAS ونقطة التعادل لحد Conversions API وhreflang والدفع عند الاستلام."];
  const schema = [
    crumbs([["Home", ""], ["Glossary", file]]),
    webPage(file, title[0]),
    { "@type": "DefinedTermSet", "@id": url + "#terms", name: "Brand Vitals marketing glossary", url, inLanguage: "en", publisher: ORG,
      hasDefinedTerm: glossary.map(g => ({ "@type": "DefinedTerm", "@id": `${url}#${g.id}`, name: g.en, description: g.d[0], url: `${url}#${g.id}`, inDefinedTermSet: { "@id": url + "#terms" } })) }
  ];
  const main = `${hero({ crumb: [["Home", "الرئيسية", "index.html"], ["Glossary", "المصطلحات"]], eyebrow: ["Glossary", "المصطلحات"],
    h1: ["The marketing terms we use, defined.", "مصطلحات التسويق اللي بنستخدمها، متعرّفة."],
    lead: ["Every term below appears somewhere on this site. Each definition stands on its own, so you can link to it or quote it.", "كل مصطلح هنا موجود في مكان ما في الموقع. وكل تعريف كامل لوحده، فتقدر تبعت لينكه أو تقتبس منه."],
    answer: ["This glossary defines the marketing terms Brand Vitals uses with clients in Egypt and Saudi Arabia: measurement such as ROAS and CPA, tracking such as GA4 and Conversions API, paid media, websites and search, brand, and the market terms that shape plans in both countries.",
      "القاموس ده بيعرّف مصطلحات التسويق اللي Brand Vitals بتستخدمها مع العملاء في مصر والسعودية: القياس زي ROAS وCPA، والتتبع زي GA4 وConversions API، والإعلانات، والمواقع والبحث، والبراند، ومصطلحات السوق اللي بتشكّل الخطط في البلدين."] })}

    <section class="section section--tight">
      <div class="container">
        <nav class="gl-jump" aria-label="Glossary sections" data-ar-label="أقسام القاموس">
          ${GROUPS.map(([k, en, ar]) => `<a href="#g-${k}" data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</a>`).join("\n          ")}
        </nav>
${GROUPS.map(([k, en, ar]) => `        <div class="gl-group" id="g-${k}">
          ${bi("h2", en, ar)}
          <div class="gl-list">
${glossary.filter(g => g.group === k).map(g => `            <article class="gl-item" id="${g.id}">
              ${bi("h3", g.en, g.ar)}
              ${bi("p", g.d[0], g.d[1])}
            </article>`).join("\n")}
          </div>
        </div>`).join("\n")}
      </div>
    </section>

${arSection(file)}

${ctaBand({ h: ["Want these numbers on your account?", "عايز الأرقام دي على حسابك؟"], p: ["Start with a free audit. A strategist reviews your ROAS, CPA and tracking and tells you what will move them.", "ابدأ بتدقيق مجاني. حد من فريقنا بيراجع الـ ROAS وتكلفة الاستحواذ والتتبع عندك، وبيقولك إيه اللي هيحرّكهم."], secondary: ["Forecast your growth", "توقّع نموّك", "forecast.html"] })}`;
  write(file, pageShell({ head: head({ file, titleEn: title[0], titleAr: title[1], descEn: desc[0], descAr: desc[1], schema }), main }));
}

// ---------------------------------------------------------------- Egypt vs Saudi Arabia guide
{
  const file = "egypt-vs-saudi-marketing.html";
  const g = guide;
  const items = g.faq.map(([q0, q1, a0, a1]) => ({ q: [q0, q1], a: [a0, a1] }));
  const schema = [
    crumbs([["Home", ""], ["Egypt vs Saudi Arabia", file]]),
    webPage(file, g.title[0]),
    { "@type": "Article", "@id": `https://brandvitals.io/${file}#article`, headline: g.h1[0], description: g.desc[0], inLanguage: "en", datePublished: UPDATED.iso, dateModified: UPDATED.iso,
      author: ORG, publisher: ORG, mainEntityOfPage: { "@id": `https://brandvitals.io/${file}#webpage` }, about: [{ "@type": "Country", name: "Egypt" }, { "@type": "Country", name: "Saudi Arabia" }] },
    faqSchema(items)
  ];
  const main = `${hero({ crumb: [["Home", "الرئيسية", "index.html"], ["Egypt vs Saudi Arabia", "مصر والسعودية"]], eyebrow: ["Market guide", "دليل السوق"], h1: g.h1, lead: g.lead, answer: g.answer })}

    <section class="section section--tight">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "Side by side", "جنب بعض", 'class="eyebrow"')}
          ${bi("h2", "Egypt and Saudi Arabia, compared.", "مصر والسعودية، مقارنة.")}
        </div>
        <div class="geo-table" data-reveal data-stack="plain">
          <div class="geo-table__row geo-table__head"><span></span>${bi("b", "Egypt", "مصر")}${bi("b", "Saudi Arabia", "السعودية")}</div>
${g.table.map(([k, eg, sa]) => `          <div class="geo-table__row">${bi("span", k[0], k[1], 'class="geo-table__k"')}${bi("span", eg[0], eg[1])}${bi("span", sa[0], sa[1])}</div>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container geo-prose">
${g.sections.map(([h, ps]) => `        ${bi("h2", h[0], h[1], "data-reveal")}\n${ps.map(([en, ar]) => `        ${bi("p", en, ar)}`).join("\n")}`).join("\n")}
      </div>
    </section>

${arSection(file)}

${faqBlock(items)}

    <section class="section section--tight">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "Keep exploring", "كمّل", 'class="eyebrow"')}
          ${bi("h2", "Related services, reading and tools.", "خدمات ومقالات وأدوات ليها علاقة.")}
        </div>
        <ul class="geo-links" data-reveal>
${g.links.map(f => { const [en, ar] = titleOf(f); return `          <li><a href="${f}">${bi("span", en, ar)}</a></li>`; }).join("\n")}
        </ul>
      </div>
    </section>

${ctaBand({})}`;
  write(file, pageShell({ head: head({ file, titleEn: g.title[0], titleAr: g.title[1], descEn: g.desc[0], descAr: g.desc[1], ogType: "article", schema }), main }));
}
