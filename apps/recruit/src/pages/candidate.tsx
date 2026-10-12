// Candidate side, the way Wuzzuf and LinkedIn Jobs work: search with side filters and counts,
// match %, saved jobs, applicant stats, profile strength and career interests.
// The edge: Brand Vitals screens every application within 48 hours and tells you the result.
import { ArrowLeft, Bookmark, Briefcase, Building2, Check, Download, Eye, FileText, GraduationCap, Link2, MapPin, Pencil, Plus, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, actions, candidateOf, companyOf, jobOf, matchScore, skillMatch, statsOf, strength, useDB, type Candidate, type Field, type Job, type JobType, type Stage, type WorkMode } from "../store";
import { Avatar, EDU, Empty, FIELD, JobCard, LEVEL, Logo, MODE, Match, Modal, Pipeline, SaveBtn, StagePill, TYPE, useSalary, useT, useToast } from "../ui";

const POSTED: [string, number, string, string][] = [["1", 1, "Last 24 hours", "آخر ٢٤ ساعة"], ["7", 7, "Past week", "آخر أسبوع"], ["30", 30, "Past month", "آخر شهر"]];
const daysOld = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86400000;

export function Jobs() {
  const { L } = useI18n();
  const T = useT();
  const db = useDB();
  const [sp, setSp] = useSearchParams();
  const [panel, setPanel] = useState(false);
  const me = candidateOf(db, ME.candidate)!;
  const q = sp.get("q") || "";
  const where = sp.get("where") || "";
  const sort = sp.get("sort") || "relevance";
  const many = (k: string) => (sp.get(k) || "").split(",").filter(Boolean);
  const sel = { field: many("field"), type: many("type"), mode: many("mode"), level: many("level") };
  const posted = sp.get("posted") || "";
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const toggle = (k: keyof typeof sel, v: string) => { const cur = sel[k]; set(k, (cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]).join(",")); };
  const [qIn, setQIn] = useState(q);
  const [whereIn, setWhereIn] = useState(where);
  useEffect(() => { setQIn(q); setWhereIn(where); }, [q, where]);

  const text = (j: Job) => [j.title, j.title_ar, companyOf(db, j.company_id).name, companyOf(db, j.company_id).name_ar, ...j.skills].join(" ").toLowerCase();
  const base = db.jobs.filter(j => j.status === "open"
    && (!q || text(j).includes(q.toLowerCase()))
    && (!where || (j.city + " " + j.city_ar + " " + MODE[j.mode].join(" ")).toLowerCase().includes(where.toLowerCase()))
    && (!posted || daysOld(j.posted_at) <= +posted));
  // each facet counts what you'd get if you picked it, with the other facets applied (like Wuzzuf)
  const passes = (j: Job, skip?: keyof typeof sel) => (Object.keys(sel) as (keyof typeof sel)[]).every(k => k === skip || !sel[k].length || sel[k].includes(j[k] as string));
  const list = useMemo(() => {
    const l = base.filter(j => passes(j));
    return sort === "newest" ? [...l].sort((a, b) => b.posted_at.localeCompare(a.posted_at)) : sort === "salary" ? [...l].sort((a, b) => b.salary_max - a.salary_max) : [...l].sort((a, b) => matchScore(me, b) - matchScore(me, a));
  }, [base, sel.field.join(), sel.type.join(), sel.mode.join(), sel.level.join(), sort, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const recommended = db.jobs.filter(j => j.status === "open" && !db.applications.some(a => a.job_id === j.id && a.candidate_id === me.id)).sort((a, b) => matchScore(me, b) - matchScore(me, a)).slice(0, 3);
  const active = Object.values(sel).flat().length + (posted ? 1 : 0);

  const Facet = ({ k, title, opts }: { k: keyof typeof sel; title: string; opts: Record<string, [string, string]> }) => <fieldset className="rc-facet">
    <legend>{title}</legend>
    {Object.keys(opts).map(v => { const n = base.filter(j => passes(j, k) && j[k] === v).length; return <label key={v} className={n === 0 && !sel[k].includes(v) ? "off" : ""}>
      <input type="checkbox" checked={sel[k].includes(v)} onChange={() => toggle(k, v)} /><span>{L(...opts[v])}</span><span className="rc-facet__n">{n}</span>
    </label>; })}
  </fieldset>;

  return <div className="page">
    <form className="rc-hero-search" onSubmit={e => { e.preventDefault(); const n = new URLSearchParams(sp); qIn ? n.set("q", qIn) : n.delete("q"); whereIn ? n.set("where", whereIn) : n.delete("where"); setSp(n); }}>
      <label className="rc-search"><Search /><input className="inp inp--bare" value={qIn} onChange={e => setQIn(e.target.value)} placeholder={L("Job title, skill or company", "المسمى أو المهارة أو الشركة")} /></label>
      <label className="rc-search"><MapPin /><input className="inp inp--bare" value={whereIn} onChange={e => setWhereIn(e.target.value)} placeholder={L("City or 'remote'", "المدينة أو «عن بُعد»")} /></label>
      <button className="btn btn--primary btn--lg" type="submit">{L("Search", "دوّر")}</button>
    </form>

    {!q && !active && recommended.length > 0 && <section className="stack">
      <div className="rc-sec-h"><h2><Sparkles size={18} /> {L("Recommended for you", "مقترحة ليك")}</h2><span className="small faint">{L("Based on your skills and career interests", "على حسب مهاراتك واهتماماتك المهنية")}</span></div>
      <div className="rc-reco">{recommended.map(j => <Link key={j.id} to={"/jobs/" + j.id} className="card rc-reco__i">
        <span className="rc-reco__h"><Logo co={companyOf(db, j.company_id)} /><Match pct={matchScore(me, j)} /></span>
        <b>{T(j.title, j.title_ar)}</b><span className="small muted">{T(companyOf(db, j.company_id).name, companyOf(db, j.company_id).name_ar)} · {T(j.city, j.city_ar)}</span>
      </Link>)}</div>
    </section>}

    <div className="rc-search-layout">
      <aside className={"rc-filters-side card" + (panel ? " open" : "")} aria-label={L("Filters", "الفلاتر")}>
        <div className="rc-filters-side__h"><b>{L("Filters", "الفلاتر")}</b>{active > 0 && <button className="link small" onClick={() => setSp(new URLSearchParams(q ? { q } : {}), { replace: true })}>{L("Clear all", "امسح الكل")}</button>}<button className="icon-btn rc-only-m" onClick={() => setPanel(false)} aria-label={L("Close", "إغلاق")}><X /></button></div>
        <fieldset className="rc-facet"><legend>{L("Date posted", "تاريخ النشر")}</legend>
          <label><input type="radio" name="posted" checked={!posted} onChange={() => set("posted", "")} /><span>{L("Any time", "أي وقت")}</span></label>
          {POSTED.map(([v, , en, ar]) => <label key={v}><input type="radio" name="posted" checked={posted === v} onChange={() => set("posted", v)} /><span>{L(en, ar)}</span></label>)}
        </fieldset>
        <Facet k="mode" title={L("Workplace", "مكان الشغل")} opts={MODE} />
        <Facet k="type" title={L("Job type", "نوع الوظيفة")} opts={TYPE} />
        <Facet k="level" title={L("Career level", "المستوى الوظيفي")} opts={LEVEL} />
        <Facet k="field" title={L("Field", "المجال")} opts={FIELD} />
      </aside>
      <section className="stack">
        <div className="rc-results-h">
          <p><b>{L(`${list.length} jobs`, `${list.length} وظيفة`)}</b>{q && <span className="muted"> {L(`for “${q}”`, `لـ «${q}»`)}</span>}</p>
          <div className="rc-row">
            <button className="btn btn--sm rc-only-m" onClick={() => setPanel(true)}><SlidersHorizontal />{L("Filters", "الفلاتر")}{active ? ` (${active})` : ""}</button>
            <label className="rc-sort small"><span className="faint">{L("Sort by", "رتّب حسب")}</span><select className="sel" value={sort} onChange={e => set("sort", e.target.value === "relevance" ? "" : e.target.value)}>
              <option value="relevance">{L("Best match", "الأنسب ليك")}</option><option value="newest">{L("Newest", "الأحدث")}</option><option value="salary">{L("Highest salary", "أعلى مرتب")}</option></select></label>
          </div>
        </div>
        {active > 0 && <div className="chips">{(Object.keys(sel) as (keyof typeof sel)[]).flatMap(k => sel[k].map(v => <button key={k + v} className="chip-btn on" onClick={() => toggle(k, v)}>{L(...({ field: FIELD, type: TYPE, mode: MODE, level: LEVEL }[k] as Record<string, [string, string]>)[v])} <X size={13} /></button>))}
          {posted && <button className="chip-btn on" onClick={() => set("posted", "")}>{L(...(POSTED.find(p => p[0] === posted)!.slice(2) as [string, string]))} <X size={13} /></button>}</div>}
        <div className="card list">{list.length ? list.map(j => <JobCard key={j.id} j={j} />) : <Empty icon={<Search />} title={L("No jobs match", "مفيش وظايف مطابقة")} text={L("Try fewer filters or another keyword.", "جرّب فلاتر أقل أو كلمة تانية.")} />}</div>
      </section>
    </div>
  </div>;
}

export function JobDetail() {
  const { L, lang } = useI18n();
  const T = useT();
  const { id = "" } = useParams();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const salary = useSalary();
  const [open, setOpen] = useState(false);
  const [cover, setCover] = useState("");
  const j = jobOf(db, id);
  useEffect(() => { if (j) actions.seeJob(j.id); }, [j?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!j) return <div className="page"><Empty icon={<Briefcase />} title={L("Job not found", "الوظيفة مش موجودة")} action={<Link className="btn" to="/jobs">{L("All jobs", "كل الوظايف")}</Link>} /></div>;
  const co = companyOf(db, j.company_id);
  const me = candidateOf(db, ME.candidate)!;
  const mine = db.applications.find(a => a.job_id === j.id && a.candidate_id === ME.candidate);
  const st = statsOf(db, j.id);
  const sm = skillMatch(me, j);
  const pct = matchScore(me, j);
  const similar = db.jobs.filter(x => x.id !== j.id && x.status === "open" && (x.field === j.field || x.company_id === j.company_id)).slice(0, 4);
  const reqs = lang === "ar" && j.requirements_ar.length ? j.requirements_ar : j.requirements;
  const submit = () => { actions.apply(j.id, cover.trim()); setOpen(false); setCover(""); toast(L("Application sent. Brand Vitals will screen it within 48 hours.", "الطلب اتبعت. Brand Vitals هتفرزه خلال ٤٨ ساعة.")); nav("/applications"); };
  const share = () => { try { navigator.clipboard.writeText(location.href); toast(L("Link copied", "اللينك اتنسخ")); } catch { toast(location.href); } };
  return <div className="page">
    <Link to="/jobs" className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{L("All jobs", "كل الوظايف")}</Link>
    <div className="split rc-split--wide">
      <div className="stack">
        <div className="card card--pad rc-jd">
          <div className="rc-jd__head"><Logo co={co} size="lg" /><div className="rc-jd__id"><h1>{T(j.title, j.title_ar)}</h1>
            <p className="muted"><Link className="link" to={"/companies/" + co.id}>{T(co.name, co.name_ar)}</Link> · <MapPin size={13} /> {T(j.city, j.city_ar)} · {L("Posted", "اتنشرت")} {ago(j.posted_at, lang)}</p>
            <div className="chips"><span className="tag">{L(...TYPE[j.type])}</span><span className="tag">{L(...MODE[j.mode])}</span>{j.status === "closed" && <span className="pill pill--bad">{L("No longer accepting applications", "مش بتستقبل طلبات")}</span>}</div>
          </div></div>
          <div className="rc-jd__actions">
            {mine ? <Link className="btn btn--lg" to="/applications"><Check />{L("Applied · view status", "اتقدّمت · شوف الحالة")}</Link>
              : <button className="btn btn--primary btn--lg" disabled={j.status === "closed"} onClick={() => setOpen(true)}><Send />{L("Apply now", "قدّم دلوقتي")}</button>}
            <SaveBtn id={j.id} label />
            <button className="btn btn--lg" onClick={share}><Link2 />{L("Share", "شارك")}</button>
          </div>
          <dl className="rc-stats">
            <div><dt>{st.applied}</dt><dd>{L("Applicants", "متقدم")}</dd></div>
            <div><dt>{j.views}</dt><dd>{L("Views", "مشاهدة")}</dd></div>
            <div><dt>{st.screened}</dt><dd>{L("Screened by Brand Vitals", "اتفرزوا من Brand Vitals")}</dd></div>
            <div><dt>{st.considered}</dt><dd>{L("In consideration", "قيد الدراسة")}</dd></div>
          </dl>
        </div>
        <div className="card card--pad rc-jd">
          <h2>{L("Job details", "تفاصيل الوظيفة")}</h2>
          <dl className="rc-kv">
            <div><dt>{L("Experience needed", "الخبرة المطلوبة")}</dt><dd>{L(`${j.exp_min} to ${j.exp_max} years`, `من ${j.exp_min} لـ ${j.exp_max} سنين`)}</dd></div>
            <div><dt>{L("Career level", "المستوى الوظيفي")}</dt><dd>{L(...LEVEL[j.level])}</dd></div>
            <div><dt>{L("Education", "التعليم")}</dt><dd>{L(...EDU[j.education])}</dd></div>
            <div><dt>{L("Salary", "المرتب")}</dt><dd>{salary(j.salary_min, j.salary_max, j.currency)}</dd></div>
            <div><dt>{L("Field", "المجال")}</dt><dd>{L(...FIELD[j.field])}</dd></div>
            <div><dt>{L("Openings", "عدد الأماكن")}</dt><dd>{j.openings}</dd></div>
          </dl>
          <h3>{L("Skills and tools", "المهارات والأدوات")}</h3>
          <div className="chips">{j.skills.map(s => <span key={s} className={"tag" + (sm.have.includes(s) ? " rc-tag--have" : "")}>{sm.have.includes(s) && <Check size={12} />} {s}</span>)}</div>
          <h2>{L("Job description", "وصف الوظيفة")}</h2>
          <p>{T(j.description, j.description_ar)}</p>
          <h2>{L("Job requirements", "متطلبات الوظيفة")}</h2>
          <ul className="rc-req">{reqs.map((r, i) => <li key={i}><Check size={15} />{r}</li>)}</ul>
        </div>
      </div>
      <div className="stack rc-sticky">
        <div className="card card--pad stack">
          {mine ? <>
            <h3>{L("Your application", "طلبك")}</h3>
            <StagePill s={mine.stage} />
            <Pipeline s={mine.stage} />
          </> : <>
            <div className="rc-row" style={{ justifyContent: "space-between" }}><h3>{L("How you match", "توافقك مع الوظيفة")}</h3><Match pct={pct} /></div>
            <p className="small"><b>{L(`${sm.have.length} of ${j.skills.length} skills`, `${sm.have.length} من ${j.skills.length} مهارات`)}</b> {L("on your profile", "في بروفايلك")}</p>
            {sm.missing.length > 0 && <p className="small muted">{L("Missing: ", "ناقص: ")}{sm.missing.join(L(", ", "، "))}</p>}
            <p className="small muted">{me.years >= j.exp_min ? L(`Your ${me.years} years fit the ${j.exp_min}–${j.exp_max} asked.`, `خبرتك ${me.years} سنين مناسبة للمطلوب (${j.exp_min}–${j.exp_max}).`) : L(`They ask for ${j.exp_min}+ years; you have ${me.years}.`, `مطلوب ${j.exp_min} سنين أو أكتر، وإنت عندك ${me.years}.`)}</p>
          </>}
          <div className="rc-edge rc-edge--inline"><ShieldCheck /><span>{L("Brand Vitals screens every application within 48 hours. Matched profiles go to the company; if not, you hear why.", "Brand Vitals بتفرز كل طلب خلال ٤٨ ساعة. البروفايلات المناسبة بتروح للشركة، ولو لأ بتعرف السبب.")}</span></div>
        </div>
        <div className="card card--pad stack">
          <h3><Building2 size={16} /> {L("About the company", "عن الشركة")}</h3>
          <div className="rc-mini"><Logo co={co} /><div><b>{T(co.name, co.name_ar)}</b><div className="small muted">{T(co.industry, co.industry_ar)} · {co.size} {L("employees", "موظف")}</div></div></div>
          <p className="small">{T(co.about, co.about_ar)}</p>
          <Link className="link small" to={"/companies/" + co.id}>{L(`See all jobs at ${co.name}`, `كل وظايف ${co.name_ar}`)}</Link>
        </div>
        {similar.length > 0 && <div className="card">
          <div className="card__h"><h3>{L("Similar jobs", "وظايف مشابهة")}</h3></div>
          <div className="list">{similar.map(x => <JobCard key={x.id} j={x} compact />)}</div>
        </div>}
      </div>
    </div>
    {open && <Modal title={L(`Apply: ${j.title}`, `التقديم: ${j.title_ar}`)} onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" onClick={submit} disabled={!me.cv}><Send />{L("Send application", "ابعت الطلب")}</button></>}>
      <div className="stack">
        <div className="rc-mini"><Avatar name={me.name} size="lg" /><div><b>{T(me.name, me.name_ar)}</b><div className="small muted">{T(me.headline, me.headline_ar)} · {T(me.city, me.city_ar)} · {L(`${me.years} years`, `${me.years} سنين خبرة`)}</div></div></div>
        {me.cv ? <div className="rc-file"><FileText size={16} /><span>{me.cv.name}</span><Link className="small link" to="/profile">{L("Change", "غيّر")}</Link></div>
          : <div className="rc-note"><b>{L("Upload your CV first", "ارفع الـ CV الأول")}</b><Link className="link small" to="/profile">{L("Go to my profile", "روح لبروفايلي")}</Link></div>}
        <label className="field"><span>{L("Short note to the hiring team (optional)", "كلمة قصيرة لفريق التوظيف (اختياري)")}</span><textarea className="txt" style={{ minHeight: 96 }} maxLength={400} value={cover} onChange={e => setCover(e.target.value)} placeholder={L("Why this role, in two or three lines.", "ليه الوظيفة دي، في سطرين أو تلاتة.")} /><small>{cover.length}/400</small></label>
        <p className="small faint">{date(new Date().toISOString(), lang)} · {L("Screened by Brand Vitals within 48 hours", "الفرز من Brand Vitals خلال ٤٨ ساعة")}</p>
      </div>
    </Modal>}
  </div>;
}

const TABS: [string, Stage[], string, string][] = [
  ["all", [], "All", "الكل"], ["screening", ["screening"], "In screening", "قيد الفرز"], ["company", ["shortlisted"], "With the company", "عند الشركة"],
  ["interview", ["interview", "offer", "hired"], "Interviews & offers", "مقابلات وعروض"], ["closed", ["not_matched", "not_selected"], "Not selected", "لم يتم الاختيار"]
];

export function Applications() {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const all = db.applications.filter(a => a.candidate_id === ME.candidate);
  const stagesOf = (k: string) => TABS.find(t => t[0] === k)![1];
  const mine = tab === "all" ? all : all.filter(a => stagesOf(tab).includes(a.stage));
  return <div className="page rc-narrow">
    <div className="page-head"><div className="page-head__t"><h1>{L("My applications", "طلباتي")}</h1><p className="muted">{L("Every application gets an answer. No silence.", "كل طلب بياخد رد. مفيش تجاهل.")}</p></div><Link className="btn btn--primary" to="/jobs"><Search />{L("Find jobs", "دوّر على وظيفة")}</Link></div>
    <div className="tabs">{TABS.map(([k, st, en, ar]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{L(en, ar)}<span className="count">{k === "all" ? all.length : all.filter(a => st.includes(a.stage)).length}</span></button>)}</div>
    {mine.length === 0 ? <div className="card"><Empty icon={<Briefcase />} title={tab === "all" ? L("No applications yet", "مفيش طلبات لسه") : L("Nothing here", "مفيش حاجة هنا")} action={tab === "all" ? <Link className="btn btn--primary btn--sm" to="/jobs">{L("Browse jobs", "شوف الوظايف")}</Link> : undefined} /></div>
      : <div className="stack">{mine.map(a => {
        const j = jobOf(db, a.job_id)!;
        const co = companyOf(db, j.company_id);
        return <div key={a.id} className="card card--pad rc-app">
          <div className="rc-app__head">
            <Logo co={co} />
            <div className="rc-app__t"><Link to={"/jobs/" + j.id}><b>{T(j.title, j.title_ar)}</b></Link><span className="small muted">{T(co.name, co.name_ar)} · {L("Applied", "اتقدّمت")} {ago(a.applied_at, lang)}{a.viewed ? " · " : ""}{a.viewed && <span className="rc-viewed"><Eye size={12} /> {L("Viewed by the company", "الشركة شافت طلبك")}</span>}</span></div>
            <StagePill s={a.stage} />
          </div>
          <Pipeline s={a.stage} />
          {a.stage === "not_matched" && <div className="rc-note"><b>{L("Feedback from Brand Vitals", "رأي Brand Vitals")}</b><span>{T(a.screen_note, a.screen_note_ar)}</span></div>}
          {a.stage === "screening" && <div className="rc-note rc-note--soft"><span>{L("In screening. You will hear back within 48 hours of applying.", "قيد الفرز. هيوصلك رد خلال ٤٨ ساعة من التقديم.")}</span><button className="btn btn--ghost btn--sm" onClick={() => { actions.withdraw(a.id); toast(L("Application withdrawn", "الطلب اتسحب")); }}>{L("Withdraw", "اسحب الطلب")}</button></div>}
          {a.history.length > 0 && <ol className="rc-hist">{[...a.history].reverse().map((h, i) => <li key={i}><StagePill s={h.stage} /><span className="small">{T(h.note, h.note_ar)}</span><span className="small faint">{ago(h.at, lang)}</span></li>)}</ol>}
        </div>;
      })}</div>}
  </div>;
}

export function Saved() {
  const { L } = useI18n();
  const db = useDB();
  const jobs = db.saved.map(id => jobOf(db, id)).filter(Boolean) as Job[];
  return <div className="page rc-narrow">
    <div className="page-head"><div className="page-head__t"><h1>{L("Saved jobs", "الوظايف المحفوظة")}</h1><p className="muted">{L("Jobs you bookmarked to apply later.", "وظايف حفظتها عشان تقدّم عليها بعدين.")}</p></div></div>
    <div className="card list">{jobs.length ? jobs.map(j => <JobCard key={j.id} j={j} />) : <Empty icon={<Bookmark />} title={L("No saved jobs", "مفيش وظايف محفوظة")} text={L("Tap the bookmark on any job to keep it here.", "دوس على علامة الحفظ في أي وظيفة عشان تفضل هنا.")} action={<Link className="btn btn--primary btn--sm" to="/jobs">{L("Browse jobs", "شوف الوظايف")}</Link>} />}</div>
  </div>;
}

export function CompanyPage() {
  const { L } = useI18n();
  const T = useT();
  const { id = "" } = useParams();
  const db = useDB();
  const co = db.companies.find(c => c.id === id);
  if (!co) return <div className="page"><Empty icon={<Building2 />} title={L("Company not found", "الشركة مش موجودة")} /></div>;
  const jobs = db.jobs.filter(j => j.company_id === co.id && j.status === "open");
  return <div className="page rc-narrow">
    <div className="card rc-prof">
      <div className="rc-prof__band" style={{ background: `linear-gradient(120deg, ${co.color}, #0A1326)` }} />
      <div className="rc-prof__head"><span className="rc-co rc-co--xl" style={{ background: co.color }}>{co.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
        <div className="rc-prof__id"><h1>{T(co.name, co.name_ar)}</h1><p className="muted">{T(co.industry, co.industry_ar)}</p><p className="small faint"><MapPin size={13} /> {T(co.city, co.city_ar)} · {co.size} {L("employees", "موظف")} · {L(`Founded ${co.founded}`, `تأسست ${co.founded}`)}</p></div>
      </div>
    </div>
    <section className="card card--pad stack"><h2>{L("About", "نبذة")}</h2><p>{T(co.about, co.about_ar)}</p></section>
    <div className="rc-sec-h"><h2>{L(`Open jobs (${jobs.length})`, `وظايف متاحة (${jobs.length})`)}</h2></div>
    <div className="card list">{jobs.length ? jobs.map(j => <JobCard key={j.id} j={j} />) : <Empty icon={<Briefcase />} title={L("No open jobs right now", "مفيش وظايف متاحة دلوقتي")} />}</div>
  </div>;
}

const ALL_FIELDS = Object.keys(FIELD) as Field[];

export function Profile() {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const toast = useToast();
  const me = candidateOf(db, ME.candidate)!;
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState<Candidate>(me);
  const [skill, setSkill] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const s = strength(me);
  const ar = lang === "ar";
  // Typed text is stored for both languages, so the profile reads the same way in either.
  const both = (k: "headline" | "about", v: string) => setF({ ...f, [k]: v, [k + "_ar"]: v });
  const startEdit = () => { setF(me); setEdit(true); };
  const saveAll = () => { actions.updateProfile({ ...f, skills: f.skills.filter(Boolean) }); setEdit(false); toast(L("Profile saved", "البروفايل اتحفظ")); };
  const setExp = (i: number, k: "title" | "company" | "from" | "to" | "summary", v: string) => setF({ ...f, experience: f.experience.map((x, j) => j === i ? { ...x, [k]: v, ...(k === "title" || k === "company" || k === "summary" ? { [k + "_ar"]: v } : {}) } : x) });
  const setEdu = (i: number, k: "school" | "degree" | "year", v: string) => setF({ ...f, education: f.education.map((x, j) => j === i ? { ...x, [k]: v, ...(k !== "year" ? { [k + "_ar"]: v } : {}) } : x) });
  const addSkill = () => { const v = skill.trim(); if (v && !f.skills.some(x => x.toLowerCase() === v.toLowerCase())) setF({ ...f, skills: [...f.skills, v] }); setSkill(""); };
  const pick = <K extends "fields" | "types" | "modes">(k: K, v: Candidate["interests"][K][number]) => {
    const cur = f.interests[k] as string[];
    setF({ ...f, interests: { ...f.interests, [k]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] } });
  };
  const upload = (fl: File | undefined) => {
    if (!fl) return;
    if (fl.size > 2 * 1024 * 1024) { toast(L("CV must be 2 MB or smaller", "الـ CV لازم يكون ٢ ميجا أو أقل"), true); return; }
    const r = new FileReader();
    r.onload = () => { const cv = { name: fl.name, size: fl.size, data: String(r.result) }; actions.updateProfile({ ...me, cv }); setF(x => ({ ...x, cv })); toast(L("CV uploaded", "الـ CV اترفع")); };
    r.readAsDataURL(fl);
  };
  const cvBlock = (c: Candidate) => <div className="rc-file"><FileText size={16} />{c.cv ? <><span>{c.cv.name} · {Math.round(c.cv.size / 1024)} KB</span>{c.cv.data && <a className="icon-btn" href={c.cv.data} download={c.cv.name} aria-label={L("Download CV", "نزّل الـ CV")}><Download /></a>}</> : <span className="faint">{L("No CV yet", "مفيش CV لسه")}</span>}
    <button className="btn btn--sm" onClick={() => file.current?.click()}><Upload />{c.cv ? L("Replace", "استبدل") : L("Upload", "ارفع")}</button>
    <input ref={file} type="file" accept=".pdf,.doc,.docx" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} /></div>;

  if (edit) return <div className="page rc-narrow">
    <div className="page-head"><div className="page-head__t"><h1>{L("Edit profile", "تعديل البروفايل")}</h1><p className="muted">{L("Companies see exactly this, after Brand Vitals screening.", "الشركات بتشوف ده بالظبط، بعد فرز Brand Vitals.")}</p></div></div>
    <div className="card card--pad stack">
      <h3>{L("General info", "معلومات عامة")}</h3>
      <div className="grid2"><label className="field"><span>{L("Full name", "الاسم بالكامل")}</span><input className="inp" value={ar ? f.name_ar || f.name : f.name} onChange={e => setF(ar ? { ...f, name_ar: e.target.value } : { ...f, name: e.target.value })} /></label>
        <label className="field"><span>{L("Headline", "المسمى")}</span><input className="inp" value={T(f.headline, f.headline_ar)} onChange={e => both("headline", e.target.value)} /></label></div>
      <div className="grid2"><label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={T(f.city, f.city_ar)} onChange={e => setF({ ...f, city: e.target.value, city_ar: e.target.value })} /></label>
        <label className="field"><span>{L("Years of experience", "سنين الخبرة")}</span><input className="inp" type="number" min={0} max={40} value={f.years} onChange={e => setF({ ...f, years: Math.max(0, +e.target.value) })} /></label></div>
      <label className="field"><span>{L("About", "نبذة")}</span><textarea className="txt" style={{ minHeight: 100 }} value={T(f.about, f.about_ar)} onChange={e => both("about", e.target.value)} /></label>
      <label className="field"><span>{L("Portfolio or LinkedIn link", "لينك البورتفوليو أو LinkedIn")}</span><input className="inp" dir="ltr" value={f.link} onChange={e => setF({ ...f, link: e.target.value })} placeholder="https://" /></label>

      <h3>{L("Career interests", "اهتماماتك المهنية")}</h3>
      <div className="field"><span>{L("Fields you want to work in", "المجالات اللي عايز تشتغل فيها")}</span><div className="chips">{ALL_FIELDS.map(x => <button key={x} type="button" className={"chip-btn" + (f.interests.fields.includes(x) ? " on" : "")} onClick={() => pick("fields", x)}>{L(...FIELD[x])}</button>)}</div></div>
      <div className="grid2">
        <div className="field"><span>{L("Job types", "نوع الوظيفة")}</span><div className="chips">{(Object.keys(TYPE) as JobType[]).map(x => <button key={x} type="button" className={"chip-btn" + (f.interests.types.includes(x) ? " on" : "")} onClick={() => pick("types", x)}>{L(...TYPE[x])}</button>)}</div></div>
        <div className="field"><span>{L("Workplace", "مكان الشغل")}</span><div className="chips">{(Object.keys(MODE) as WorkMode[]).map(x => <button key={x} type="button" className={"chip-btn" + (f.interests.modes.includes(x) ? " on" : "")} onClick={() => pick("modes", x)}>{L(...MODE[x])}</button>)}</div></div>
      </div>
      <div className="grid2"><label className="field"><span>{L("Minimum monthly salary", "أقل مرتب شهري")}</span><input className="inp" type="number" min={0} step={1000} value={f.interests.salary} onChange={e => setF({ ...f, interests: { ...f.interests, salary: +e.target.value } })} /></label>
        <label className="field"><span>{L("Currency", "العملة")}</span><select className="sel" value={f.interests.currency} onChange={e => setF({ ...f, interests: { ...f.interests, currency: e.target.value } })}>{["EGP", "SAR", "AED", "USD"].map(x => <option key={x}>{x}</option>)}</select></label></div>

      <h3>{L("Experience", "الخبرات")}</h3>
      {f.experience.map((x, i) => <div key={i} className="rc-edit-block">
        <div className="grid2"><label className="field"><span>{L("Title", "المسمى")}</span><input className="inp" value={T(x.title, x.title_ar)} onChange={e => setExp(i, "title", e.target.value)} /></label>
          <label className="field"><span>{L("Company", "الشركة")}</span><input className="inp" value={T(x.company, x.company_ar)} onChange={e => setExp(i, "company", e.target.value)} /></label></div>
        <div className="grid2"><label className="field"><span>{L("From", "من")}</span><input className="inp" value={x.from} onChange={e => setExp(i, "from", e.target.value)} placeholder="2022" /></label>
          <label className="field"><span>{L("To", "لحد")}</span><input className="inp" value={x.to} onChange={e => setExp(i, "to", e.target.value)} placeholder={L("Present", "حاليًا")} /></label></div>
        <label className="field"><span>{L("What you did", "عملت إيه")}</span><textarea className="txt" style={{ minHeight: 70 }} value={T(x.summary, x.summary_ar)} onChange={e => setExp(i, "summary", e.target.value)} /></label>
        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => setF({ ...f, experience: f.experience.filter((_, j) => j !== i) })}><Trash2 />{L("Remove", "احذف")}</button>
      </div>)}
      <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => setF({ ...f, experience: [...f.experience, { title: "", company: "", from: "", to: "", summary: "" }] })}><Plus />{L("Add experience", "ضيف خبرة")}</button>

      <h3>{L("Education", "التعليم")}</h3>
      {f.education.map((x, i) => <div key={i} className="rc-edit-block">
        <div className="grid3"><label className="field"><span>{L("School", "الجامعة")}</span><input className="inp" value={T(x.school, x.school_ar)} onChange={e => setEdu(i, "school", e.target.value)} /></label>
          <label className="field"><span>{L("Degree", "الشهادة")}</span><input className="inp" value={T(x.degree, x.degree_ar)} onChange={e => setEdu(i, "degree", e.target.value)} /></label>
          <label className="field"><span>{L("Year", "السنة")}</span><input className="inp" value={x.year} onChange={e => setEdu(i, "year", e.target.value)} /></label></div>
        <button className="btn btn--ghost btn--sm btn--danger" onClick={() => setF({ ...f, education: f.education.filter((_, j) => j !== i) })}><Trash2 />{L("Remove", "احذف")}</button>
      </div>)}
      <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => setF({ ...f, education: [...f.education, { school: "", degree: "", year: "" }] })}><Plus />{L("Add education", "ضيف تعليم")}</button>

      <h3>{L("Skills", "المهارات")}</h3>
      <div className="chips">{f.skills.map(x => <button key={x} type="button" className="chip-btn on" onClick={() => setF({ ...f, skills: f.skills.filter(y => y !== x) })}>{x} <X size={13} /></button>)}</div>
      <div className="rc-row"><input className="inp" value={skill} onChange={e => setSkill(e.target.value)} placeholder={L("Add a skill, then Enter", "ضيف مهارة واضغط Enter")} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} /><button className="btn" onClick={addSkill}>{L("Add", "ضيف")}</button></div>
      <h3>{L("CV", "الـ CV")}</h3>
      {cvBlock(f)}
      <div className="rc-row rc-row--end"><button className="btn" onClick={() => setEdit(false)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" onClick={saveAll}><Check />{L("Save profile", "احفظ البروفايل")}</button></div>
    </div>
  </div>;

  return <div className="page rc-narrow">
    <div className="card card--pad rc-strength">
      <div className="rc-strength__h"><b>{L("Profile strength", "قوة البروفايل")}</b><span>{s.pct}%</span></div>
      <div className="rc-bar"><i style={{ width: s.pct + "%" }} /></div>
      {s.missing.length > 0 ? <p className="small muted">{L("Add to stand out: ", "ضيف عشان تتميّز: ")}{s.missing.map(m => L(m[1], m[2])).join(L(", ", "، "))}</p> : <p className="small muted">{L("All set. Companies see a complete profile.", "كله تمام. الشركات بتشوف بروفايل كامل.")}</p>}
    </div>
    <CandidateCard c={me} actions={<button className="btn" onClick={startEdit}><Pencil />{L("Edit profile", "عدّل البروفايل")}</button>} extra={<>
      <section className="card card--pad stack"><h3>{L("Career interests", "اهتماماتك المهنية")}</h3>
        <div className="chips">{me.interests.fields.map(x => <span key={x} className="tag">{L(...FIELD[x])}</span>)}{me.interests.types.map(x => <span key={x} className="tag">{L(...TYPE[x])}</span>)}{me.interests.modes.map(x => <span key={x} className="tag">{L(...MODE[x])}</span>)}</div>
        <p className="small muted">{L("Minimum salary", "أقل مرتب")}: {me.interests.salary.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} {me.interests.currency}</p>
      </section>
      <section className="card card--pad stack"><h3>{L("CV", "الـ CV")}</h3>{cvBlock(me)}</section>
    </>} />
  </div>;
}

/** The formal profile, the same for the candidate, the company and the screener. */
export function CandidateCard({ c, actions: act, contact = true, extra }: { c: Candidate; actions?: ReactNode; contact?: boolean; extra?: ReactNode }) {
  const { L } = useI18n();
  const T = useT();
  return <div className="stack">
    <div className="card rc-prof">
      <div className="rc-prof__band" />
      <div className="rc-prof__head">
        <Avatar name={c.name} size="xl" />
        <div className="rc-prof__id"><h1>{T(c.name, c.name_ar)}</h1><p className="muted">{T(c.headline, c.headline_ar)}</p><p className="small faint"><MapPin size={13} /> {T(c.city, c.city_ar)} · {L(`${c.years} years of experience`, `${c.years} سنين خبرة`)}</p></div>
        {act}
      </div>
    </div>
    <div className="split">
      <div className="stack">
        <section className="card card--pad stack"><h2>{L("About", "نبذة")}</h2><p>{T(c.about, c.about_ar)}</p></section>
        <section className="card card--pad stack"><h2>{L("Experience", "الخبرات")}</h2>
          {c.experience.length ? <ol className="rc-tl">{c.experience.map((x, i) => <li key={i}><span className="rc-tl__ico"><Briefcase size={15} /></span><div><b>{T(x.title, x.title_ar)}</b><div className="small muted">{T(x.company, x.company_ar)} · {x.from} – {x.to === "Present" ? L("Present", "حاليًا") : x.to}</div>{x.summary && <p className="small">{T(x.summary, x.summary_ar)}</p>}</div></li>)}</ol> : <p className="small faint">—</p>}</section>
        <section className="card card--pad stack"><h2>{L("Education", "التعليم")}</h2>
          {c.education.length ? <ol className="rc-tl">{c.education.map((x, i) => <li key={i}><span className="rc-tl__ico"><GraduationCap size={15} /></span><div><b>{T(x.school, x.school_ar)}</b><div className="small muted">{T(x.degree, x.degree_ar)} · {x.year}</div></div></li>)}</ol> : <p className="small faint">—</p>}</section>
      </div>
      <div className="stack">
        <section className="card card--pad stack"><h3>{L("Skills", "المهارات")}</h3><div className="chips">{c.skills.map(s => <span key={s} className="tag">{s}</span>)}</div></section>
        <section className="card card--pad stack"><h3>{L("Languages", "اللغات")}</h3><p className="small">{c.languages.map(x => x === "Arabic" ? L("Arabic", "العربية") : x === "English" ? L("English", "الإنجليزية") : x).join(" · ")}</p></section>
        {extra}
        {!extra && <section className="card card--pad stack"><h3>{L("CV", "الـ CV")}</h3><div className="rc-file"><FileText size={16} /><span>{c.cv ? c.cv.name : L("No CV", "مفيش CV")}</span>{c.cv?.data && <a className="link small" href={c.cv.data} download={c.cv.name}>{L("Download", "تنزيل")}</a>}</div>{c.link && <a className="small link" href={c.link} target="_blank" rel="noopener" dir="ltr">{c.link}</a>}</section>}
        {contact && !extra && <section className="card card--pad stack"><h3>{L("Contact", "التواصل")}</h3><p className="small" dir="ltr"><Users size={13} /> {c.email}<br />{c.phone}</p></section>}
      </div>
    </div>
  </div>;
}


