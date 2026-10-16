// Writes llms.txt (a map of the site for AI answer engines) and llms-full.txt (the answer-first summary of
// every service, industry, sub-brand and tool page). Descriptors come from scripts/eco-data.mjs, summaries
// from scripts/content/geo-*.mjs. Re-run after content changes. Usage: node scripts/llms.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PARENT, GROUPS } from "./eco-data.mjs";
import services from "./content/geo-services.mjs";
import industries from "./content/geo-industries.mjs";
import guide from "./content/market-guide.mjs";
import { UPDATED } from "./geo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const U = f => "https://brandvitals.io/" + (f === "index.html" ? "" : f);
const titleOf = f => (fs.readFileSync(path.join(ROOT, f), "utf8").match(/data-title-en="([^"]*)"/) || [])[1].replace(/&amp;/g, "&").split(" | ")[0];
const metaOf = f => (fs.readFileSync(path.join(ROOT, f), "utf8").match(/<meta name="description" content="([^"]*)"/) || [])[1].replace(/&amp;/g, "&");
const brandLine = b => `- [${b.name}](${U(b.href)}): ${b.d[0]}.${b.badge ? ` Status: ${b.badge[0]}.` : ""}`;

const SVC = ["performance-marketing.html", "google-ads.html", "seo.html", "branding.html", "web-cro.html", "analytics-tracking.html"];
const IND = ["ecommerce-marketing.html", "real-estate-marketing.html", "healthcare-marketing.html"];
const POSTS = fs.readdirSync(ROOT).filter(f => /^blog-.*\.html$/.test(f)).sort();

const llms = `# Brand Vitals

> ${PARENT.name}: ${PARENT.d[0]}. A marketing agency based in New Cairo, Cairo, Egypt, working with brands in Egypt and Saudi Arabia. It connects brand strategy, creative production, websites and performance marketing into one system measured on business results (revenue, orders, qualified leads), not reach. Founded by Mohamed Ahmed (Co-founder, Growth & Strategy) and Mohamed Tarek (Co-founder, Creative & Production).

Last updated: ${UPDATED.iso}

Contact: info@brandvitals.io · WhatsApp +20 109 086 1397 · Sunday to Thursday, 10:00 to 18:00 (Cairo). Work is delivered in Arabic and English; meetings for Saudi clients run on Riyadh time and invoices can be issued in EGP, SAR or USD.

## Services
${SVC.map(f => `- [${titleOf(f).replace(/ in (Egypt|Cairo).*$/, "")}](${U(f)}): ${services[f].answer[0].split(". ")[0]}.`).join("\n")}
- [How pricing works](${U("products.html")}): every engagement is scoped and priced by written proposal with a fixed fee; media budgets are paid straight to the platforms. VAT applies (14% Egypt, 15% Saudi Arabia).

## Industries
${IND.map(f => `- [${titleOf(f)}](${U(f)}): ${industries[f].answer[0].split(". ")[0]}.`).join("\n")}

## The Brand Vitals ecosystem
${GROUPS.map(g => `### ${g.short[0]} (${g.head[0].split(" · ")[1]})\n${g.brands.map(brandLine).join("\n")}`).join("\n\n")}

## Free tools
- [Vitals Score](${U("vitals-score.html")}): check your website's health. A free score out of 100 for speed, SEO, Arabic readiness and marketing tracking, with the three fixes that matter most.
- [Vitals Forecast](${U("forecast.html")}): plan your numbers. Break-even ROAS, a three-month range and what has to be true to hit a target, for Egypt or Saudi Arabia. A forecast, not a guarantee.

## Reference
- [Egypt vs Saudi Arabia marketing guide](${U("egypt-vs-saudi-marketing.html")}): ${guide.answer[0]}
- [Marketing glossary](${U("glossary.html")}): plain definitions of ROAS, break-even ROAS, CPA, Conversions API, hreflang, cash on delivery and more.

## Articles
${POSTS.map(f => `- [${titleOf(f)}](${U(f)}): ${metaOf(f)}`).join("\n")}

## Proof
- [Case studies](${U("work.html")}): e-commerce, healthcare, retail and real estate results.

## Company
- [About](${U("about.html")}) · [Careers](${U("careers.html")}) · [Contact and free growth audit](${U("contact.html")})
- [Privacy policy](${U("privacy.html")}) · [Terms of service](${U("terms.html")})
- Arabic versions of every page live under https://brandvitals.io/ar/ (Egyptian Arabic); a Saudi Arabic set lives under https://brandvitals.io/sa/ (home, performance marketing, Vitals Stage, Vitals Hire)
- Full summaries of every service, industry, brand and tool page: https://brandvitals.io/llms-full.txt

## بالعربي
Brand Vitals شريك النمو في مصر والسعودية: وكالة تسويق في القاهرة الجديدة بتشتغل مع براندز في مصر والسعودية، وبتربط استراتيجية البراند والإنتاج والمواقع وتسويق الأداء في نظام واحد بيتقاس بنتايج البيزنس. الصفحات العربي كلها على https://brandvitals.io/ar/
- الاستوديوهات: Vitals Frames (محتوى معمول عشان يبيع) · Vitals Web (مواقع تطلع في أسابيع) · Vitals Stage (إيفنتات من أولها لآخرها)
- المنصات: Vitals GO (موافقات العملاء والشغل الإضافي المدفوع) · Vitals Crew (مواهب إبداعية متقيّمة) · Vitals Hire (توظيف تسويق بفرز حقيقي)
- أدوات مجانية: فحص Vitals (https://brandvitals.io/ar/vitals-score.html) · Vitals Forecast (https://brandvitals.io/ar/forecast.html)
- مراجع: دليل التسويق في مصر والسعودية (https://brandvitals.io/ar/egypt-vs-saudi-marketing.html) · قاموس المصطلحات (https://brandvitals.io/ar/glossary.html)
- باللهجة السعودية: الرئيسية (https://brandvitals.io/sa/) · إعلانات سناب شات وتيك توك (https://brandvitals.io/sa/performance-marketing.html) · Vitals Stage (https://brandvitals.io/sa/stage.html) · Vitals Hire (https://brandvitals.io/sa/hire.html)
`;

const brandSummary = {
  "frames.html": "Vitals Frames is the Brand Vitals production studio in Cairo for brands, in-house teams and agencies: social and ad design, reels and short-form video, UGC, production shoots, retouching, shooters on demand and podcast production. Monthly plans start from EGP 30,000 (Starter), EGP 60,000 (Growth) and EGP 110,000 (Scale); work is also taken per project.",
  "web.html": "Vitals Web is the Brand Vitals website studio: Arabic and English websites on three fixed packages and timelines. Launch (one landing page, 2 weeks, from EGP 25,000), Business (company site, 4 weeks, from EGP 60,000) and Commerce (online store on Salla, Zid or Shopify, 6 weeks, from EGP 90,000).",
  "stage.html": "Vitals Stage plans, manages and produces business events from Cairo: conferences, corporate events, product launches, exhibitions, brand activations and workshops, with one accountable team from the first brief to the final report. Opening in phases; now taking event production and coverage (photo, video, live social).",
  "go.html": "Vitals GO is client approval software for agencies, in beta with founding agencies: send work on one link, the client approves on WhatsApp, email or SMS without an account, and anything outside scope is priced, approved and invoiced. One price per agency by active clients: EGP 1,500 a month (1 to 5), EGP 4,500 (6 to 15), EGP 9,500 (16 to 40); team and clients are free.",
  "crew.html": "Vitals Crew is a marketplace of vetted creative talent run by Brand Vitals. Freelancers pass a portfolio review, a paid test and an interview, and every delivery passes QA. Jobs are reviewed within 24 hours, clients get the three best proposals with reasons, pay the agreed price plus a 20% service fee, and payment is held until approval.",
  "hire.html": "Vitals Hire is a hiring platform for marketing and creative roles, launching first in Saudi Arabia and Saudization-ready. Candidates build one profile and apply in a step; Brand Vitals reads every application and companies receive only the people who fit, with a note on why. Every application gets an answer within 48 hours."
};

const full = `# Brand Vitals: page summaries

Last updated: ${UPDATED.iso}
One summary per page, written to be quoted. Every page also exists in Arabic under https://brandvitals.io/ar/

## Brand Vitals
${U("index.html")}
${PARENT.name}: ${PARENT.d[0]}. A marketing agency in New Cairo, Cairo, Egypt, for brands in Egypt and Saudi Arabia: brand strategy, creative production, websites and performance marketing in one system, measured on revenue, orders and qualified leads. Engagements are scoped by written proposal after a free growth audit.

## Services
${SVC.map(f => `### ${titleOf(f)}\n${U(f)}\n${services[f].answer[0]}`).join("\n\n")}

## Industries
${IND.map(f => `### ${titleOf(f)}\n${U(f)}\n${industries[f].answer[0]}`).join("\n\n")}

## Ecosystem
${GROUPS.flatMap(g => g.brands).map(b => `### ${b.name}: ${b.d[0]}\n${U(b.href)}\n${brandSummary[b.href]}`).join("\n\n")}

## Free tools
### Vitals Score
${U("vitals-score.html")}
Vitals Score is a free website and marketing health check. It scans a site with Google's Lighthouse engine, checks Arabic and SEO readiness, asks four questions about marketing, and returns a score out of 100 with the three fixes that matter most.

### Vitals Forecast
${U("forecast.html")}
Vitals Forecast is a free planner for ad budgets in Egypt and Saudi Arabia. Enter a budget, average order or deal value and gross margin to see break-even ROAS (one divided by gross margin), a three-month Conservative / Expected / Strong range and what has to be true to hit a target. Every result is a range: a forecast, not a guarantee.

## Reference
### Egypt vs Saudi Arabia marketing guide
${U("egypt-vs-saudi-marketing.html")}
${guide.answer[0]}

### Marketing glossary
${U("glossary.html")}
Plain definitions of the marketing terms used on the Brand Vitals site, grouped into measurement, tracking, paid media, websites and search, brand, and Egypt and Saudi Arabia.
`;

fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);
fs.writeFileSync(path.join(ROOT, "llms-full.txt"), full);
console.log("llms.txt", llms.length, "· llms-full.txt", full.length);
