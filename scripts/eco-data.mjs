// The ecosystem, in one place. Descriptors follow the UI fix spec 11.2 word for word. scripts/eco.mjs rebuilds every brand list from this:
// header mega menu, mobile drawer, footer column, sub-brand family blocks and the homepage section.
export const PARENT = {
  key: "bv", name: "Brand Vitals", href: "index.html", mark: "assets/img/favicon.svg",
  d: ["Growth partner for Egypt & Saudi", "شريك النمو في مصر والسعودية"]
};

export const GROUPS = [
  {
    key: "studios", head: ["Studios · we make the work", "الاستوديوهات · بنعمل الشغل"], short: ["Studios", "الاستوديوهات"],
    brands: [
      { key: "frames", name: "Vitals Frames", href: "frames.html", mark: "assets/img/brands/frames-mark.svg", d: ["Content made to perform", "محتوى معمول عشان يبيع"] },
      { key: "web", name: "Vitals Web", href: "web.html", mark: "assets/img/brands/web-mark.svg", d: ["Websites live in weeks", "مواقع تطلع في أسابيع"] },
      { key: "stage", name: "Vitals Stage", href: "stage.html", mark: "assets/img/brands/stage-mark.svg", d: ["Events produced end to end", "إيفنتات من أولها لآخرها"], badge: ["Coming soon", "قريبًا"] }
    ]
  },
  {
    key: "platforms", head: ["Platforms · tools you use", "المنصات · أدوات بتستخدمها"], short: ["Platforms", "المنصات"],
    brands: [
      { key: "go", name: "Vitals GO", href: "go.html", mark: "assets/img/brands/go-mark.svg", d: ["Client approvals & paid extras", "موافقات العملاء والشغل الإضافي المدفوع"], badge: ["Coming soon", "قريبًا"] },
      { key: "crew", name: "Vitals Crew", href: "crew.html", mark: "assets/img/brands/crew-mark.svg", d: ["Vetted creative talent", "مواهب إبداعية متقيّمة"], badge: ["Coming soon", "قريبًا"] },
      { key: "jobs", name: "Vitals Hire", href: "hire.html", mark: "assets/img/brands/jobs-mark.svg", d: ["Marketing hiring, screened", "توظيف تسويق بفرز حقيقي"], badge: ["Coming soon", "قريبًا"] }
    ]
  }
];

/** Sub-brand pages and the brand each one belongs to. */
export const SUB_PAGES = Object.fromEntries(GROUPS.flatMap(g => g.brands.map(b => [b.href, b.key])));

