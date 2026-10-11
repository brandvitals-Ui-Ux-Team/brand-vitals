// The vetting explainer used inside the app, plus the umbrella header/footer for the few
// public app pages (join). Crew's marketing lives on crew.html, inside the Brand Vitals site.
import { Briefcase, ClipboardCheck, FileSearch, MessagesSquare, Moon, ShieldCheck, Sun } from "lucide-react";
import { useEffect, type ReactElement } from "react";
import { useI18n } from "../../../hq/src/lib/i18n";
import { useTheme } from "../components/Shell";
import { useDB } from "../lib/store";

export function HowWeVet({ compact }: { compact?: boolean }) {
  const { L } = useI18n();
  const db = useDB();
  const rate = Math.round((db.stats.accepted_90d / Math.max(1, db.stats.applied_90d)) * 100);
  const gates: [ReactElement, string, string, string, string][] = [
    [<FileSearch />, "Portfolio review", "مراجعة البورتفوليو", "A senior reviewer scores real past work, not a CV.", "مراجع خبير بيقيّم شغل حقيقي، مش سي في."],
    [<Briefcase />, "Paid skill test", "اختبار عملي", "A small real brief, judged on craft and brief fit.", "بريف صغير حقيقي بيتقيّم على الجودة وفهم المطلوب."],
    [<MessagesSquare />, "Interview", "مقابلة", "Communication, reliability, and how they take feedback.", "التواصل والالتزام وإزاي بيتعامل مع الملاحظات."],
    [<ClipboardCheck />, "QA on every delivery", "مراجعة كل تسليم", "We check every file against the brief before the client sees it.", "بنراجع كل ملف على البريف قبل ما يوصل للعميل."]
  ];
  return <div className={"card vet" + (compact ? " vet--compact" : "")}>
    <div className="vet__h"><ShieldCheck /><div><h2>{L("How we vet: 100% reviewed", "إزاي بنعتمد: مراجعة ١٠٠٪")}</h2>
      <p className="small muted">{L(`Only ${rate}% of applicants were accepted in the last 90 days (${db.stats.accepted_90d} of ${db.stats.applied_90d}).`, `اتقبل ${rate}٪ بس من المتقدمين آخر ٩٠ يوم (${db.stats.accepted_90d} من ${db.stats.applied_90d}).`)}</p></div></div>
    <div className="vet__g">{gates.map(([icon, en, ar, den, dar], i) => <div key={i} className="vet__i"><span className="vet__n">{icon}</span><b>{L(en, ar)}</b><span className="small muted">{L(den, dar)}</span></div>)}</div>
  </div>;
}

/** /crew/ opens the Crew page on the Brand Vitals site, so the brand is always seen inside its family. */
export function Landing() {
  useEffect(() => { window.location.replace("/crew.html"); }, []);
  return null;
}

const FAMILY: [string, string, string, string, string][] = [
  ["/index.html", "/assets/img/favicon.svg", "Brand Vitals", "The growth agency", "وكالة النمو"],
  ["/studio.html", "/assets/img/brands/studio-mark.svg", "Vitals Studio", "Production studio", "ستوديو إنتاج"],
  ["/web.html", "/assets/img/brands/web-mark.svg", "Vitals Web", "Websites", "مواقع"],
  ["/events.html", "/assets/img/brands/events-mark.svg", "Vitals Events", "Events", "فعاليات"],
  ["/go.html", "/assets/img/brands/go-mark.svg", "Vitals GO", "Client approvals", "موافقات العملاء"]
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

export function MkFooter() {
  const { L } = useI18n();
  return <footer className="mk-foot">
    <div className="mk-foot__fam">{FAMILY.map(([h, img, n, en, ar]) => <a key={h} href={h}><img src={img} alt="" width={30} height={30} /><span><b>{n}</b><span className="small">{L(en, ar)}</span></span></a>)}</div>
    <div className="mk-foot__bar small"><span>© {new Date().getFullYear()} Vitals Crew · <a href="/index.html">{L("A Brand Vitals company", "إحدى شركات براند ڤايتلز")}</a></span><span><a href="/crew.html">{L("About Vitals Crew", "عن Vitals Crew")}</a> · <a href="/privacy.html">{L("Privacy", "الخصوصية")}</a> · <a href="/contact.html">{L("Contact", "تواصل")}</a></span></div>
  </footer>;
}
