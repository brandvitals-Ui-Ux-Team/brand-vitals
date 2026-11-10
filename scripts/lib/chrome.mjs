// Shared building blocks for the master-brand pages: header, drawer, footer,
// <head>, and small bilingual helpers. Used by scripts/gen-pages.mjs.
import fs from "node:fs";

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// <tag data-en data-ar>en</tag> for text-only elements (the i18n system swaps textContent).
export const bi = (tag, en, ar, attrs = "") =>
  `<${tag}${attrs ? " " + attrs : ""} data-en="${esc(en)}" data-ar="${esc(ar)}">${esc(en)}</${tag}>`;

export const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
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

// Header, drawer and footer are read from index.html, which scripts/eco.mjs, scripts/nav.mjs and
// scripts/tools-menu.mjs keep current, so a generated page always matches the rest of the site.
const INDEX = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const cut = (start, end) => {
  const i = INDEX.indexOf(start), j = INDEX.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error("index.html: missing " + start);
  return INDEX.slice(i, j + end.length);
};
export const HEADER = cut('<header class="nav">', "</header>");
export const DRAWER = cut('<nav class="drawer"', "\n  </nav>");
export const FOOTER = cut('<footer class="footer">', "</footer>");

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">';

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
  <link rel="stylesheet" href="assets/css/theme.css">
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
