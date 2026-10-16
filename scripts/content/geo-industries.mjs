// Section 12 content for the three industry pages (EN + Egyptian Arabic). Injected by scripts/geo.mjs.
// Facts rule: only what the site already states. No statistics, prices, client names or results.
const PRICED = (en, ar) => [
  [`${en} Every engagement is scoped in a written proposal with deliverables, timeline and a fixed fee, after a free consultation and growth audit. Media budgets are paid straight to the ad platforms, separate from our fees. Invoices are in Egyptian pounds, Saudi riyals or US dollars, with VAT added where the law requires it.`,
   `${ar} كل شغل بيتحدد في عرض مكتوب فيه المطلوب والمدة وسعر ثابت، بعد استشارة مجانية وتدقيق نمو. ميزانية الإعلانات بتتدفع للمنصات مباشرة، منفصلة عن أتعابنا. والفواتير بالجنيه المصري أو الريال السعودي أو الدولار، والضريبة بتتضاف حسب القانون.`]
];
// The engagement steps on products.html, with what the client receives at each one.
const STEPS = (audit, plan, monthly) => [
  [["Free consultation", "استشارة مجانية"], [["30 minutes on your goals, numbers and what is in the way", "30 دقيقة عن أهدافك وأرقامك واللي معطّلك"]]],
  [["Growth audit", "تدقيق النمو"], audit],
  [["Scoped proposal", "عرض محدد"], [["Deliverables, timeline, revision rounds and a fixed fee, in writing", "المطلوب والمدة وجولات التعديل وسعر ثابت، مكتوبين"]]],
  [["Kick-off", "البداية"], plan],
  [["Monthly review", "مراجعة شهرية"], monthly]
];

export default {
  "ecommerce-marketing.html": {
    answer: ["Brand Vitals grows online stores in Egypt and Saudi Arabia with paid media, creative, CRO and retention, measured on contribution margin rather than ROAS alone. It suits e-commerce brands on Shopify, WooCommerce, Salla, Zid or custom platforms. Work starts with a free growth audit of your store, ads and tracking.",
      "Brand Vitals بتكبّر المتاجر الإلكترونية في مصر والسعودية بالإعلانات والكرييتيف وتحسين التحويل والاحتفاظ بالعملاء، وبتقيس على هامش المساهمة مش على الـ ROAS لوحده. مناسبة لبراندز التجارة الإلكترونية على Shopify أو WooCommerce أو سلة أو زد أو منصات خاصة. والشغل بيبدأ بتدقيق نمو مجاني للمتجر والإعلانات والتتبع."],
    marketLead: ["An online store selling in both markets runs two checkouts, two calendars and two ways of asking before buying.",
      "المتجر اللي بيبيع في السوقين بيدير صفحتين دفع وتقويمين وطريقتين للسؤال قبل الشرا."],
    marketExtra: [["What changes for the store", "إيه اللي بيتغير في المتجر"],
      ["Cash-on-delivery orders tracked to delivery; WhatsApp answers prices and delivery times.", "أوردرات الدفع عند الاستلام بتتتبع لحد التسليم، وواتساب بيرد على الأسعار ومواعيد التوصيل."],
      ["White Friday and Ramadan planned weeks ahead; prices shown in SAR with VAT included.", "الجمعة البيضا ورمضان بيتخطط لهم قبلها بأسابيع، والأسعار بتظهر بالريال شاملة الضريبة."]],
    priced: PRICED("E-commerce work usually runs as the E-commerce Growth System, an always-on programme priced by custom proposal.", "شغل التجارة الإلكترونية غالبًا بيمشي كـ E-commerce Growth System، برنامج مستمر سعره بعرض مخصص."),
    deliver: STEPS(
      [["Store, ads and tracking review", "مراجعة للمتجر والإعلانات والتتبع"], ["Contribution margin by product, and the target cost per order", "هامش المساهمة لكل منتج، وتكلفة الطلب المستهدفة"]],
      [["One accountable lead and access set up", "مسؤول واحد عن الحساب والصلاحيات متجهزة"], ["A 90-day plan: hero products, campaigns, creative and retention flows", "خطة 90 يوم: المنتجات الأساسية والحملات والكرييتيف ورسائل الاحتفاظ بالعملاء"]],
      [["Spend, delivered revenue and cost per order", "الصرف والإيراد المتسلّم فعلًا وتكلفة الطلب"], ["What changes next month", "إيه اللي هيتغير الشهر الجاي"]]),
    explain: [
      [["Contribution margin, not ROAS alone", "هامش المساهمة، مش الـ ROAS لوحده"],
        ["ROAS counts revenue, but an online store lives on what is left after product, delivery, payment fees and returns. Two campaigns with the same ROAS can make very different profit if one sells low-margin items. E-commerce marketing at Brand Vitals sets the target cost per order from contribution margin, product by product, and reviews it whenever prices or costs move.",
         "الـ ROAS بيعد الإيراد، بس المتجر الإلكتروني عايش على اللي بيفضل بعد تكلفة المنتج والتوصيل ورسوم الدفع والمرتجعات. حملتين بنفس الـ ROAS ممكن يجيبوا ربح مختلف جدًا لو واحدة بتبيع منتجات هامشها قليل. تسويق التجارة الإلكترونية في Brand Vitals بيحط تكلفة الطلب المستهدفة من هامش المساهمة، منتج منتج، وبيراجعها كل ما الأسعار أو التكاليف تتغير."]],
      [["Cash on delivery and real sales", "الدفع عند الاستلام والبيعات الحقيقية"],
        ["In Egypt many orders are paid in cash at the door, and some are never confirmed or are returned. Ad platforms count the order the moment it is placed. Brand Vitals tracks confirmed and delivered orders where possible and sends them back to the platforms, so campaigns learn from customers who actually paid.",
         "في مصر أوردرات كتير بتتدفع كاش على الباب، وفيه أوردرات مابتتأكدش أو بترجع. منصات الإعلانات بتعد الأوردر أول ما يتعمل. Brand Vitals بتتتبع الأوردرات اللي اتأكدت واتسلمت قد ما تقدر وبترجعها للمنصات، عشان الحملات تتعلم من العملاء اللي دفعوا فعلًا."]],
      [["Hero products and retention", "المنتجات الأساسية والاحتفاظ بالعملاء"],
        ["Spreading ads across a whole catalogue usually spreads results thin. Focusing paid media on a few hero products, each with its own creative and landing page, gives the algorithm a clear signal, while a smaller catalogue campaign keeps the rest selling. Email, SMS and WhatsApp flows then turn first orders into repeat customers.",
         "إنك توزّع الإعلانات على الكتالوج كله غالبًا بيوزّع النتايج وبيضعّفها. التركيز على كام منتج أساسي، كل واحد بكرييتيف وصفحة هبوط خاصة بيه، بيدّي الخوارزمية إشارة واضحة، وحملة كتالوج أصغر بتخلي باقي المنتجات تفضل تبيع. وبعدين رسائل الإيميل والـ SMS وواتساب بتحوّل أول أوردر لعميل بيرجع يشتري."]]
    ],
    terms: ["contribution-margin", "aov", "ltv", "cash-on-delivery", "creative-fatigue", "retargeting"],
    faq: [
      ["Is Brand Vitals an e-commerce marketing agency in Egypt?", "هل Brand Vitals شركة تسويق للتجارة الإلكترونية في مصر؟",
       "Yes. Brand Vitals runs e-commerce marketing from New Cairo for online stores in Egypt and Saudi Arabia: paid media, creative, CRO and retention.",
       "أيوه. Brand Vitals بتدير تسويق التجارة الإلكترونية من القاهرة الجديدة لمتاجر في مصر والسعودية: إعلانات وكرييتيف وتحسين تحويل واحتفاظ بالعملاء."],
      ["Do you work with Salla and Zid stores in Saudi Arabia?", "بتشتغلوا مع متاجر سلة وزد في السعودية؟",
       "Yes. Brand Vitals works with stores on Salla and Zid, as well as Shopify, WooCommerce and custom platforms, with tracking connected for ads.",
       "أيوه. Brand Vitals بتشتغل مع متاجر على سلة وزد، وكمان Shopify وWooCommerce والمنصات الخاصة، والتتبع متوصل للإعلانات."],
      ["How do you set a target cost per order?", "بتحددوا تكلفة الطلب المستهدفة إزاي؟",
       "The target cost per order is set from contribution margin: what is left after product, delivery, payment and return costs. It is reviewed whenever prices or costs change.",
       "تكلفة الطلب المستهدفة بتتحدد من هامش المساهمة: اللي بيفضل بعد تكلفة المنتج والتوصيل والدفع والمرتجعات. وبتتراجع كل ما الأسعار أو التكاليف تتغير."],
      ["What are hero products?", "يعني إيه المنتجات الأساسية (Hero products)؟",
       "Hero products are the few items that get most of the ad budget, each with its own creative and landing page. Focusing on them gives clearer results than advertising the whole catalogue.",
       "المنتجات الأساسية هي كام منتج بياخدوا أغلب ميزانية الإعلانات، كل واحد بكرييتيف وصفحة هبوط خاصة بيه. والتركيز عليهم بيدّي نتايج أوضح من الإعلان عن الكتالوج كله."],
      ["How do you plan for White Friday and Ramadan?", "بتخططوا للجمعة البيضا ورمضان إزاي؟",
       "Seasonal campaigns are planned weeks ahead in three waves: awareness before the moment, conversion during it, and retargeting right after, each with its own creative.",
       "الحملات الموسمية بيتخطط لها قبلها بأسابيع على تلات موجات: وعي قبل الموسم، وتحويل أثناءه، وإعادة استهداف بعده على طول، وكل موجة بكرييتيف خاص بيها."],
      ["Can we estimate results before starting?", "نقدر نتوقع النتايج قبل ما نبدأ؟",
       "Yes. Vitals Forecast, a free tool on this site, shows your break-even ROAS and what has to be true for a target, using your own budget, order value and margin.",
       "أيوه. Vitals Forecast، أداة مجانية على الموقع، بتوريك نقطة التعادل وإيه اللي لازم يحصل عشان توصل لهدف، باستخدام ميزانيتك وقيمة طلبك وهامشك."]
    ],
    links: { services: ["performance-marketing.html", "web-cro.html"], industry: "real-estate-marketing.html", posts: ["blog-focus-your-catalog.html", "blog-ecommerce-kpi-stack.html"], tool: "forecast.html" }
  },

  "real-estate-marketing.html": {
    answer: ["Brand Vitals markets real estate projects in Egypt and Saudi Arabia: positioning, project films with Vitals Frames, paid campaigns and lead forms that qualify buyers before sales calls them. It suits developers and brokers who need leads their sales team wants to call. Work starts with a free consultation.",
      "Brand Vitals بتسوّق مشاريع عقارية في مصر والسعودية: تموضع، وأفلام للمشروع مع Vitals Frames، وحملات ممولة، وفورمز بتفرز المشتري قبل ما المبيعات تكلمه. مناسبة للمطورين والوسطاء اللي محتاجين عملاء فريق المبيعات عايز يكلمهم. والشغل بيبدأ باستشارة مجانية."],
    marketLead: ["Buyers in Egypt and Saudi Arabia research, ask and decide differently. These are the differences a property campaign has to plan for.",
      "المشتري في مصر غير المشتري في السعودية في طريقة البحث والسؤال والقرار. ودي الفروق اللي حملة العقار لازم تخطط لها."],
    marketExtra: [["What changes for a project", "إيه اللي بيتغير في المشروع"],
      ["Fast WhatsApp follow-up; Egyptian Arabic for most projects, English for premium buyers.", "متابعة سريعة على واتساب، وعامية مصرية لأغلب المشاريع، وإنجليزي للمشترين الفاخرين."],
      ["Saudi tone and local faces in films; Ramadan and Eid planned as key months for real estate.", "نبرة سعودية ووشوش محلية في الأفلام، ورمضان والعيد بيتخطط لهم كشهور أساسية للعقارات."]],
    priced: PRICED("Real estate work is scoped per project or as a launch programme, priced by custom proposal.", "شغل العقارات بيتحدد بالمشروع أو كبرنامج إطلاق، وسعره بعرض مخصص."),
    deliver: STEPS(
      [["Review of current campaigns, lead quality and follow-up speed", "مراجعة للحملات الحالية وجودة العملاء وسرعة المتابعة"], ["The questions a qualified lead must answer", "الأسئلة اللي العميل الجاد لازم يجاوب عليها"]],
      [["Project positioning and the film brief", "تموضع المشروع وبريف الفيلم"], ["A 90-day launch plan with lead forms and CRM feedback set up", "خطة إطلاق 90 يوم بفورمز للعملاء وربط بالـ CRM"]],
      [["Cost per qualified lead and per site visit", "تكلفة العميل الجاد وتكلفة زيارة الموقع"], ["Sales feedback sent back to the platforms", "رأي المبيعات بيترجع للمنصات"]]),
    explain: [
      [["Qualified leads over cheap leads", "عملاء جادين أحسن من عملاء رخاص"],
        ["A low cost per lead looks good in a report until the sales team cannot reach or close anyone. Real estate marketing at Brand Vitals asks the questions that matter in the form itself, such as budget, timeline and unit type, and sends sales outcomes from the CRM back to the ad platforms so they learn what a good lead looks like.",
         "تكلفة العميل القليلة بتبان حلوة في التقرير لحد ما فريق المبيعات مايعرفش يوصل لحد أو يقفل مع حد. تسويق العقارات في Brand Vitals بيسأل الأسئلة المهمة في الفورم نفسه، زي الميزانية والمدة ونوع الوحدة، وبيرجّع نتايج المبيعات من الـ CRM لمنصات الإعلانات عشان تتعلم شكل العميل الكويس."]],
      [["A project people remember", "مشروع الناس تفتكره"],
        ["Renders and price lists rarely make a project memorable, because every competitor shows the same. Brand Vitals starts with positioning, a clear story for who the project is for and why it is worth the price, then produces the film and creative with Vitals Frames to sell the lifestyle, not only the unit.",
         "الرندرز وقوايم الأسعار نادرًا ما بتخلي مشروع يتفتكر، لأن كل المنافسين بيعرضوا نفس الحاجة. Brand Vitals بتبدأ بالتموضع، قصة واضحة لمين المشروع ده وليه يستاهل سعره، وبعدين بتنتج الفيلم والكرييتيف مع Vitals Frames عشان تبيع أسلوب الحياة، مش الوحدة بس."]],
      [["Follow-up within the hour", "المتابعة في خلال ساعة"],
        ["Property leads go cold in hours when nobody replies. Campaigns are only as good as the follow-up behind them, so Brand Vitals agrees reply times with the sales team, routes WhatsApp and form leads to one owner, and reports follow-up speed next to cost per lead.",
         "عملاء العقارات بيبردوا في ساعات لو محدش رد. والحملات قيمتها على قد المتابعة اللي وراها، عشان كده Brand Vitals بتتفق مع فريق المبيعات على مواعيد الرد، وبتوجّه عملاء واتساب والفورمز لمسؤول واحد، وبتعرض سرعة المتابعة جنب تكلفة العميل."]]
    ],
    terms: ["cpa", "offline-conversions", "positioning", "click-to-whatsapp", "landing-page"],
    faq: [
      ["Is Brand Vitals a real estate marketing agency in Egypt?", "هل Brand Vitals شركة تسويق عقاري في مصر؟",
       "Yes. Brand Vitals markets real estate projects from New Cairo for developers and brokers in Egypt and Saudi Arabia, from positioning to qualified leads.",
       "أيوه. Brand Vitals بتسوّق مشاريع عقارية من القاهرة الجديدة لمطورين ووسطاء في مصر والسعودية، من التموضع لحد العملاء الجادين."],
      ["What makes a real estate lead qualified?", "إيه اللي بيخلي عميل العقار جاد؟",
       "A qualified real estate lead has a budget, timeline and unit type that match the project and can be reached by sales. Forms ask these questions before the call.",
       "عميل العقار الجاد عنده ميزانية ومدة ونوع وحدة مناسبين للمشروع، والمبيعات تقدر توصله. والفورمز بتسأل الأسئلة دي قبل المكالمة."],
      ["Which platforms work for property in Saudi Arabia?", "أنهي منصات بتنفع للعقارات في السعودية؟",
       "In Saudi Arabia people are on Snapchat, TikTok, Instagram, X and YouTube, with Google for high-intent search. The mix for a project depends on the buyer it targets.",
       "في السعودية الناس على سناب شات وتيك توك وإنستجرام وX ويوتيوب، وجوجل للبحث اللي وراه نية شرا. واختيار المنصات للمشروع بيتوقف على المشتري المستهدف."],
      ["How fast should sales reply to a lead?", "المبيعات المفروض ترد على العميل في قد إيه؟",
       "As fast as possible: property leads go cold in hours. Brand Vitals agrees reply times with the sales team and reports follow-up speed with every campaign.",
       "بأسرع وقت: عملاء العقارات بيبردوا في ساعات. Brand Vitals بتتفق مع فريق المبيعات على مواعيد الرد، وبتعرض سرعة المتابعة مع كل حملة."],
      ["Can CRM data improve the ads?", "بيانات الـ CRM ممكن تحسّن الإعلانات؟",
       "Yes. When leads that became site visits or sales are sent back to the ad platforms as offline conversions, the platforms learn to find more people like them.",
       "أيوه. لما العملاء اللي اتحولوا لزيارات أو بيعات يترجعوا للمنصات كتحويلات أوفلاين، المنصات بتتعلم تلاقي ناس شبههم."],
      ["Do you plan Ramadan campaigns for real estate?", "بتخططوا حملات رمضان للعقارات؟",
       "Yes. Ramadan and Eid are among the key months for real estate in Saudi Arabia, and campaigns are planned weeks ahead, with viewing that peaks late at night.",
       "أيوه. رمضان والعيد من أهم الشهور للعقارات في السعودية، والحملات بيتخطط لها قبلها بأسابيع، والمشاهدة بتبقى في أعلاها بالليل متأخر."]
    ],
    links: { services: ["branding.html", "performance-marketing.html"], industry: "healthcare-marketing.html", posts: ["blog-ksa-seasons.html", "blog-egypt-whatsapp.html"], tool: "forecast.html" }
  },

  "healthcare-marketing.html": {
    answer: ["Brand Vitals markets clinics, hospitals and healthcare groups in Egypt and the GCC, measured on bookings rather than inquiries. Campaigns, tracking and creative follow platform health policies and connect every lead to the booking system. It suits providers with several services or branches. Work starts with a free consultation.",
      "Brand Vitals بتسوّق العيادات والمستشفيات ومجموعات الرعاية الصحية في مصر والخليج، والقياس بالحجوزات مش بالاستفسارات. الحملات والتتبع والكرييتيف ماشيين على سياسات المنصات للمجال الصحي، وكل عميل متربط بنظام الحجز. مناسبة لمقدمي الخدمة اللي عندهم كذا خدمة أو فرع. والشغل بيبدأ باستشارة مجانية."],
    marketLead: ["Patients in Egypt and Saudi Arabia reach providers through different channels and expect different language. These are the differences a healthcare plan carries.",
      "المرضى في مصر والسعودية بيوصلوا لمقدمي الخدمة من قنوات مختلفة ومتوقعين لغة مختلفة. ودي الفروق اللي خطة الرعاية الصحية بتشيلها."],
    marketExtra: [["What changes for a provider", "إيه اللي بيتغير لمقدم الخدمة"],
      ["WhatsApp is often the first contact, so inquiries are tracked from first message to booking.", "واتساب غالبًا أول تواصل، فالاستفسارات بتتتبع من أول رسالة لحد الحجز."],
      ["Saudi tone and local faces in creative; Snapchat and TikTok tested next to Meta and Google.", "نبرة سعودية ووشوش محلية في الكرييتيف، وسناب شات وتيك توك بيتختبروا جنب ميتا وجوجل."]],
    priced: PRICED("Healthcare work is scoped by service lines and branches, priced by custom proposal.", "شغل الرعاية الصحية بيتحدد حسب الخدمات والفروع، وسعره بعرض مخصص."),
    deliver: STEPS(
      [["Lead sources, booking flow and tracking review", "مراجعة لمصادر العملاء وطريقة الحجز والتتبع"], ["Demand and capacity by service line and branch", "الطلب والطاقة الاستيعابية لكل خدمة وفرع"]],
      [["Campaigns by service line, with compliant creative", "حملات لكل خدمة، بكرييتيف متوافق مع السياسات"], ["A 90-day plan with CRM or booking-system tracking", "خطة 90 يوم بتتبع من الـ CRM أو نظام الحجز"]],
      [["Inquiry-to-booking rate by channel and branch", "نسبة تحويل الاستفسار لحجز لكل قناة وفرع"], ["Budget moved toward capacity and margin", "الميزانية بتتنقل حسب الطاقة والهامش"]]),
    explain: [
      [["Bookings, not inquiries", "حجوزات، مش استفسارات"],
        ["A cheap form fill means little if the patient never books. Healthcare marketing at Brand Vitals connects every lead source, WhatsApp, calls and forms, to the CRM or booking system, then optimizes campaigns toward bookings and reports the inquiry-to-booking rate by channel.",
         "الفورم الرخيص مالوش قيمة لو المريض ماحجزش. تسويق الرعاية الصحية في Brand Vitals بيربط كل مصادر العملاء، واتساب والمكالمات والفورمز، بالـ CRM أو نظام الحجز، وبعدين بيحسّن الحملات ناحية الحجوزات وبيعرض نسبة تحويل الاستفسار لحجز لكل قناة."]],
      [["Compliant creative for a sensitive category", "كرييتيف متوافق لمجال حساس"],
        ["Meta, Google, TikTok and Snap all restrict health advertising, and careless campaigns get rejected or limited. Brand Vitals plans targeting and messaging to stay inside platform and medical guidelines: clear, honest claims, no before-and-after promises, and landing pages that explain the service and the next step.",
         "ميتا وجوجل وتيك توك وسناب كلهم بيقيّدوا إعلانات الصحة، والحملات اللي مش متظبطة بتترفض أو بتتحد. Brand Vitals بتخطط الاستهداف والرسائل عشان تفضل جوه سياسات المنصات والإرشادات الطبية: كلام واضح وصادق، ومن غير وعود قبل وبعد، وصفحات هبوط بتشرح الخدمة والخطوة الجاية."]],
      [["Budget that follows capacity", "ميزانية ماشية ورا الطاقة الاستيعابية"],
        ["Each specialty and branch has its own demand, margin and free slots. Pushing ads to a fully booked clinic wastes money while another branch waits for patients. Campaigns at Brand Vitals are split by service line and branch, so budget moves toward the capacity and margin that need it.",
         "كل تخصص وكل فرع ليه طلبه وهامشه ومواعيده الفاضية. إنك تزوّد إعلانات لعيادة محجوزة بالكامل تضييع فلوس، وفرع تاني مستني مرضى. الحملات في Brand Vitals متقسمة حسب الخدمة والفرع، عشان الميزانية تروح للطاقة والهامش اللي محتاجينها."]]
    ],
    terms: ["cpa", "offline-conversions", "conversion-rate", "consent-mode", "click-to-whatsapp"],
    faq: [
      ["Is Brand Vitals a healthcare marketing agency in Egypt?", "هل Brand Vitals شركة تسويق طبي في مصر؟",
       "Yes. Brand Vitals markets clinics, hospitals and healthcare groups from New Cairo, across Egypt and GCC markets, measured on bookings.",
       "أيوه. Brand Vitals بتسوّق العيادات والمستشفيات ومجموعات الرعاية الصحية من القاهرة الجديدة، في مصر وأسواق الخليج، والقياس بالحجوزات."],
      ["How do you track bookings from ads?", "بتتتبعوا الحجوزات اللي جاية من الإعلانات إزاي؟",
       "Bookings are tracked by connecting WhatsApp, calls and forms to the CRM or booking system, and sending confirmed bookings back to the ad platforms.",
       "الحجوزات بتتتبع عن طريق ربط واتساب والمكالمات والفورمز بالـ CRM أو نظام الحجز، ورجوع الحجوزات المؤكدة لمنصات الإعلانات."],
      ["Can clinics advertise on Snapchat and TikTok?", "العيادات تقدر تعلن على سناب شات وتيك توك؟",
       "Yes, within each platform's health policies. Targeting and creative are planned to stay compliant, and every campaign is reviewed before launch.",
       "أيوه، جوه سياسات كل منصة للمجال الصحي. الاستهداف والكرييتيف بيتخطط لهم عشان يفضلوا متوافقين، وكل حملة بتتراجع قبل الإطلاق."],
      ["How do you handle several branches?", "بتتعاملوا مع كذا فرع إزاي؟",
       "Campaigns are split by service line and branch, so each one has its own budget, creative and tracking, and spend follows capacity and margin.",
       "الحملات متقسمة حسب الخدمة والفرع، فكل واحد ليه ميزانيته وكرييتيفه وتتبعه، والصرف ماشي ورا الطاقة والهامش."],
      ["Do you respect patient privacy in tracking?", "بتحترموا خصوصية المرضى في التتبع؟",
       "Yes. Tracking records marketing events, not medical details, follows consent choices, and runs through server-side setups where possible so you control what is shared.",
       "أيوه. التتبع بيسجّل أحداث تسويقية مش تفاصيل طبية، وماشي على اختيارات الموافقة، وبيعدّي على السيرفر قد ما نقدر عشان إنت اللي تتحكم في اللي بيتشارك."],
      ["Do you work with healthcare groups in Saudi Arabia?", "بتشتغلوا مع مجموعات صحية في السعودية؟",
       "Yes. Brand Vitals healthcare work spans Egypt and GCC markets, with Saudi tone and creative for campaigns in the Kingdom.",
       "أيوه. شغل Brand Vitals في الرعاية الصحية بيغطي مصر وأسواق الخليج، بنبرة وكرييتيف سعودي للحملات في المملكة."]
    ],
    links: { services: ["analytics-tracking.html", "performance-marketing.html"], industry: "ecommerce-marketing.html", posts: ["blog-egypt-whatsapp.html", "blog-b2b-to-b2c.html"], tool: "vitals-score.html" }
  }
};
