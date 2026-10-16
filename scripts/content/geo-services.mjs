// Section 12 content for the six service pages (EN + Egyptian Arabic). Injected by scripts/geo.mjs.
// Facts rule: only what the site already states (homepage "Where we work", products.html, the market articles).
// No statistics, prices, client names or results.

// Egypt vs Saudi Arabia, as stated on the homepage, products.html and the market articles.
export const MARKET = {
  platforms: [["Where people are", "الناس موجودة فين"],
    ["Facebook, Instagram, TikTok and WhatsApp, with Google for search-led categories.", "فيسبوك وإنستجرام وتيك توك وواتساب، وجوجل للمجالات اللي الناس بتدوّر عليها."],
    ["Snapchat, TikTok, Instagram, X and YouTube, with Google for high-intent search.", "سناب شات وتيك توك وإنستجرام وX ويوتيوب، وجوجل للبحث اللي وراه نية شرا."]],
  buying: [["How they buy", "بيشتروا إزاي"],
    ["They ask on WhatsApp before buying, so reply speed decides many sales.", "بيسألوا على واتساب قبل ما يشتروا، فسرعة الرد بتحسم بيعات كتير."],
    ["They expect a local feel; content written for elsewhere is noticed fast.", "متوقعين إحساس محلي، والمحتوى المعمول لسوق تاني بيبان بسرعة."]],
  language: [["Language", "اللغة"],
    ["Egyptian Arabic for most brands, English for premium and B2B.", "عامية مصرية لأغلب البراندز، وإنجليزي للبراندز الفاخرة والـ B2B."],
    ["Saudi Arabic and local faces.", "لهجة سعودية ووشوش محلية."]],
  payment: [["Payment", "الدفع"],
    ["Cash on delivery, InstaPay, cards and installments. VAT is 14%.", "الدفع عند الاستلام وإنستاباي والكروت والتقسيط. والضريبة 14%."],
    ["Mada, Apple Pay and buy-now-pay-later, with prices shown in riyals including 15% VAT.", "مدى وأبل باي واشتري دلوقتي وادفع بعدين، والأسعار بتظهر بالريال شاملة ضريبة 15%."]],
  seasons: [["Seasons", "المواسم"],
    ["Costs climb every season while margins stay the same, and prices move every few months, so targets are reset on margin.", "التكاليف بتزيد كل موسم والهامش ثابت، والأسعار بتتغير كل كام شهر، فالأهداف بتتظبط على أساس الهامش."],
    ["Ramadan, Founding Day, National Day, White Friday and payday around the 27th shape the media plan.", "رمضان ويوم التأسيس واليوم الوطني والجمعة البيضا ويوم المرتب حوالين 27 في الشهر هما اللي بيشكّلوا خطة الميديا."]]
};

// "How it's priced", shared facts from products.html, then one service-specific line per page.
const PRICED = (en, ar) => [
  [`${en} Every engagement is scoped in a written proposal with deliverables, timeline, revision rounds and a fixed fee. Media budgets are paid straight to the ad platforms, separate from our fees. Invoices are in Egyptian pounds, Saudi riyals or US dollars, and VAT is added where the law requires it. Anything outside the agreed scope is priced and approved before it starts.`,
   `${ar} كل شغل بيتحدد في عرض مكتوب فيه المطلوب والمدة وعدد جولات التعديل وسعر ثابت. ميزانية الإعلانات بتتدفع للمنصات مباشرة، منفصلة عن أتعابنا. الفواتير بالجنيه المصري أو الريال السعودي أو الدولار، والضريبة بتتضاف حسب القانون. وأي حاجة برا النطاق المتفق عليه بيتحدد سعرها وتتوافق عليها قبل ما تبدأ.`]
];

export default {
  "performance-marketing.html": {
    answer: ["Brand Vitals runs performance marketing on Meta, TikTok and Snapchat for brands in Egypt and Saudi Arabia, measured on revenue, qualified leads and cost per acquisition. It suits businesses that already sell and want paid social to pay back. Work starts with a free audit of your accounts, tracking and margins.",
      "Brand Vitals بتدير إعلانات ممولة على ميتا وتيك توك وسناب شات للبراندز في مصر والسعودية، وبتتقاس بالإيراد والعملاء الجادين وتكلفة الاستحواذ. مناسبة للبيزنس اللي بيبيع فعلًا وعايز الإعلانات الممولة ترجّع فلوسها. والشغل بيبدأ بتدقيق مجاني للحسابات والتتبع وهامش الربح."],
    marketLead: ["Paid social in Egypt and Saudi Arabia is not one plan in two languages. These are the differences we plan for, as stated in our market notes.",
      "الإعلانات الممولة في مصر والسعودية مش خطة واحدة بلغتين. دي الفروق اللي بنخطط على أساسها، زي ما هي مكتوبة في ملاحظات السوق عندنا."],
    marketExtra: [["What changes in the plan", "إيه اللي بيتغير في الخطة"],
      ["Click-to-WhatsApp and Meta often lead; conversations are tracked to the sale.", "إعلانات واتساب وميتا غالبًا في المقدمة، والمحادثات بتتتبع لحد البيعة."],
      ["Snapchat gets a fair test next to Meta and TikTok, with its own creative and Snap Pixel or Conversions API.", "سناب شات بياخد اختبار عادل جنب ميتا وتيك توك، بكرييتيف خاص بيه وSnap Pixel أو Conversions API."]],
    priced: PRICED("Performance marketing is usually run as a Performance Sprint or an always-on programme, priced by custom proposal.", "إدارة الإعلانات الممولة غالبًا بتمشي كـ Performance Sprint أو برنامج مستمر، وسعرها بيتحدد بعرض مخصص."),
    deliver: [
      [["Diagnose", "التشخيص"], [["Account, pixel and funnel audit", "تدقيق للحسابات والبيكسل والقمع"], ["Target CPA or ROAS agreed against margin", "تكلفة الاستحواذ أو الـ ROAS المستهدف متفق عليه على أساس الهامش"]]],
      [["Rebuild", "إعادة البناء"], [["Conversions API and events fixed", "Conversions API والأحداث متظبطة"], ["New campaign structure and the first creative batch", "هيكل حملات جديد وأول دفعة كرييتيف"]]],
      [["Test", "الاختبار"], [["A weekly creative and audience test plan", "خطة أسبوعية لاختبار الكرييتيف والجمهور"], ["A short note on every winner and loser", "ملاحظة قصيرة على كل إعلان كسب أو خسر"]]],
      [["Scale", "التوسع"], [["Budget moved into proven winners", "الميزانية بتتنقل للي ثبت إنه شغال"], ["A monthly report: spend, revenue, CPA, ROAS and next month's changes", "تقرير شهري: الصرف والإيراد وتكلفة الاستحواذ والـ ROAS والتغييرات الجاية"]]]
    ],
    explain: [
      [["Why paid social is measured on margin", "ليه الإعلانات الممولة بتتقاس على الهامش"],
        ["A campaign can show a healthy ROAS in Ads Manager and still lose money. That happens when the ROAS target ignores product cost, delivery, returns and cash-on-delivery orders that are never paid. Brand Vitals sets the target from your contribution margin, so a good week in Ads Manager is also a good week in the bank account. In Egypt, where prices move every few months, the target is reviewed whenever prices or costs change.",
         "ممكن حملة تبان كويسة في Ads Manager وبرضه تخسر. ده بيحصل لما الـ ROAS المستهدف يتجاهل تكلفة المنتج والتوصيل والمرتجعات وأوردرات الدفع عند الاستلام اللي ماتدفعتش. Brand Vitals بتحط الهدف من هامش المساهمة بتاعك، عشان الأسبوع الكويس في Ads Manager يبقى أسبوع كويس في الحساب البنكي كمان. وفي مصر، اللي الأسعار فيها بتتغير كل كام شهر، الهدف بيتراجع كل ما الأسعار أو التكاليف تتغير."]],
      [["Creative is the main lever", "الكرييتيف هو أهم أداة"],
        ["Targeting options on Meta, TikTok and Snapchat have narrowed, so the ad itself now decides who sees it and who buys. Paid social at Brand Vitals runs a weekly testing rhythm: new hooks, angles and formats briefed with Vitals Frames, judged on cost per result rather than likes. Winning ideas get variations before they fatigue; losing ones are switched off with a note on why.",
         "اختيارات الاستهداف في ميتا وتيك توك وسناب شات بقت أضيق، فالإعلان نفسه بقى هو اللي بيحدد مين يشوفه ومين يشتري. الإعلانات الممولة في Brand Vitals ماشية بإيقاع اختبار أسبوعي: هوكس وزوايا وفورمات جديدة بتتعمل مع Vitals Frames، وبتتحكم عليها بتكلفة النتيجة مش باللايكات. الأفكار الكسبانة بتاخد نسخ جديدة قبل ما تتعب، والخسرانة بتتقفل ومعاها ملاحظة بالسبب."]]
    ],
    terms: ["roas", "break-even-roas", "cpa", "conversions-api", "creative-testing", "click-to-whatsapp"],
    faq: [
      ["Is Brand Vitals a Meta ads agency in Egypt?", "هل Brand Vitals شركة إعلانات ممولة على فيسبوك وإنستجرام في مصر؟",
       "Yes. Brand Vitals manages Meta ads (Facebook and Instagram) for brands in Egypt from its office in New Cairo, alongside TikTok and Snapchat. Campaigns are measured on revenue and cost per acquisition, not on reach.",
       "أيوه. Brand Vitals بتدير إعلانات ميتا (فيسبوك وإنستجرام) للبراندز في مصر من مكتبها في القاهرة الجديدة، ومعاها تيك توك وسناب شات. والحملات بتتقاس بالإيراد وتكلفة الاستحواذ، مش بعدد الوصول."],
      ["Do you run TikTok and Snapchat ads in Saudi Arabia?", "بتديروا إعلانات تيك توك وسناب شات في السعودية؟",
       "Yes. For Saudi campaigns Brand Vitals tests Snapchat and TikTok next to Meta, with Saudi creative, prices in SAR including VAT, and the Snap Pixel or Conversions API installed before spend starts.",
       "أيوه. في حملات السعودية Brand Vitals بتختبر سناب شات وتيك توك جنب ميتا، بكرييتيف سعودي وأسعار بالريال شاملة الضريبة، وبيتركب Snap Pixel أو Conversions API قبل ما الصرف يبدأ."],
      ["What is a good ROAS for paid social?", "إيه الـ ROAS الكويس للإعلانات الممولة؟",
       "A good ROAS is one above your break-even ROAS, which is one divided by your gross margin. A ROAS that looks high can still lose money if margin is thin, so Brand Vitals sets the target from margin first.",
       "الـ ROAS الكويس هو اللي أعلى من نقطة التعادل بتاعتك، واللي هي واحد مقسوم على هامش الربح الإجمالي. ممكن ROAS يبان عالي وبرضه يخسر لو الهامش قليل، عشان كده Brand Vitals بتحط الهدف من الهامش الأول."],
      ["Can you run click-to-WhatsApp campaigns?", "تقدروا تشغّلوا حملات تفتح شات واتساب؟",
       "Yes. Click-to-WhatsApp campaigns suit Egypt, where many customers ask before they buy. Brand Vitals sets up fast first replies and tracks each conversation to the sale, so you can see which ad actually sold.",
       "أيوه. حملات واتساب مناسبة لمصر، لأن عملاء كتير بيسألوا قبل ما يشتروا. Brand Vitals بتظبط رد أول سريع وبتتتبع كل محادثة لحد البيعة، عشان تعرف أنهي إعلان باع فعلًا."],
      ["Can we plan our paid social budget before we call?", "نقدر نخطط ميزانية الإعلانات قبل ما نكلمكم؟",
       "Yes. Vitals Forecast is a free tool on this site. Enter your budget, average order value and margin to see your break-even ROAS and what has to be true to hit your target.",
       "أيوه. Vitals Forecast أداة مجانية على الموقع. دخّل الميزانية ومتوسط قيمة الطلب وهامش الربح، وشوف نقطة التعادل وإيه اللي لازم يحصل عشان توصل لهدفك."]
    ],
    links: { services: ["google-ads.html", "analytics-tracking.html"], industry: "ecommerce-marketing.html", posts: ["blog-creative-testing.html", "blog-ksa-snapchat.html"], tool: "forecast.html" }
  },

  "google-ads.html": {
    answer: ["Brand Vitals manages Google Ads in Arabic and English for businesses in Egypt and Saudi Arabia: search, Performance Max, YouTube and call tracking, built around conversions you can verify. It suits brands whose customers search before they buy. Work starts with a free audit of your account and tracking.",
      "Brand Vitals بتدير إعلانات جوجل بالعربي والإنجليزي للبيزنس في مصر والسعودية: بحث وPerformance Max ويوتيوب وتتبع المكالمات، كله مبني على تحويلات تقدر تتأكد منها. مناسبة للبراندز اللي عملاؤها بيدوّروا قبل ما يشتروا. والشغل بيبدأ بتدقيق مجاني للحساب والتتبع."],
    marketLead: ["Search works in both markets, but the words people type, the language of the ad and the payment they expect differ. These are the differences we plan for.",
      "البحث شغال في السوقين، بس الكلمات اللي الناس بتكتبها ولغة الإعلان وطريقة الدفع اللي متوقعينها مختلفة. ودي الفروق اللي بنخطط على أساسها."],
    marketExtra: [["What changes in the plan", "إيه اللي بيتغير في الخطة"],
      ["Keywords in Egyptian Arabic, English and Franco spellings; calls and WhatsApp clicks tracked as leads.", "كلمات بالعامية المصرية والإنجليزي والفرانكو، والمكالمات وضغطات واتساب بتتحسب كعملاء."],
      ["Keywords in Saudi phrasing and English; Google covers the high-intent searches while social builds demand.", "كلمات بالصياغة السعودية والإنجليزي، وجوجل بيغطي البحث اللي وراه نية شرا والسوشيال بيبني الطلب."]],
    priced: PRICED("Google Ads management is scoped as part of a Performance Sprint or an always-on programme, priced by custom proposal.", "إدارة إعلانات جوجل بتتحدد كجزء من Performance Sprint أو برنامج مستمر، وسعرها بعرض مخصص."),
    deliver: [
      [["Audit", "التدقيق"], [["Search terms, structure and tracking review", "مراجعة لكلمات البحث والهيكل والتتبع"], ["A list of wasted spend to cut first", "قائمة بالصرف الضايع اللي يتقطع الأول"]]],
      [["Rebuild", "إعادة البناء"], [["Bilingual keyword map and campaign structure", "خريطة كلمات بلغتين وهيكل حملات"], ["Verified conversions: forms, calls and WhatsApp", "تحويلات متأكد منها: فورمز ومكالمات وواتساب"]]],
      [["Optimize", "التحسين"], [["Weekly negative keyword and bid review", "مراجعة أسبوعية للكلمات السلبية والمزايدات"], ["Ad and landing page tests", "اختبارات للإعلانات وصفحات الهبوط"]]],
      [["Expand", "التوسع"], [["Performance Max and YouTube where data supports it", "Performance Max ويوتيوب لما البيانات تسمح"], ["Monthly report on cost per lead or sale", "تقرير شهري لتكلفة العميل أو البيعة"]]]
    ],
    explain: [
      [["Why Arabic search needs its own keyword list", "ليه البحث بالعربي محتاج قائمة كلمات خاصة بيه"],
        ["People in Egypt and Saudi Arabia search the same product with different words, in Arabic script, in English and sometimes in Latin letters. A keyword list translated from English misses most of that demand and pays for irrelevant clicks. Google Ads at Brand Vitals starts with bilingual keyword research for each market, then groups searches by intent so every ad and landing page answers the question that was typed.",
         "الناس في مصر والسعودية بتدوّر على نفس المنتج بكلمات مختلفة، بالحروف العربي وبالإنجليزي وأحيانًا بالفرانكو. قائمة الكلمات المترجمة من الإنجليزي بتفوّت أغلب الطلب ده وبتدفع في ضغطات مالهاش لازمة. إعلانات جوجل في Brand Vitals بتبدأ ببحث كلمات بلغتين لكل سوق، وبعدين بتجمّع عمليات البحث حسب النية، عشان كل إعلان وصفحة هبوط يردوا على السؤال اللي اتكتب."]],
      [["Performance Max, used carefully", "Performance Max، بحذر"],
        ["Performance Max can find buyers across Google's inventory, but it also spends on searches for your own brand and on placements that rarely convert. Brand Vitals turns it on only when conversion data is clean, excludes brand terms where needed, and reads results next to search campaigns before shifting budget.",
         "Performance Max ممكن يلاقي مشترين في كل أماكن جوجل، بس كمان بيصرف على عمليات بحث باسم البراند بتاعك وعلى أماكن نادرًا ما بتحوّل. Brand Vitals بتشغّله بس لما بيانات التحويل تبقى نضيفة، وبتستبعد كلمات البراند لو محتاجة، وبتقرا نتايجه جنب حملات البحث قبل ما تنقل الميزانية."]]
    ],
    terms: ["performance-max", "negative-keywords", "cpa", "conversion-rate", "offline-conversions", "landing-page"],
    faq: [
      ["Is Brand Vitals a Google Ads agency in Cairo?", "هل Brand Vitals شركة إعلانات جوجل في القاهرة؟",
       "Yes. Brand Vitals manages Google Ads from New Cairo for businesses across Egypt, and for brands selling in Saudi Arabia, in Arabic and English.",
       "أيوه. Brand Vitals بتدير إعلانات جوجل من القاهرة الجديدة للبيزنس في كل مصر، وللبراندز اللي بتبيع في السعودية، بالعربي والإنجليزي."],
      ["Do you manage Google Ads in Saudi Arabia?", "بتديروا إعلانات جوجل في السعودية؟",
       "Yes. Saudi Google Ads campaigns use Saudi phrasing, prices in SAR with VAT included, and landing pages that match, so high-intent searches convert.",
       "أيوه. حملات جوجل في السعودية بتستخدم الصياغة السعودية، والأسعار بالريال شاملة الضريبة، وصفحات هبوط مناسبة ليها، عشان البحث اللي وراه نية شرا يتحوّل."],
      ["What are negative keywords and why do they matter?", "إيه الكلمات السلبية وليه مهمة؟",
       "Negative keywords stop Google Ads from showing for searches you don't want, such as jobs or free. Reviewing them every week is one of the fastest ways to cut wasted spend.",
       "الكلمات السلبية بتمنع إعلانات جوجل إنها تظهر لعمليات بحث مش عايزها، زي وظايف أو مجاني. ومراجعتها كل أسبوع من أسرع الطرق لتقليل الصرف الضايع."],
      ["Can Google Ads work for WhatsApp leads?", "إعلانات جوجل تنفع مع العملاء اللي بيكلموا على واتساب؟",
       "Yes. WhatsApp clicks and calls can be tracked as conversions, so Google Ads optimizes toward the conversations that become customers, not only form fills.",
       "أيوه. ضغطات واتساب والمكالمات ممكن تتحسب كتحويلات، فإعلانات جوجل بتتحسن ناحية المحادثات اللي بتتحول لعملاء، مش بس الفورمز."],
      ["How do you report Google Ads results?", "بتعرضوا نتايج إعلانات جوجل إزاي؟",
       "Google Ads results are reported monthly in plain language: spend, cost per lead or sale, the searches that drove them, and what changes next month.",
       "نتايج إعلانات جوجل بتتعرض كل شهر بلغة بسيطة: الصرف، وتكلفة العميل أو البيعة، وعمليات البحث اللي جابتهم، وإيه اللي هيتغير الشهر الجاي."]
    ],
    links: { services: ["seo.html", "web-cro.html"], industry: "real-estate-marketing.html", posts: ["blog-arabic-seo-guide.html", "blog-prospecting-vs-retargeting.html"], tool: "forecast.html" }
  },

  "seo.html": {
    answer: ["Brand Vitals is an Arabic SEO agency in Egypt that ranks bilingual websites in the language customers search in: technical fixes, Arabic keyword research, content and local SEO, plus readiness for AI search. It suits brands with a site worth growing. Work starts with a free technical audit.",
      "Brand Vitals شركة سيو في مصر بتطلّع المواقع اللي بلغتين في اللغة اللي العملاء بيدوّروا بيها: إصلاحات تقنية، وبحث كلمات بالعربي، ومحتوى، وسيو محلي، وكمان تجهيز للبحث بالذكاء الاصطناعي. مناسبة للبراندز اللي عندها موقع يستاهل يكبر. والشغل بيبدأ بتدقيق تقني مجاني."],
    marketLead: ["Arabic SEO is not translated SEO. Searchers in Egypt and Saudi Arabia use different words and expect different pages.",
      "السيو العربي مش سيو مترجم. اللي بيدوّر في مصر غير اللي بيدوّر في السعودية، في الكلمات وفي الصفحات اللي متوقعها."],
    marketExtra: [["What changes in the plan", "إيه اللي بيتغير في الخطة"],
      ["Content in Egyptian phrasing where the brand speaks it, English for premium and B2B searches.", "محتوى بالصياغة المصرية لو البراند بيتكلم بيها، وإنجليزي لبحث البراندز الفاخرة والـ B2B."],
      ["Pages that use Saudi phrasing and show SAR prices with VAT; local SEO for each city served.", "صفحات بالصياغة السعودية وبأسعار بالريال شاملة الضريبة، وسيو محلي لكل مدينة بتخدمها."]],
    priced: PRICED("SEO is usually an ongoing monthly programme after a one-off technical audit, priced by custom proposal.", "السيو غالبًا برنامج شهري مستمر بعد تدقيق تقني لمرة واحدة، وسعره بعرض مخصص."),
    deliver: [
      [["Audit", "التدقيق"], [["Technical audit: crawl, speed, indexing, hreflang", "تدقيق تقني: الزحف والسرعة والفهرسة وhreflang"], ["Keyword map in Arabic and English", "خريطة كلمات بالعربي والإنجليزي"]]],
      [["Fix", "الإصلاح"], [["Prioritized fixes shipped with your developers", "إصلاحات مرتبة بالأولوية بتتنفذ مع المطورين بتوعك"], ["Structured data and sitemaps", "بيانات منظمة وخرايط موقع"]]],
      [["Publish", "النشر"], [["A monthly content plan, written natively in each language", "خطة محتوى شهرية، مكتوبة أصلًا بكل لغة"], ["Local SEO and Google Business Profile updates", "سيو محلي وتحديثات Google Business Profile"]]],
      [["Compound", "التراكم"], [["Monthly report on rankings, traffic and leads from search", "تقرير شهري للترتيب والزيارات والعملاء من البحث"], ["Refreshes for pages that slip", "تحديث للصفحات اللي بتنزل"]]]
    ],
    explain: [
      [["Bilingual architecture comes first", "هيكل الموقع بلغتين أول خطوة"],
        ["Many bilingual sites in the region show Arabic and English on the same address, switched by a button. Search engines then see one page and rank it in one language. Brand Vitals gives each language its own URL, links them with hreflang, and writes Arabic pages natively instead of translating them, so each version can rank on its own.",
         "مواقع كتير في المنطقة بتعرض العربي والإنجليزي على نفس الرابط وبتبدّل بينهم بزرار. ساعتها محركات البحث بتشوف صفحة واحدة وبترتبها بلغة واحدة. Brand Vitals بتدّي كل لغة رابط خاص بيها، وبتربطهم بـ hreflang، وبتكتب الصفحات العربي من الأول بدل ما تترجمها، عشان كل نسخة تترتب لوحدها."]],
      [["Ready for AI search", "جاهز للبحث بالذكاء الاصطناعي"],
        ["Answer engines such as ChatGPT, Gemini, Perplexity and Google AI Overviews quote pages that answer clearly, define their terms and state facts the same way everywhere. Brand Vitals writes answer-first summaries, self-contained FAQs and consistent company details, and keeps a public llms.txt so these systems understand the business.",
         "محركات الإجابة زي ChatGPT وGemini وPerplexity وملخصات جوجل بتقتبس من الصفحات اللي بترد بوضوح، وبتعرّف مصطلحاتها، وبتقول المعلومات بنفس الطريقة في كل مكان. Brand Vitals بتكتب ملخصات بتبدأ بالإجابة، وأسئلة شائعة كل إجابة فيها كاملة لوحدها، وبيانات شركة ثابتة، وبتحافظ على ملف llms.txt عام عشان الأنظمة دي تفهم البيزنس."]]
    ],
    terms: ["technical-seo", "hreflang", "local-seo", "ai-search", "core-web-vitals", "landing-page"],
    faq: [
      ["Is Brand Vitals an SEO company in Egypt?", "هل Brand Vitals شركة سيو في مصر؟",
       "Yes. Brand Vitals is an SEO company based in New Cairo that works on Arabic and English websites for brands in Egypt and Saudi Arabia.",
       "أيوه. Brand Vitals شركة سيو مقرها القاهرة الجديدة، وبتشتغل على مواقع بالعربي والإنجليزي لبراندز في مصر والسعودية."],
      ["Do you do SEO for Saudi websites?", "بتعملوا سيو لمواقع سعودية؟",
       "Yes. SEO for Saudi Arabia uses Saudi phrasing in keywords and content, SAR prices with VAT, and local SEO for the cities a business serves.",
       "أيوه. السيو للسعودية بيستخدم الصياغة السعودية في الكلمات والمحتوى، وأسعار بالريال شاملة الضريبة، وسيو محلي للمدن اللي البيزنس بيخدمها."],
      ["What is hreflang and does my site need it?", "إيه هو hreflang وموقعي محتاجه؟",
       "hreflang tells search engines which page is Arabic and which is English. Any site with separate language versions needs it, so each searcher lands on the right one.",
       "hreflang بيقول لمحركات البحث أنهي صفحة عربي وأنهي إنجليزي. أي موقع عنده نسخ منفصلة لكل لغة محتاجه، عشان كل واحد يوصل للنسخة الصح."],
      ["Do you write Arabic content or translate English?", "بتكتبوا محتوى عربي ولا بتترجموا من الإنجليزي؟",
       "Brand Vitals writes Arabic content natively. Arabic SEO is not translated SEO: the words people search and the questions they ask differ from English.",
       "Brand Vitals بتكتب المحتوى العربي من الأول. السيو العربي مش سيو مترجم: الكلمات اللي الناس بتدوّر بيها والأسئلة اللي بتسألها مختلفة عن الإنجليزي."],
      ["Is local SEO part of the work?", "السيو المحلي جزء من الشغل؟",
       "Yes, for businesses with branches or a service area. Local SEO covers the Google Business Profile, consistent name, address and phone everywhere, and genuine reviews.",
       "أيوه، للبيزنس اللي عنده فروع أو منطقة خدمة. السيو المحلي بيشمل Google Business Profile، والاسم والعنوان والتليفون ثابتين في كل مكان، والتقييمات الحقيقية."]
    ],
    links: { services: ["web-cro.html", "google-ads.html"], industry: "healthcare-marketing.html", posts: ["blog-arabic-seo-guide.html", "blog-ecommerce-kpi-stack.html"], tool: "vitals-score.html" }
  },

  "branding.html": {
    answer: ["Brand Vitals is a branding agency in Cairo that builds brand strategy, naming, visual identity and guidelines in Arabic and English, then turns them into campaigns with Vitals Frames. It suits new brands and brands that have outgrown their look. Work starts with a free consultation.",
      "Brand Vitals شركة تصميم هوية بصرية في القاهرة بتبني استراتيجية البراند والاسم والهوية البصرية ودليل الهوية بالعربي والإنجليزي، وبعدين بتحولهم لحملات مع Vitals Frames. مناسبة للبراندز الجديدة وللبراندز اللي شكلها بقى أصغر منها. والشغل بيبدأ باستشارة مجانية."],
    marketLead: ["A brand that sells in both markets keeps one idea and adapts how it speaks. These are the differences the identity has to carry.",
      "البراند اللي بيبيع في السوقين بيحتفظ بفكرة واحدة وبيغيّر طريقة كلامه. ودي الفروق اللي الهوية لازم تشيلها."],
    marketExtra: [["What changes in the identity", "إيه اللي بيتغير في الهوية"],
      ["Arabic and English names and type that work side by side; tone that fits Egyptian Arabic.", "اسم وخطوط بالعربي والإنجليزي شغالين جنب بعض، ونبرة مناسبة للعامية المصرية."],
      ["Saudi tone of voice, local faces in imagery, and price displays in SAR with VAT.", "نبرة سعودية، ووشوش محلية في الصور، وعرض الأسعار بالريال شامل الضريبة."]],
    priced: PRICED("Brand projects are priced per project by custom proposal, with the number of concepts and revision rounds written in.", "مشاريع البراند بتتسعر بالمشروع بعرض مخصص، ومكتوب فيه عدد الأفكار وجولات التعديل."),
    deliver: [
      [["Discover", "الاكتشاف"], [["Interviews, market and competitor review", "مقابلات ومراجعة للسوق والمنافسين"], ["A short findings deck", "عرض مختصر بالنتايج"]]],
      [["Define", "التحديد"], [["Positioning, messaging and naming", "التموضع والرسائل والاسم"], ["Tone of voice in Arabic and English", "نبرة الكلام بالعربي والإنجليزي"]]],
      [["Design", "التصميم"], [["Logo and visual identity, bilingual", "لوجو وهوية بصرية بلغتين"], ["Brand guidelines and source files", "دليل الهوية والملفات المفتوحة"]]],
      [["Deploy", "التطبيق"], [["Launch campaign creative", "كرييتيف حملة الإطلاق"], ["Templates for social, ads and documents", "قوالب للسوشيال والإعلانات والمستندات"]]]
    ],
    explain: [
      [["Arabic and English, designed together", "العربي والإنجليزي بيتصمموا مع بعض"],
        ["Many identities are designed in English and given an Arabic version at the end, which shows in uneven weights and awkward lockups. Brand Vitals designs the Arabic and English logo, type and layouts together, so the brand looks like itself on a Cairo billboard, a Riyadh storefront and an English pitch deck.",
         "هويات كتير بتتصمم بالإنجليزي وبعدين بتاخد نسخة عربي في الآخر، وده بيبان في أوزان مش متساوية وتركيبات غريبة. Brand Vitals بتصمم اللوجو والخطوط والتنسيقات بالعربي والإنجليزي مع بعض، عشان البراند يبان هو نفسه على بيلبورد في القاهرة، وواجهة محل في الرياض، وعرض تقديمي بالإنجليزي."]],
      [["From identity to campaigns", "من الهوية للحملات"],
        ["An identity only pays back when it is used every week. Brand Vitals hands over guidelines and source files you own, then produces the launch campaign and ad templates with Vitals Frames, so the new brand reaches customers instead of staying in a PDF.",
         "الهوية مابترجّعش فلوسها غير لما تتستخدم كل أسبوع. Brand Vitals بتسلّم دليل الهوية والملفات المفتوحة اللي بتبقى ملكك، وبعدين بتعمل حملة الإطلاق وقوالب الإعلانات مع Vitals Frames، عشان البراند الجديد يوصل للعملاء بدل ما يفضل في ملف PDF."]]
    ],
    terms: ["positioning", "brand-guidelines", "creative-testing", "ugc", "creative-fatigue"],
    faq: [
      ["Is Brand Vitals a branding agency in Cairo?", "هل Brand Vitals شركة تصميم هوية بصرية في القاهرة؟",
       "Yes. Brand Vitals designs brand strategy, naming and visual identity from New Cairo for brands in Egypt and Saudi Arabia.",
       "أيوه. Brand Vitals بتصمم استراتيجية البراند والاسم والهوية البصرية من القاهرة الجديدة لبراندز في مصر والسعودية."],
      ["Do you design brand identities for Saudi businesses?", "بتصمموا هويات تجارية لشركات سعودية؟",
       "Yes. Brand identities for Saudi businesses use a Saudi tone of voice, local imagery and Arabic type designed alongside the English, not added later.",
       "أيوه. الهويات التجارية للشركات السعودية بتستخدم نبرة سعودية وصور محلية وخط عربي متصمم جنب الإنجليزي، مش متضاف بعدين."],
      ["What do brand guidelines include?", "دليل الهوية بيشمل إيه؟",
       "Brand guidelines cover the logo, colours, type, tone of voice and imagery in Arabic and English, with examples, so every team produces work that looks like one brand.",
       "دليل الهوية بيغطي اللوجو والألوان والخطوط ونبرة الكلام والصور بالعربي والإنجليزي، مع أمثلة، عشان كل فريق يطلع شغل شبه براند واحد."],
      ["Can you refresh a brand without starting over?", "تقدروا تجددوا البراند من غير ما نبدأ من الصفر؟",
       "Yes. A brand refresh keeps what customers already recognise and fixes what holds the brand back, such as Arabic type, colour use or messaging.",
       "أيوه. تجديد البراند بيحتفظ باللي العملاء عارفينه وبيصلّح اللي معطّل البراند، زي الخط العربي أو استخدام الألوان أو الرسائل."],
      ["Do you produce the campaign after the identity?", "بتعملوا الحملة بعد الهوية؟",
       "Yes. Campaign creative and production are made with Vitals Frames, the Brand Vitals production studio, so the identity reaches customers in ads, social and video.",
       "أيوه. كرييتيف الحملة والإنتاج بيتعملوا مع Vitals Frames، ستوديو الإنتاج بتاع Brand Vitals، عشان الهوية توصل للعملاء في الإعلانات والسوشيال والفيديو."]
    ],
    links: { services: ["performance-marketing.html", "web-cro.html"], industry: "real-estate-marketing.html", posts: ["blog-creative-testing.html", "blog-b2b-to-b2c.html"], tool: "vitals-score.html" }
  },

  "web-cro.html": {
    answer: ["Brand Vitals designs bilingual websites and landing pages in Egypt and runs conversion rate optimization (CRO), so more visitors become customers from the same traffic. It suits brands paying for traffic that does not convert. Fixed-price sites are built by Vitals Web; work starts with a free audit.",
      "Brand Vitals بتصمم مواقع وصفحات هبوط بلغتين في مصر، وبتشتغل على تحسين معدل التحويل (CRO)، عشان زوار أكتر يتحولوا لعملاء من نفس الزيارات. مناسبة للبراندز اللي بتدفع في زيارات مابتحولش. المواقع بسعر ثابت بتتعمل من خلال Vitals Web، والشغل بيبدأ بتدقيق مجاني."],
    marketLead: ["A site that converts in Cairo may not convert in Riyadh. Payment, language and trust signals change by market.",
      "الموقع اللي بيحوّل في القاهرة ممكن مايحوّلش في الرياض. الدفع واللغة وعلامات الثقة بتختلف من سوق للتاني."],
    marketExtra: [["What changes on the site", "إيه اللي بيتغير في الموقع"],
      ["WhatsApp buttons next to forms, cash on delivery and InstaPay at checkout.", "زراير واتساب جنب الفورمز، والدفع عند الاستلام وإنستاباي في صفحة الدفع."],
      ["Mada, Apple Pay and buy-now-pay-later at checkout; stores on Salla or Zid where they fit.", "مدى وأبل باي واشتري دلوقتي وادفع بعدين في صفحة الدفع، ومتاجر على سلة أو زد لو مناسبين."]],
    priced: PRICED("Websites are built on fixed Vitals Web packages; CRO and landing page programmes are priced by custom proposal.", "المواقع بتتعمل على باكدجات Vitals Web بسعر ثابت، وبرامج الـ CRO وصفحات الهبوط سعرها بعرض مخصص."),
    deliver: [
      [["Measure", "القياس"], [["Analytics and funnel review", "مراجعة التحليلات ومراحل التحويل"], ["A list of the biggest drop-off points", "قائمة بأكبر الأماكن اللي الزوار بيقعوا فيها"]]],
      [["Design", "التصميم"], [["Wireframes and designs in Arabic and English", "وايرفريمز وتصميمات بالعربي والإنجليزي"], ["Copy structure for each page", "هيكلة الكلام لكل صفحة"]]],
      [["Build", "التنفيذ"], [["A fast, tracked site or landing page", "موقع أو صفحة هبوط سريعة ومتتبعة"], ["Forms and WhatsApp flows connected", "فورمز وواتساب متوصلين"]]],
      [["Test", "الاختبار"], [["A/B tests where traffic allows", "اختبارات A/B لما الزيارات تسمح"], ["A monthly report on conversion rate and leads", "تقرير شهري لنسبة التحويل والعملاء"]]]
    ],
    explain: [
      [["Speed and trust before design", "السرعة والثقة قبل التصميم"],
        ["Most visitors from ads arrive on a phone, often on a mobile connection. A page that loads slowly or hides the price and the next step loses them before the design is even seen. Brand Vitals starts CRO with speed, clear offers and trust signals in both languages, then tests layout and copy once the basics hold.",
         "أغلب الزوار اللي جايين من الإعلانات بيدخلوا من الموبايل، وكتير على نت موبايل. الصفحة اللي بتحمل ببطء أو بتخبّي السعر والخطوة الجاية بتخسرهم قبل ما حد يشوف التصميم. Brand Vitals بتبدأ الـ CRO بالسرعة والعرض الواضح وعلامات الثقة باللغتين، وبعدين بتختبر التنسيق والكلام لما الأساسيات تثبت."]],
      [["Website design in Egypt, with Arabic first-class", "تصميم مواقع في مصر، والعربي فيها أساسي"],
        ["Arabic pages are designed right-to-left from the start, with their own copy and their own URL, not mirrored from English at the end. That matters for customers, who notice awkward Arabic, and for search, which ranks each language separately.",
         "الصفحات العربي بتتصمم من اليمين للشمال من الأول، بكلام خاص بيها ورابط خاص بيها، مش معكوسة من الإنجليزي في الآخر. وده مهم للعملاء اللي بياخدوا بالهم من العربي الغريب، ومهم للبحث اللي بيرتب كل لغة لوحدها."]]
    ],
    terms: ["cro", "ab-test", "landing-page", "core-web-vitals", "conversion-rate", "hreflang"],
    faq: [
      ["Is Brand Vitals a website design company in Egypt?", "هل Brand Vitals شركة تصميم مواقع في مصر؟",
       "Yes. Brand Vitals designs and builds bilingual websites from New Cairo, and Vitals Web delivers them on fixed packages and timelines.",
       "أيوه. Brand Vitals بتصمم وتنفذ مواقع بلغتين من القاهرة الجديدة، وVitals Web بتسلّمها بباكدجات ومواعيد ثابتة."],
      ["Can you design a Salla or Zid store?", "تقدروا تصمموا متجر على سلة أو زد؟",
       "Yes. For brands selling in Saudi Arabia, Vitals Web can set up stores on Salla or Zid, with tracking connected for ads.",
       "أيوه. للبراندز اللي بتبيع في السعودية، Vitals Web تقدر تجهّز متاجر على سلة أو زد، والتتبع متوصل للإعلانات."],
      ["How long does a website take?", "الموقع بياخد قد إيه؟",
       "A Vitals Web package takes two to six weeks, depending on the package: a landing page, a company site or an online store.",
       "باكدج Vitals Web بياخد من أسبوعين لـ 6 أسابيع حسب الباكدج: صفحة هبوط، أو موقع شركة، أو متجر إلكتروني."],
      ["Should my landing page have a WhatsApp button?", "صفحة الهبوط بتاعتي محتاجة زرار واتساب؟",
       "In Egypt, usually yes, because many customers ask before buying. The WhatsApp click is tracked as a conversion so you can see which campaigns bring conversations.",
       "في مصر غالبًا أيوه، لأن عملاء كتير بيسألوا قبل ما يشتروا. وضغطة واتساب بتتحسب كتحويل عشان تعرف أنهي حملات بتجيب محادثات."],
      ["Can you check my site before a redesign?", "تقدروا تفحصوا موقعي قبل ما نعيد تصميمه؟",
       "Yes. The free Vitals Score checks speed, SEO, Arabic readiness and tracking in about a minute, and a strategist can review it with you.",
       "أيوه. فحص Vitals المجاني بيفحص السرعة والسيو وجاهزية العربي والتتبع في حوالي دقيقة، وحد من فريقنا يقدر يراجعه معاك."]
    ],
    links: { services: ["seo.html", "analytics-tracking.html"], industry: "ecommerce-marketing.html", posts: ["blog-focus-your-catalog.html", "blog-egypt-whatsapp.html"], tool: "vitals-score.html" }
  },

  "analytics-tracking.html": {
    answer: ["Brand Vitals sets up analytics and tracking for brands in Egypt and Saudi Arabia: GA4, Google Tag Manager, server-side tracking, conversion tracking and dashboards, so marketing decisions run on numbers you can trust. It suits any business spending on ads. Work starts with a free tracking audit.",
      "Brand Vitals بتجهّز التحليلات والتتبع للبراندز في مصر والسعودية: GA4 وجوجل تاج مانجر والتتبع من السيرفر وتتبع التحويلات ولوحات المتابعة، عشان قرارات التسويق تمشي على أرقام تقدر تثق فيها. مناسبة لأي بيزنس بيصرف على إعلانات. والشغل بيبدأ بتدقيق مجاني للتتبع."],
    marketLead: ["Tracking has to follow how each market buys and pays, or the numbers miss the sales that matter.",
      "التتبع لازم يمشي ورا طريقة الشرا والدفع في كل سوق، وإلا الأرقام هتفوّت البيعات المهمة."],
    marketExtra: [["What changes in tracking", "إيه اللي بيتغير في التتبع"],
      ["WhatsApp conversations and cash-on-delivery orders sent back as offline conversions once paid.", "محادثات واتساب وأوردرات الدفع عند الاستلام بتترجع للمنصات كتحويلات أوفلاين لما تتدفع."],
      ["Snap Pixel or Conversions API next to Meta and Google; prices tracked with VAT included.", "Snap Pixel أو Conversions API جنب ميتا وجوجل، والأسعار بتتتبع شاملة الضريبة."]],
    priced: PRICED("Tracking is set up as a one-off Analytics & Tracking Setup, with optional monthly reporting, priced by custom proposal.", "التتبع بيتجهز كـ Analytics & Tracking Setup لمرة واحدة، ومعاه تقارير شهرية لو حابب، وسعره بعرض مخصص."),
    deliver: [
      [["Audit", "التدقيق"], [["Every tag, pixel and event checked", "مراجعة كل تاج وبيكسل وحدث"], ["Gaps between platforms, GA4 and sales explained", "شرح للفروق بين المنصات وGA4 والمبيعات"]]],
      [["Plan", "التخطيط"], [["A measurement plan: events, names and owners", "خطة قياس: الأحداث وأسماؤها ومين مسؤول عنها"], ["Consent and privacy approach agreed", "اتفاق على طريقة الموافقة والخصوصية"]]],
      [["Implement", "التنفيذ"], [["GA4, Tag Manager, Conversions API and server-side setup", "تجهيز GA4 وتاج مانجر وConversions API والتتبع من السيرفر"], ["CRM and offline conversions connected", "الـ CRM والتحويلات الأوفلاين متوصلين"]]],
      [["Report", "التقارير"], [["A dashboard your team reads weekly", "لوحة متابعة فريقك بيقراها كل أسبوع"], ["Documentation so the setup outlives any agency", "توثيق عشان التجهيز يفضل شغال حتى لو الوكالة اتغيرت"]]]
    ],
    explain: [
      [["Why the numbers never match", "ليه الأرقام عمرها ما بتتطابق"],
        ["Meta, Google, TikTok and Snap each count the sales they influenced, with their own attribution windows, so the same order is often claimed several times. GA4 counts differently again. Analytics at Brand Vitals defines one source of truth for revenue, usually your store or CRM, and uses blended results to judge total spend, while each platform's own numbers guide day-to-day optimization.",
         "ميتا وجوجل وتيك توك وسناب كل واحدة بتعد البيعات اللي أثّرت فيها، وبنوافذ إسناد خاصة بيها، فنفس الأوردر كتير بيتنسب أكتر من مرة. وGA4 بيعد بطريقة تانية خالص. التحليلات في Brand Vitals بتحدد مصدر واحد للحقيقة للإيراد، غالبًا المتجر أو الـ CRM، وبتستخدم النتايج المجمّعة للحكم على الصرف كله، وأرقام كل منصة بتوجّه التحسين اليومي."]],
      [["Server-side tracking and privacy", "التتبع من السيرفر والخصوصية"],
        ["Browsers and ad blockers stop many tracking scripts, which leaves ad algorithms learning from partial data. Server-side tracking and Conversions API send the important events from a server you control, while consent mode respects each visitor's choice. The result is fuller data, faster pages and a clear record of what is shared.",
         "المتصفحات ومانعات الإعلانات بتوقف سكريبتات تتبع كتير، وده بيخلي خوارزميات الإعلانات تتعلم من بيانات ناقصة. التتبع من السيرفر وConversions API بيبعتوا الأحداث المهمة من سيرفر إنت متحكم فيه، ووضع الموافقة بيحترم اختيار كل زائر. والنتيجة بيانات أكمل، وصفحات أسرع، وسجل واضح لكل اللي بيتشارك."]]
    ],
    terms: ["ga4", "tag-manager", "server-side-tracking", "conversions-api", "consent-mode", "attribution-window", "blended-results"],
    faq: [
      ["Can you set up GA4 in Egypt?", "تقدروا تجهّزوا GA4 في مصر؟",
       "Yes. Brand Vitals sets up GA4 and Google Tag Manager for businesses in Egypt and Saudi Arabia, with events for purchases, leads, WhatsApp clicks and calls.",
       "أيوه. Brand Vitals بتجهّز GA4 وجوجل تاج مانجر للبيزنس في مصر والسعودية، بأحداث لعمليات الشرا والعملاء وضغطات واتساب والمكالمات."],
      ["How do you track WhatsApp and phone leads?", "بتتتبعوا عملاء واتساب والتليفون إزاي؟",
       "WhatsApp clicks and calls are tracked as events, and leads that close in the CRM are sent back to the ad platforms as offline conversions.",
       "ضغطات واتساب والمكالمات بتتتبع كأحداث، والعملاء اللي بيتقفلوا في الـ CRM بيترجعوا للمنصات كتحويلات أوفلاين."],
      ["Can you connect the Snap Pixel in Saudi Arabia?", "تقدروا تربطوا Snap Pixel في السعودية؟",
       "Yes. For Saudi campaigns the Snap Pixel or Snap Conversions API is installed and tested next to Meta, TikTok and Google before spend starts.",
       "أيوه. في حملات السعودية بيتركب Snap Pixel أو Snap Conversions API ويتختبر جنب ميتا وتيك توك وجوجل قبل ما الصرف يبدأ."],
      ["What is conversion tracking?", "يعني إيه تتبع التحويلات؟",
       "Conversion tracking records the actions that matter, such as purchases, leads and bookings, and shares them with analytics and ad platforms so campaigns optimize toward them.",
       "تتبع التحويلات إنك تسجّل الخطوات المهمة، زي الشرا والعملاء والحجوزات، وتشاركها مع أدوات التحليلات ومنصات الإعلانات عشان الحملات تتحسن ناحيتها."],
      ["Will we own the tracking setup?", "التتبع هيبقى ملكنا؟",
       "Yes. Accounts, containers and dashboards are set up in your company's name, with documentation, so the tracking stays with you whatever agency you work with.",
       "أيوه. الحسابات والحاويات ولوحات المتابعة بتتعمل باسم شركتك، ومعاها توثيق، عشان التتبع يفضل معاك مهما كانت الوكالة اللي بتشتغل معاها."]
    ],
    links: { services: ["performance-marketing.html", "web-cro.html"], industry: "healthcare-marketing.html", posts: ["blog-ecommerce-kpi-stack.html", "blog-prospecting-vs-retargeting.html"], tool: "vitals-score.html" }
  }
};
