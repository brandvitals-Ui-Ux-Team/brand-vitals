// Builds the six Brand Vitals service pages, each with its own layout instead of one shared template.
// Content: scripts/content/services.mjs (offer), geo-services.mjs (answer, market, stages, pricing,
// terms, links, FAQ) and service-instruments.mjs (each page's hero instrument and signature diagram).
// Only <main> is rewritten; head, header and footer stay as they are. Re-runnable:
//   node scripts/service-pages.mjs
// geo.mjs and gen-pages.mjs leave these pages alone (they carry data-svc).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import services from "./content/services.mjs";
import geo, { MARKET } from "./content/geo-services.mjs";
import cases from "./content/cases.mjs";
import glossary from "./content/glossary.mjs";
import inst from "./content/service-instruments.mjs";
import { esc, bi, ARROW, breadcrumbNav, ctaBand } from "./lib/chrome.mjs";
import { syncSchema, arSection, arFaq, UPDATED } from "./geo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const T = (en, ar, tag = "span", attrs = "") => bi(tag, en, ar, attrs);
const TERM = Object.fromEntries(glossary.map(g => [g.id, g]));
const PLUS = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>';
const titleOf = f => {
  const s = fs.readFileSync(path.join(ROOT, f), "utf8");
  const en = (s.match(/data-title-en="([^"]*)"/) || [])[1] || f;
  const ar = (s.match(/data-title-ar="([^"]*)"/) || [])[1] || en;
  const clean = v => v.replace(/&amp;/g, "&").split(" | ")[0].trim();
  return [clean(en), clean(ar)];
};

const caseCard = c => `<a class="sv-case" href="${c.file}">
            <span class="sv-case__k">${esc(c.metrics[0][0])}</span>${T(c.metrics[0][1], c.metrics[0][2], "small")}
            ${T(c.client[0], c.client[1], "b")}
            ${T(c.headline[0], c.headline[1], "span", 'class="sv-case__d"')}
          </a>`;

const faqItem = (q, a, only = "") => `          <div class="acc-item"${only ? ` data-only="${only}"` : ""}>
            <button class="acc-item__btn" aria-expanded="false">${T(q[0], q[1])}${PLUS}</button>
            <div class="acc-item__panel"><div>${T(a[0], a[1], "p")}</div></div>
          </div>`;

function main(s) {
  const c = geo[s.file], I = inst[s.file];
  const kind = { s: ["Service", "خدمة"], i: ["Industry", "مجال"], p: ["Article", "مقال"], t: ["Free tool", "أداة مجانية"] };
  const L = c.links;
  const linkItems = [...L.services.map(f => ["s", f]), ["i", L.industry], ...L.posts.map(f => ["p", f]), ["t", L.tool]];
  const market = [MARKET.platforms, MARKET.buying, MARKET.language, MARKET.payment, MARKET.seasons, c.marketExtra].filter(Boolean);
  const stages = s.steps.map((st, i) => [st, (c.deliver[i] || [])[1] || []]);

  return `
    <section class="sv-hero">
      <div class="container sv-hero__grid">
        <div class="sv-hero__copy">
          ${breadcrumbNav([["Home", "الرئيسية", "index.html"], ["Services", "الخدمات", "solutions.html"], [s.name[0], s.name[1]]])}
          <p class="sv-chan"><i aria-hidden="true"></i>${T(I.chan[0], I.chan[1])}</p>
          <h1 class="sv-hero__t">${T(s.h1[0], s.h1[1])}</h1>
          ${T(s.lead[0], s.lead[1], "p", 'class="lead"')}
          <div class="btn-row">
            <a class="btn btn--primary btn--lg" href="contact.html" data-magnetic data-consult>${T("Get a free audit", "احصل على تدقيق مجاني", "span", 'class="btn__label"')}${ARROW}</a>
            <a class="btn btn--ghost btn--lg" href="vitals-score.html" data-magnetic>${T("Check your Vitals Score", "افحص مؤشرات Vitals")}</a>
          </div>
          <p class="sv-plat">${T("Where we run it:", "بنشتغل على:")} ${s.platforms.map(p => `<b>${esc(p)}</b>`).join(" ")}</p>
        </div>
        <div class="sv-hero__inst">
          ${I.hero()}
        </div>
      </div>
      <div class="container sv-answer">
        <p class="answer-lead" data-geo="answer" data-en="${esc(c.answer[0])}" data-ar="${esc(c.answer[1])}">${esc(c.answer[0])}</p>
        <p class="micro geo-updated" data-geo="updated"><time datetime="${UPDATED.iso}" data-en="Last updated ${UPDATED.en}" data-ar="آخر تحديث ${UPDATED.ar}">Last updated ${UPDATED.en}</time></p>
      </div>
    </section>

    <section class="section sv-sig">
      <div class="container sv-sig__grid">
        <div class="sv-sig__copy" data-reveal>
          ${T(c.explain[0][0][0], c.explain[0][0][1], "h2")}
          ${T(c.explain[0][1][0], c.explain[0][1][1], "p")}
        </div>
        <div class="sv-sig__art" data-reveal>
          ${I.sig()}
        </div>
      </div>
    </section>

    <section class="section section--tight sv-inc">
      <div class="container">
        ${T("What's included", "الخدمة فيها إيه", "h2", 'class="sv-h2" data-reveal')}
        <dl class="sv-inc__list" data-reveal>
${s.included.map(([t, d]) => `          <div>${T(t[0], t[1], "dt")}${T(d[0], d[1], "dd")}</div>`).join("\n")}
        </dl>
      </div>
    </section>

    <section class="section section--tight sv-run">
      <div class="container">
        ${T("How it runs, and what you receive", "الشغل بيمشي إزاي، وهتستلم إيه", "h2", 'class="sv-h2" data-reveal')}
        <ol class="sv-run__list" data-reveal>
${stages.map(([[t, d], items], i) => `          <li>
            <span class="sv-run__n" aria-hidden="true">${i + 1}</span>
            <div class="sv-run__what">${T(t[0], t[1], "h3")}${T(d[0], d[1], "p")}</div>
            <ul class="sv-run__get">${items.map(([en, ar]) => T(en, ar, "li")).join("")}</ul>
          </li>`).join("\n")}
        </ol>
      </div>
    </section>

    <section class="section section--tight sv-signs">
      <div class="container sv-signs__grid">
        <div data-reveal>
          ${T("Sound familiar?", "الكلام ده مألوف؟", "h2", 'class="sv-h2"')}
          ${T("If two or more of these are true, a short audit will likely pay for itself.", "لو اتنين أو أكتر من دول بيحصلوا عندك، تدقيق قصير غالبًا هيستاهل.", "p", 'class="lead"')}
        </div>
        <ul class="sv-signs__list" data-reveal>
${s.signs.map(x => `          ${T(x[0], x[1], "li")}`).join("\n")}
        </ul>
      </div>
    </section>

    <section class="section section--tight sv-essay">
      <div class="container sv-essay__in" data-reveal>
        ${T(c.explain[1][0][0], c.explain[1][0][1], "h2")}
        ${T(c.explain[1][1][0], c.explain[1][1][1], "p")}
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="section-head" data-reveal>
          ${T(`${s.name[0]} in Egypt and Saudi Arabia.`, `${s.name[1]} في مصر والسعودية.`, "h2")}
          ${T(c.marketLead[0], c.marketLead[1], "p", 'class="lead"')}
        </div>
        <div class="geo-table" data-reveal data-stack="plain">
          <div class="geo-table__row geo-table__head"><span></span>${T("Egypt", "مصر", "b")}${T("Saudi Arabia", "السعودية", "b")}</div>
${market.map(([topic, eg, sa]) => `          <div class="geo-table__row">${T(topic[0], topic[1], "span", 'class="geo-table__k"')}${T(eg[0], eg[1])}${T(sa[0], sa[1])}</div>`).join("\n")}
        </div>
        <p class="micro geo-src">${T("From our market notes: ", "من ملاحظات السوق عندنا: ")}<a href="index.html#markets">${T("Where we work", "إحنا شغالين فين")}</a> · <a href="egypt-vs-saudi-marketing.html">${T("Egypt vs Saudi Arabia marketing guide", "دليل التسويق في مصر والسعودية")}</a></p>
      </div>
    </section>

    <section class="section section--tight sv-proof">
      <div class="container">
        <div class="sv-proof__head" data-reveal>
          ${T("Work that used this service", "شغل اتعمل بالخدمة دي", "h2", 'class="sv-h2"')}
          <a class="btn btn--ghost" href="work.html" data-magnetic>${T("All work", "كل الأعمال")}${ARROW}</a>
        </div>
        <div class="sv-proof__row" data-reveal>
          ${s.cases.map(f => cases.find(x => x.file === f)).filter(Boolean).slice(0, 3).map(caseCard).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section section--tight sv-ref">
      <div class="container sv-ref__grid">
        <div class="sv-ref__price" data-reveal>
          ${T(`How ${s.name[0].replace(/^SEO$/, "SEO")} is priced`, `سعر ${s.name[1]} بيتحسب إزاي`, "h2", 'class="sv-h3"')}
${c.priced.map(([en, ar]) => `          ${T(en, ar, "p")}`).join("\n")}
          <p><a class="link-arrow" href="products.html">${T("How we price", "إزاي بنسعّر")}${ARROW}</a></p>
        </div>
        <div class="sv-ref__terms" data-reveal>
          ${T("Terms used on this page", "مصطلحات في الصفحة دي", "h2", 'class="sv-h3"')}
          <dl class="geo-terms sv-terms">
${c.terms.map(id => { const g = TERM[id]; if (!g) throw new Error("glossary: " + id); return `            <div><dt><a href="glossary.html#${id}" data-en="${esc(g.en)}" data-ar="${esc(g.ar)}">${esc(g.en)}</a></dt>${T(g.d[0], g.d[1], "dd")}</div>`; }).join("\n")}
          </dl>
          <p><a class="link-arrow" href="glossary.html">${T("The full glossary", "كل المصطلحات")}${ARROW}</a></p>
        </div>
      </div>
      <div class="container">
        <ul class="geo-links sv-links" data-reveal>
${linkItems.map(([k, f]) => { const [en, ar] = titleOf(f); return `          <li><a href="${f}">${T(kind[k][0], kind[k][1], "small")}${T(en, ar)}</a></li>`; }).join("\n")}
        </ul>
      </div>
    </section>

${arSection(s.file)}
    <section class="section section--tight">
      <div class="container" style="max-width:880px">
        <div class="section-head" data-reveal>
          ${T("Questions, answered.", "أسئلة، بإجابات.", "h2")}
        </div>
        <div class="acc" data-reveal>
${[...s.faq.map(q => faqItem(q.q, q.a)), ...c.faq.map(([qe, qa, ae, aa]) => faqItem([qe, qa], [ae, aa])), ...arFaq(s.file)].join("\n")}
        </div>
      </div>
    </section>

    ${ctaBand()}
  `;
}

let n = 0;
for (const s of services) {
  const I = inst[s.file];
  if (!I) continue;
  const p = path.join(ROOT, s.file);
  let html = fs.readFileSync(p, "utf8");
  const m = html.match(/<main id="main"[^>]*>[\s\S]*?\n  <\/main>/);
  if (!m) throw new Error(s.file + ": no <main>");
  html = html.replace(m[0], `<main id="main" data-svc="${I.key}">${main(s)}\n  </main>`);
  if (!html.includes("assets/css/services.css")) html = html.replace(/(<link rel="stylesheet" href="assets\/css\/main\.css">)/, '$1\n  <link rel="stylesheet" href="assets/css/services.css">');
  html = syncSchema(html, s.file);
  fs.writeFileSync(p, html);
  n++;
}
console.log("service pages built:", n);
