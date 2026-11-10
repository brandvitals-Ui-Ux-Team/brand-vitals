// One "vital sign" per service page: its monitor colour, the instrument in its hero, and the diagram
// in its signature section. Everything is drawn as a wireframe of the work itself, never as a result:
// labels are examples of how the work is read, with no invented numbers (copy rule in services.mjs).
import { esc, bi } from "../lib/chrome.mjs";

const T = (en, ar, tag = "span", attrs = "") => bi(tag, en, ar, attrs);
const fig = (cls, en, ar, inner) => `<figure class="sv-inst ${cls}" role="img" aria-label="${esc(en)}" data-ar-label="${esc(ar)}">
${inner}
          </figure>`;

// ------------------------------------------------------------------ performance marketing
const ads = [
  ["A", ["Problem first", "المشكلة الأول"], "scale", ["Scale", "زوّد"], ["Lowest cost per sale this round", "أقل تكلفة لكل بيعة في الجولة دي"]],
  ["B", ["Product first", "المنتج الأول"], "iterate", ["New version", "نسخة جديدة"], ["Strong hook, weak offer", "الهوك قوي والعرض ضعيف"]],
  ["C", ["Customer review", "رأي عميل"], "wait", ["Still learning", "لسه بيتعلم"], ["Not enough spend to judge", "الصرف لسه مش كفاية نحكم"]],
  ["D", ["Offer first", "العرض الأول"], "off", ["Switched off", "اتقفل"], ["Clicks, but no sales", "كليكات من غير بيع"]]
];
const perfHero = () => fig("sv-test", "Example of a creative test round: four ads, each with a decision and a reason.", "مثال لجولة اختبار كرييتيف: أربع إعلانات، كل واحد عليه قرار وسبب.", `            <div class="sv-inst__bar">${T("Example test round", "مثال لجولة اختبار")}${T("Same audience, same budget", "نفس الجمهور، نفس الميزانية")}</div>
            <div class="sv-test__grid">
${ads.map(([k, hook, state, dec, why]) => `              <div class="sv-ad sv-ad--${state}">
                <div class="sv-ad__phone"><i class="sv-ad__media"></i><b>${T("Hook " + k, "هوك " + k)}</b>${T(hook[0], hook[1], "small")}</div>
                <p class="sv-ad__call">${T(dec[0], dec[1], "em")}${T(why[0], why[1])}</p>
              </div>`).join("\n")}
            </div>`);
const perfSig = () => `<div class="sv-margin" role="img" aria-label="Where an order's price goes, and the break-even ROAS formula." data-ar-label="سعر الأوردر بيروح فين، ومعادلة نقطة التعادل.">
            ${T("Where the price of an order goes", "سعر الأوردر بيروح فين", "p", 'class="sv-margin__h"')}
            <div class="sv-margin__bar" aria-hidden="true"><span style="--w:38"></span><span style="--w:12"></span><span style="--w:10"></span><span class="is-margin" style="--w:40"></span></div>
            <ul class="sv-margin__key">
              <li class="k1">${T("Product cost", "تكلفة المنتج")}</li>
              <li class="k2">${T("Delivery", "التوصيل")}</li>
              <li class="k3">${T("Returns and unpaid cash on delivery", "مرتجعات وأوردرات دفع عند الاستلام ماتدفعتش")}</li>
              <li class="k4">${T("Gross margin", "هامش الربح")}</li>
            </ul>
            <div class="sv-margin__f">
              <p>${T("Break-even ROAS", "نقطة التعادل (ROAS)")} <b>=</b> <span dir="ltr">1 ÷</span> ${T("gross margin", "هامش الربح")}</p>
              ${T("With a 40% margin, every 1 spent on ads has to bring back 2.5 in sales before the campaign makes money. Below that line, more sales means more loss.", "لو الهامش 40%، كل 1 بتصرفه على الإعلانات لازم يرجّع 2.5 مبيعات قبل ما الحملة تكسب. تحت الخط ده، مبيعات أكتر يعني خسارة أكتر.", "p", 'class="sv-margin__note"')}
            </div>
          </div>`;

// ------------------------------------------------------------------ google ads
const gHero = () => fig("sv-serp", "Example search results page with a sponsored result matched to buying intent.", "مثال لصفحة نتايج بحث فيها إعلان مطابق لنية الشراء.", `            <div class="sv-serp__q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>${T("apartments for sale new cairo installments", "شقق للبيع في التجمع بالتقسيط", "span", 'class="sv-serp__typed"')}</div>
            <div class="sv-serp__ad">
              <p class="sv-serp__url">${T("Sponsored", "إعلان")} <span dir="ltr">yourbrand.com/new-cairo</span></p>
              ${T("Apartments in New Cairo with installments, see prices", "شقق في التجمع بالتقسيط، شوف الأسعار", "p", 'class="sv-serp__title"')}
              ${T("Same words as the search, a page that answers it, and a call that is tracked.", "نفس كلام البحث، وصفحة بترد عليه، ومكالمة متتبعة.", "p", 'class="sv-serp__desc"')}
              <div class="sv-serp__tags">${T("Buying intent", "نية شراء", "span", 'class="sv-tagpill sv-tagpill--on"')}${T("Arabic keyword", "كلمة بالعربي", "span", 'class="sv-tagpill"')}${T("Tracked call", "مكالمة متتبعة", "span", 'class="sv-tagpill"')}</div>
            </div>
            <div class="sv-serp__org"><i></i><i></i><i></i></div>
            <div class="sv-serp__org"><i></i><i></i></div>
            <div class="sv-serp__neg">${T("Searches we stop paying for", "بحث بنبطّل ندفع عليه", "span", 'class="sv-serp__negh"')}${["for rent|إيجار", "jobs|وظايف", "free|ببلاش", "pdf|pdf"].map(x => { const [en, ar] = x.split("|"); return T(en, ar, "s"); }).join("")}</div>`);
const ladder = [
  [["Learning", "بيتعلم"], ["how to choose an apartment", "ازاي اختار شقة"], ["YouTube and Demand Gen", "يوتيوب وDemand Gen"]],
  [["Comparing", "بيقارن"], ["best compounds in new cairo", "احسن كمبوندات التجمع"], ["Search, by area and project", "بحث حسب المنطقة والمشروع"]],
  [["Ready to buy", "جاهز يشتري"], ["apartment for sale new cairo installments", "شقة للبيع في التجمع بالتقسيط"], ["Search and brand, bid highest", "بحث وبراند، بأعلى مزايدة"]]
];
const gSig = () => `<ol class="sv-ladder" aria-label="The intent ladder: what people search at each stage and the campaign that answers it." data-ar-label="سلّم النية: الناس بتدوّر على إيه في كل مرحلة، وأنهي حملة بترد.">
${ladder.map(([stage, q, camp], i) => `            <li style="--i:${i}">
              ${T(stage[0], stage[1], "b")}
              <span class="sv-ladder__q" dir="auto">${T("“" + q[0] + "”", "«" + q[1] + "»")}</span>
              ${T(camp[0], camp[1], "span", 'class="sv-ladder__c"')}
            </li>`).join("\n")}
          </ol>`;

// ------------------------------------------------------------------ seo
const seoHero = () => fig("sv-spell", "One search written three ways, each reaching the right language version of the same page.", "نفس البحث مكتوب بتلات طرق، وكل طريقة بتوصل لنسخة اللغة الصح من نفس الصفحة.", `            <div class="sv-inst__bar">${T("One search, three ways to type it", "بحث واحد، بتلات طرق كتابة")}</div>
            <ul class="sv-spell__list">
              <li><span class="sv-spell__k">${T("Arabic", "عربي")}</span><span class="sv-spell__q" dir="rtl" lang="ar">افضل دكتور اسنان في التجمع</span><span class="sv-spell__to" dir="ltr">/ar/dentist-new-cairo</span></li>
              <li><span class="sv-spell__k">${T("English", "إنجليزي")}</span><span class="sv-spell__q" dir="ltr" lang="en">best dentist new cairo</span><span class="sv-spell__to" dir="ltr">/dentist-new-cairo</span></li>
              <li><span class="sv-spell__k">${T("Franco", "فرانكو")}</span><span class="sv-spell__q" dir="ltr" lang="ar-Latn">a7san doctor asnan fl tagamo3</span><span class="sv-spell__to" dir="ltr">/ar/dentist-new-cairo</span></li>
            </ul>
            <pre class="sv-code" dir="ltr"><span>&lt;link rel="alternate" hreflang="ar"</span><span>      href="/ar/dentist-new-cairo"&gt;</span><span>&lt;link rel="alternate" hreflang="en"</span><span>      href="/dentist-new-cairo"&gt;</span></pre>`);
const seoSig = () => `<div class="sv-pair" role="img" aria-label="Two pages, one per language, linked with hreflang so each can rank in its own language." data-ar-label="صفحتين، واحدة لكل لغة، متربوطين بـ hreflang عشان كل واحدة تظهر بلغتها.">
            <div class="sv-page sv-page--en"><span class="sv-page__url" dir="ltr">brand.com/services</span><i class="sv-page__h"></i><i></i><i></i><i class="short"></i>${T("English page", "الصفحة الإنجليزي", "b")}</div>
            <div class="sv-pair__link"><span dir="ltr">hreflang</span><svg viewBox="0 0 80 24" aria-hidden="true"><path d="M4 8h70m-6-5 6 5-6 5M76 16H6m6-5-6 5 6 5"/></svg></div>
            <div class="sv-page sv-page--ar" dir="rtl"><span class="sv-page__url" dir="ltr">brand.com/ar/services</span><i class="sv-page__h"></i><i></i><i></i><i class="short"></i>${T("Arabic page", "الصفحة العربي", "b")}</div>
          </div>`;

// ------------------------------------------------------------------ branding
const brandHero = () => fig("sv-spec", "Example brand specimen sheet: logo slot, bilingual type, colour roles and voice.", "مثال لورقة هوية: مكان اللوجو، خطوط بلغتين، أدوار الألوان، وطريقة الكلام.", `            <div class="sv-spec__logo">${T("Logo", "اللوجو")}</div>
            <div class="sv-spec__type"><span class="sv-spec__glyph" lang="en">Aa</span><span class="sv-spec__glyph" lang="ar">أب</span>${T("One type system for both scripts", "نظام خطوط واحد للغتين", "small")}</div>
            <div class="sv-spec__sw">
              <span class="is-1">${T("Primary", "أساسي")}</span><span class="is-2">${T("Accent", "مميز")}</span><span class="is-3">${T("Ink", "نص")}</span><span class="is-4">${T("Paper", "خلفية")}</span>
            </div>
            <div class="sv-spec__voice">${T("Voice", "طريقة الكلام", "b")}${T("Clear", "واضح", "span", 'class="sv-tagpill"')}${T("Warm", "قريب", "span", 'class="sv-tagpill"')}${T("Sure of itself", "واثق", "span", 'class="sv-tagpill"')}</div>`);
const brandSig = () => `<div class="sv-lock" role="img" aria-label="A bilingual lockup: the Arabic and English names drawn on shared guide lines." data-ar-label="لوجو بلغتين: الاسم العربي والإنجليزي مرسومين على نفس خطوط الضبط.">
            <div class="sv-lock__mark"></div>
            <div class="sv-lock__names">
              <span class="sv-lock__en" lang="en" dir="ltr">Your brand</span>
              <span class="sv-lock__ar" lang="ar" dir="rtl">براندك</span>
            </div>
            <i class="sv-lock__g g1"></i><i class="sv-lock__g g2"></i><i class="sv-lock__g g3"></i>
            ${T("Shared baseline, matched weight, one mark", "نفس خط القاعدة، نفس التقل، وعلامة واحدة", "p", 'class="sv-lock__cap"')}
          </div>`;

// ------------------------------------------------------------------ web and cro
const spots = [
  ["The headline says what you sell, in one line", "العنوان بيقول إنت بتبيع إيه، في سطر واحد"],
  ["One main action, visible without scrolling", "زرار واحد أساسي، باين من غير سكرول"],
  ["Proof next to the action", "دليل جنب الزرار"],
  ["A WhatsApp button that is tracked", "زرار واتساب متتبع"]
];
const dot = n => `<span class="sv-anno__dot" aria-hidden="true">${n}</span>`;
const webHero = () => fig("sv-anno", "Example landing page with four numbered conversion points.", "مثال لصفحة هبوط عليها أربع نقط تحويل مترقمة.", `            <div class="sv-anno__page">
              <div class="sv-anno__bar"><i></i><i></i><i></i><span dir="ltr">yourbrand.com/offer</span></div>
              <div class="sv-anno__body">
                <div class="sv-anno__t">${dot(1)}<i class="sv-anno__h"></i></div>
                <i class="sv-anno__l"></i><i class="sv-anno__l short"></i>
                <div class="sv-anno__t" style="width:46%">${dot(2)}<span class="sv-anno__btn" style="width:100%"></span></div>
                <div class="sv-anno__t sv-anno__proof">${dot(3)}<i></i><i></i><i></i></div>
                <div class="sv-anno__t" style="justify-self:end">${dot(4)}<span class="sv-anno__wa"></span></div>
              </div>
            </div>
            <ol class="sv-anno__key">
${spots.map(([en, ar]) => `              ${T(en, ar, "li")}`).join("\n")}
            </ol>`);
const leaks = [
  [["Ad click", "ضغطة على الإعلان"], null],
  [["Page loads", "الصفحة بتفتح"], ["Slow on a mid-range phone", "بطيئة على موبايل متوسط"]],
  [["Understands the offer", "فهم العرض"], ["Headline about you, not about them", "العنوان بيتكلم عنك مش عنه"]],
  [["Trusts you", "وثق فيك"], ["No proof near the action", "مفيش دليل جنب الزرار"]],
  [["Takes action", "اتحرك"], ["A form with too many fields", "فورم فيه خانات كتير"]],
  [["Becomes a lead or a sale", "بقى عميل أو بيعة"], null]
];
const webSig = () => `<ol class="sv-leaks" aria-label="The path from ad click to sale, and where pages usually lose people." data-ar-label="الطريق من الضغطة على الإعلان لحد البيعة، والأماكن اللي الصفحات بتخسر فيها الناس.">
${leaks.map(([step, leak]) => `            <li${leak ? ' class="has-leak"' : ""}>${T(step[0], step[1], "b")}${leak ? T(leak[0], leak[1], "span", 'class="sv-leaks__l"') : ""}</li>`).join("\n")}
          </ol>`;

// ------------------------------------------------------------------ analytics
const anHero = () => fig("sv-pipe", "How tracking data flows: from your site, WhatsApp and CRM, through Tag Manager, to GA4, ad platforms and one dashboard.", "البيانات بتمشي إزاي: من موقعك وواتساب والـ CRM، عن طريق Tag Manager، لـ GA4 ومنصات الإعلانات وداشبورد واحد.", `            <div class="sv-pipe__col">${T("Where it happens", "بيحصل فين", "small")}${T("Website", "الموقع", "span", 'class="sv-node"')}${T("WhatsApp", "واتساب", "span", 'class="sv-node"')}${T("CRM", "الـ CRM", "span", 'class="sv-node"')}</div>
            <div class="sv-pipe__mid"><svg viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20 C30 20 30 60 60 60 M0 60 H60 M0 100 C30 100 30 60 60 60"/></svg></div>
            <div class="sv-pipe__col sv-pipe__col--hub">${T("Collected once", "بيتجمع مرة واحدة", "small")}<span class="sv-node sv-node--hub">${T("Tag Manager and server container", "Tag Manager وسيرفر")}</span></div>
            <div class="sv-pipe__mid"><svg viewBox="0 0 60 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C30 60 30 14 60 14 M0 60 C30 60 30 46 60 46 M0 60 C30 60 30 78 60 78 M0 60 C30 60 30 108 60 108"/></svg></div>
            <div class="sv-pipe__col">${T("Sent to", "بيتبعت لـ", "small")}<span class="sv-node">GA4</span><span class="sv-node">Meta CAPI</span><span class="sv-node">Google Ads</span>${T("Dashboard", "الداشبورد", "span", 'class="sv-node sv-node--out"')}</div>`);
const events = [
  ["page_view", ["Every page", "كل صفحة"], ["GA4"]],
  ["view_item", ["Product or service page", "صفحة منتج أو خدمة"], ["GA4", "Meta CAPI"]],
  ["add_to_cart", ["Added to cart", "اتضاف للسلة"], ["GA4", "Meta CAPI", "TikTok"]],
  ["generate_lead", ["Form sent", "الفورم اتبعت"], ["GA4", "Meta CAPI", "Google Ads"]],
  ["whatsapp_click", ["WhatsApp button", "زرار واتساب"], ["GA4", "Meta CAPI"]],
  ["purchase", ["Paid order, from the server", "أوردر مدفوع، من السيرفر"], ["GA4", "Meta CAPI", "Google Ads", "TikTok"]],
  ["closed_deal", ["Deal closed in the CRM", "صفقة اتقفلت في الـ CRM"], ["Google Ads", "Meta CAPI"]]
];
const anSig = () => `<div class="sv-events" role="table" aria-label="Example event map" data-ar-label="مثال لخريطة الأحداث">
            <div class="sv-events__r sv-events__head" role="row">${T("Event", "الحدث", "span", 'role="columnheader"')}${T("When it fires", "بيشتغل إمتى", "span", 'role="columnheader"')}${T("Sent to", "بيتبعت لـ", "span", 'role="columnheader"')}</div>
${events.map(([ev, when, to]) => `            <div class="sv-events__r" role="row"><code role="cell" dir="ltr">${ev}</code>${T(when[0], when[1], "span", 'role="cell"')}<span role="cell" class="sv-events__to">${to.map(x => `<i>${x}</i>`).join("")}</span></div>`).join("\n")}
          </div>`;

export default {
  "performance-marketing.html": { key: "perf", hero: perfHero, sig: perfSig, chan: ["Paid social", "الإعلانات الممولة"] },
  "google-ads.html": { key: "gads", hero: gHero, sig: gSig, chan: ["Search intent", "نية البحث"] },
  "seo.html": { key: "seo", hero: seoHero, sig: seoSig, chan: ["Organic search", "البحث المجاني"] },
  "branding.html": { key: "brand", hero: brandHero, sig: brandSig, chan: ["Brand and creative", "الهوية والإبداع"] },
  "web-cro.html": { key: "web", hero: webHero, sig: webSig, chan: ["Conversion", "التحويل"] },
  "analytics-tracking.html": { key: "data", hero: anHero, sig: anSig, chan: ["Measurement", "القياس"] }
};
