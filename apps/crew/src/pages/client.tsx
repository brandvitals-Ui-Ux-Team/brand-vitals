// Client side, the familiar way (Upwork-style job posts, Fiverr-style packages), with the
// Vitals edge built in: we review the job, screen proposals into a shortlist of 3, QA every
// delivery, and switch the freelancer at our cost if needed, without moving the deadline.
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock, FilePlus2, Lock, MessageSquareQuote, PenLine, Search, ShieldCheck, Sparkles, Star, Timer, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { Switches, Timeline } from "../components/guarantee";
import { TalentCard } from "../components/TalentCard";
import { Art, Avatar, BriefPill, CAT, Empty, KindTag, LevelBadge, Modal, QAPill, ScoreBars, Stepper, VettedMark, briefDone, useMoney, useToast } from "../components/ui";
import { CLIENT_CHANCES, FEE, ME, actions, avg, hiredTalent, packagesOf, talentOf, useDB } from "../lib/store";
import type { Brief, Category, JobSize, Level, Proposal } from "../lib/types";

const JOB_STEPS: [string, string][] = [["Posted", "اتنشرت"], ["Reviewed by Vitals", "اتراجعت من Vitals"], ["Best 3 proposals", "أحسن ٣ عروض"], ["Hired", "اخترت"], ["Delivered", "اتسلّمت"]];

function NextSteps() {
  const { L } = useI18n();
  const steps: [string, string, string, string][] = [
    ["Vitals reviews your job", "Vitals بتراجع الشغلانة", "Scope, budget and timeline checked within 24h.", "المطلوب والميزانية والميعاد بيتراجعوا خلال ٢٤ ساعة."],
    ["Vetted members send proposals", "الأعضاء المعتمدين بيقدموا", "Only people who passed our 4 gates can apply.", "بس اللي عدّوا ٤ مراحل اعتماد يقدروا يقدموا."],
    ["You get the best 3", "بيوصلك أحسن ٣", "We screen every proposal and tell you why we picked each.", "بنراجع كل العروض ونقولك ليه اخترنا كل واحد."],
    ["Hire and pay into escrow", "اختار وادفع بضمان", "Money is released only when you approve.", "الفلوس بتتصرف لما توافق بس."],
    ["Every delivery is QA'd", "كل تسليم بيتراجع", "3 failed rounds or 2 off-brief? We switch at our cost. Same date.", "٣ جولات فاشلة أو مرتين مش زي البريف؟ بنغيّر على حسابنا. نفس الميعاد."]
  ];
  return <ol className="next-steps">{steps.map(([en, ar, den, dar], i) => <li key={i}><span className="next-steps__n">{i + 1}</span><div><b>{L(en, ar)}</b><span className="small muted">{L(den, dar)}</span></div></li>)}</ol>;
}

// ---------- dashboard ----------
export function ClientHome() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const mine = db.briefs.filter(b => b.client === ME.client.company);
  const escrow = mine.filter(b => b.status === "in_progress").reduce((s, b) => s + (hiredTalent(db, b)?.p.price || 0), 0);
  const waiting = db.deliveries.filter(x => x.client === "waiting" && mine.some(b => b.id === x.brief_id));
  const shortlists = mine.filter(b => b.status === "shortlist");
  const todo = [...shortlists.map(b => ({ key: b.id, to: "/client/briefs/" + b.id, icon: <Sparkles />, t: L("Choose a freelancer", "اختار فريلانسر"), s: b.title })), ...waiting.map(x => ({ key: x.id, to: "/client/briefs/" + x.brief_id, icon: <ClipboardCheck />, t: L("Review a delivery", "راجع تسليم"), s: `${x.title} · v${x.version}` }))];
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L(`Hi ${ME.client.name.split(" ")[0]}`, `أهلًا ${ME.client.name.split(" ")[0]}`)}</h1><p className="muted">{ME.client.company}</p></div>
      <Link className="btn btn--primary" to="/client/post"><FilePlus2 />{L("Post a job", "انشر شغلانة")}</Link></div>
    <div className="grid4">
      <div className="card kpi"><span className="kpi__l">{L("Waiting for you", "مستني قرارك")}</span><span className="kpi__v">{todo.length}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Active jobs", "شغلانات شغالة")}</span><span className="kpi__v">{mine.filter(b => b.status !== "delivered").length}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("In escrow", "محجوز بضمان")}</span><span className="kpi__v">{money(escrow)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Completed", "اتسلّمت")}</span><span className="kpi__v">{mine.filter(b => b.status === "delivered").length}</span></div>
    </div>
    <div className="split">
      <div className="stack">
        <div className="card">
          <div className="card__h"><h2>{L("Needs your decision", "محتاج قرارك")}</h2></div>
          <div className="list">{todo.length === 0 ? <p className="small faint" style={{ padding: 16 }}>{L("Nothing right now.", "مفيش حاجة دلوقتي.")}</p> : todo.map(x => <Link key={x.key} to={x.to} className="li li--link"><span className="li__ico">{x.icon}</span><span className="li__main"><span className="li__t">{x.t}</span><span className="li__s">{x.s}</span></span><ArrowRight size={16} className="flip-rtl faint" /></Link>)}</div>
        </div>
        <JobsTable jobs={mine.slice(0, 6)} title={L("Recent jobs", "آخر الشغلانات")} more />
      </div>
      <div className="card card--pad stack">
        <h3>{L("How hiring works on Vitals Crew", "التوظيف على Vitals Crew بيمشي إزاي")}</h3>
        <NextSteps />
      </div>
    </div>
    <p className="small faint">{L("Last activity", "آخر نشاط")} · {db.activity[0] ? ago(db.activity[0].at, lang) : "—"}</p>
  </div>;
}

function JobsTable({ jobs, title, more }: { jobs: Brief[]; title: string; more?: boolean }) {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const nav = useNavigate();
  return <div className="card">
    <div className="card__h"><h2>{title}</h2>{more && <Link className="small link" to="/client/jobs">{L("All jobs", "كل الشغلانات")}</Link>}</div>
    <div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Job", "الشغلانة")}</th><th>{L("Budget", "الميزانية")}</th><th>{L("Due", "الميعاد")}</th><th>{L("Proposals", "العروض")}</th><th>{L("Status", "الحالة")}</th></tr></thead>
      <tbody>{jobs.length === 0 ? <tr><td colSpan={5}><Empty icon={<FilePlus2 />} title={L("No jobs yet", "مفيش شغلانات لسه")} action={<Link className="btn btn--primary btn--sm" to="/client/post">{L("Post a job", "انشر شغلانة")}</Link>} /></td></tr> : jobs.map(b => <tr key={b.id} className="click" onClick={() => nav("/client/briefs/" + b.id)}>
        <td><b>{b.title}</b><div className="small faint">{L(...CAT[b.category])}</div></td>
        <td>{money(b.budget, b.currency)}</td>
        <td className="small">{date(b.deadline, lang)}</td>
        <td className="small">{db.proposals.filter(p => p.brief_id === b.id).length}</td>
        <td><BriefPill s={b.status} /></td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

export function MyJobs() {
  const { L } = useI18n();
  const db = useDB();
  const [tab, setTab] = useState<"open" | "done">("open");
  const mine = db.briefs.filter(b => b.client === ME.client.company && (tab === "open" ? b.status !== "delivered" : b.status === "delivered"));
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("My jobs", "شغلاناتي")}</h1></div><Link className="btn btn--primary" to="/client/post"><FilePlus2 />{L("Post a job", "انشر شغلانة")}</Link></div>
    <div className="tabs"><button className={tab === "open" ? "on" : ""} onClick={() => setTab("open")}>{L("Open", "مفتوحة")}</button><button className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>{L("Completed", "خلصت")}</button></div>
    <JobsTable jobs={mine} title={tab === "open" ? L("Open jobs", "الشغلانات المفتوحة") : L("Completed jobs", "الشغلانات اللي خلصت")} />
  </div>;
}

// ---------- post a job (3 short steps, like Upwork) ----------
const EXAMPLES: Record<Category, string[]> = {
  design: ["Brand identity for a new café", "10 social posts for Ramadan"], motion: ["4 reels for a product launch", "Animated logo"], video: ["6 UGC ads for a skincare serum", "Product video, 60s"],
  copy: ["Arabic website copy, 6 pages", "Instagram captions for a month"], social: ["Manage our Instagram for a month", "Content calendar for Q4"], web: ["Landing page for a launch", "Company website, 5 pages"],
  ads: ["Set up Meta ads for e-commerce", "Audit our Google Ads"], photo: ["Product photos, 20 items", "Team portraits, half day"]
};
const SKILLS: Record<Category, string[]> = {
  design: ["Branding", "Social media design", "Packaging", "Arabic typography", "Illustration"], motion: ["Reels", "After Effects", "2D animation", "3D", "Logo animation"],
  video: ["UGC", "Editing", "Shooting", "Color grading", "Saudi dialect"], copy: ["Arabic copywriting", "English copywriting", "Egyptian dialect", "Gulf dialect", "UX writing"],
  social: ["Content calendar", "Community management", "TikTok", "Instagram"], web: ["Webflow", "WordPress", "Next.js", "Landing pages", "CRO"],
  ads: ["Meta Ads", "Google Ads", "TikTok Ads", "Creative testing", "Analytics"], photo: ["Product", "Lifestyle", "Portraits", "Events", "Retouching"]
};

export function PostJob() {
  const { L } = useI18n();
  const nav = useNavigate();
  const toast = useToast();
  const money = useMoney();
  const [sp] = useSearchParams();
  const db = useDB();
  const pref = talentOf(db, sp.get("talent"));
  const pack = pref ? packagesOf(pref).find(p => p.key === sp.get("pack")) : undefined;
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    title: sp.get("title") || (pref && pack ? `${L(pack.en, pack.ar)} · ${pref.name}` : ""), category: (pref?.category || "design") as Category,
    skills: [] as string[], size: "medium" as JobSize, duration: "1–2 weeks", level: "pro" as Level,
    budget: pack?.price || 15000, description: "", deadline: new Date(Date.now() + ((pack?.days || 14) + 3) * 86400000).toISOString().slice(0, 10), mode: "shortlist" as Brief["mode"]
  });
  const steps = [L("The job", "الشغلانة"), L("Scope", "الحجم"), L("Budget & details", "الميزانية والتفاصيل"), L("Review", "مراجعة")];
  const ok = [f.title.trim().length > 4, f.skills.length > 0, f.budget > 0 && f.description.trim().length > 15, true][step];
  const toggle = (s: string) => setF(x => ({ ...x, skills: x.skills.includes(s) ? x.skills.filter(y => y !== s) : x.skills.length < 5 ? [...x.skills, s] : x.skills }));
  const post = () => {
    const id = actions.postBrief({ title: f.title.trim(), category: f.category, description: f.description.trim(), budget: f.budget, deadline: f.deadline, mode: f.mode, preferred_talent: pref?.id || null, skills: f.skills, size: f.size, duration: f.duration, level: f.level });
    toast(L("Job posted. Vitals reviews it within 24 hours.", "الشغلانة اتنشرت. Vitals هتراجعها خلال ٢٤ ساعة."));
    nav("/client/briefs/" + id);
  };
  const Opt = <T extends string>({ v, cur, set, t, s }: { v: T; cur: T; set: (v: T) => void; t: string; s?: string }) =>
    <button type="button" className={"opt" + (v === cur ? " on" : "")} onClick={() => set(v)}><span className="opt__dot">{v === cur && <Check size={12} />}</span><span><b>{t}</b>{s && <span className="small muted">{s}</span>}</span></button>;
  return <div className="page post">
    <Link to="/client" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Dashboard", "الرئيسية")}</Link>
    <div className="post__grid">
      <div className="stack">
        <div className="progress-line"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <p className="small faint">{L(`Step ${step + 1} of ${steps.length}`, `خطوة ${step + 1} من ${steps.length}`)} · {steps[step]}</p>
        {pref && <div className="hint"><Star />{L(`Requesting ${pref.name}${pack ? ` · ${pack.key} package` : ""}. We'll invite them first and still add vetted alternatives.`, `طالب ${pref.name}${pack ? ` · باقة ${pack.key}` : ""}. هنبعتله الأول ومعاه بدائل معتمدة.`)}</div>}

        {step === 0 && <div className="card card--pad form">
          <h1>{L("What do you need done?", "محتاج إيه يتعمل؟")}</h1>
          <label className="field"><span>{L("Job title", "عنوان الشغلانة")}</span><input className="inp inp--lg" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} autoFocus placeholder={EXAMPLES[f.category][0]} /></label>
          <div className="small muted">{L("Examples", "أمثلة")}: {EXAMPLES[f.category].map(x => <button key={x} type="button" className="link-btn small" style={{ marginInlineEnd: 10 }} onClick={() => setF({ ...f, title: x })}>{x}</button>)}</div>
          <div className="field"><span>{L("Category", "المجال")}</span><div className="chips">{(Object.keys(CAT) as Category[]).map(c => <button key={c} type="button" className={"chip-btn" + (f.category === c ? " on" : "")} onClick={() => setF({ ...f, category: c, skills: [] })}>{L(...CAT[c])}</button>)}</div></div>
        </div>}

        {step === 1 && <div className="card card--pad form">
          <h1>{L("Skills and size", "المهارات والحجم")}</h1>
          <div className="field"><span>{L("Skills needed (up to 5)", "المهارات المطلوبة (لحد ٥)")}</span><div className="chips">{SKILLS[f.category].map(s => <button key={s} type="button" className={"chip-btn" + (f.skills.includes(s) ? " on" : "")} onClick={() => toggle(s)}>{f.skills.includes(s) && <Check />}{s}</button>)}</div></div>
          <div className="field"><span>{L("How big is it?", "حجمها قد إيه؟")}</span><div className="opts">
            <Opt v="small" cur={f.size} set={v => setF({ ...f, size: v })} t={L("Small", "صغيرة")} s={L("Quick and well defined", "سريعة وواضحة")} />
            <Opt v="medium" cur={f.size} set={v => setF({ ...f, size: v })} t={L("Medium", "متوسطة")} s={L("A few deliverables", "كذا تسليم")} />
            <Opt v="large" cur={f.size} set={v => setF({ ...f, size: v })} t={L("Large", "كبيرة")} s={L("A campaign or a long project", "حملة أو مشروع طويل")} />
          </div></div>
          <div className="form-row">
            <label className="field"><span>{L("How long?", "هتاخد قد إيه؟")}</span><select className="sel" value={f.duration} onChange={e => setF({ ...f, duration: e.target.value })}>{["Under a week", "1–2 weeks", "2–4 weeks", "1–2 months", "3+ months"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="field"><span>{L("Level", "المستوى")}</span><select className="sel" value={f.level} onChange={e => setF({ ...f, level: e.target.value as Level })}><option value="vetted">{L("Vetted · good value", "معتمد · سعر مناسب")}</option><option value="pro">{L("Pro · most jobs", "محترف · أغلب الشغل")}</option><option value="elite">{L("Elite · top 5%", "نخبة · أعلى ٥٪")}</option></select></label>
          </div>
        </div>}

        {step === 2 && <div className="card card--pad form">
          <h1>{L("Budget and details", "الميزانية والتفاصيل")}</h1>
          <div className="form-row">
            <label className="field"><span>{L("Fixed budget (EGP)", "ميزانية ثابتة (جنيه)")}</span><input className="inp inp--lg" type="number" min={0} step={500} value={f.budget} onChange={e => setF({ ...f, budget: +e.target.value })} /></label>
            <label className="field"><span>{L("Final delivery by", "التسليم النهائي يوم")}</span><input className="inp inp--lg" type="date" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })} /></label>
          </div>
          <p className="small faint">{L("Typical for this size", "المعتاد للحجم ده")}: {money(f.size === "small" ? 5000 : f.size === "medium" ? 15000 : 50000)} – {money(f.size === "small" ? 15000 : f.size === "medium" ? 40000 : 150000)}</p>
          <label className="field"><span>{L("Describe the job", "اوصف الشغلانة")}</span><textarea className="txt" style={{ minHeight: 140 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder={L("What you need, what it's for, formats, language, and any references you like.", "محتاج إيه، لإيه، المقاسات، اللغة، وأي ريفرنس عاجبك.")} /></label>
          <div className="field"><span>{L("How should we run it?", "عايزنا نمشيها إزاي؟")}</span><div className="opts">
            <Opt v="shortlist" cur={f.mode} set={v => setF({ ...f, mode: v })} t={L("Send me the best 3", "ابعتولي أحسن ٣")} s={L("You choose who to hire", "انت تختار")} />
            <Opt v="managed" cur={f.mode} set={v => setF({ ...f, mode: v })} t={L("Fully managed", "إدارة كاملة")} s={L("We build and run the team", "إحنا نجمع الفريق وندير")} />
          </div></div>
        </div>}

        {step === 3 && <div className="card card--pad stack">
          <h1>{L("Review and post", "راجع وانشر")}</h1>
          <dl className="review">
            <div><dt>{L("Title", "العنوان")}</dt><dd>{f.title}</dd></div>
            <div><dt>{L("Category", "المجال")}</dt><dd>{L(...CAT[f.category])}</dd></div>
            <div><dt>{L("Skills", "المهارات")}</dt><dd><div className="chips">{f.skills.map(s => <span key={s} className="tag">{s}</span>)}</div></dd></div>
            <div><dt>{L("Size · duration · level", "الحجم · المدة · المستوى")}</dt><dd>{f.size} · {f.duration} · {f.level}</dd></div>
            <div><dt>{L("Budget", "الميزانية")}</dt><dd><b>{money(f.budget)}</b></dd></div>
            <div><dt>{L("Final delivery", "التسليم النهائي")}</dt><dd>{f.deadline}</dd></div>
            <div><dt>{L("Details", "التفاصيل")}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{f.description}</dd></div>
          </dl>
        </div>}

        <div className="row row--between">
          {step > 0 ? <button className="btn btn--lg" onClick={() => setStep(step - 1)}><ArrowLeft className="flip-rtl" />{L("Back", "رجوع")}</button> : <span />}
          {step < 3 ? <button className="btn btn--primary btn--lg" disabled={!ok} onClick={() => setStep(step + 1)}>{L("Next", "التالي")}<ArrowRight className="flip-rtl" /></button>
            : <button className="btn btn--primary btn--lg" onClick={post}><ShieldCheck />{L("Post job", "انشر الشغلانة")}</button>}
        </div>
      </div>
      <aside className="card card--pad stack post__side">
        <h3>{L("What happens after you post", "إيه اللي بيحصل بعد ما تنشر")}</h3>
        <NextSteps />
        <p className="small faint">{L(`Posting is free. When you hire, you pay the agreed price plus a ${FEE * 100}% Vitals fee into escrow.`, `النشر مجاني. لما تختار بتدفع السعر المتفق عليه + ${FEE * 100}٪ رسوم Vitals في الضمان.`)}</p>
      </aside>
    </div>
  </div>;
}

// ---------- a job, from the client's side ----------
export function ClientBrief() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const b = db.briefs.find(x => x.id === id);
  const [hire, setHire] = useState<Proposal | null>(null);
  const [changes, setChanges] = useState<string | null>(null);
  const toast = useToast();
  const shortlist = useMemo(() => db.proposals.filter(p => p.brief_id === id && (p.status === "shortlisted" || p.status === "hired" || p.status === "not_selected")).sort((a, c) => (c.score || 0) - (a.score || 0)), [db, id]);
  if (!b) return <div className="page"><Empty icon={<FilePlus2 />} title={L("Job not found", "الشغلانة مش موجودة")} /></div>;
  const hired = hiredTalent(db, b);
  const dels = db.deliveries.filter(x => x.brief_id === id && x.qa === "passed" && x.talent_id === b.talent_id).sort((a, c) => c.version - a.version);
  const screened = db.proposals.filter(p => p.brief_id === id).length;
  return <div className="page">
    <Link to="/client/jobs" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("My jobs", "شغلاناتي")}</Link>
    <div className="page-head"><div className="page-head__t"><div className="row"><h1>{b.title}</h1><BriefPill s={b.status} /></div>
      <p className="muted">{L(...CAT[b.category])} · {money(b.budget, b.currency)} · {L("due", "التسليم")} {date(b.deadline, lang, { day: "numeric", month: "long" })}</p></div></div>
    <div className="card card--pad"><Stepper steps={JOB_STEPS} done={briefDone(b.status)} active={b.status !== "delivered"} /></div>

    {b.status === "review" && <div className="callout callout--warn"><ShieldCheck /><span><b>{L("Vitals is reviewing your job.", "Vitals بتراجع الشغلانة.")}</b> {L("We check scope, budget and timeline so only the right members see it. Usually within 24 hours.", "بنتأكد من المطلوب والميزانية والميعاد عشان يوصل للأعضاء المناسبين بس. غالبًا خلال ٢٤ ساعة.")}</span></div>}
    {b.status === "sourcing" && <div className="callout callout--info"><Sparkles /><span><b>{L("Collecting proposals.", "بنجمع العروض.")}</b> {L(`${screened} proposals so far. We screen each one and send you only the best 3.`, `${screened} عرض لحد دلوقتي. بنراجع كل واحد ونبعتلك أحسن ٣ بس.`)}</span></div>}
    {b.reviewer_note && <div className="hint"><MessageSquareQuote />{L("Reviewer note", "ملاحظة المراجع")}: {b.reviewer_note}</div>}

    {shortlist.length > 0 && <div className="stack">
      <div className="row row--between"><h2>{b.status === "shortlist" ? L("Choose one of your best 3", "اختار واحد من أحسن ٣") : L("Shortlist", "القائمة المختصرة")}</h2>
        <span className="small faint">{L(`Picked from ${screened} proposals by Vitals reviewers`, `اتختاروا من ${screened} عرض بواسطة مراجعين Vitals`)}</span></div>
      <div className="grid3">{shortlist.map(p => { const t = talentOf(db, p.talent_id)!; return <div key={p.id} className={"card pick" + (p.status === "hired" ? " pick--hired" : "") + (p.status === "not_selected" ? " pick--muted" : "")}>
        <div className="talent__art">{t.portfolio.slice(0, 2).map(x => <Art key={x} title={x} alt={x} />)}</div>
        <div className="card__b stack" style={{ gap: 10 }}>
          <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={t.name} /><div style={{ flex: 1, minWidth: 0 }}><Link to={"/client/talent/" + t.id}><b>{t.name}</b></Link><div className="small muted">{L(t.title, t.title_ar)}</div></div><LevelBadge level={t.level} /></div>
          <div className="why"><b className="small">{L("Why we picked them", "ليه اخترناهم")}</b><p className="small">{p.why}</p></div>
          <p className="small muted">“{p.pitch}”</p>
          <ScoreBars s={t.scores} />
          <div className="row row--between"><span><b style={{ fontSize: 18 }}>{money(p.price)}</b> <span className="small faint">· {p.days} {L("days", "يوم")}</span></span>
            {b.status === "shortlist" ? <button className="btn btn--primary btn--sm" onClick={() => setHire(p)}>{L("Hire", "اختار")}</button> : p.status === "hired" ? <span className="pill pill--ok">{L("Hired", "اتختار")}</span> : null}</div>
        </div>
      </div>; })}</div>
    </div>}

    {hired && b.status !== "shortlist" && <div className="grid2" style={{ alignItems: "start" }}><Timeline b={b} /><div className="stack"><Switches b={b} />{!b.switches.length && <div className="card card--pad stack"><h3 className="row"><ShieldCheck size={16} />{L("Delivery guarantee", "ضمان التسليم")}</h3><p className="small muted">{L(`We QA every version before you see it. After 3 failed QA rounds, or ${CLIENT_CHANCES} deliveries that don't match your brief, we move the job to another vetted member at our cost.`, `بنراجع كل نسخة قبل ما توصلك. بعد ٣ جولات مراجعة فاشلة، أو تسليمين مش زي البريف، بنحوّل الشغلانة لعضو معتمد تاني على حسابنا.`)}</p></div>}</div></div>}
    {hired && b.status !== "shortlist" && <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("Deliveries", "التسليمات")}</h2><span className="small faint">{L("Only work that passed our QA", "بس الشغل اللي عدّى المراجعة")}</span></div>
        <div className="card__b stack">
          {dels.length === 0 && <Empty icon={<ClipboardCheck />} title={L("Nothing to review yet", "مفيش حاجة للمراجعة لسه")} text={L("When the freelancer delivers, our QA checks it against your job first.", "لما الفريلانسر يسلّم، المراجعة بتشوفه على الشغلانة الأول.")} />}
          {dels.map(x => <div key={x.id} className="delivery">
            <Art title={x.art} className="delivery__art" alt={x.title} />
            <div className="stack" style={{ gap: 8 }}>
              <div className="row row--between"><b>{x.title} · v{x.version}</b><QAPill s={x.qa} /></div>
              <p className="small muted">{x.note}</p>
              <div className="qa-box small"><ShieldCheck size={15} /><span><b>{L("QA by", "راجعه")} {x.qa_by}:</b> {x.qa_note}</span></div>
              {x.client === "waiting" ? <div className="row"><button className="btn btn--primary" onClick={() => { actions.clientDecide(x.id, true, ""); toast(L("Approved. Payment released.", "اتوافق عليه واتصرف المبلغ.")); }}><CheckCircle2 />{L("Approve & release payment", "وافق واصرف المبلغ")}</button><button className="btn" onClick={() => setChanges(x.id)}><PenLine />{L("Request changes", "اطلب تعديل")}</button></div>
                : x.client === "approved" ? <span className="pill pill--ok">{L("You approved this", "وافقت عليه")}</span> : x.client === "changes" ? <span className="pill pill--warn">{x.client_kind === "off_brief" ? L("Didn't match the brief", "مش زي البريف") : L("Changes requested", "طلبت تعديل")}: {x.client_note}</span> : null}
            </div>
          </div>)}
        </div>
      </div>
      <div className="stack">
        <div className="card card--pad stack">
          <h3>{L("Your freelancer", "الفريلانسر")}</h3>
          <Link to={"/client/talent/" + hired.t!.id} className="row" style={{ flexWrap: "nowrap" }}><Avatar name={hired.t!.name} /><div><b>{hired.t!.name}</b><div className="small muted">{L(hired.t!.title, hired.t!.title_ar)}</div></div></Link>
          <VettedMark t={hired.t!} />
        </div>
        <div className="card card--pad stack">
          <h3 className="row"><Wallet size={16} />{L("Payment", "الدفع")}</h3>
          <div className="row row--between small"><span className="muted">{L("Agreed price", "السعر المتفق عليه")}</span><b>{money(hired.p.price)}</b></div>
          <div className="row row--between small"><span className="muted">{L("Status", "الحالة")}</span>{b.status === "delivered" ? <span className="pill pill--ok">{L("Released", "اتصرف")}</span> : <span className="pill pill--info"><Lock size={12} />{L("In escrow", "محجوز بضمان")}</span>}</div>
        </div>
      </div>
    </div>}

    {hire && <Modal title={L("Hire and fund escrow", "اختار وادفع بضمان")} onClose={() => setHire(null)} footer={<>
      <button className="btn" onClick={() => setHire(null)}>{L("Cancel", "إلغاء")}</button>
      <button className="btn btn--primary" onClick={() => { actions.hire(b.id, hire.id); setHire(null); toast(L("Hired. Money is held safely until you approve.", "تم. الفلوس محجوزة بأمان لحد ما توافق.")); }}><Lock />{L("Confirm & pay into escrow", "أكد وادفع للضمان")}</button>
    </>}>
      <div className="stack">
        <p>{L(`You're hiring ${talentOf(db, hire.talent_id)?.name} for “${b.title}”.`, `هتختار ${talentOf(db, hire.talent_id)?.name} لـ «${b.title}».`)}</p>
        <div className="receipt">
          <div><span>{L("Freelancer price", "سعر الفريلانسر")}</span><b>{money(hire.price)}</b></div>
          <div><span>{L("Vitals Crew fee", "رسوم Vitals Crew")} ({FEE * 100}%)</span><b>{money(hire.price * FEE)}</b></div>
          <div className="receipt__t"><span>{L("Total, held in escrow", "الإجمالي، محجوز بضمان")}</span><b>{money(hire.price * (1 + FEE))}</b></div>
        </div>
        <div className="callout callout--ok"><ShieldCheck /><span className="small">{L("The fee covers vetting, QA on every delivery and a free replacement if needed. Your deadline is guaranteed.", "الرسوم بتغطي الاعتماد ومراجعة كل تسليم واستبدال مجاني لو احتجنا. وميعادك مضمون.")}</span></div>
      </div>
    </Modal>}
    {changes && <ChangesModal strikes={b.client_strikes} onClose={() => setChanges(null)} onSend={(n, k) => { actions.clientDecide(changes, false, n, k); setChanges(null); toast(k === "off_brief" ? L("Logged as not matching the brief", "اتسجّل إنه مش زي البريف") : L("Sent to the freelancer", "اتبعت للفريلانسر")); }} />}
    <p className="small faint">{L("Posted", "اتنشرت")} {ago(b.created_at, lang)}</p>
  </div>;
}

function ChangesModal({ strikes, onClose, onSend }: { strikes: number; onClose: () => void; onSend: (n: string, k: "revision" | "off_brief") => void }) {
  const { L } = useI18n();
  const [n, setN] = useState("");
  const [k, setK] = useState<"revision" | "off_brief">("revision");
  return <Modal title={L("What should change?", "إيه اللي يتغير؟")} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" disabled={!n.trim()} onClick={() => onSend(n.trim(), k)}>{L("Send", "ابعت")}</button></>}>
    <div className="form">
      <div className="opts">
        <button type="button" className={"opt" + (k === "revision" ? " on" : "")} onClick={() => setK("revision")}><span className="opt__dot">{k === "revision" && <Check size={12} />}</span><span><b>{L("A revision", "تعديل عادي")}</b><span className="small muted">{L("It follows the brief; I want adjustments.", "ماشي على البريف؛ عايز تظبيطات.")}</span></span></button>
        <button type="button" className={"opt" + (k === "off_brief" ? " on" : "")} onClick={() => setK("off_brief")}><span className="opt__dot">{k === "off_brief" && <Check size={12} />}</span><span><b>{L("Doesn't match the brief", "مش زي البريف")}</b><span className="small muted">{L(`Counts as a chance (${strikes}/${CLIENT_CHANCES} used). At ${CLIENT_CHANCES}, we switch the freelancer at our cost.`, `بتتحسب فرصة (${strikes}/${CLIENT_CHANCES}). عند ${CLIENT_CHANCES} بنغيّر الفريلانسر على حسابنا.`)}</span></span></button>
      </div>
      <textarea className="txt" style={{ minHeight: 110, width: "100%" }} value={n} onChange={e => setN(e.target.value)} autoFocus placeholder={L("Be specific: what, where, and which part of the brief or reference", "حدد: إيه، فين، وأنهي جزء من البريف أو الريفرنس")} />
    </div>
  </Modal>;
}

// ---------- find talent + profiles with packages (Fiverr-style) ----------
export function Directory() {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [kind, setKind] = useState<"all" | "solo" | "team">("all");
  const term = q.trim().toLowerCase();
  const list = db.talents.filter(t => (cat === "all" || t.category === cat) && (kind === "all" || (kind === "solo" ? t.kind === "solo" : t.kind !== "solo"))
    && (!term || [t.name, t.title, t.title_ar, ...t.skills].some(x => x.toLowerCase().includes(term))));
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Find talent", "دوّر على مواهب")}</h1><p className="muted">{L(`${db.talents.length} vetted freelancers and teams. Hire one directly with a package, or post a job and get the best 3.`, `${db.talents.length} فريلانسر وفريق معتمدين. اختار حد مباشرة بباقة، أو انشر شغلانة وخد أحسن ٣.`)}</p></div></div>
    <div className="searchbar"><Search /><input value={q} onChange={e => setQ(e.target.value)} placeholder={L("Search skills or names: reels, branding, UGC…", "دوّر بالمهارة أو الاسم: ريلز، هوية، UGC…")} /><div className="seg">{([["all", L("All", "الكل")], ["solo", L("Freelancers", "أفراد")], ["team", L("Teams", "فرق")]] as const).map(([k, l]) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{l}</button>)}</div></div>
    <div className="chips"><button className={"chip-btn" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>{L("All", "الكل")}</button>{(Object.keys(CAT) as Category[]).map(c => <button key={c} className={"chip-btn" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{L(...CAT[c])}</button>)}</div>
    {list.length === 0 ? <div className="card"><Empty icon={<Search />} title={L("No one matches", "مفيش نتائج")} /></div> :
      <div className="grid3">{list.map(t => <div key={t.id} className="clickable" onClick={() => nav("/client/talent/" + t.id)}><TalentCard t={t} footer={<span className="small link">{L("View profile", "شوف البروفايل")}</span>} /></div>)}</div>}
  </div>;
}

export function TalentProfile({ self }: { self?: string }) {
  const params = useParams();
  const id = self || params.id || "";
  const { L } = useI18n();
  const db = useDB();
  const money = useMoney();
  const nav = useNavigate();
  const t = talentOf(db, id);
  const [pk, setPk] = useState<"basic" | "standard" | "premium">("standard");
  if (!t) return <div className="page"><Empty icon={<Search />} title={L("Profile not found", "البروفايل مش موجود")} /></div>;
  const packs = packagesOf(t);
  const p = packs.find(x => x.key === pk)!;
  return <div className="page">
    {!self && <Link to="/client/talent" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Find talent", "دوّر على مواهب")}</Link>}
    <div className="profile">
      <div className="stack" style={{ gap: 18 }}>
        <div className="card card--pad profile__head">
          <Avatar name={t.name} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}><div className="row"><h1>{t.name}</h1><LevelBadge level={t.level} /><KindTag t={t} /></div>
            <p className="muted">{L(t.title, t.title_ar)} · {L(t.city, t.city_ar)}</p>
            <div className="row small" style={{ marginTop: 6 }}><VettedMark t={t} /><span className="row" style={{ gap: 4 }}><Star size={14} />{avg(t.scores).toFixed(1)}</span><span>{t.jobs} {L("jobs", "شغلانة")}</span><span className="row" style={{ gap: 4 }}><Timer size={14} />{t.on_time}% {L("on time", "في الميعاد")}</span></div></div>
        </div>
        <div className="card card--pad stack"><h3>{L("About", "نبذة")}</h3><p>{L(t.bio, t.bio_ar)}</p><div className="chips">{t.skills.map(s => <span key={s} className="tag">{s}</span>)}</div></div>
        <div className="card card--pad stack"><h3>{L("Portfolio", "البورتفوليو")}</h3><div className="pieces pieces--static">{t.portfolio.map((x, i) => <div key={i} className="piece"><Art title={x} alt={x} /><span className="small ellipsis">{x.startsWith("data:") ? L("Portfolio piece", "قطعة من البورتفوليو") : x}</span></div>)}</div></div>
        <div className="card card--pad stack"><h3>{L("Vitals vetting scorecard", "تقييم اعتماد Vitals")}</h3><ScoreBars s={t.scores} /><p className="small faint">{L("Scored by our reviewers at vetting and updated after every QA-reviewed delivery.", "متقيّم من مراجعينا وقت الاعتماد، وبيتحدث بعد كل تسليم بيتراجع.")}</p></div>
      </div>
      <aside className="card pack">
        <div className="pack__tabs">{packs.map(x => <button key={x.key} className={pk === x.key ? "on" : ""} onClick={() => setPk(x.key)}>{x.key === "basic" ? L("Basic", "أساسي") : x.key === "standard" ? L("Standard", "قياسي") : L("Premium", "مميز")}</button>)}</div>
        <div className="pack__b">
          <div className="row row--between"><b>{L(p.en, p.ar)}</b><b className="pack__price">{money(p.price)}</b></div>
          <ul className="pack__list small">
            <li><Clock size={14} />{L(`${p.days}-day delivery`, `تسليم في ${p.days} يوم`)}</li>
            <li><PenLine size={14} />{L(`${p.revisions} revision round${p.revisions > 1 ? "s" : ""}`, `${p.revisions} جولة تعديل`)}</li>
            <li><ShieldCheck size={14} />{L("Vitals QA before you see it", "مراجعة Vitals قبل ما توصلك")}</li>
            <li><Lock size={14} />{L("Escrow, released on approval", "دفع بضمان يتصرف بموافقتك")}</li>
          </ul>
          {!self && <button className="btn btn--primary btn--block btn--lg" onClick={() => nav(`/client/post?talent=${t.id}&pack=${p.key}`)}>{L("Continue", "كمّل")} · {money(p.price)}</button>}
          {!self && <button className="btn btn--block" onClick={() => nav(`/client/post?talent=${t.id}`)}>{L("Custom job instead", "شغلانة مخصوصة")}</button>}
        </div>
      </aside>
    </div>
  </div>;
}
