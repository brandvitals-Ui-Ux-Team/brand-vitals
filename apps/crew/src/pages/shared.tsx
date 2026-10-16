// The vetting explainer used inside the app, plus the umbrella header/footer for the few
// public app pages (join). Crew's marketing lives on crew.html, inside the Brand Vitals site.
import { Briefcase, ClipboardCheck, FileSearch, MessagesSquare, Moon, ShieldCheck, Sun } from "lucide-react";
import { type ReactElement } from "react";
import { useI18n } from "../../../hq/src/lib/i18n";
import { useTheme } from "../components/Shell";

export function HowWeVet({ compact }: { compact?: boolean }) {
  const { L } = useI18n();
  const gates: [ReactElement, string, string, string, string][] = [
    [<FileSearch />, "Portfolio review", "مراجعة البورتفوليو", "A senior reviewer scores real past work, not a CV.", "مراجع خبير بيقيّم شغل حقيقي، مش سي في."],
    [<Briefcase />, "Paid skill test", "اختبار عملي", "A small real brief, judged on craft and brief fit.", "بريف صغير حقيقي بيتقيّم على الجودة وفهم المطلوب."],
    [<MessagesSquare />, "Interview", "مقابلة", "Communication, reliability, and how they take feedback.", "التواصل والالتزام وإزاي بيتعامل مع الملاحظات."],
    [<ClipboardCheck />, "QA on every delivery", "مراجعة كل تسليم", "We check every file against the brief before the client sees it.", "بنراجع كل ملف على البريف قبل ما يوصل للعميل."]
  ];
  return <div className={"card vet" + (compact ? " vet--compact" : "")}>
    <div className="vet__h"><ShieldCheck /><div><h2>{L("How we vet: 100% reviewed", "إزاي بنعتمد: مراجعة ١٠٠٪")}</h2>
      <p className="small muted">{L("Most applicants do not get in, and each one is told why.", "مش كل المتقدمين بيدخلوا، وكل واحد بيعرف السبب.")}</p></div></div>
    <div className="vet__g">{gates.map(([icon, en, ar, den, dar], i) => <div key={i} className="vet__i"><span className="vet__n">{icon}</span><b>{L(en, ar)}</b><span className="small muted">{L(den, dar)}</span></div>)}</div>
  </div>;
}

/** /crew/ is a role chooser: hiring, freelancing, or the Vitals review team. (It used to bounce back to crew.html, which looped.) */
export function Landing() {
  const { L } = useI18n();
  return <div className="mk">
    <MkNav light />
    <main className="join crew-pick">
      <h1>{L("How do you want to use Vitals Crew?", "عايز تستخدم Vitals Crew إزاي؟")}</h1>
      <div className="crew-pick__g">
        <a className="card choice choice--big crew-pick__c" href="/crew/client"><Briefcase /><b>{L("I'm hiring", "بوظّف")}</b><span className="small muted">{L("Post a job and get a shortlist of three vetted freelancers.", "انشر شغلانة وخد أحسن 3 فريلانسرز متراجعين.")}</span></a>
        <a className="card choice choice--big crew-pick__c" href="/crew/join"><ShieldCheck /><b>{L("I'm a freelancer", "أنا فريلانسر")}</b><span className="small muted">{L("Apply with your best work. A reviewer looks at every piece.", "قدّم بأحسن شغلك. مراجع بيشوف كل حاجة.")}</span></a>
      </div>
      <a className="link small crew-pick__ops" href="/crew/ops">{L("Vitals reviewer sign in", "دخول فريق المراجعة")}</a>
    </main>
    <MkFooter />
  </div>;
}

const BRANDS: [string, string][] = [
  ["/frames.html", "Vitals Frames"], ["/web.html", "Vitals Web"], ["/stage.html", "Vitals Stage"],
  ["/go.html", "Vitals GO"], ["/hire.html", "Vitals Hire"], ["/index.html", "Brand Vitals"]
];

export function MkNav({ light }: { light?: boolean }) {
  const { L, lang, setLang } = useI18n();
  const [theme, setTheme] = useTheme();
  return <header className={"mk-nav" + (light ? " mk-nav--light" : "")}>
    <a href="/crew.html"><img src={`${import.meta.env.BASE_URL}${light && theme !== "dark" ? "logo-dark.svg" : "logo-light.svg"}`} alt="Vitals Crew" style={{ height: 32 }} /></a>
    <nav className="mk-nav__links">
      <a href="/crew.html#vetting">{L("How we vet", "إزاي بنعتمد")}</a>
      <a href="/index.html" className="mk-nav__parent"><img src="/assets/img/favicon.svg" alt="" width={18} height={18} />{L("A Brand Vitals company", "إحدى شركات براند ڤايتلز")}</a>
      <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
      <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
    </nav>
  </header>;
}

/** Same footer as crew.html on the Brand Vitals site, so the app never looks like a separate brand. */
export function MkFooter() {
  const { L } = useI18n();
  const [theme] = useTheme();
  return <footer className="mk-foot">
    <div className="mk-foot__grid">
      <div className="mk-foot__brand">
        <a href="/crew.html" aria-label="Vitals Crew"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Crew" height={40} /></a>
        <p>{L("Vetted freelancers and creative teams, reviewed 100% by Brand Vitals.", "فريلانسرز وفرق إبداعية معتمدة، بمراجعة ١٠٠٪ من براند ڤايتلز.")}</p>
      </div>
      <div className="mk-foot__col">
        <h2 className="mk-foot__h">Vitals Crew</h2>
        <a href="/crew.html#vetting">{L("How we vet", "إزاي بنعتمد")}</a>
        <a href="/crew.html#clients">{L("For clients", "للعملاء")}</a>
        <a href="/crew.html#talent">{L("For talent", "للمواهب")}</a>
        <a href="/crew.html#review">{L("Review team", "فريق المراجعة")}</a>
        <a href="/crew/">{L("Open the platform", "افتح المنصة")}</a>
      </div>
      <div className="mk-foot__col">
        <h2 className="mk-foot__h">{L("Brands", "البراندات")}</h2>
        {BRANDS.map(([h, n]) => <a key={h} href={h}>{n}</a>)}
      </div>
      <div className="mk-foot__col">
        <h2 className="mk-foot__h">{L("Contact", "تواصل")}</h2>
        <a href="https://wa.me/201090861397" target="_blank" rel="noopener" dir="ltr">WhatsApp +20 109 086 1397</a>
        <span>{L("New Cairo, Cairo, Egypt", "القاهرة الجديدة، القاهرة، مصر")}</span>
        <span>{L("Sun to Thu, 10:00 to 18:00", "الأحد إلى الخميس، 10:00 إلى 18:00")}</span>
      </div>
    </div>
    <div className="mk-foot__bar small">
      <span>© {new Date().getFullYear()} Vitals Crew. <a className="mk-foot__parent" href="/index.html"><img src="/assets/img/favicon.svg" alt="" width={16} height={16} />{L("A Brand Vitals company", "إحدى شركات Brand Vitals")}</a></span>
      <span><a href="/blog.html">{L("Articles", "مقالات")}</a> · <a href="/privacy.html">{L("Privacy Policy", "سياسة الخصوصية")}</a></span>
    </div>
  </footer>;
}
