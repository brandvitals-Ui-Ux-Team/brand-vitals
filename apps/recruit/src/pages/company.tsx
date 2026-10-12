// Company side: post a job, then meet only applicants Brand Vitals has already screened,
// each with a fit score and a note on why they are worth the interview.
import { ArrowLeft, Briefcase, CalendarCheck, Check, Eye, FilePlus2, Handshake, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, VISIBLE_TO_COMPANY, actions, appOf, candidateOf, companyOf, jobOf, skillMatch, statsOf, useDB, type Edu, type Field, type JobType, type Level, type Stage, type WorkMode } from "../store";
import { Avatar, EDU, Empty, FIELD, Fit, LEVEL, MODE, Modal, StagePill, TYPE, useSalary, useT, useToast } from "../ui";
import { CandidateCard } from "./candidate";

const useMine = () => {
  const db = useDB();
  const jobs = db.jobs.filter(j => j.company_id === ME.company);
  const apps = db.applications.filter(a => jobs.some(j => j.id === a.job_id));
  return { db, jobs, apps, seen: apps.filter(a => VISIBLE_TO_COMPANY.includes(a.stage)) };
};

export function CompanyHome() {
  const { L, lang } = useI18n();
  const T = useT();
  const { db, jobs, apps, seen } = useMine();
  const co = companyOf(db, ME.company);
  const fresh = seen.filter(a => a.stage === "shortlisted");
  const views = jobs.reduce((s, j) => s + j.views, 0);
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{T(co.name, co.name_ar)}</h1><p className="muted">{T(co.industry, co.industry_ar)} · {T(co.city, co.city_ar)}</p></div>
      <Link className="btn btn--primary" to="/company/post"><FilePlus2 />{L("Post a job", "انشر وظيفة")}</Link></div>
    <div className="grid4">
      <div className="card kpi"><span className="kpi__l">{L("Open jobs", "وظايف مفتوحة")}</span><span className="kpi__v">{jobs.filter(j => j.status === "open").length}</span><span className="small faint">{L(`${views} views in total`, `${views} مشاهدة إجمالًا`)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Applied", "اتقدموا")}</span><span className="kpi__v">{apps.length}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Screened for you", "اتفرزوا ليك")}</span><span className="kpi__v">{seen.length}</span><span className="small faint">{L(`${apps.length - seen.length} filtered out or in screening`, `${apps.length - seen.length} اتستبعدوا أو قيد الفرز`)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Interviews", "مقابلات")}</span><span className="kpi__v">{seen.filter(a => a.stage === "interview").length}</span></div>
    </div>
    <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("New screened applicants", "متقدمين جداد بعد الفرز")}</h2></div>
        <div className="list">{fresh.length === 0 ? <p className="small faint" style={{ padding: 16 }}>{L("Nothing new right now.", "مفيش جديد دلوقتي.")}</p> : fresh.map(a => {
          const c = candidateOf(db, a.candidate_id)!; const j = jobOf(db, a.job_id)!;
          return <Link key={a.id} to={"/company/applicants/" + a.id} className="li li--link"><Avatar name={c.name} /><span className="li__main"><span className="li__t">{T(c.name, c.name_ar)}{!a.viewed && <span className="rc-new">{L("New", "جديد")}</span>}</span><span className="li__s">{T(j.title, j.title_ar)} · {ago(a.applied_at, lang)}</span></span><Fit n={a.fit} /></Link>;
        })}</div>
      </div>
      <div className="card card--pad stack">
        <h3>{L("How hiring works here", "التوظيف هنا بيمشي إزاي")}</h3>
        <ol className="rc-steps">
          <li><b>{L("You post the job", "بتنشر الوظيفة")}</b><span className="small muted">{L("Title, salary range, requirements.", "المسمى ونطاق المرتب والمطلوب.")}</span></li>
          <li><b>{L("Brand Vitals screens everyone", "Brand Vitals بتفرز الكل")}</b><span className="small muted">{L("CV, experience and portfolio checked within 48 hours.", "الـ CV والخبرة والبورتفوليو بيتراجعوا خلال ٤٨ ساعة.")}</span></li>
          <li><b>{L("You see the matches only", "بتشوف المناسبين بس")}</b><span className="small muted">{L("Each with a fit score and a note.", "كل واحد بدرجة توافق وملاحظة.")}</span></li>
          <li><b>{L("Interview and hire", "قابل ووظّف")}</b><span className="small muted">{L("Move people along; they are told at every step.", "حرّك المتقدمين، وهم بيتبلغوا في كل خطوة.")}</span></li>
        </ol>
      </div>
    </div>
  </div>;
}

export function CompanyJobs() {
  const { L, lang } = useI18n();
  const T = useT();
  const { db, jobs } = useMine();
  const nav = useNavigate();
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Jobs and applicants", "الوظايف والمتقدمين")}</h1></div><Link className="btn btn--primary" to="/company/post"><FilePlus2 />{L("Post a job", "انشر وظيفة")}</Link></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Job", "الوظيفة")}</th><th>{L("Posted", "اتنشرت")}</th><th>{L("Views", "مشاهدات")}</th><th>{L("Applied", "اتقدموا")}</th><th>{L("Screened for you", "اتفرزوا ليك")}</th><th>{L("Status", "الحالة")}</th></tr></thead>
      <tbody>{jobs.length === 0 ? <tr><td colSpan={6}><Empty icon={<Briefcase />} title={L("No jobs yet", "مفيش وظايف لسه")} /></td></tr> : jobs.map(j => {
        const st = statsOf(db, j.id);
        return <tr key={j.id} className="click" onClick={() => nav("/company/jobs/" + j.id)}>
          <td><b>{T(j.title, j.title_ar)}</b><div className="small faint">{L(...FIELD[j.field])} · {L(...TYPE[j.type])}</div></td>
          <td className="small">{ago(j.posted_at, lang)}</td>
          <td>{j.views}</td>
          <td>{st.applied}</td>
          <td>{db.applications.filter(x => x.job_id === j.id && VISIBLE_TO_COMPANY.includes(x.stage)).length}</td>
          <td><span className={"pill " + (j.status === "open" ? "pill--ok" : "")}>{j.status === "open" ? L("Open", "مفتوحة") : L("Closed", "مقفولة")}</span></td>
        </tr>;
      })}</tbody>
    </table></div></div>
  </div>;
}

const COLS: [Stage[], string, string][] = [[["shortlisted"], "Screened", "اتفرزوا"], [["interview"], "Interview", "مقابلة"], [["offer", "hired"], "Offer & hired", "عرض وتعيين"], [["not_selected"], "Not selected", "لم يتم الاختيار"]];

export function CompanyJob() {
  const { L, lang } = useI18n();
  const T = useT();
  const { id = "" } = useParams();
  const { db, apps } = useMine();
  const salary = useSalary();
  const j = jobOf(db, id);
  if (!j || j.company_id !== ME.company) return <div className="page"><Empty icon={<Briefcase />} title={L("Job not found", "الوظيفة مش موجودة")} /></div>;
  const mine = apps.filter(a => a.job_id === j.id);
  const hidden = mine.filter(a => !VISIBLE_TO_COMPANY.includes(a.stage));
  return <div className="page">
    <Link to="/company/jobs" className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{L("All jobs", "كل الوظايف")}</Link>
    <div className="page-head"><div className="page-head__t"><h1>{T(j.title, j.title_ar)}</h1><p className="muted">{salary(j.salary_min, j.salary_max, j.currency)} · {L(...MODE[j.mode])} · {L(...LEVEL[j.level])} · {L("Posted", "اتنشرت")} {ago(j.posted_at, lang)} · {L(`${j.views} views`, `${j.views} مشاهدة`)}</p></div>
      <div className="rc-row"><Link className="btn" to={"/jobs/" + j.id}><Eye />{L("View as candidate", "شوفها كمتقدم")}</Link><button className="btn" onClick={() => actions.closeJob(j.id)}>{j.status === "open" ? L("Close job", "اقفل الوظيفة") : L("Reopen job", "افتح الوظيفة تاني")}</button></div></div>
    <div className="rc-edge rc-edge--inline"><ShieldCheck /><span>{L(`${mine.length} applied. Brand Vitals screened them; you see the ${mine.length - hidden.length} who match. ${hidden.length} are filtered out or still in screening.`, `${mine.length} اتقدموا. Brand Vitals فرزتهم؛ إنت بتشوف الـ ${mine.length - hidden.length} المناسبين. ${hidden.length} اتستبعدوا أو لسه بيتفرزوا.`)}</span></div>
    <div className="rc-board">{COLS.map(([stages, en, ar]) => {
      const list = mine.filter(a => stages.includes(a.stage)).sort((a, b) => (b.fit || 0) - (a.fit || 0));
      return <div key={en} className="rc-col"><div className="rc-col__h"><b>{L(en, ar)}</b><span className="count">{list.length}</span></div>
        {list.length === 0 ? <p className="small faint rc-col__empty">—</p> : list.map(a => { const c = candidateOf(db, a.candidate_id)!; return <Link key={a.id} to={"/company/applicants/" + a.id} className="rc-cand"><div className="rc-cand__h"><Avatar name={c.name} /><span><b>{T(c.name, c.name_ar)}{!a.viewed && <span className="rc-new">{L("New", "جديد")}</span>}</b><span className="small muted">{T(c.headline, c.headline_ar)}</span></span></div><Fit n={a.fit} /><p className="small muted rc-cand__note">{T(a.screen_note, a.screen_note_ar)}</p></Link>; })}
      </div>;
    })}</div>
  </div>;
}

export function Applicant() {
  const { L, lang } = useI18n();
  const T = useT();
  const { id = "" } = useParams();
  const db = useDB();
  const toast = useToast();
  const [dlg, setDlg] = useState<Stage | null>(null);
  const [note, setNote] = useState("");
  const a = appOf(db, id);
  const j = a && jobOf(db, a.job_id);
  const ok = !!a && !!j && j.company_id === ME.company && VISIBLE_TO_COMPANY.includes(a.stage);
  useEffect(() => { if (ok) actions.markViewed(id); }, [ok, id]);
  if (!ok || !a || !j) return <div className="page"><Empty icon={<Users />} title={L("Applicant not available", "المتقدم مش متاح")} text={L("Companies only see applicants after Brand Vitals screening.", "الشركات بتشوف المتقدمين بعد فرز Brand Vitals بس.")} /></div>;
  const c = candidateOf(db, a.candidate_id)!;
  const sm = skillMatch(c, j);
  const go = (s: Stage) => { actions.move(a.id, s, ME.hr, note.trim()); setDlg(null); setNote(""); toast(L("Updated. The candidate has been told.", "اتحدّث. والمتقدم اتبلغ.")); };
  const label: Record<string, [string, string]> = { interview: ["Invite to interview", "ادعيه لمقابلة"], offer: ["Make an offer", "قدّم عرض"], hired: ["Mark as hired", "اتعيّن"], not_selected: ["Not selected", "لم يتم الاختيار"] };
  const next: Stage[] = a.stage === "shortlisted" ? ["interview", "not_selected"] : a.stage === "interview" ? ["offer", "not_selected"] : a.stage === "offer" ? ["hired", "not_selected"] : [];
  const icon = (s: Stage) => s === "interview" ? <CalendarCheck /> : s === "offer" ? <Handshake /> : s === "hired" ? <Check /> : <X />;
  return <div className="page rc-narrow">
    <Link to={"/company/jobs/" + j.id} className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{T(j.title, j.title_ar)}</Link>
    <div className="card card--pad rc-screen">
      <div className="rc-screen__h"><ShieldCheck /><b>{L("Brand Vitals screening", "فرز Brand Vitals")}</b><Fit n={a.fit} /><StagePill s={a.stage} company /></div>
      <p>{T(a.screen_note, a.screen_note_ar)}</p>
      <p className="small muted">{L(`Skills: ${sm.have.length} of ${j.skills.length} asked`, `المهارات: ${sm.have.length} من ${j.skills.length} مطلوبة`)}{sm.missing.length ? " · " + L("missing ", "ناقص ") + sm.missing.join(L(", ", "، ")) : ""}</p>
      {a.cover && <p className="small muted">“{a.cover}”</p>}
      {next.length > 0 && <div className="rc-row">{next.map(s => <button key={s} className={"btn" + (s === "not_selected" ? " btn--ghost" : " btn--primary")} onClick={() => setDlg(s)}>{icon(s)}{L(...label[s])}</button>)}</div>}
      {a.history.length > 0 && <ol className="rc-hist">{[...a.history].reverse().map((h, i) => <li key={i}><StagePill s={h.stage} company /><span className="small">{T(h.note, h.note_ar)}</span><span className="small faint">{ago(h.at, lang)}</span></li>)}</ol>}
    </div>
    <CandidateCard c={c} />
    {dlg && <Modal title={L(...label[dlg])} onClose={() => setDlg(null)} footer={<><button className="btn" onClick={() => setDlg(null)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" onClick={() => go(dlg)}>{L("Confirm", "تأكيد")}</button></>}>
      <label className="field"><span>{dlg === "interview" ? L("Date, time and place", "الميعاد والمكان") : L("Message to the candidate (optional)", "رسالة للمتقدم (اختياري)")}</span><textarea className="txt" style={{ minHeight: 90 }} value={note} onChange={e => setNote(e.target.value)} placeholder={dlg === "interview" ? L("Thursday 11:00 at our New Cairo office", "الخميس ١١ الصبح في مكتبنا بالتجمع") : ""} /></label>
    </Modal>}
  </div>;
}

const EMPTY = { title: "", title_ar: "", field: "social" as Field, type: "full_time" as JobType, mode: "onsite" as WorkMode, level: "mid" as Level, city: "New Cairo", city_ar: "القاهرة الجديدة",
  saudi: false, salary_min: 15000, salary_max: 25000, currency: "EGP", exp_min: 2, exp_max: 5, education: "bachelor" as Edu, openings: 1, skills: [] as string[],
  description: "", description_ar: "", requirements: [""], requirements_ar: [] as string[] };

export function PostJob() {
  const { L } = useI18n();
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [skill, setSkill] = useState("");
  const ok = f.title.trim().length > 2 && f.description.trim().length > 20 && f.salary_max >= f.salary_min && f.exp_max >= f.exp_min && f.requirements.some(r => r.trim()) && f.skills.length > 0;
  const addSkill = () => { const v = skill.trim(); if (v && !f.skills.includes(v)) setF({ ...f, skills: [...f.skills, v] }); setSkill(""); };
  const submit = () => {
    const req = f.requirements.map(r => r.trim()).filter(Boolean);
    const id = actions.postJob({ ...f, title_ar: f.title_ar.trim() || f.title, description_ar: f.description_ar.trim() || f.description, requirements: req, requirements_ar: req, city_ar: f.city_ar || f.city });
    toast(L("Job posted. Brand Vitals starts screening applicants as they come in.", "الوظيفة اتنشرت. Brand Vitals هتبدأ تفرز المتقدمين أول بأول."));
    nav("/company/jobs/" + id);
  };
  return <div className="page rc-narrow">
    <div className="page-head"><div className="page-head__t"><h1>{L("Post a job", "انشر وظيفة")}</h1><p className="muted">{L("One page. Brand Vitals screens every applicant before you see them.", "صفحة واحدة. Brand Vitals بتفرز كل متقدم قبل ما تشوفه.")}</p></div></div>
    <div className="card card--pad stack">
      <div className="grid2">
        <label className="field"><span>{L("Job title (English)", "المسمى الوظيفي (إنجليزي)")}</span><input className="inp inp--lg" dir="ltr" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Senior Graphic Designer" autoFocus /></label>
        <label className="field"><span>{L("Job title (Arabic, optional)", "المسمى الوظيفي (عربي، اختياري)")}</span><input className="inp inp--lg" dir="rtl" value={f.title_ar} onChange={e => setF({ ...f, title_ar: e.target.value })} placeholder="مصمم جرافيك أول" /></label>
      </div>
      <div className="field"><span>{L("Field", "المجال")}</span><div className="chips">{(Object.keys(FIELD) as Field[]).map(x => <button key={x} type="button" className={"chip-btn" + (f.field === x ? " on" : "")} onClick={() => setF({ ...f, field: x })}>{L(...FIELD[x])}</button>)}</div></div>
      <div className="grid3">
        <label className="field"><span>{L("Type", "النوع")}</span><select className="sel" value={f.type} onChange={e => setF({ ...f, type: e.target.value as JobType })}>{(Object.keys(TYPE) as JobType[]).map(x => <option key={x} value={x}>{L(...TYPE[x])}</option>)}</select></label>
        <label className="field"><span>{L("Workplace", "مكان الشغل")}</span><select className="sel" value={f.mode} onChange={e => setF({ ...f, mode: e.target.value as WorkMode })}>{(Object.keys(MODE) as WorkMode[]).map(x => <option key={x} value={x}>{L(...MODE[x])}</option>)}</select></label>
        <label className="field"><span>{L("Career level", "المستوى")}</span><select className="sel" value={f.level} onChange={e => setF({ ...f, level: e.target.value as Level })}>{(Object.keys(LEVEL) as Level[]).map(x => <option key={x} value={x}>{L(...LEVEL[x])}</option>)}</select></label>
      </div>
      <div className="grid3">
        <label className="field"><span>{L("Experience from (years)", "الخبرة من (سنين)")}</span><input className="inp" type="number" min={0} max={30} value={f.exp_min} onChange={e => setF({ ...f, exp_min: +e.target.value })} /></label>
        <label className="field"><span>{L("Experience to (years)", "الخبرة لحد (سنين)")}</span><input className="inp" type="number" min={0} max={40} value={f.exp_max} onChange={e => setF({ ...f, exp_max: +e.target.value })} /></label>
        <label className="field"><span>{L("Education", "التعليم")}</span><select className="sel" value={f.education} onChange={e => setF({ ...f, education: e.target.value as Edu })}>{(Object.keys(EDU) as Edu[]).map(x => <option key={x} value={x}>{L(...EDU[x])}</option>)}</select></label>
      </div>
      <div className="grid3">
        <label className="field"><span>{L("Salary from (monthly)", "المرتب من (شهري)")}</span><input className="inp" type="number" min={0} step={500} value={f.salary_min} onChange={e => setF({ ...f, salary_min: +e.target.value })} /></label>
        <label className="field"><span>{L("Salary to (monthly)", "المرتب لحد (شهري)")}</span><input className="inp" type="number" min={0} step={500} value={f.salary_max} onChange={e => setF({ ...f, salary_max: +e.target.value })} /></label>
        <label className="field"><span>{L("Currency", "العملة")}</span><select className="sel" value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>{["EGP", "SAR", "AED", "USD"].map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
      {(f.salary_max < f.salary_min || f.exp_max < f.exp_min) && <p className="small" style={{ color: "var(--bad)" }}>{L("The “to” values must be at least the “from” values.", "قيم «لحد» لازم تكون أكبر من أو تساوي قيم «من».")}</p>}
      {f.currency === "SAR" && <label className="rc-check"><input type="checkbox" checked={f.saudi} onChange={e => setF({ ...f, saudi: e.target.checked })} /><span><b>{L("Saudization role", "وظيفة توطين")}</b><span className="small muted">{L("Reserved for Saudi nationals. Screening and the job page show it from the start.", "مخصّصة للسعوديين. يظهر ذلك في الفرز وصفحة الوظيفة من البداية.")}</span></span></label>}
      <p className="small faint">{L("Every job on Vitals Recruit shows a salary range. It brings better applicants.", "كل وظيفة على Vitals Recruit بتعرض نطاق المرتب. ده بيجيب متقدمين أنسب.")}</p>
      <div className="grid2">
        <label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={f.city} onChange={e => setF({ ...f, city: e.target.value, city_ar: e.target.value })} /></label>
        <label className="field"><span>{L("Openings", "عدد الأماكن")}</span><input className="inp" type="number" min={1} max={50} value={f.openings} onChange={e => setF({ ...f, openings: Math.max(1, +e.target.value) })} /></label>
      </div>
      <div className="field"><span>{L("Skills and tools (used to match candidates)", "المهارات والأدوات (بنستخدمها في التوافق)")}</span>
        <div className="chips">{f.skills.map(x => <button key={x} type="button" className="chip-btn on" onClick={() => setF({ ...f, skills: f.skills.filter(y => y !== x) })}>{x} <X size={13} /></button>)}</div>
        <div className="rc-row"><input className="inp" value={skill} onChange={e => setSkill(e.target.value)} placeholder={L("e.g. Illustrator, then Enter", "مثلًا Illustrator واضغط Enter")} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} /><button className="btn" type="button" onClick={addSkill}>{L("Add", "ضيف")}</button></div>
      </div>
      <label className="field"><span>{L("About the role (English)", "عن الوظيفة (إنجليزي)")}</span><textarea className="txt" dir="ltr" style={{ minHeight: 110 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="What the person will own, who they work with, and what success looks like." /></label>
      <label className="field"><span>{L("About the role (Arabic, optional)", "عن الوظيفة (عربي، اختياري)")}</span><textarea className="txt" dir="rtl" style={{ minHeight: 110 }} value={f.description_ar} onChange={e => setF({ ...f, description_ar: e.target.value })} placeholder="الشخص هيكون مسؤول عن إيه، هيشتغل مع مين، والنجاح شكله إيه." /></label>
      <div className="field"><span>{L("Requirements", "المطلوب")}</span>
        <div className="stack">{f.requirements.map((r, i) => <div key={i} className="rc-row"><input className="inp" value={r} onChange={e => setF({ ...f, requirements: f.requirements.map((x, k) => k === i ? e.target.value : x) })} placeholder={L("e.g. 3+ years in a similar role", "مثلًا: ٣ سنين خبرة في وظيفة مشابهة")} />{f.requirements.length > 1 && <button className="icon-btn" type="button" onClick={() => setF({ ...f, requirements: f.requirements.filter((_, k) => k !== i) })} aria-label={L("Remove", "احذف")}><Trash2 /></button>}</div>)}</div>
        <button className="btn btn--sm" type="button" style={{ justifySelf: "start" }} onClick={() => setF({ ...f, requirements: [...f.requirements, ""] })}><Plus />{L("Add requirement", "ضيف شرط")}</button>
      </div>
      <div className="rc-row rc-row--end"><Link className="btn" to="/company">{L("Cancel", "إلغاء")}</Link><button className="btn btn--primary" disabled={!ok} onClick={submit}><FilePlus2 />{L("Post job", "انشر الوظيفة")}</button></div>
    </div>
  </div>;
}
