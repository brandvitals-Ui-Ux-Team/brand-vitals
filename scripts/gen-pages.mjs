// Generates the content pages (services, industries, case studies, articles,
// Vitals Score) and refreshes the shared header/drawer/footer on master pages.
// Run it once when adding pages from scripts/content/*. It is NOT part of the
// build: after generation the HTML belongs to the dashboard (CMS), and running
// this again overwrites dashboard edits on the generated pages.
// Usage: npm run gen:pages
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { esc, bi, ARROW, head, pageShell, crumbs, breadcrumbNav, faqBlock, faqSchema, ctaBand, HEADER, DRAWER, FOOTER, SERVICES, INDUSTRIES } from "./lib/chrome.mjs";
import services from "./content/services.mjs";
import industries from "./content/industries.mjs";
import cases from "./content/cases.mjs";
import posts from "./content/posts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = (file, html) => { fs.writeFileSync(path.join(ROOT, file), html); console.log("  wrote", file); };
const ORG = { "@id": "https://brandvitals.io/#org" };
const caseBy = f => cases.find(c => c.file === f);
const svcBy = f => services.find(s => s.file === f);

const pageHero = ({ crumb, eyebrow, h1, lead, extra = "" }) => `    <section class="page-hero grid-field">
      <div class="orb orb--a float-slow" style="top:-20%; inset-inline-end:-8%;" data-parallax="0.06"></div>
      <div class="container">
        ${breadcrumbNav(crumb)}
        ${bi("p", eyebrow[0], eyebrow[1], 'class="eyebrow"')}
        <h1 class="page-hero__title" style="margin-top:1rem">${bi("span", h1[0], h1[1])}</h1>
        ${bi("p", lead[0], lead[1], 'class="lead"')}
${extra}
      </div>
    </section>`;

const caseCard = (c, i = 0) => `<a class="card case-card case-card--link" href="${c.file}" data-reveal style="--rd:${(i * 0.08).toFixed(2)}s">
            <div class="case-card__media case-card__media--ph"><span class="case-card__stat"><em>${esc(c.metrics[0][0])}</em>&nbsp;${bi("span", c.metrics[0][1], c.metrics[0][2])}</span></div>
            <div class="case-card__body">
              <div class="case-card__meta">${bi("span", c.tags[0][0], c.tags[0][1], 'class="chip chip--accent"')}${bi("span", c.tags[1][0], c.tags[1][1], 'class="chip"')}</div>
              ${bi("h3", c.client[0], c.client[1])}
              ${bi("p", c.headline[0], c.headline[1])}
              <span class="case-card__go">${bi("span", "Read the case", "اقرأ دراسة الحالة")}${ARROW}</span>
            </div>
          </a>`;

const relatedCases = (files, title = ["Related work", "أعمال ذات صلة"]) => `    <section class="section section--tight">
      <div class="container">
        <div class="section-head section-head--split" data-reveal>
          <div style="display:grid; gap:1rem">
            ${bi("p", "Proof", "الدليل", 'class="eyebrow"')}
            ${bi("h2", title[0], title[1])}
          </div>
          <a class="btn btn--ghost" href="work.html" data-magnetic>${bi("span", "All work", "كل الأعمال")}${ARROW}</a>
        </div>
        <div class="grid-3">
          ${files.map(caseBy).filter(Boolean).slice(0, 3).map(caseCard).join("\n          ")}
        </div>
      </div>
    </section>`;

// ---------------------------------------------------------------- services
function servicePage(s) {
  const schema = [
    crumbs([["Home", ""], ["Services", "solutions.html"], [s.name[0], s.file]]),
    { "@type": "Service", name: s.name[0], serviceType: s.name[0], description: s.desc[0], provider: ORG, areaServed: ["Egypt", "Saudi Arabia", "United Arab Emirates", "MENA"], availableLanguage: ["en", "ar"], url: "https://brandvitals.io/" + s.file },
    faqSchema(s.faq)
  ];
  const main = `${pageHero({
    crumb: [["Home", "الرئيسية", "index.html"], ["Services", "الخدمات", "solutions.html"], [s.name[0], s.name[1]]],
    eyebrow: s.eyebrow, h1: s.h1, lead: s.lead,
    extra: `        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="contact.html" data-magnetic data-consult>${bi("span", "Get a free audit", "احصل على تدقيق مجاني", 'class="btn__label"')}${ARROW}</a>
          <a class="btn btn--ghost btn--lg" href="vitals-score.html" data-magnetic>${bi("span", "Check your Vitals Score", "افحص مؤشرات Vitals")}</a>
        </div>
        <div class="chip-row">${s.platforms.map(p => `<span class="chip">${esc(p)}</span>`).join("")}</div>`
  })}

    <section class="section">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "01 · What's included", "01 · ما يشمله", 'class="eyebrow"')}
          ${bi("h2", "Everything it takes, in one team.", "كل ما يلزم، في فريق واحد.")}
        </div>
        <div class="feature-grid">
${s.included.map(([t, d], i) => `          <article class="card feature" data-reveal style="--rd:${(i * 0.05).toFixed(2)}s">
            <span class="feature__num mono">${String(i + 1).padStart(2, "0")}</span>
            ${bi("h3", t[0], t[1])}
            ${bi("p", d[0], d[1])}
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section--tight band-light grid-field">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "02 · How we run it", "02 · كيف ننفّذها", 'class="eyebrow"')}
          ${bi("h2", "Four stages, clear milestones.", "أربع مراحل، ومحطات واضحة.")}
        </div>
        <div class="process__grid process__grid--4">
${s.steps.map(([t, d], i) => `          <article class="process-step" data-reveal style="--rd:${(i * 0.06).toFixed(2)}s">
            <span class="process-step__num">${String(i + 1).padStart(2, "0")}</span>
            ${bi("h3", t[0], t[1])}
            ${bi("p", d[0], d[1])}
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="split split--top">
          <div class="section-head" data-reveal style="margin:0">
            ${bi("p", "03 · Signs you need this", "03 · علامات أنك تحتاج هذا", 'class="eyebrow"')}
            ${bi("h2", "Sound familiar?", "هل يبدو هذا مألوفًا؟")}
            ${bi("p", "If two or more of these are true, a short audit will likely pay for itself.", "إذا انطبق اثنان أو أكثر، فغالبًا سيستحق التدقيق القصير وقته.", 'class="lead"')}
          </div>
          <ul class="check-list" data-reveal>
${s.signs.map(x => `            ${bi("li", x[0], x[1])}`).join("\n")}
          </ul>
        </div>
      </div>
    </section>

${relatedCases(s.cases)}

    ${faqBlock(s.faq)}

    ${ctaBand()}`;
  return pageShell({ head: head({ file: s.file, titleEn: s.title[0], titleAr: s.title[1], descEn: s.desc[0], descAr: s.desc[1], schema }), main });
}

// -------------------------------------------------------------- industries
function industryPage(s) {
  const schema = [crumbs([["Home", ""], [s.name[0], s.file]]), faqSchema(s.faq)];
  const main = `${pageHero({
    crumb: [["Home", "الرئيسية", "index.html"], [s.name[0], s.name[1]]],
    eyebrow: s.name, h1: s.h1, lead: s.lead,
    extra: `        <div class="btn-row">
          <a class="btn btn--primary btn--lg" href="contact.html" data-magnetic data-consult>${bi("span", "Get a free audit", "احصل على تدقيق مجاني", 'class="btn__label"')}${ARROW}</a>
          <a class="btn btn--ghost btn--lg" href="#work" data-magnetic>${bi("span", "See results", "شاهد النتائج")}</a>
        </div>`
  })}

    <section class="section">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "01 · The challenge", "01 · التحدي", 'class="eyebrow"')}
          ${bi("h2", "What usually gets in the way.", "ما الذي يعيق عادةً.")}
        </div>
        <div class="grid-3">
${s.challenges.map(([t, d], i) => `          <article class="card feature" data-reveal style="--rd:${(i * 0.06).toFixed(2)}s">
            <span class="feature__num mono">${String(i + 1).padStart(2, "0")}</span>
            ${bi("h3", t[0], t[1])}
            ${bi("p", d[0], d[1])}
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section--tight band-light grid-field">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "02 · Our approach", "02 · منهجنا", 'class="eyebrow"')}
          ${bi("h2", "How we grow businesses like yours.", "كيف ننمّي أعمالًا مثل عملك.")}
        </div>
        <div class="process__grid process__grid--4">
${s.approach.map(([t, d], i) => `          <article class="process-step" data-reveal style="--rd:${(i * 0.06).toFixed(2)}s">
            <span class="process-step__num">${String(i + 1).padStart(2, "0")}</span>
            ${bi("h3", t[0], t[1])}
            ${bi("p", d[0], d[1])}
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    <div id="work"></div>
${relatedCases(s.cases, ["Results in this industry", "نتائج في هذا القطاع"])}

    <section class="section section--tight">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "Services we use", "الخدمات المستخدمة", 'class="eyebrow"')}
        </div>
        <div class="link-grid" data-reveal>
          ${SERVICES.map(x => `<a class="link-tile" href="${x.file}">${bi("span", x.en, x.ar)}${ARROW}</a>`).join("\n          ")}
        </div>
      </div>
    </section>

    ${faqBlock(s.faq)}

    ${ctaBand()}`;
  return pageShell({ head: head({ file: s.file, titleEn: s.title[0], titleAr: s.title[1], descEn: s.desc[0], descAr: s.desc[1], schema }), main });
}

// ------------------------------------------------------------- case studies
function casePage(c) {
  const titleEn = `${c.client[0]} case study | Brand Vitals`;
  const titleAr = `دراسة حالة: ${c.client[1]} | Brand Vitals`;
  const descEn = `${c.headline[0]} ${c.result[0]}`.slice(0, 300);
  const descAr = `${c.headline[1]} ${c.result[1]}`.slice(0, 300);
  const schema = [
    crumbs([["Home", ""], ["Work", "work.html"], [c.client[0], c.file]]),
    { "@type": "Article", headline: c.headline[0], about: c.client[0], author: ORG, publisher: ORG, inLanguage: ["en", "ar"], mainEntityOfPage: "https://brandvitals.io/" + c.file }
  ];
  const ind = industries.find(i => i.file === c.industry);
  const main = `    <section class="page-hero grid-field">
      <div class="orb orb--a float-slow" style="top:-20%; inset-inline-end:-8%;" data-parallax="0.06"></div>
      <div class="container">
        ${breadcrumbNav([["Home", "الرئيسية", "index.html"], ["Work", "أعمالنا", "work.html"], [c.client[0], c.client[1]]])}
        <div class="case-card__meta">${bi("span", c.tags[0][0], c.tags[0][1], 'class="chip chip--accent"')}${bi("span", c.tags[1][0], c.tags[1][1], 'class="chip"')}</div>
        ${bi("p", c.client[0], c.client[1], 'class="eyebrow"')}
        <h1 class="page-hero__title page-hero__title--md">${bi("span", c.headline[0], c.headline[1])}</h1>
        <div class="case-metrics" data-reveal>
${c.metrics.map(m => `          <div class="case-metric"><span class="case-metric__v">${esc(m[0])}</span>${bi("span", m[1], m[2], 'class="case-metric__l"')}</div>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="case-layout">
          <aside class="case-facts card" data-reveal>
            <dl>
              <div>${bi("dt", "Industry", "القطاع")}<dd>${ind ? `<a href="${ind.file}" data-en="${esc(ind.name[0])}" data-ar="${esc(ind.name[1])}">${esc(ind.name[0])}</a>` : ""}</dd></div>
              <div>${bi("dt", "Market", "السوق")}${bi("dd", c.tags[1][0], c.tags[1][1])}</div>
              <div>${bi("dt", "Services", "الخدمات")}<dd class="case-facts__list">${c.services.map(svcBy).filter(Boolean).map(x => `<a href="${x.file}" data-en="${esc(x.name[0])}" data-ar="${esc(x.name[1])}">${esc(x.name[0])}</a>`).join("")}</dd></div>
            </dl>
            ${bi("p", "Client identity withheld for confidentiality. Full details are shared in a call where the client permits.", "هوية العميل محجوبة للسرّية. نشارك التفاصيل كاملة في مكالمة حين يسمح العميل.", 'class="micro"')}
          </aside>
          <article class="prose" data-reveal>
            ${bi("h2", "The challenge", "التحدي")}
            ${bi("p", c.challenge[0], c.challenge[1])}
            ${bi("h2", "What we did", "ما قمنا به")}
            <ul>
${c.approach.map(a => `              ${bi("li", a[0], a[1])}`).join("\n")}
            </ul>
            ${bi("h2", "The result", "النتيجة")}
            ${bi("p", c.result[0], c.result[1])}
          </article>
        </div>
      </div>
    </section>

${relatedCases(cases.filter(x => x.file !== c.file).map(x => x.file), ["More work", "أعمال أخرى"])}

    ${ctaBand({ h: ["Want results like these?", "تريد نتائج مثل هذه؟"], p: ["Tell us where you are today. We'll show you the plan and the number we'd hold ourselves to.", "أخبرنا أين أنت اليوم. سنريك الخطة والرقم الذي نلتزم به."] })}`;
  return pageShell({ head: head({ file: c.file, titleEn, titleAr, descEn, descAr, ogType: "article", schema }), main });
}

// ------------------------------------------------------------------- posts
const fmtDate = (d, lang) => new Date(d + "T12:00:00Z").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

function postPage(p) {
  const schema = [
    crumbs([["Home", ""], ["Insights", "blog.html"], [p.title[0], p.file]]),
    { "@type": "BlogPosting", headline: p.title[0], description: p.desc[0], datePublished: p.date, dateModified: p.date, author: ORG, publisher: ORG, inLanguage: ["en", "ar"], mainEntityOfPage: "https://brandvitals.io/" + p.file }
  ];
  const others = posts.filter(x => x.file !== p.file).slice(0, 3);
  const main = `    <section class="page-hero page-hero--article grid-field">
      <div class="container">
        ${breadcrumbNav([["Home", "الرئيسية", "index.html"], ["Insights", "مقالات", "blog.html"], [p.cat[0], p.cat[1]]])}
        <div class="post-card__meta">${bi("span", p.cat[0], p.cat[1], 'class="cat"')}<span>·</span>${bi("time", fmtDate(p.date, "en"), fmtDate(p.date, "ar"), `datetime="${p.date}"`)}<span>·</span>${bi("span", p.read + " min read", "قراءة " + p.read + " دقائق")}</div>
        <h1 class="page-hero__title page-hero__title--md">${bi("span", p.title[0], p.title[1])}</h1>
        ${bi("p", p.desc[0], p.desc[1], 'class="lead"')}
      </div>
    </section>

    <section class="section section--tight">
      <div class="container" style="max-width:780px">
        <article class="prose prose--article">
          ${bi("p", p.intro[0], p.intro[1], 'class="prose__intro"')}
${p.sections.map(s => `          ${bi("h2", s.h[0], s.h[1])}
${(s.p || []).map(x => `          ${bi("p", x[0], x[1])}`).join("\n")}${s.list ? `
          <ul>
${s.list.map(x => `            ${bi("li", x[0], x[1])}`).join("\n")}
          </ul>` : ""}`).join("\n")}
          <aside class="takeaway">
            ${bi("p", "The takeaway", "الخلاصة", 'class="eyebrow"')}
            ${bi("p", p.takeaway[0], p.takeaway[1])}
          </aside>
        </article>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "Keep reading", "تابع القراءة", 'class="eyebrow"')}
        </div>
        <div class="grid-3">
          ${others.map(postCard).join("\n          ")}
        </div>
      </div>
    </section>

    ${ctaBand({ h: ["Want this thinking on your account?", "تريد هذا التفكير على حسابك؟"], p: ["Every article starts as client work. Book a consultation and get the version tailored to your numbers.", "كل مقال يبدأ من عمل مع عميل. احجز استشارة واحصل على النسخة المخصّصة لأرقامك."], btn: ["Book a free consultation", "احجز استشارة مجانية"] })}`;
  return pageShell({ head: head({ file: p.file, titleEn: p.title[0] + " | Brand Vitals", titleAr: p.title[1] + " | Brand Vitals", descEn: p.desc[0], descAr: p.desc[1], ogType: "article", schema }), main });
}

function postCard(p, i = 0) {
  return `<a class="card post-card" href="${p.file}" data-reveal style="--rd:${(i * 0.06).toFixed(2)}s">
            <div class="post-card__media post-card__media--ph">${bi("span", p.cat[0], p.cat[1], 'class="case-ph-tag"')}</div>
            <div class="post-card__body">
              <div class="post-card__meta">${bi("span", p.cat[0], p.cat[1], 'class="cat"')}<span>·</span>${bi("span", p.read + " min read", "قراءة " + p.read + " دقائق")}</div>
              ${bi("h3", p.title[0], p.title[1])}
              ${bi("p", p.desc[0], p.desc[1])}
            </div>
          </a>`;
}

// ----------------------------------------------------------- vitals score
function vitalsScorePage() {
  const file = "vitals-score.html";
  const t = ["Free Vitals Score | Website & Marketing Health Check | Brand Vitals", "فحص Vitals المجاني | فحص صحة موقعك وتسويقك | Brand Vitals"];
  const d = ["Get a free score out of 100 for your website speed, SEO, Arabic readiness and marketing tracking, with a prioritized list of what to fix first.",
    "احصل على درجة مجانية من 100 لسرعة موقعك والسيو وجاهزية العربي وتتبع التسويق، مع قائمة مرتّبة بما يجب إصلاحه أولًا."];
  const schema = [crumbs([["Home", ""], ["Vitals Score", file]]),
    { "@type": "WebApplication", name: "Brand Vitals Score", applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, provider: ORG, url: "https://brandvitals.io/" + file }];
  const q = (name, en, ar, opts) => `<fieldset class="vs-q">
                ${bi("legend", en, ar)}
                <div class="vs-opts">
${opts.map(([v, oen, oar]) => `                  <label class="vs-opt"><input type="radio" name="${name}" value="${v}" required>${bi("span", oen, oar)}</label>`).join("\n")}
                </div>
              </fieldset>`;
  const main = `    <section class="page-hero grid-field vs-hero">
      <div class="orb orb--a float-slow" style="top:-20%; inset-inline-end:-8%;" data-parallax="0.06"></div>
      <div class="container">
        ${breadcrumbNav([["Home", "الرئيسية", "index.html"], ["Vitals Score", "فحص Vitals"]])}
        ${bi("p", "Free tool · 60 seconds", "أداة مجانية · 60 ثانية", 'class="eyebrow"')}
        <h1 class="page-hero__title">${bi("span", "What's your brand's", "ما هي مؤشرات")} <span class="accent-text" data-en="Vitals Score?" data-ar="علامتك الحيوية؟">Vitals Score?</span></h1>
        ${bi("p", "We scan your website with Google's own Lighthouse engine, check your Arabic and SEO readiness, and ask four quick questions about your marketing. You get a score out of 100 and the three fixes that matter most.", "نفحص موقعك بمحرك Lighthouse من جوجل، ونتحقق من جاهزية العربي والسيو، ونسألك أربعة أسئلة سريعة عن تسويقك. تحصل على درجة من 100 وأهم ثلاثة إصلاحات.", 'class="lead"')}
      </div>
    </section>

    <section class="section section--tight vs" id="tool">
      <div class="container">
        <div class="vs-shell card" data-vs>
          <form class="vs-form" data-vs-form novalidate>
            <div class="vs-step" data-vs-step="1">
              <div class="field field--full">
                <label for="vs-url" data-en="Your website address" data-ar="عنوان موقعك">Your website address</label>
                <input id="vs-url" name="url" type="url" required dir="ltr" inputmode="url" autocomplete="url" placeholder="https://yourbrand.com">
                <span class="err" data-en="Please enter a valid website, starting with https://" data-ar="يرجى إدخال موقع صحيح يبدأ بـ https://">Please enter a valid website, starting with https://</span>
              </div>
              ${q("ads", "Do you run paid ads today?", "هل تشغّل إعلانات مدفوعة حاليًا؟", [["yes", "Yes, every month", "نعم، كل شهر"], ["some", "Sometimes", "أحيانًا"], ["no", "Not yet", "ليس بعد"]])}
              ${q("tracking", "Is conversion tracking (pixel / GA4) set up and checked?", "هل تتبع التحويلات (بيكسل / GA4) مُعدّ ومفحوص؟", [["yes", "Yes, verified", "نعم، ومفحوص"], ["unsure", "Not sure", "لست متأكدًا"], ["no", "No", "لا"]])}
              ${q("testing", "Do you test new ad creative every month?", "هل تختبر إعلانات جديدة كل شهر؟", [["yes", "Yes", "نعم"], ["some", "Occasionally", "أحيانًا"], ["no", "No", "لا"]])}
              ${q("reporting", "Do you know your cost to acquire a customer?", "هل تعرف تكلفة اكتساب العميل؟", [["yes", "Yes, exactly", "نعم، بدقة"], ["rough", "Roughly", "تقريبًا"], ["no", "No", "لا"]])}
              <button class="btn btn--primary btn--lg vs-go" type="submit"><span class="spinner" aria-hidden="true"></span>${bi("span", "Check my Vitals", "افحص مؤشراتي", 'class="btn__label"')}${ARROW}</button>
              ${bi("p", "Free. No sign-up needed to see your score.", "مجاني. لا تحتاج تسجيلًا لرؤية درجتك.", 'class="micro"')}
            </div>
          </form>

          <div class="vs-scan" data-vs-scan hidden aria-live="polite">
            <svg class="vs-scan__ecg" viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1000" d="M0 64 H58 L66 60 L74 64 H94 L103 20 L114 98 L123 50 L130 64 H156 L166 56 L178 64 H226 L234 60 L242 64 H262 L271 20 L282 98 L291 50 L298 64 H324 L334 56 L346 64 H400"/></svg>
            <p class="vs-scan__msg" data-vs-msg>Scanning…</p>
            ${bi("p", "Google's Lighthouse scan usually takes 20 to 40 seconds.", "يستغرق فحص Lighthouse من جوجل عادةً من 20 إلى 40 ثانية.", 'class="micro"')}
          </div>

          <div class="vs-result" data-vs-result hidden>
            <div class="vs-result__top">
              <div class="vs-gauge" data-vs-gauge style="--v:0">
                <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="vs-gauge__track" cx="60" cy="60" r="52"/><circle class="vs-gauge__bar" cx="60" cy="60" r="52" pathLength="100"/></svg>
                <div class="vs-gauge__num"><b data-vs-total>0</b><span>/100</span></div>
              </div>
              <div>
                ${bi("p", "Your Vitals Score", "درجة مؤشراتك", 'class="eyebrow"')}
                <h2 class="vs-result__title" data-vs-verdict></h2>
                <p class="vs-result__site mono" dir="ltr" data-vs-site></p>
              </div>
            </div>
            <div class="vs-bars" data-vs-bars></div>
            <div class="vs-fixes">
              ${bi("h3", "Fix these first", "أصلح هذه أولًا")}
              <ol data-vs-fixes></ol>
            </div>
            <div class="vs-cta card">
              <div>
                ${bi("h3", "Get the full report and a 30-minute walkthrough", "احصل على التقرير الكامل وجلسة شرح 30 دقيقة")}
                ${bi("p", "A strategist reviews your score, your ads and your tracking, then sends a prioritized plan. Free, no obligation.", "يراجع خبير استراتيجي درجتك وإعلاناتك وتتبعك ثم يرسل خطة مرتّبة. مجانًا وبلا التزام.")}
              </div>
              <form class="vs-lead" data-validate data-form="vitals-score" data-success="#vsSuccess" novalidate>
                <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
                <input type="hidden" name="message" data-vs-summary>
                <div class="form-grid">
                  <div class="field"><label for="vs-name" data-en="Name *" data-ar="الاسم *">Name *</label><input id="vs-name" name="name" required autocomplete="name"><span class="err" data-en="Please enter your name." data-ar="يرجى إدخال اسمك.">Please enter your name.</span></div>
                  <div class="field"><label for="vs-phone" data-en="WhatsApp *" data-ar="واتساب *">WhatsApp *</label><input id="vs-phone" name="phone" type="tel" required dir="ltr" autocomplete="tel" placeholder="+20 …"><span class="err" data-en="Please enter your number." data-ar="يرجى إدخال رقمك.">Please enter your number.</span></div>
                  <div class="field field--full"><label for="vs-email" data-en="Business email *" data-ar="البريد الإلكتروني *">Business email *</label><input id="vs-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com"><span class="err" data-en="Please enter a valid email." data-ar="يرجى إدخال بريد صحيح.">Please enter a valid email.</span></div>
                  <div class="field--full"><button class="btn btn--primary btn--lg" type="submit" style="width:100%"><span class="spinner" aria-hidden="true"></span>${bi("span", "Send me the full report", "أرسل لي التقرير الكامل", 'class="btn__label"')}</button></div>
                </div>
              </form>
              <div class="form-success" id="vsSuccess" role="status">${bi("h3", "Request received.", "استلمنا طلبك.")}${bi("p", "A strategist will send your full report within one business day.", "سيرسل لك خبير استراتيجي تقريرك الكامل خلال يوم عمل واحد.")}</div>
            </div>
            <button class="btn btn--ghost" type="button" data-vs-again>${bi("span", "Check another site", "افحص موقعًا آخر")}</button>
          </div>
        </div>
        ${bi("p", "Speed, SEO, accessibility and best-practice scores come from Google PageSpeed Insights (mobile). Arabic readiness is checked from the page's own markup. Your answers are only stored if you request the full report.", "درجات السرعة والسيو وسهولة الوصول وأفضل الممارسات من Google PageSpeed Insights (موبايل). جاهزية العربي تُفحص من كود الصفحة نفسها. لا تُحفظ إجاباتك إلا إذا طلبت التقرير الكامل.", 'class="micro vs-note"')}
      </div>
    </section>

    <section class="section section--tight band-light grid-field">
      <div class="container">
        <div class="section-head" data-reveal>
          ${bi("p", "What we measure", "ما نقيسه", 'class="eyebrow"')}
          ${bi("h2", "Five vital signs of a healthy growth system.", "خمس علامات حيوية لنظام نمو صحي.")}
        </div>
        <div class="feature-grid">
${[["Speed", "السرعة", "How fast your site loads on a real mobile connection. Slow pages waste ad spend.", "مدى سرعة تحميل موقعك على اتصال موبايل حقيقي. الصفحات البطيئة تهدر الإنفاق الإعلاني."],
    ["SEO", "السيو", "Whether search engines can crawl, understand and index your pages.", "هل تستطيع محركات البحث الزحف لصفحاتك وفهمها وفهرستها."],
    ["Arabic readiness", "جاهزية العربي", "Separate Arabic URLs, hreflang and proper RTL, so Arabic searchers can find you.", "روابط عربية منفصلة وhreflang وRTL صحيح، ليجدك من يبحث بالعربي."],
    ["Experience", "التجربة", "Accessibility and best practices that affect trust and conversion.", "سهولة الوصول وأفضل الممارسات التي تؤثر في الثقة والتحويل."],
    ["Marketing maturity", "نضج التسويق", "Tracking, testing and knowing your acquisition cost: the habits behind profitable growth.", "التتبع والاختبار ومعرفة تكلفة الاكتساب: عادات وراء النمو المربح."]].map(([en, ar, den, dar], i) => `          <article class="card feature" data-reveal style="--rd:${(i * 0.05).toFixed(2)}s">
            <span class="feature__num mono">${String(i + 1).padStart(2, "0")}</span>
            ${bi("h3", en, ar)}
            ${bi("p", den, dar)}
          </article>`).join("\n")}
        </div>
      </div>
    </section>

    ${ctaBand({ secondary: null })}`;
  return pageShell({ head: head({ file, titleEn: t[0], titleAr: t[1], descEn: d[0], descAr: d[1], schema }), main, scripts: '\n  <script src="assets/js/vitals-score.js" defer></script>' });
}

// ------------------------------------------------- refresh existing pages
const MASTER = ["index.html", "about.html", "blog.html", "careers.html", "contact.html", "privacy.html", "products.html", "solutions.html", "work.html"];
const SUB = ["frames.html", "web.html", "stage.html", "go.html"];

function replaceBlock(html, startRe, endTag, replacement) {
  const m = html.match(startRe);
  if (!m) return html;
  const start = m.index;
  const end = html.indexOf(endTag, start);
  if (end < 0) return html;
  return html.slice(0, start) + replacement + html.slice(end + endTag.length);
}

function refreshMaster(file) {
  let html = fs.readFileSync(path.join(ROOT, file), "utf8");
  html = replaceBlock(html, /<header class="nav">/, "</header>", HEADER);
  html = replaceBlock(html, /<nav class="drawer"/, "\n  </nav>", DRAWER);
  html = replaceBlock(html, /<footer class="footer">/, "</footer>", FOOTER);
  return html;
}

// Arabic meta descriptions for the hand-written pages (built into /ar/).
const META_AR = {
  "index.html": "براند فايتلز وكالة تسويق متكاملة في القاهرة، مصر. نوحّد استراتيجية العلامة والإبداع وتجربة الويب وتسويق الأداء في نظام واحد مبني حول نموّ تجاري قابل للقياس في مصر والمنطقة.",
  "solutions.html": "خدمات براند فايتلز: الاستراتيجية والاستشارات، والعلامة والإبداع، والويب والتجربة، والتسويق والنمو، أربعة تخصصات مترابطة تعمل كنظام نموّ واحد في مصر والمنطقة.",
  "work.html": "أعمال براند فايتلز في مصر والمنطقة: نتائج حقيقية في التجارة الإلكترونية والرعاية الصحية والتجزئة والعقارات، مقاسة بالأرقام التي تهم.",
  "products.html": "لا نبيع باقات تسويق ثابتة. كل تعاقد يُحدّد حول أهداف عملك والخدمات المطلوبة وسوقك. ابدأ بتدقيق نموّ مجاني.",
  "about.html": "براند فايتلز وكالة تسويق متكاملة في القاهرة تجمع الاستراتيجية والإبداع والتجربة الرقمية وتسويق الأداء لمساعدة الأعمال الطموحة على النمو.",
  "careers.html": "وظائف في براند فايتلز: نوظّف استراتيجيين ومشتري إعلانات ومبدعين ومحللين في القاهرة للعمل عبر المنطقة.",
  "blog.html": "مقالات براند فايتلز: ما نتعلمه من إدارة النمو في مصر والمنطقة، مكتوبًا بشكل عملي.",
  "contact.html": "تواصل مع براند فايتلز في القاهرة. احجز استشارة نموّ مجانية مدتها 30 دقيقة أو راسلنا على واتساب.",
  "privacy.html": "سياسة الخصوصية وشروط الخدمة لموقع براند فايتلز.",
  "frames.html": "Vitals Frames ستوديو إنتاج في القاهرة: إعلانات ومحتوى UGC وأفلام للعلامات وتصوير منتجات وموشن ومحتوى شهري مصنوع ليحقق نتائج.",
  "web.html": "Vitals Web: مواقع بالعربي والإنجليزي تنطلق خلال أسابيع، بباقات ومواعيد ثابتة، مع السيو والتتبع جاهزين.",
  "stage.html": "Vitals Stage: تنظيم وإنتاج الفعاليات والمؤتمرات والإطلاقات والمعارض، مع محتوى يُلتقط ويُضخّم بعد الحدث.",
  "go.html": "Vitals GO: منصة للوكالات لإرسال التسليمات للعميل على واتساب، وتسجيل الموافقات، وتحويل الطلبات خارج النطاق إلى أوامر تغيير مدفوعة."
};
function addMetaAr(html, file) {
  const ar = META_AR[file];
  if (!ar) return html;
  return html.replace(/<meta name="description" content="([^"]*)"(?: data-ar="[^"]*")?>/, (_, en) => `<meta name="description" content="${en}" data-ar="${esc(ar)}">`);
}

// Link existing case cards on index/work to their case pages, blog cards to posts,
// and service cards on the services page to their service pages.
function linkCards(html, file) {
  if (file === "index.html" || file === "work.html") {
    for (const c of cases) {
      const re = new RegExp(`<article class="card case-card([^"]*)"([^>]*)>((?:(?!</article>)[\\s\\S])*?data-en="${c.client[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?)</article>`);
      html = html.replace(re, (m, cls, attrs, inner) => `<a class="card case-card case-card--link${cls}" href="${c.file}"${attrs}>${inner}</a>`);
    }
  }
  if (file === "blog.html") {
    for (const p of posts) {
      const re = new RegExp(`<article class="card post-card"([^>]*)>((?:(?!</article>)[\\s\\S])*?data-en="${p.title[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?)</article>`);
      html = html.replace(re, (m, attrs, inner) => `<a class="card post-card" href="${p.file}"${attrs}>${inner}</a>`);
    }
  }
  return html;
}

// -------------------------------------------------------------------- run
console.log("generating pages…");
// Service pages have their own layouts now: node scripts/service-pages.mjs
// for (const s of services) write(s.file, servicePage(s));
for (const s of industries) write(s.file, industryPage(s));
for (const c of cases) write(c.file, casePage(c));
for (const p of posts) write(p.file, postPage(p));
write("vitals-score.html", vitalsScorePage());

for (const file of MASTER) {
  let html = refreshMaster(file);
  html = addMetaAr(html, file);
  html = linkCards(html, file);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log("  refreshed", file);
}
for (const file of SUB) {
  let html = fs.readFileSync(path.join(ROOT, file), "utf8");
  html = html.replace(/\s*<a class="footer__dash"[^>]*>[\s\S]*?<\/a>/, "");
  html = addMetaAr(html, file);
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log("  refreshed", file);
}
export { INDUSTRIES };
