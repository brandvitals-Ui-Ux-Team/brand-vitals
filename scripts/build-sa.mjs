// Builds the Saudi Arabic pages (dist/sa/) from scripts/content/sa-pages.mjs. Each page takes its built
// Arabic twin as the template (header, drawer, footer, brand theme), swaps in Saudi <main>, head tags and
// JSON-LD, and points chrome links that have no Saudi twin at the Arabic site. Called by build-site.mjs.
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import pages from "./content/sa-pages.mjs";

const SITE = "https://brandvitals.io";
export const SA_FILES = new Set(pages.map(p => p.file));
const url = (dir, file) => `${SITE}/${dir ? dir + "/" : ""}${file === "index.html" ? "" : file}`;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const PLUS = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>';
const href = h => /^(\.\.\/|[a-z]+:|#|\/)/i.test(h) || SA_FILES.has(h) ? h : "../ar/" + h;

function section(s) {
  const head = (h2, lead) => `        <div class="section-head" data-reveal>
          <h2>${esc(h2)}</h2>${lead ? `\n          <p class="lead">${esc(lead)}</p>` : ""}
        </div>`;
  const wrap = (inner, extra = "") => `    <section class="section section--tight"${extra}>
      <div class="container">
${inner}
      </div>
    </section>`;
  if (s.kind === "notice") return `    <section class="sb-notice-wrap">
      <div class="container">
        <p class="sb-notice"><span class="sb-notice__dot" aria-hidden="true"></span><span>${esc(s.text)}</span></p>
      </div>
    </section>`;
  if (s.kind === "cards") return wrap(`${head(s.h2)}
        <ul class="sa-cards" data-reveal>
${s.items.map(([h, p, link]) => link ? `          <li><a href="${href(link)}"><b>${esc(h)}</b><span>${esc(p)}</span></a></li>` : `          <li><div><b>${esc(h)}</b><span>${esc(p)}</span></div></li>`).join("\n")}
        </ul>`);
  if (s.kind === "table") return wrap(`${head(s.h2, s.lead)}
        <div class="geo-table geo-table--2" data-reveal>
${s.rows.map(([k, v]) => `          <div class="geo-table__row"><span class="geo-table__k">${esc(k)}</span><span>${esc(v)}</span></div>`).join("\n")}
        </div>`);
  if (s.kind === "steps") return wrap(`${head(s.h2)}
        <ol class="geo-steps" data-reveal>
${s.items.map(([h, p], i) => `          <li><span class="geo-steps__n mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("\n")}
        </ol>`);
  if (s.kind === "prose") return wrap(`        <div class="geo-prose">
          <h2 data-reveal>${esc(s.h2)}</h2>
${s.ps.map(p => `          <p>${esc(p)}</p>`).join("\n")}${s.link ? `\n          <p><a class="link-arrow" href="${href(s.link[1])}">${esc(s.link[0])}${ARROW}</a></p>` : ""}
        </div>`);
  throw new Error("sa section kind " + s.kind);
}

function main(p) {
  const search = p.search ? `
        <form class="bh-search" action="/jobs/search" method="get" role="search" style="margin-top:1.5rem">
          <label class="bh-search__f"><span class="sr-only">المسمى الوظيفي أو المهارة</span><input name="q" type="search" placeholder="المسمى الوظيفي أو المهارة" autocomplete="off"></label>
          <label class="bh-search__f"><span class="sr-only">المدينة</span><input name="city" type="text" placeholder="المدينة" autocomplete="address-level2"></label>
          <button class="btn btn--primary btn--lg" type="submit"><span>ابحث عن وظيفة</span></button>
        </form>` : "";
  return `
    <section class="page-hero grid-field">
      <div class="container">
        <nav class="breadcrumb" aria-label="مسار التنقل">
          <a href="index.html">الرئيسية</a>${p.file === "index.html" ? "" : `<span class="sep">/</span><span>${esc(p.eyebrow)}</span>`}
        </nav>
        <p class="eyebrow">${esc(p.eyebrow)}</p>
        <h1 class="page-hero__title" style="margin-top:1rem">${esc(p.h1)}</h1>
        <p class="lead">${esc(p.lead)}</p>
        <p class="answer-lead">${esc(p.answer)}</p>
        <p class="micro geo-updated"><time datetime="2026-10-16">آخر تحديث 16 أكتوبر 2026</time></p>${search}
        <div class="btn-row" style="margin-top:1.5rem">
          <a class="btn btn--primary btn--lg" href="../ar/contact.html" data-consult><span class="btn__label">احجز استشارة مجانية</span>${ARROW}</a>
          <a class="btn btn--ghost btn--lg" href="../ar/forecast.html"><span>احسب نقطة التعادل</span></a>
        </div>
      </div>
    </section>

${p.sections.map(section).join("\n\n")}

    <section class="section section--tight">
      <div class="container" style="max-width:880px">
        <div class="section-head" data-reveal>
          <p class="eyebrow">أسئلة شائعة</p>
          <h2>أسئلة وأجوبتها.</h2>
        </div>
        <div class="acc" data-reveal>
${p.faq.map(([q, a]) => `          <div class="acc-item">
            <button class="acc-item__btn" aria-expanded="false"><span>${esc(q)}</span>${PLUS}</button>
            <div class="acc-item__panel"><div><p>${esc(a)}</p></div></div>
          </div>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section cta-band">
      <div class="container">
        <div class="cta-band__card grid-field" data-reveal>
          <h2>عندك هدف نمو تبي توصله؟</h2>
          <p class="lead">ابدأ بتدقيق مجاني. نراجع أرقامك ونقول لك بصراحة وش اللي بيحركها.</p>
          <div class="btn-row" style="justify-content:center">
            <a class="btn btn--primary btn--lg" href="../ar/contact.html" data-consult><span class="btn__label">احجز تدقيق مجاني</span>${ARROW}</a>
          </div>
          <p class="micro">بدون التزام · بدون عرض بيعي · من الأحد للخميس</p>
        </div>
      </div>
    </section>
  `;
}

/** hreflang alternates for a page: en, ar (generic Arabic = /ar/), ar-EG, ar-SA when a Saudi twin exists, x-default. */
export function alternates(file) {
  const list = [["en", url("", file)], ["ar", url("ar", file)], ["ar-EG", url("ar", file)]];
  if (SA_FILES.has(file)) list.push(["ar-SA", url("sa", file)]);
  list.push(["x-default", url("", file)]);
  return list;
}

export function buildSa(OUT) {
  fs.mkdirSync(path.join(OUT, "sa"), { recursive: true });
  for (const p of pages) {
    const $ = cheerio.load(fs.readFileSync(path.join(OUT, "ar", p.base), "utf8"));
    const own = url("sa", p.file);
    $("html").attr({ lang: "ar-SA", dir: "rtl", "data-title-ar": p.title, "data-dialect": "sa" });
    $("title").text(p.title);
    $('meta[name="description"]').attr("content", p.desc);
    $('meta[property="og:title"]').attr("content", p.title);
    $('meta[property="og:description"]').attr("content", p.desc);
    $('meta[property="og:url"]').attr("content", own);
    $('meta[property="og:locale"]').attr("content", "ar_SA");
    $('link[rel="canonical"]').attr("href", own);
    $('link[rel="alternate"][hreflang]').remove();
    for (const [lang, h] of alternates(p.file)) $("head").append(`\n  <link rel="alternate" hreflang="${lang}" href="${h}">`);
    $("main").html(main(p));
    // chrome links: keep Saudi twins, send everything else to the Arabic site
    $("header a[href], nav.drawer a[href], footer a[href]").each((_, el) => { const h = $(el).attr("href"); $(el).attr("href", href(h)); });
    // in-page anchors in a sub-brand header point at sections of the Arabic page, which the Saudi page doesn't have
    $('header a[href^="#"], nav.drawer a[href^="#"]').each((_, el) => { const h = $(el).attr("href"); if (h.length > 1 && !$(h).length) $(el).attr("href", `../ar/${p.base}${h}`); });
    const graph = [
      { "@type": "WebPage", "@id": own + "#webpage", url: own, name: p.title, description: p.desc, inLanguage: "ar-SA", dateModified: "2026-10-16",
        isPartOf: { "@id": `${SITE}/#website` }, publisher: { "@id": `${SITE}/#org` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE}/sa/` }, ...(p.file === "index.html" ? [] : [{ "@type": "ListItem", position: 2, name: p.eyebrow, item: own }])] },
      { "@type": "FAQPage", inLanguage: "ar-SA", mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
    ];
    $('script[type="application/ld+json"]').first().text("\n" + JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2) + "\n  ");
    $('script[type="application/ld+json"]').slice(1).remove();
    fs.writeFileSync(path.join(OUT, "sa", p.file), $.html());
  }
  return pages.map(p => p.file);
}
