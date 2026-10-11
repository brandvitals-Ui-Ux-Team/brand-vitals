// Marketing pages for the app (landing) plus the vetting explainer used inside the app.
// Every hero on Vitals Crew is centered and built differently: this one is "the orbit".
import { ArrowRight, Briefcase, ClipboardCheck, FileSearch, MessagesSquare, Moon, ShieldCheck, Sun } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { useTheme } from "../components/Shell";
import { Art } from "../components/ui";
import { CLIENT_CHANCES, MAX_QA_ROUNDS, useDB } from "../lib/store";

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

export function MkNav({ light }: { light?: boolean }) {
  const { L, lang, setLang } = useI18n();
  const [theme, setTheme] = useTheme();
  return <header className={"mk-nav" + (light ? " mk-nav--light" : "")}>
    <Link to="/"><img src={`${import.meta.env.BASE_URL}${light && theme !== "dark" ? "logo-dark.svg" : "logo-light.svg"}`} alt="Vitals Crew" style={{ height: 32 }} /></Link>
    <nav className="mk-nav__links">
      <Link to="/client/talent">{L("Hire talent", "اختار مواهب")}</Link>
      <Link to="/talent/jobs">{L("Find work", "دوّر على شغل")}</Link>
      <a href="/crew.html#vetting">{L("How we vet", "إزاي بنعتمد")}</a>
      <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
      <button className="icon-btn" style={{ color: light ? undefined : "#fff" }} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
      <Link className="mk-nav__cta mk-btn mk-btn--grad" style={{ height: 40, paddingInline: 18 }} to="/join">{L("Join as a freelancer", "انضم كفريلانسر")}</Link>
    </nav>
  </header>;
}

export function Landing() {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const rate = Math.round((db.stats.accepted_90d / Math.max(1, db.stats.applied_90d)) * 100);
  const art = Array.from(new Set(db.talents.flatMap(t => t.portfolio).filter(x => !x.startsWith("data:"))));
  const floats = db.talents.slice(0, 6).map(t => ({ a: t.portfolio[0], tag: L(t.title, t.title_ar) }));
  const chips = [L("Reels", "ريلز"), L("Brand identity", "هوية بصرية"), L("UGC ads", "إعلانات UGC"), L("Arabic copy", "كتابة عربي"), L("Product photos", "تصوير منتجات")];
  const go = (title: string) => nav("/client/post" + (title.trim() ? "?title=" + encodeURIComponent(title.trim()) : ""));
  const gates: [string, string, string][] = [
    [L("Applied", "قدّموا"), "100%", "100%"],
    [L("Passed portfolio review", "عدّوا مراجعة البورتفوليو"), "", "72%"],
    [L("Passed a paid skill test", "عدّوا الاختبار العملي"), "", "48%"],
    [L("Passed the interview", "عدّوا المقابلة"), "", "30%"]
  ];
  return <div className="mk">
    <MkNav />
    <section className="orbit">
      <span className="orbit__ring" aria-hidden /><span className="orbit__ring orbit__ring--2" aria-hidden />
      {floats.map((f, i) => <div key={i} className="floaty" aria-hidden><Art title={f.a} /><span className="floaty__tag">{f.tag}</span></div>)}
      <div className="orbit__core">
        <span className="mk-eyebrow"><ShieldCheck size={14} />{L(`Only ${rate}% of applicants get in`, `${rate}٪ بس من المتقدمين بيدخلوا`)}</span>
        <h1>{L("Hire creatives who", "اختار مبدعين")} <span className="mk-grad-text">{L("passed 4 reviews", "عدّوا ٤ مراجعات")}</span> {L("before you met them.", "قبل ما تقابلهم.")}</h1>
        <p className="lead-x">{L("A freelance marketplace where a real team checks every member, every proposal and every delivery. You only ever see qualified work.", "منصة فريلانس فيها فريق حقيقي بيراجع كل عضو وكل عرض وكل تسليم. مش هتشوف غير شغل مؤهل.")}</p>
        <form className="orbit__search" onSubmit={e => { e.preventDefault(); go(q); }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={L("What do you need made?", "محتاج إيه يتعمل؟")} aria-label={L("What do you need made?", "محتاج إيه يتعمل؟")} />
          <button className="mk-btn mk-btn--grad" type="submit">{L("Post a job", "انشر شغلانة")}<ArrowRight className="flip-rtl" /></button>
        </form>
        <div className="orbit__chips">{chips.map(c => <button key={c} type="button" onClick={() => go(c)}>{c}</button>)}</div>
        <p className="orbit__alt">{L("Freelancer or studio?", "فريلانسر أو استوديو؟")} <Link to="/join">{L("Show us your work", "ورّينا شغلك")}</Link></p>
      </div>
    </section>

    <section className="funnel">
      <span className="mk-eyebrow" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{L("The filter", "الفلتر")}</span>
      <h2>{L("Most freelancers never make it to your inbox.", "أغلب الفريلانسرز عمرهم ما بيوصلولك.")}</h2>
      <div className="funnel__bars">
        {gates.map(([label, , w]) => <div key={label} className="funnel__bar" style={{ width: w }}><span>{label}</span></div>)}
        <div className="funnel__bar funnel__bar--in" style={{ width: `max(${rate}%, 240px)` }}><span>{L("In Vitals Crew", "في Vitals Crew")}</span><span>{rate}%</span></div>
      </div>
      <p className="funnel__note small">{L(`Bar widths are illustrative except the last: ${db.stats.accepted_90d} of ${db.stats.applied_90d} applicants accepted in the last 90 days.`, `عرض الأعمدة توضيحي ماعدا الأخير: ${db.stats.accepted_90d} من ${db.stats.applied_90d} متقدم اتقبلوا آخر ٩٠ يوم.`)}</p>
    </section>

    <section className="doors">
      <div className="door door--hire">
        <span className="mk-eyebrow" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}>{L("For clients", "للعملاء")}</span>
        <h2>{L("Post a job. Get the best 3.", "انشر شغلانة. خد أحسن ٣.")}</h2>
        <ol><li>{L("Describe it in 3 short steps", "اوصفها في ٣ خطوات قصيرة")}</li><li>{L("We screen every proposal for you", "إحنا بنراجع كل العروض")}</li><li>{L("Hire, pay into escrow, approve QA'd work", "اختار، ادفع بضمان، ووافق على شغل اتراجع")}</li></ol>
        <Link className="mk-btn" to="/client/post">{L("Post a job", "انشر شغلانة")}<ArrowRight className="flip-rtl" /></Link>
        <span className="door__big" aria-hidden>3</span>
      </div>
      <div className="door door--work">
        <span className="mk-eyebrow" style={{ background: "rgba(4,34,43,.12)", color: "#04222B" }}>{L("For freelancers & teams", "للفريلانسرز والفرق")}</span>
        <h2>{L("Get in once. Win on quality.", "ادخل مرة. واكسب بالجودة.")}</h2>
        <ol><li>{L("Send your portfolio for review", "ابعت البورتفوليو للمراجعة")}</li><li>{L("Find vetted jobs and send proposals", "دوّر على شغل متراجع وقدّم عروض")}</li><li>{L("Deliver, pass QA, get paid on approval", "سلّم، عدّي المراجعة، واقبض بالموافقة")}</li></ol>
        <Link className="mk-btn" style={{ background: "#04222B", color: "#fff" }} to="/join">{L("Join as a freelancer", "انضم كفريلانسر")}<ArrowRight className="flip-rtl" /></Link>
        <span className="door__big" aria-hidden>%</span>
      </div>
    </section>

    <section className="marquee" aria-label={L("Work by Vitals Crew members", "شغل أعضاء Vitals Crew")}>
      <div className="marquee__row">{[...art, ...art].map((a, i) => <Art key={i} title={a} />)}</div>
      <div className="marquee__row marquee__row--rev">{[...art.slice().reverse(), ...art.slice().reverse()].map((a, i) => <Art key={i} title={a} />)}</div>
    </section>

    <section className="promise">
      <span className="mk-eyebrow">{L("The Crew promise", "وعد Crew")}</span>
      <p className="promise__line">{L("Nobody works here", "محدش بيشتغل هنا")} <em>{L("without review.", "من غير مراجعة.")}</em></p>
      <p className="promise__line">{L(`${MAX_QA_ROUNDS} failed QA rounds?`, `${MAX_QA_ROUNDS} جولات مراجعة فاشلة؟`)} <em>{L("We switch the freelancer.", "بنغيّر الفريلانسر.")}</em></p>
      <p className="promise__line">{L(`${CLIENT_CHANCES} off-brief deliveries?`, `تسليمين مش زي البريف؟`)} <em>{L("We switch, at our cost.", "بنغيّر، على حسابنا.")}</em></p>
      <p className="promise__line">{L("Your deadline", "ميعادك")} <em>{L("never moves.", "مابيتحركش.")}</em></p>
      <p className="promise__sub">{L("Every switch happens inside our buffer. Same price, same date.", "أي تبديل بيحصل جوه وقتنا. نفس السعر ونفس الميعاد.")}</p>
    </section>

    <section className="mk-end">
      <h2>{L("Ready when", "جاهزين لما")} <span className="mk-grad-text">{L("you are.", "تكون جاهز.")}</span></h2>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link className="mk-btn mk-btn--grad" to="/client/post">{L("Post a job", "انشر شغلانة")}</Link>
        <Link className="mk-btn mk-btn--ghost" to="/join">{L("Join as a freelancer", "انضم كفريلانسر")}</Link>
      </div>
      <p className="small faint">{L("Demo: open any view from the app menu, Viewing as.", "تجربة: افتح أي عرض من قائمة «بتشوف كـ» جوه التطبيق.")} <Link className="link" to="/ops">{L("Review team view", "عرض فريق المراجعة")}</Link></p>
    </section>
  </div>;
}
