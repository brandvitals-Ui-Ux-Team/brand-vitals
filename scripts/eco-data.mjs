// The Brand Vitals ecosystem, in one place. scripts/eco.mjs rebuilds every brand list from this:
// header mega menu, mobile drawer, footer column, sub-brand family blocks and the homepage section.
export const PARENT = {
  key: "bv", name: "Brand Vitals", href: "index.html", mark: "assets/img/favicon.svg",
  d: ["Growth agency", "وكالة النمو"]
};

export const GROUPS = [
  {
    key: "studios", head: ["Studios · we make the work", "الاستوديوهات · بنعمل الشغل"], short: ["Studios", "الاستوديوهات"],
    brands: [
      { key: "frames", name: "Vitals Frames", href: "frames.html", mark: "assets/img/brands/frames-mark.svg", d: ["Production studio", "ستوديو إنتاج"] },
      { key: "web", name: "Vitals Web", href: "web.html", mark: "assets/img/brands/web-mark.svg", d: ["Websites, launched fast", "مواقع تنطلق بسرعة"] },
      { key: "stage", name: "Vitals Stage", href: "stage.html", mark: "assets/img/brands/stage-mark.svg", d: ["Launches, activations and events", "إطلاقات وفعاليات وتفعيلات"], badge: ["Coming soon", "قريبًا"] }
    ]
  },
  {
    key: "platforms", head: ["Platforms · tools you use", "المنصات · أدوات بتستخدمها"], short: ["Platforms", "المنصات"],
    brands: [
      { key: "go", name: "Vitals GO", href: "go.html", mark: "assets/img/brands/go-mark.svg", d: ["Client approvals & team chat", "موافقات العملاء وتواصل الفريق"], badge: ["Beta", "تجريبي"] },
      { key: "crew", name: "Vitals Crew", href: "crew.html", mark: "assets/img/brands/crew-mark.svg", d: ["Vetted freelancers & teams", "فريلانسرز وفرق معتمدة"], badge: ["Founding members", "أول الأعضاء"] },
      { key: "jobs", name: "Vitals Jobs", href: "jobs.html", mark: "assets/img/brands/jobs-mark.svg", d: ["Creative & marketing jobs", "وظايف كرييتيف وماركتينج"], badge: ["Coming soon", "قريبًا"] }
    ]
  }
];

/** Sub-brand pages and the brand each one belongs to. */
export const SUB_PAGES = Object.fromEntries(GROUPS.flatMap(g => g.brands.map(b => [b.href, b.key])));

