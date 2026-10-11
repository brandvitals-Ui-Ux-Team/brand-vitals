// Landing (choose a view), the talent application flow, and the vetting explainer.
import { ArrowRight, Briefcase, ClipboardCheck, FileSearch, Languages, MessagesSquare, Moon, ShieldCheck, Sun, UserCheck, Users } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { useTheme } from "../components/Shell";
import { APP_STEPS, Art, CAT, StagePill, Stepper, appDone, useToast } from "../components/ui";
import { actions, useDB } from "../lib/store";
import type { Category, TalentKind } from "../lib/types";

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
    <div className="vet__h"><ShieldCheck /><div><h2>{L("How we vet: 100% reviewed, every time", "إزاي بنعتمد: مراجعة ١٠٠٪ كل مرة")}</h2>
      <p className="small muted">{L(`Only ${rate}% of applicants were accepted in the last 90 days (${db.stats.accepted_90d} of ${db.stats.applied_90d}).`, `اتقبل ${rate}٪ بس من المتقدمين آخر ٩٠ يوم (${db.stats.accepted_90d} من ${db.stats.applied_90d}).`)}</p></div></div>
    <div className="vet__g">{gates.map(([icon, en, ar, den, dar], i) => <div key={i} className="vet__i"><span className="vet__n">{icon}</span><b>{L(en, ar)}</b><span className="small muted">{L(den, dar)}</span></div>)}</div>
  </div>;
}

export function Landing() {
  const { L, lang, setLang } = useI18n();
  const [theme, setTheme] = useTheme();
  const db = useDB();
  const views: [string, ReactElement, string, string, string, string][] = [
    ["/client", <Users />, "I need talent", "محتاج مواهب", "Post a brief, get a vetted shortlist of 3, pay into escrow, approve QA-checked work.", "انشر بريف، استلم ٣ ترشيحات معتمدة، ادفع بضمان، ووافق على شغل اتراجع."],
    ["/talent", <Briefcase />, "I'm a freelancer or a team", "أنا فريلانسر أو فريق", "See matched briefs, send proposals, deliver, get paid on time.", "شوف البريفات المناسبة، قدّم عرض، سلّم، واقبض في ميعادك."],
    ["/ops", <UserCheck />, "Vitals review team", "فريق مراجعة Vitals", "Vet applicants, screen proposals, build shortlists and QA every delivery.", "اعتمد المتقدمين، راجع العروض، اعمل الترشيحات، وراجع كل تسليم."]
  ];
  return <div className="landing">
    <header className="landing__top">
      <img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Crew" style={{ height: 34 }} />
      <div className="row"><button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}><Languages size={15} />{lang === "en" ? "عربي" : "EN"}</button><button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button></div>
    </header>
    <section className="landing__hero">
      <div className="stack" style={{ gap: 18 }}>
        <span className="pill pill--plain hero-pill"><ShieldCheck size={14} />{L("By Brand Vitals · every member reviewed", "من براند ڤايتلز · كل عضو اتراجع")}</span>
        <h1>{L("Vetted creative talent and teams. Nobody gets in without review.", "مواهب وفرق إبداعية معتمدة. محدش بيدخل من غير مراجعة.")}</h1>
        <p className="muted" style={{ fontSize: 17 }}>{L("Like a freelance marketplace, with one difference: our team reviews every freelancer, every proposal and every delivery. You only ever see qualified work.", "زي منصات الفريلانس، بفرق واحد: فريقنا بيراجع كل فريلانسر، وكل عرض، وكل تسليم. مش هتشوف غير شغل مؤهل.")}</p>
        <div className="row"><Link className="btn btn--primary btn--lg" to="/client/new">{L("Post a brief", "انشر بريف")}<ArrowRight className="flip-rtl" /></Link><Link className="btn btn--lg" to="/apply">{L("Apply to join", "قدّم للانضمام")}</Link></div>
      </div>
      <div className="hero-art">{db.talents.slice(0, 6).map(t => <Art key={t.id} title={t.portfolio[0]} alt="" />)}</div>
    </section>
    <section className="landing__views">
      <h2>{L("See the platform from each side", "شوف المنصة من كل جانب")}</h2>
      <div className="grid3">{views.map(([to, icon, en, ar, den, dar]) => <Link key={to} to={to} className="card view-card"><span className="view-card__i">{icon}</span><b>{L(en, ar)}</b><span className="small muted">{L(den, dar)}</span><span className="row small" style={{ color: "var(--accent)", fontWeight: 600 }}>{L("Open", "افتح")}<ArrowRight size={14} className="flip-rtl" /></span></Link>)}</div>
    </section>
    <section className="landing__views"><HowWeVet /></section>
  </div>;
}

export function Apply() {
  const { L } = useI18n();
  const toast = useToast();
  const db = useDB();
  const [id, setId] = useState<string | null>(() => { try { return localStorage.getItem("crew-my-application"); } catch { return null; } });
  const [f, setF] = useState({ name: "", title: "", category: "design" as Category, kind: "solo" as TalentKind, members: 1, city: "", links: "" });
  const mine = db.applications.find(a => a.id === id);
  const ok = f.name.trim() && f.title.trim() && f.links.trim();
  const samples: Record<Category, string[]> = { design: ["New seasonal menu post", "Weekend offer story"], motion: ["Latte art reel"], video: ["Vitamin C serum ad · UGC"], copy: ["Ramadan bundle static"], social: ["Ramadan bundle static"], web: ["Key visual · Family courtyard"], ads: ["Cold brew launch carousel"], photo: ["Barista story post"] };
  return <div className="landing">
    <header className="landing__top"><Link to="/"><img src={`${import.meta.env.BASE_URL}logo-dark.svg`} alt="Vitals Crew" style={{ height: 34 }} /></Link></header>
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head__t"><h1>{L("Apply to Vitals Crew", "قدّم في Vitals Crew")}</h1><p className="muted">{L("Freelancers and teams welcome. Every application is reviewed by a person, in four steps.", "الأفراد والفرق مرحب بيهم. كل طلب بيراجعه شخص حقيقي على ٤ خطوات.")}</p></div>
      {mine ? <div className="card card--pad stack">
        <div className="row row--between"><h2>{mine.name}</h2><StagePill s={mine.stage} /></div>
        <Stepper steps={APP_STEPS} done={appDone(mine.stage)} active={mine.stage !== "rejected"} />
        <p className="muted">{mine.stage === "portfolio" ? L("A reviewer will look at your portfolio within 3 working days. If it fits, you'll get a paid skill test.", "مراجع هيشوف البورتفوليو خلال ٣ أيام عمل. لو مناسب هيوصلك اختبار عملي مدفوع.") : mine.history.at(-1)?.note}</p>
        <p className="small faint">{L("Tip: open the Review team view to review this application yourself.", "جرّب: افتح عرض فريق المراجعة وراجع الطلب ده بنفسك.")} <Link to="/ops/applications" style={{ color: "var(--accent)" }}>{L("Open", "افتح")}</Link></p>
        <button className="btn btn--sm btn--ghost" style={{ justifySelf: "start" }} onClick={() => { setId(null); try { localStorage.removeItem("crew-my-application"); } catch { /* ignore */ } }}>{L("Start another application", "قدّم طلب تاني")}</button>
      </div> : <>
        <HowWeVet compact />
        <div className="card card--pad form">
          <div className="seg" style={{ justifySelf: "start" }}><button className={f.kind === "solo" ? "on" : ""} onClick={() => setF({ ...f, kind: "solo", members: 1 })}>{L("I'm a freelancer", "أنا فريلانسر")}</button><button className={f.kind === "team" ? "on" : ""} onClick={() => setF({ ...f, kind: "team", members: 2 })}>{L("We're a team", "إحنا فريق")}</button></div>
          <div className="form-row">
            <label className="field"><span>{f.kind === "team" ? L("Team name", "اسم الفريق") : L("Full name", "الاسم بالكامل")}</span><input className="inp" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
            <label className="field"><span>{L("What you do", "بتعمل إيه")}</span><input className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={L("e.g. Motion designer", "مثلًا: مصمم موشن")} /></label>
          </div>
          <div className="field"><span>{L("Main skill", "المجال الأساسي")}</span><div className="chips">{(Object.keys(CAT) as Category[]).map(c => <button key={c} type="button" className={"chip-btn" + (f.category === c ? " on" : "")} onClick={() => setF({ ...f, category: c })}>{L(...CAT[c])}</button>)}</div></div>
          <div className="form-row">
            <label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>
            {f.kind === "team" ? <label className="field"><span>{L("Team size", "عدد الفريق")}</span><input className="inp" type="number" min={2} value={f.members} onChange={e => setF({ ...f, members: Math.max(2, +e.target.value) })} /></label>
              : <label className="field"><span>{L("Portfolio link", "لينك البورتفوليو")}</span><input className="inp" dir="ltr" value={f.links} onChange={e => setF({ ...f, links: e.target.value })} placeholder="behance.net/…" /></label>}
          </div>
          {f.kind === "team" && <label className="field"><span>{L("Portfolio link", "لينك البورتفوليو")}</span><input className="inp" dir="ltr" value={f.links} onChange={e => setF({ ...f, links: e.target.value })} placeholder="behance.net/…" /></label>}
          <button className="btn btn--primary btn--lg" disabled={!ok} onClick={() => { const nid = actions.apply({ ...f, portfolio: samples[f.category] }); setId(nid); try { localStorage.setItem("crew-my-application", nid); } catch { /* ignore */ } toast(L("Application received", "الطلب وصل")); }}><ShieldCheck />{L("Submit for review", "ابعت للمراجعة")}</button>
        </div>
      </>}
    </div>
  </div>;
}
