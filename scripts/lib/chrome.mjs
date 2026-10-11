// Shared building blocks for the master-brand pages: header, drawer, footer,
// <head>, and small bilingual helpers. Used by scripts/gen-pages.mjs.

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// <tag data-en data-ar>en</tag> for text-only elements (the i18n system swaps textContent).
export const bi = (tag, en, ar, attrs = "") =>
  `<${tag}${attrs ? " " + attrs : ""} data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</${tag}>`;

export const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const PLUS = '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>';

export const SERVICES = [
  { file: "performance-marketing.html", en: "Performance marketing", ar: "تسويق الأداء" },
  { file: "google-ads.html", en: "Google Ads", ar: "إعلانات جوجل" },
  { file: "seo.html", en: "SEO & Arabic SEO", ar: "السيو والسيو العربي" },
  { file: "branding.html", en: "Brand & creative", ar: "العلامة والإبداع" },
  { file: "web-cro.html", en: "Websites & CRO", ar: "المواقع وتحسين التحويل" },
  { file: "analytics-tracking.html", en: "Analytics & tracking", ar: "التحليلات والتتبع" }
];
export const INDUSTRIES = [
  { file: "ecommerce-marketing.html", en: "E-commerce", ar: "التجارة الإلكترونية" },
  { file: "real-estate-marketing.html", en: "Real estate", ar: "العقارات" },
  { file: "healthcare-marketing.html", en: "Healthcare", ar: "الرعاية الصحية" }
];

const eco = [
  ["index.html", "assets/img/favicon.svg", "Brand Vitals", "Growth agency", "وكالة النمو"],
  ["studio.html", "assets/img/brands/studio-mark.svg", "Vitals Studio", "Production studio", "ستوديو إنتاج"],
  ["web.html", "assets/img/brands/web-mark.svg", "Vitals Web", "Websites, launched fast", "مواقع تنطلق بسرعة"],
  ["events.html", "assets/img/brands/events-mark.svg", "Vitals Events", "Launches, activations and events", "إطلاقات وفعاليات وتفعيلات"],
  ["go.html", "assets/img/brands/go-mark.svg", "Vitals GO", "Client approvals & team chat", "موافقات العملاء وتواصل الفريق"]
];
const ecoItems = () => eco.map(([href, img, name, en, ar]) =>
  `<a class="eco-item" href="${href}"><img src="${img}" alt="" width="38" height="38"><span class="eco-item__txt"><span class="eco-item__name">${name}${href === "go.html" ? ' <em class="eco-badge" data-en="New" data-ar="جديد">New</em>' : ""}</span>${bi("span", en, ar, 'class="eco-item__d"')}</span></a>`
).join("\n            ");

const svcMenu = () => SERVICES.map(s => `<a class="eco-item eco-item--text" href="${s.file}">${bi("span", s.en, s.ar, 'class="eco-item__name"')}</a>`).join("\n            ");

export const HEADER = `<header class="nav">
    <div class="nav__inner">
      <a class="nav__logo" href="index.html" aria-label="Brand Vitals, Home">
        <img class="logo-light" src="assets/img/logo-light.svg" alt="Brand Vitals" width="253" height="44">
        <img class="logo-dark" src="assets/img/logo.svg" alt="Brand Vitals" width="253" height="44">
      </a>
      <nav class="nav__links" aria-label="Primary">
        <div class="nav__item" data-eco>
          <button class="nav__link nav__trigger" type="button" aria-expanded="false" aria-controls="svcMenu"><span data-en="Services" data-ar="الخدمات">Services</span>${CHEV}</button>
          <div class="eco-menu eco-menu--list" id="svcMenu">
            <p class="eco-menu__head" data-en="What we do" data-ar="ما نقدّمه">What we do</p>
            ${svcMenu()}
            <a class="eco-item eco-item--text eco-item--all" href="solutions.html"><span class="eco-item__name" data-en="All services →" data-ar="كل الخدمات ←">All services →</span></a>
          </div>
        </div>
        <a class="nav__link" href="work.html" data-en="Work" data-ar="أعمالنا">Work</a>
        <a class="nav__link" href="blog.html" data-en="Insights" data-ar="مقالات">Insights</a>
        <div class="nav__item" data-eco>
          <button class="nav__link nav__trigger" type="button" aria-expanded="false" aria-controls="ecoMenu"><span data-en="Ecosystem" data-ar="الكيانات">Ecosystem</span>${CHEV}</button>
          <div class="eco-menu" id="ecoMenu">
            <p class="eco-menu__head" data-en="The Brand Vitals ecosystem" data-ar="منظومة Brand Vitals">The Brand Vitals ecosystem</p>
            ${ecoItems()}
          </div>
        </div>
        <a class="nav__link nav__link--pill" href="vitals-score.html"><span class="pulse-dot" aria-hidden="true"></span><span data-en="Free Vitals Score" data-ar="فحص Vitals مجاني">Free Vitals Score</span></a>
      </nav>
      <div class="nav__actions">
        <button class="lang-toggle" data-lang-toggle aria-label="Switch language">عربي</button>
        <button class="icon-btn theme-toggle" data-theme-toggle aria-label="Toggle color theme">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>
        <a class="btn btn--primary" href="contact.html" data-magnetic data-consult><span data-en="Get a free audit" data-ar="تدقيق مجاني">Get a free audit</span></a>
        <button class="nav__burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>`;

export const DRAWER = `<nav class="drawer" aria-label="Mobile">
    <a class="drawer__link" href="index.html"><span class="mono">01</span><span data-en="Home" data-ar="الرئيسية">Home</span></a>
    <div class="drawer__group">
      <button class="drawer__link drawer__toggle" type="button" aria-expanded="false" aria-controls="drawerSvc"><span class="mono">02</span><span data-en="Services" data-ar="الخدمات">Services</span>${CHEV}</button>
      <div class="drawer__sub" id="drawerSvc" hidden>
        ${SERVICES.map(s => `<a class="drawer__sublink" href="${s.file}" data-en="${esc(s.en)}" data-ar="${esc(s.ar)}">${esc(s.en)}</a>`).join("\n        ")}
        <a class="drawer__sublink" href="solutions.html" data-en="All services" data-ar="كل الخدمات">All services</a>
      </div>
    </div>
    <a class="drawer__link" href="work.html"><span class="mono">03</span><span data-en="Work" data-ar="أعمالنا">Work</span></a>
    <a class="drawer__link" href="blog.html"><span class="mono">04</span><span data-en="Insights" data-ar="مقالات">Insights</span></a>
    <div class="drawer__group">
      <button class="drawer__link drawer__toggle" type="button" aria-expanded="false" aria-controls="drawerEco"><span class="mono">05</span><span data-en="Ecosystem" data-ar="الكيانات">Ecosystem</span>${CHEV}</button>
      <div class="drawer__sub" id="drawerEco" hidden>
        ${ecoItems()}
      </div>
    </div>
    <a class="drawer__link" href="vitals-score.html"><span class="mono">06</span><span data-en="Free Vitals Score" data-ar="فحص Vitals مجاني">Free Vitals Score</span></a>
    <div class="drawer__foot"><a class="btn btn--primary" href="contact.html" data-consult><span data-en="Get a free audit" data-ar="احصل على تدقيق مجاني">Get a free audit</span></a></div>
  </nav>`;

const li = (href, en, ar) => `<li><a href="${href}" data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</a></li>`;

export const FOOTER = `<footer class="footer">
    <div class="container container--wide">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" aria-label="Brand Vitals, Home">
            <img class="logo-light" src="assets/img/logo-light.svg" alt="Brand Vitals" width="253" height="44">
            <img class="logo-dark" src="assets/img/logo.svg" alt="Brand Vitals" width="253" height="44">
          </a>
          <p data-en="Your growth partner in Cairo &amp; MENA. We unite strategy, brand, web, and marketing into one system built to help brands grow." data-ar="شريك نموّك في القاهرة والمنطقة. نُوحّد الاستراتيجية والعلامة والويب والتسويق في نظام واحد مبنيّ لمساعدة العلامات على النموّ.">Your growth partner in Cairo &amp; MENA. We unite strategy, brand, web, and marketing into one system built to help brands grow.</p>
          <address>
            <a href="https://wa.me/201090861397" target="_blank" rel="noopener" dir="ltr">WhatsApp +20 109 086 1397</a><br>
            <a href="mailto:info@brandvitals.io" dir="ltr">info@brandvitals.io</a><br>
            <span data-en="New Cairo, Cairo, Egypt · Sun to Thu, 10:00 to 18:00" data-ar="القاهرة الجديدة، مصر · الأحد إلى الخميس، 10:00 إلى 18:00">New Cairo, Cairo, Egypt · Sun to Thu, 10:00 to 18:00</span>
          </address>
          <div class="socials">
            <a href="https://www.instagram.com/brandvitals.io" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg></a>
            <a href="https://www.linkedin.com/company/brandvitals-io" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
            <a href="https://www.facebook.com/BrandVitals.io" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
          </div>
        </div>
        <div class="footer__col">
          <h4 data-en="Navigate" data-ar="تصفّح">Navigate</h4>
          <ul>
            ${li("index.html", "Home", "الرئيسية")}
            ${li("work.html", "Work", "أعمالنا")}
            ${li("about.html", "About", "من نحن")}
            ${li("products.html", "How we price", "طريقة التسعير")}
            ${li("blog.html", "Insights", "مقالات")}
            ${li("careers.html", "Careers", "الوظائف")}
            ${li("contact.html", "Contact", "تواصل")}
          </ul>
        </div>
        <div class="footer__col">
          <h4 data-en="Services" data-ar="الخدمات">Services</h4>
          <ul>
            ${SERVICES.map(s => li(s.file, s.en, s.ar)).join("\n            ")}
          </ul>
        </div>
        <div class="footer__col">
          <h4 data-en="Industries &amp; tools" data-ar="القطاعات والأدوات">Industries &amp; tools</h4>
          <ul>
            ${INDUSTRIES.map(s => li(s.file, s.en + " marketing", "تسويق " + s.ar)).join("\n            ")}
            ${li("vitals-score.html", "Free Vitals Score", "فحص Vitals المجاني")}
          </ul>
        </div>
        <div class="footer__col">
          <h4 data-en="Ecosystem" data-ar="الكيانات">Ecosystem</h4>
          <ul>
            <li><a href="index.html">Brand Vitals</a></li>
            <li><a href="studio.html">Vitals Studio</a></li>
            <li><a href="web.html">Vitals Web</a></li>
            <li><a href="events.html">Vitals Events</a></li>
            <li><a href="go.html">Vitals GO</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bar">
        <span>© <span data-year>2026</span> Brand Vitals. <span data-en="All rights reserved." data-ar="جميع الحقوق محفوظة.">All rights reserved.</span></span>
        <div class="legal">
          <a href="privacy.html" data-en="Privacy Policy" data-ar="سياسة الخصوصية">Privacy Policy</a>
          <a href="privacy.html#terms" data-en="Terms of Service" data-ar="شروط الخدمة">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>`;

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">';

// Full <head> for a generated page. `schema` is an array of JSON-LD nodes.
export function head({ file, titleEn, titleAr, descEn, descAr, ogType = "website", schema = [] }) {
  const url = "https://brandvitals.io/" + (file === "index.html" ? "" : file);
  const graph = { "@context": "https://schema.org", "@graph": schema };
  return `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="dark"
      data-title-en="${esc(titleEn)}"
      data-title-ar="${esc(titleAr)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titleEn)}</title>
  <meta name="description" content="${esc(descEn)}" data-ar="${esc(descAr)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#05080B">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="Brand Vitals">
  <meta property="og:title" content="${esc(titleEn)}" data-ar="${esc(titleAr)}">
  <meta property="og:description" content="${esc(descEn)}" data-ar="${esc(descAr)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="en_US">
  <meta property="og:locale:alternate" content="ar_EG">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
  <link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <script>(function(){try{var t=localStorage.getItem("oso-theme")||"dark";document.documentElement.dataset.theme=t;}catch(e){}})();</script>
  ${FONTS}
  <link rel="stylesheet" href="assets/css/main.css">
  <script type="application/ld+json">
${JSON.stringify(graph, null, 2).replace(/^/gm, "  ")}
  </script>
</head>`;
}

export const crumbs = items => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: "https://brandvitals.io/" + path }))
});

export const breadcrumbNav = items => `<nav class="breadcrumb" aria-label="Breadcrumb">
          ${items.map(([en, ar, href], i) => (href ? `<a href="${href}" data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</a>` : bi("span", en, ar)) + (i < items.length - 1 ? '<span class="sep">/</span>' : "")).join("")}
        </nav>`;

export function pageShell({ head: h, main, scripts = "" }) {
  return `${h}
<body class="noise">
  <a class="skip-link" href="#main" data-en="Skip to content" data-ar="تخطّي إلى المحتوى">Skip to content</a>
  <div class="progress" aria-hidden="true"></div>

  ${HEADER}

  ${DRAWER}

  <main id="main">
${main}
  </main>

  ${FOOTER}

  <button class="to-top" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>

  <script src="assets/js/main.js" defer></script>${scripts}
</body>
</html>
`;
}

export function faqBlock(items, idx = "FAQ") {
  return `<section class="section section--tight">
      <div class="container" style="max-width:880px">
        <div class="section-head" data-reveal>
          ${bi("p", idx, idx === "FAQ" ? "الأسئلة الشائعة" : idx, 'class="eyebrow"')}
          ${bi("h2", "Questions, answered.", "أسئلة، بإجابات.")}
        </div>
        <div class="acc" data-reveal>
${items.map(q => `          <div class="acc-item">
            <button class="acc-item__btn" aria-expanded="false">${bi("span", q.q[0], q.q[1])}${PLUS}</button>
            <div class="acc-item__panel"><div>${bi("p", q.a[0], q.a[1])}</div></div>
          </div>`).join("\n")}
        </div>
      </div>
    </section>`;
}

export const faqSchema = items => ({
  "@type": "FAQPage",
  mainEntity: items.map(q => ({ "@type": "Question", name: q.q[0], acceptedAnswer: { "@type": "Answer", text: q.a[0] } }))
});

export function ctaBand({ h = ["Have a growth problem worth solving?", "عندك تحدّي نموٍّ يستحقّ الحل؟"], p = ["Start with a free audit. A strategist reviews your numbers and tells you honestly what will move them.", "ابدأ بتدقيق مجاني. يراجع خبير نموّ أرقامك ويخبرك بصراحة بما سيحرّكها."], btn = ["Get a free audit", "احصل على تدقيق مجاني"], secondary = ["Check your Vitals Score", "افحص مؤشرات Vitals", "vitals-score.html"] } = {}) {
  return `<section class="section cta-band">
      <div class="container">
        <div class="cta-band__card grid-field" data-reveal>
          ${bi("h2", h[0], h[1])}
          ${bi("p", p[0], p[1], 'class="lead"')}
          <div class="btn-row" style="justify-content:center">
            <a class="btn btn--primary btn--lg" href="contact.html" data-magnetic data-consult>${bi("span", btn[0], btn[1], 'class="btn__label"')}${ARROW}</a>
            ${secondary ? `<a class="btn btn--ghost btn--lg" href="${secondary[2]}" data-magnetic>${bi("span", secondary[0], secondary[1])}</a>` : ""}
          </div>
          ${bi("p", "No obligation · No pitch deck · Cairo & MENA", "بلا التزام · بلا عرض بيعي · القاهرة والمنطقة", 'class="micro"')}
        </div>
      </div>
    </section>`;
}
