// Candidate side: find a job, apply with the profile in one step, follow each application.
// The edge: Brand Vitals screens every application within 48 hours and tells you the result.
import { ArrowLeft, Briefcase, Building2, Check, FileText, GraduationCap, MapPin, Pencil, Plus, Search, Send, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, actions, candidateOf, companyOf, jobOf, useDB, type Candidate, type Field, type Job, type JobType, type WorkMode } from "../store";
import { Avatar, Empty, FIELD, LEVEL, Logo, MODE, Modal, Pipeline, StagePill, TYPE, useSalary, useToast } from "../ui";

function JobRow({ j }: { j: Job }) {
  const { L, lang } = useI18n();
  const db = useDB();
  const salary = useSalary();
  const co = companyOf(db, j.company_id);
  const applied = db.applications.some(a => a.job_id === j.id && a.candidate_id === ME.candidate);
  return <Link to={"/jobs/" + j.id} className="rc-job">
    <Logo name={co.name} />
    <span className="rc-job__main">
      <b className="rc-job__t">{j.title}</b>
      <span className="rc-job__co">{co.name} · {L(j.city, j.city_ar)}</span>
      <span className="rc-job__tags"><span className="tag">{L(...TYPE[j.type])}</span><span className="tag">{L(...MODE[j.mode])}</span><span className="tag">{L(...LEVEL[j.level])}</span><span className="tag">{L(...FIELD[j.field])}</span></span>
    </span>
    <span className="rc-job__side">
      <span className="rc-job__pay">{salary(j.salary_min, j.salary_max, j.currency)}</span>
      <span className="small faint">{ago(j.posted_at, lang)}</span>
      {applied && <span className="pill pill--ok">{L("Applied", "اتقدّمت")}</span>}
    </span>
  </Link>;
}

export function Jobs() {
  const { L } = useI18n();
  const db = useDB();
  const [q, setQ] = useState("");
  const [field, setField] = useState<Field | "">("");
  const [type, setType] = useState<JobType | "">("");
  const [mode, setMode] = useState<WorkMode | "">("");
  const list = useMemo(() => db.jobs.filter(j => j.status === "open"
    && (!field || j.field === field) && (!type || j.type === type) && (!mode || j.mode === mode)
    && (!q || (j.title + " " + companyOf(db, j.company_id).name + " " + j.city).toLowerCase().includes(q.toLowerCase()))), [db, q, field, type, mode]);
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Jobs in creative and marketing", "وظايف في الكرييتيف والماركتينج")}</h1><p className="muted">{L("Apply with your profile in one step. Brand Vitals screens every application within 48 hours.", "قدّم ببروفايلك في خطوة واحدة. Brand Vitals بتفرز كل طلب خلال ٤٨ ساعة.")}</p></div></div>
    <div className="card rc-filters">
      <label className="rc-search"><Search /><input className="inp inp--bare" value={q} onChange={e => setQ(e.target.value)} placeholder={L("Job title, company or city", "المسمى أو الشركة أو المدينة")} /></label>
      <select className="sel" value={field} onChange={e => setField(e.target.value as Field | "")} aria-label={L("Field", "المجال")}><option value="">{L("All fields", "كل المجالات")}</option>{(Object.keys(FIELD) as Field[]).map(f => <option key={f} value={f}>{L(...FIELD[f])}</option>)}</select>
      <select className="sel" value={type} onChange={e => setType(e.target.value as JobType | "")} aria-label={L("Job type", "نوع الوظيفة")}><option value="">{L("Any type", "أي نوع")}</option>{(Object.keys(TYPE) as JobType[]).map(t => <option key={t} value={t}>{L(...TYPE[t])}</option>)}</select>
      <select className="sel" value={mode} onChange={e => setMode(e.target.value as WorkMode | "")} aria-label={L("Workplace", "مكان الشغل")}><option value="">{L("Any workplace", "أي مكان")}</option>{(Object.keys(MODE) as WorkMode[]).map(m => <option key={m} value={m}>{L(...MODE[m])}</option>)}</select>
    </div>
    <p className="small faint">{L(`${list.length} open jobs`, `${list.length} وظيفة متاحة`)}</p>
    <div className="card list">{list.length ? list.map(j => <JobRow key={j.id} j={j} />) : <Empty icon={<Search />} title={L("No jobs match", "مفيش وظايف مطابقة")} text={L("Try fewer filters.", "جرّب فلاتر أقل.")} />}</div>
  </div>;
}

export function JobDetail() {
  const { L, lang } = useI18n();
  const { id = "" } = useParams();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const salary = useSalary();
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const j = jobOf(db, id);
  if (!j) return <div className="page"><Empty icon={<Briefcase />} title={L("Job not found", "الوظيفة مش موجودة")} action={<Link className="btn" to="/jobs">{L("All jobs", "كل الوظايف")}</Link>} /></div>;
  const co = companyOf(db, j.company_id);
  const me = candidateOf(db, ME.candidate)!;
  const mine = db.applications.find(a => a.job_id === j.id && a.candidate_id === ME.candidate);
  const submit = () => { actions.apply(j.id, cover.trim()); setOpen(false); toast(L("Application sent. Brand Vitals will screen it within 48 hours.", "الطلب اتبعت. Brand Vitals هتفرزه خلال ٤٨ ساعة.")); nav("/applications"); };
  return <div className="page">
    <Link to="/jobs" className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{L("All jobs", "كل الوظايف")}</Link>
    <div className="split">
      <div className="card card--pad rc-jd">
        <div className="rc-jd__head"><Logo name={co.name} /><div><h1>{j.title}</h1><p className="muted">{co.name} · <MapPin size={13} /> {L(j.city, j.city_ar)} · {L("Posted", "اتنشرت")} {ago(j.posted_at, lang)}</p></div></div>
        <dl className="rc-facts">
          <div><dt>{L("Salary", "المرتب")}</dt><dd>{salary(j.salary_min, j.salary_max, j.currency)}</dd></div>
          <div><dt>{L("Type", "النوع")}</dt><dd>{L(...TYPE[j.type])}</dd></div>
          <div><dt>{L("Workplace", "مكان الشغل")}</dt><dd>{L(...MODE[j.mode])}</dd></div>
          <div><dt>{L("Level", "المستوى")}</dt><dd>{L(...LEVEL[j.level])}</dd></div>
        </dl>
        <h2>{L("About the role", "عن الوظيفة")}</h2>
        <p>{j.description}</p>
        <h2>{L("Requirements", "المطلوب")}</h2>
        <ul className="rc-req">{j.requirements.map((r, i) => <li key={i}><Check size={15} />{r}</li>)}</ul>
      </div>
      <div className="stack">
        <div className="card card--pad stack">
          {mine ? <>
            <h3>{L("Your application", "طلبك")}</h3>
            <StagePill s={mine.stage} />
            <Pipeline s={mine.stage} />
            <Link className="btn" to="/applications">{L("View my applications", "شوف طلباتي")}</Link>
          </> : <>
            <h3>{L("Apply with your profile", "قدّم ببروفايلك")}</h3>
            <p className="small muted">{L("We send your profile and CV as they are. No forms to refill.", "بنبعت بروفايلك والـ CV زي ما هم. من غير فورم تاني.")}</p>
            <button className="btn btn--primary btn--lg btn--block" onClick={() => setOpen(true)}><Send />{L("Apply now", "قدّم دلوقتي")}</button>
            <div className="rc-edge rc-edge--inline"><ShieldCheck /><span>{L("Brand Vitals screens every application within 48 hours. Matched profiles go to the company; if not, you hear why.", "Brand Vitals بتفرز كل طلب خلال ٤٨ ساعة. البروفايلات المناسبة بتروح للشركة، ولو لأ بتعرف السبب.")}</span></div>
          </>}
        </div>
        <div className="card card--pad stack">
          <h3><Building2 size={16} /> {co.name}</h3>
          <p className="small muted">{L(co.industry, co.industry_ar)} · {L(co.city, co.city_ar)} · {co.size} {L("employees", "موظف")}</p>
          <p className="small">{L(co.about, co.about_ar)}</p>
        </div>
      </div>
    </div>
    {open && <Modal title={L(`Apply: ${j.title}`, `التقديم: ${j.title}`)} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" onClick={submit}><Send />{L("Send application", "ابعت الطلب")}</button></>}>
      <div className="stack">
        <div className="rc-mini"><Avatar name={me.name} size="lg" /><div><b>{me.name}</b><div className="small muted">{me.headline} · {L(me.city, me.city_ar)} · {L(`${me.years} years`, `${me.years} سنين خبرة`)}</div></div></div>
        <div className="rc-file"><FileText size={16} /><span>{me.cv}</span><Link className="small link" to="/profile">{L("Edit profile", "عدّل البروفايل")}</Link></div>
        <label className="field"><span>{L("Short note to the hiring team (optional)", "كلمة قصيرة لفريق التوظيف (اختياري)")}</span><textarea className="txt" style={{ minHeight: 96 }} maxLength={400} value={cover} onChange={e => setCover(e.target.value)} placeholder={L("Why this role, in two or three lines.", "ليه الوظيفة دي، في سطرين أو تلاتة.")} /></label>
        <p className="small faint">{date(new Date().toISOString(), lang)} · {L("Screened by Brand Vitals within 48 hours", "الفرز من Brand Vitals خلال ٤٨ ساعة")}</p>
      </div>
    </Modal>}
  </div>;
}

export function Applications() {
  const { L, lang } = useI18n();
  const db = useDB();
  const toast = useToast();
  const mine = db.applications.filter(a => a.candidate_id === ME.candidate);
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("My applications", "طلباتي")}</h1><p className="muted">{L("Every application gets an answer. No silence.", "كل طلب بياخد رد. مفيش تجاهل.")}</p></div><Link className="btn btn--primary" to="/jobs"><Search />{L("Find jobs", "دوّر على وظيفة")}</Link></div>
    {mine.length === 0 ? <div className="card"><Empty icon={<Briefcase />} title={L("No applications yet", "مفيش طلبات لسه")} action={<Link className="btn btn--primary btn--sm" to="/jobs">{L("Browse jobs", "شوف الوظايف")}</Link>} /></div>
      : <div className="stack">{mine.map(a => {
        const j = jobOf(db, a.job_id)!;
        const co = companyOf(db, j.company_id);
        const last = a.history[a.history.length - 1];
        return <div key={a.id} className="card card--pad rc-app">
          <div className="rc-app__head">
            <Logo name={co.name} />
            <div className="rc-app__t"><Link to={"/jobs/" + j.id}><b>{j.title}</b></Link><span className="small muted">{co.name} · {L("Applied", "اتقدّمت")} {ago(a.applied_at, lang)}</span></div>
            <StagePill s={a.stage} />
          </div>
          <Pipeline s={a.stage} />
          {a.stage === "not_matched" && <div className="rc-note"><b>{L("Feedback from Brand Vitals", "رأي Brand Vitals")}</b><span>{a.screen_note}</span></div>}
          {a.stage === "screening" && <div className="rc-note rc-note--soft"><span>{L("In screening. You will hear back within 48 hours of applying.", "قيد الفرز. هيوصلك رد خلال ٤٨ ساعة من التقديم.")}</span><button className="btn btn--ghost btn--sm" onClick={() => { actions.withdraw(a.id); toast(L("Application withdrawn", "الطلب اتسحب")); }}>{L("Withdraw", "اسحب الطلب")}</button></div>}
          {last && a.stage !== "not_matched" && last.note && <p className="small muted">{last.note} · {ago(last.at, lang)}</p>}
        </div>;
      })}</div>}
  </div>;
}

export function Profile() {
  const { L, lang } = useI18n();
  const db = useDB();
  const toast = useToast();
  const me = candidateOf(db, ME.candidate)!;
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState<Candidate>(me);
  const [skill, setSkill] = useState("");
  const startEdit = () => { setF(me); setEdit(true); };
  const save = () => { actions.updateProfile({ ...f, skills: f.skills.filter(Boolean) }); setEdit(false); toast(L("Profile saved", "البروفايل اتحفظ")); };
  const setExp = (i: number, k: keyof Candidate["experience"][number], v: string) => setF({ ...f, experience: f.experience.map((x, j) => j === i ? { ...x, [k]: v } : x) });
  const count = db.applications.filter(a => a.candidate_id === me.id).length;
  if (edit) return <div className="page rc-narrow">
    <div className="page-head"><div className="page-head__t"><h1>{L("Edit profile", "تعديل البروفايل")}</h1><p className="muted">{L("Companies see exactly this, after Brand Vitals screening.", "الشركات بتشوف ده بالظبط، بعد فرز Brand Vitals.")}</p></div></div>
    <div className="card card--pad stack">
      <div className="grid2"><label className="field"><span>{L("Full name", "الاسم بالكامل")}</span><input className="inp" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span>{L("Headline", "المسمى")}</span><input className="inp" value={f.headline} onChange={e => setF({ ...f, headline: e.target.value })} /></label></div>
      <div className="grid2"><label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={L(f.city, f.city_ar)} onChange={e => setF(lang === "ar" ? { ...f, city_ar: e.target.value } : { ...f, city: e.target.value })} /></label>
        <label className="field"><span>{L("Years of experience", "سنين الخبرة")}</span><input className="inp" type="number" min={0} max={40} value={f.years} onChange={e => setF({ ...f, years: +e.target.value })} /></label></div>
      <label className="field"><span>{L("About", "نبذة")}</span><textarea className="txt" style={{ minHeight: 100 }} value={f.about} onChange={e => setF({ ...f, about: e.target.value })} /></label>
      <h3>{L("Experience", "الخبرات")}</h3>
      {f.experience.map((x, i) => <div key={i} className="rc-edit-block">
        <div className="grid2"><label className="field"><span>{L("Title", "المسمى")}</span><input className="inp" value={x.title} onChange={e => setExp(i, "title", e.target.value)} /></label>
          <label className="field"><span>{L("Company", "الشركة")}</span><input className="inp" value={x.company} onChange={e => setExp(i, "company", e.target.value)} /></label></div>
        <div className="grid2"><label className="field"><span>{L("From", "من")}</span><input className="inp" value={x.from} onChange={e => setExp(i, "from", e.target.value)} /></label>
          <label className="field"><span>{L("To", "لحد")}</span><input className="inp" value={x.to} onChange={e => setExp(i, "to", e.target.value)} /></label></div>
        <label className="field"><span>{L("What you did", "عملت إيه")}</span><textarea className="txt" style={{ minHeight: 70 }} value={x.summary} onChange={e => setExp(i, "summary", e.target.value)} /></label>
        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => setF({ ...f, experience: f.experience.filter((_, j) => j !== i) })}><Trash2 />{L("Remove", "احذف")}</button>
      </div>)}
      <button className="btn btn--sm" onClick={() => setF({ ...f, experience: [...f.experience, { title: "", company: "", from: "", to: "", summary: "" }] })}><Plus />{L("Add experience", "ضيف خبرة")}</button>
      <h3>{L("Skills", "المهارات")}</h3>
      <div className="chips">{f.skills.map(s => <button key={s} type="button" className="chip-btn on" onClick={() => setF({ ...f, skills: f.skills.filter(x => x !== s) })}>{s} ×</button>)}</div>
      <div className="rc-row"><input className="inp" value={skill} onChange={e => setSkill(e.target.value)} placeholder={L("Add a skill", "ضيف مهارة")} onKeyDown={e => { if (e.key === "Enter" && skill.trim()) { setF({ ...f, skills: [...f.skills, skill.trim()] }); setSkill(""); } }} /><button className="btn" onClick={() => { if (skill.trim()) { setF({ ...f, skills: [...f.skills, skill.trim()] }); setSkill(""); } }}>{L("Add", "ضيف")}</button></div>
      <label className="field"><span>{L("CV file", "ملف الـ CV")}</span><input className="inp" value={f.cv} onChange={e => setF({ ...f, cv: e.target.value })} /><small>{L("PDF, up to 5 MB.", "PDF، لحد ٥ ميجا.")}</small></label>
      <label className="field"><span>{L("Portfolio or LinkedIn link", "لينك البورتفوليو أو LinkedIn")}</span><input className="inp" dir="ltr" value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://" /></label>
      <div className="rc-row rc-row--end"><button className="btn" onClick={() => setEdit(false)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" onClick={save}><Check />{L("Save profile", "احفظ البروفايل")}</button></div>
    </div>
  </div>;
  return <div className="page rc-narrow">
    <CandidateCard c={me} actions={<button className="btn" onClick={startEdit}><Pencil />{L("Edit profile", "عدّل البروفايل")}</button>} />
    <p className="small faint">{L(`${count} applications sent with this profile`, `${count} طلب اتبعت بالبروفايل ده`)}</p>
  </div>;
}

/** The formal profile, the same for the candidate and for the company. */
export function CandidateCard({ c, actions: act, contact = true }: { c: Candidate; actions?: ReactNode; contact?: boolean }) {
  const { L } = useI18n();
  return <div className="stack">
    <div className="card rc-prof">
      <div className="rc-prof__band" />
      <div className="rc-prof__head">
        <Avatar name={c.name} size="xl" />
        <div className="rc-prof__id"><h1>{c.name}</h1><p className="muted">{c.headline}</p><p className="small faint"><MapPin size={13} /> {L(c.city, c.city_ar)} · {L(`${c.years} years of experience`, `${c.years} سنين خبرة`)}</p></div>
        {act}
      </div>
    </div>
    <div className="split">
      <div className="stack">
        <section className="card card--pad stack"><h2>{L("About", "نبذة")}</h2><p>{c.about}</p></section>
        <section className="card card--pad stack"><h2>{L("Experience", "الخبرات")}</h2>
          <ol className="rc-tl">{c.experience.map((x, i) => <li key={i}><span className="rc-tl__ico"><Briefcase size={15} /></span><div><b>{x.title}</b><div className="small muted">{x.company} · {x.from} – {x.to}</div>{x.summary && <p className="small">{x.summary}</p>}</div></li>)}</ol></section>
        <section className="card card--pad stack"><h2>{L("Education", "التعليم")}</h2>
          <ol className="rc-tl">{c.education.map((x, i) => <li key={i}><span className="rc-tl__ico"><GraduationCap size={15} /></span><div><b>{x.school}</b><div className="small muted">{x.degree} · {x.year}</div></div></li>)}</ol></section>
      </div>
      <div className="stack">
        <section className="card card--pad stack"><h3>{L("Skills", "المهارات")}</h3><div className="chips">{c.skills.map(s => <span key={s} className="tag">{s}</span>)}</div></section>
        <section className="card card--pad stack"><h3>{L("Languages", "اللغات")}</h3><p className="small">{c.languages.join(" · ")}</p></section>
        <section className="card card--pad stack"><h3>{L("CV", "الـ CV")}</h3><div className="rc-file"><FileText size={16} /><span>{c.cv}</span></div>{c.link && <a className="small link" href={c.link} target="_blank" rel="noopener" dir="ltr">{c.link}</a>}</section>
        {contact && <section className="card card--pad stack"><h3>{L("Contact", "التواصل")}</h3><p className="small" dir="ltr">{c.email}<br />{c.phone}</p></section>}
      </div>
    </div>
  </div>;
}
