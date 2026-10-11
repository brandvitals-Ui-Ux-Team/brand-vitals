// Freelancer side, the familiar way: Find work → open a job → Submit a proposal (Upwork-style),
// with the Vitals edge: every proposal is reviewed before the client sees it, every delivery is QA'd.
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Clock, Lock, Search, Send, ShieldCheck, Upload, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { RuleMeters, Switches, Timeline } from "../components/guarantee";
import { Art, CAT, Empty, LevelBadge, Modal, ProposalPill, QAPill, ScoreBars, VettedMark, useMoney, useToast } from "../components/ui";
import { ME, actions, avg, meTalentId, talentOf, useDB } from "../lib/store";
import type { Brief, Category, DB, JobSize } from "../lib/types";
import { TalentProfile } from "./client";

const meOf = (db: DB) => talentOf(db, meTalentId()) || talentOf(db, ME.talent.id)!;
const myJobs = (db: DB) => db.briefs.filter(b => b.talent_id === meOf(db).id);
const SIZE: Record<JobSize, [string, string]> = { small: ["Small", "صغيرة"], medium: ["Medium", "متوسطة"], large: ["Large", "كبيرة"] };

// ---------- dashboard ----------
export function TalentHome() {
  const { L } = useI18n();
  const db = useDB();
  const money = useMoney();
  const me = meOf(db);
  const jobs = myJobs(db);
  const priceOf = (b: Brief) => db.proposals.find(p => p.id === b.hired_proposal_id)?.price || 0;
  const escrow = jobs.filter(b => b.status === "in_progress").reduce((s, b) => s + priceOf(b), 0);
  const paid = jobs.filter(b => b.status === "delivered").reduce((s, b) => s + priceOf(b), 0);
  const props = db.proposals.filter(p => p.talent_id === me.id);
  const open = db.briefs.filter(b => b.status === "sourcing" && !props.some(p => p.brief_id === b.id));
  const best = [...open].sort((a, b) => Number(b.category === me.category) - Number(a.category === me.category)).slice(0, 4);
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L(`Hi ${me.name.split(" ")[0]}`, `أهلًا ${me.name.split(" ")[0]}`)}</h1><p className="muted">{L(me.title, me.title_ar)}</p></div>
      <Link className="btn btn--primary" to="/talent/jobs"><Search />{L("Find work", "دوّر على شغل")}</Link></div>
    <div className="grid4">
      <div className="card kpi"><span className="kpi__l">{L("In escrow for you", "محجوز ليك")}</span><span className="kpi__v">{money(escrow)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Earned", "أرباحك")}</span><span className="kpi__v">{money(paid)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Proposals in review", "عروض بتتراجع")}</span><span className="kpi__v">{props.filter(p => p.status === "screening").length}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Active contracts", "عقود شغالة")}</span><span className="kpi__v">{jobs.filter(b => b.status === "in_progress").length}</span></div>
    </div>
    <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("Jobs for you", "شغل مناسب ليك")}</h2><Link to="/talent/jobs" className="small link">{L("See all", "شوف الكل")}</Link></div>
        <div className="list">{best.length === 0 ? <p className="small faint" style={{ padding: 16 }}>{L("No open jobs right now.", "مفيش شغل مفتوح دلوقتي.")}</p> : best.map(b => <Link key={b.id} to={"/talent/jobs/" + b.id} className="li li--link"><span className="li__main"><span className="li__t">{b.title}</span><span className="li__s">{money(b.budget)} · {L(...CAT[b.category])} · {b.duration || ""}</span></span>{b.category === me.category && <span className="pill pill--ok pill--plain">{L("Your skill", "مجالك")}</span>}<ArrowRight size={16} className="flip-rtl faint" /></Link>)}</div>
      </div>
      <div className="card card--pad stack">
        <div className="row row--between"><h3>{L("Your standing", "مستواك")}</h3><LevelBadge level={me.level} /></div>
        <VettedMark t={me} />
        <ScoreBars s={me.scores} />
        <p className="small muted">{L(`Average ${avg(me.scores).toFixed(1)} / 5, updated after every QA-reviewed delivery.`, `المتوسط ${avg(me.scores).toFixed(1)} من ٥، وبيتحدث بعد كل تسليم بيتراجع.`)}</p>
      </div>
    </div>
  </div>;
}

// ---------- find work ----------
export function FindWork() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const me = meOf(db);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all" | "mine">("mine");
  const [size, setSize] = useState<JobSize | "all">("all");
  const props = db.proposals.filter(p => p.talent_id === me.id);
  const term = q.trim().toLowerCase();
  const list = db.briefs.filter(b => b.status === "sourcing"
    && (cat === "all" || (cat === "mine" ? b.category === me.category : b.category === cat))
    && (size === "all" || b.size === size)
    && (!term || [b.title, b.description, ...(b.skills || [])].some(x => x.toLowerCase().includes(term))));
  const all = db.briefs.filter(b => b.status === "sourcing").length;
  return <div className="page">
    <div className="page-head__t"><h1>{L("Find work", "دوّر على شغل")}</h1><p className="muted">{L("Every job here was checked by Vitals: real budget, clear scope, verified client.", "كل شغلانة هنا Vitals راجعتها: ميزانية حقيقية، مطلوب واضح، وعميل موثّق.")}</p></div>
    <div className="searchbar"><Search /><input value={q} onChange={e => setQ(e.target.value)} placeholder={L("Search jobs: reels, UGC, packaging…", "دوّر: ريلز، UGC، تغليف…")} /></div>
    <div className="findwork">
      <aside className="card card--pad stack filters">
        <b className="small">{L("Category", "المجال")}</b>
        <div className="radio-list">
          <label><input type="radio" checked={cat === "mine"} onChange={() => setCat("mine")} />{L("My skill", "مجالي")}</label>
          <label><input type="radio" checked={cat === "all"} onChange={() => setCat("all")} />{L(`All jobs (${all})`, `كل الشغل (${all})`)}</label>
          {(Object.keys(CAT) as Category[]).map(c => <label key={c}><input type="radio" checked={cat === c} onChange={() => setCat(c)} />{L(...CAT[c])}</label>)}
        </div>
        <b className="small">{L("Job size", "حجم الشغلانة")}</b>
        <div className="radio-list">{(["all", "small", "medium", "large"] as const).map(s => <label key={s}><input type="radio" checked={size === s} onChange={() => setSize(s)} />{s === "all" ? L("Any", "أي حجم") : L(...SIZE[s])}</label>)}</div>
      </aside>
      <div className="stack">
        <p className="small faint">{L(`${list.length} jobs`, `${list.length} شغلانة`)}</p>
        {list.length === 0 && <div className="card"><Empty icon={<Search />} title={L("No jobs match", "مفيش شغل مطابق")} text={L("Try All jobs, or another size.", "جرّب كل الشغل أو حجم تاني.")} /></div>}
        {list.map(b => { const mine = props.find(p => p.brief_id === b.id); const n = db.proposals.filter(p => p.brief_id === b.id).length; return <Link key={b.id} to={"/talent/jobs/" + b.id} className="card job">
          <div className="row row--between"><span className="small faint">{L("Posted", "اتنشرت")} {ago(b.created_at, lang)}</span>{mine ? <ProposalPill s={mine.status} /> : b.mode === "managed" && <span className="pill pill--violet pill--plain">{L("Managed by Vitals", "بإدارة Vitals")}</span>}</div>
          <h3 className="job__t">{b.title}</h3>
          <p className="small muted">{L("Fixed price", "سعر ثابت")} · <b>{money(b.budget)}</b> · {b.level ? L(b.level === "elite" ? "Elite" : b.level === "pro" ? "Pro" : "Vetted", b.level === "elite" ? "نخبة" : b.level === "pro" ? "محترف" : "معتمد") : ""} · {b.duration || ""} · {L("due", "التسليم")} {date(b.deadline, lang)}</p>
          <p className="small job__d">{b.description}</p>
          <div className="chips">{(b.skills || []).map(s => <span key={s} className="tag">{s}</span>)}</div>
          <div className="row small faint"><ShieldCheck size={14} />{L("Client verified by Vitals", "عميل موثّق من Vitals")} · {b.client} · {L(`Proposals: ${n}`, `العروض: ${n}`)}</div>
        </Link>; })}
      </div>
    </div>
  </div>;
}

export function JobDetail() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const me = meOf(db);
  const b = db.briefs.find(x => x.id === id);
  if (!b) return <div className="page"><Empty icon={<Briefcase />} title={L("Job not found", "الشغلانة مش موجودة")} /></div>;
  const mine = db.proposals.find(p => p.brief_id === b.id && p.talent_id === me.id);
  const n = db.proposals.filter(p => p.brief_id === b.id).length;
  const done = db.briefs.filter(x => x.client === b.client && x.status === "delivered").length;
  return <div className="page">
    <Link to="/talent/jobs" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Find work", "دوّر على شغل")}</Link>
    <div className="split">
      <div className="card card--pad stack" style={{ gap: 16 }}>
        <div><h1>{b.title}</h1><p className="small faint">{L("Posted", "اتنشرت")} {ago(b.created_at, lang)} · {L(...CAT[b.category])}</p></div>
        <p style={{ whiteSpace: "pre-wrap" }}>{b.description}</p>
        {b.reviewer_note && <div className="hint"><ShieldCheck />{L("Vitals reviewer", "مراجع Vitals")}: {b.reviewer_note}</div>}
        <div className="facts">
          <div><span className="small faint">{L("Budget", "الميزانية")}</span><b>{money(b.budget)}</b><span className="small faint">{L("Fixed price", "سعر ثابت")}</span></div>
          <div><span className="small faint">{L("Level", "المستوى")}</span><b>{b.level || "—"}</b></div>
          <div><span className="small faint">{L("Duration", "المدة")}</span><b>{b.duration || "—"}</b></div>
          <div><span className="small faint">{L("Final delivery", "التسليم النهائي")}</span><b>{date(b.deadline, lang, { day: "numeric", month: "short" })}</b></div>
        </div>
        <div className="stack" style={{ gap: 8 }}><b className="small">{L("Skills", "المهارات")}</b><div className="chips">{(b.skills || []).map(s => <span key={s} className="tag">{s}</span>)}</div></div>
      </div>
      <aside className="stack">
        <div className="card card--pad stack">
          {mine ? <><ProposalPill s={mine.status} /><p className="small muted">{L("You already applied.", "انت قدّمت بالفعل.")}</p><Link className="btn btn--block" to="/talent/proposals">{L("View my proposal", "شوف عرضي")}</Link></>
            : b.status === "sourcing" ? <Link className="btn btn--primary btn--block btn--lg" to={`/talent/jobs/${b.id}/apply`}><Send />{L("Submit a proposal", "قدّم عرض")}</Link>
              : <p className="small muted">{L("This job is no longer taking proposals.", "الشغلانة مابقتش بتستقبل عروض.")}</p>}
          <p className="small faint">{L(`${n} proposals so far. Vitals reviewers send the client only the best 3.`, `${n} عرض لحد دلوقتي. مراجعين Vitals بيبعتوا للعميل أحسن ٣ بس.`)}</p>
        </div>
        <div className="card card--pad stack">
          <h3>{L("About the client", "عن العميل")}</h3>
          <div className="row small"><ShieldCheck size={15} />{L("Identity and payment verified by Vitals", "الهوية والدفع موثقين من Vitals")}</div>
          <p className="small muted">{b.client} · {L(`${done} jobs completed on Vitals Crew`, `${done} شغلانة خلصت على Vitals Crew`)}</p>
          <p className="small muted">{L("Pays into escrow before work starts.", "بيدفع في الضمان قبل بداية الشغل.")}</p>
        </div>
      </aside>
    </div>
  </div>;
}

export function SubmitProposal() {
  const { id = "" } = useParams();
  const { L } = useI18n();
  const db = useDB();
  const money = useMoney();
  const toast = useToast();
  const nav = useNavigate();
  const me = meOf(db);
  const b = db.briefs.find(x => x.id === id);
  const [f, setF] = useState({ price: b ? Math.round((b.budget * 0.9) / 500) * 500 : 0, days: 10, pitch: "", samples: me.portfolio.slice(0, 2) });
  if (!b) return <div className="page"><Empty icon={<Briefcase />} title={L("Job not found", "الشغلانة مش موجودة")} /></div>;
  const ok = f.price > 0 && f.pitch.trim().length >= 40 && f.samples.length > 0;
  const toggle = (s: string) => setF(x => ({ ...x, samples: x.samples.includes(s) ? x.samples.filter(y => y !== s) : x.samples.length < 3 ? [...x.samples, s] : x.samples }));
  const send = () => { actions.propose(b.id, me.id, f.price, f.days, f.pitch.trim(), f.samples); toast(L("Proposal sent to Vitals reviewers", "العرض اتبعت لمراجعين Vitals")); nav("/talent/proposals"); };
  return <div className="page">
    <Link to={"/talent/jobs/" + b.id} className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{b.title}</Link>
    <h1>{L("Submit a proposal", "قدّم عرض")}</h1>
    <div className="split">
      <div className="stack">
        <div className="card card--pad form">
          <h2>{L("Terms", "الشروط")}</h2>
          <div className="form-row">
            <label className="field"><span>{L("Your price for the whole job (EGP)", "سعرك للشغلانة كلها (جنيه)")}</span><input className="inp inp--lg" type="number" min={0} step={500} value={f.price} onChange={e => setF({ ...f, price: +e.target.value })} /><small>{L(`Client budget: ${money(b.budget)}`, `ميزانية العميل: ${money(b.budget)}`)}</small></label>
            <label className="field"><span>{L("How long will it take?", "هتاخد قد إيه؟")}</span><select className="sel inp--lg" value={f.days} onChange={e => setF({ ...f, days: +e.target.value })}>{[3, 5, 7, 10, 14, 21, 30].map(d => <option key={d} value={d}>{L(`${d} days`, `${d} يوم`)}</option>)}</select></label>
          </div>
          <div className="receipt small">
            <div><span>{L("Your price", "سعرك")}</span><b>{money(f.price)}</b></div>
            <div><span>{L("Vitals fee taken from you", "رسوم Vitals عليك")}</span><b>{money(0)}</b></div>
            <div className="receipt__t"><span>{L("You'll receive", "هتستلم")}</span><b>{money(f.price)}</b></div>
          </div>
        </div>
        <div className="card card--pad form">
          <h2>{L("Cover letter", "رسالة التقديم")}</h2>
          <textarea className="txt" style={{ minHeight: 170 }} value={f.pitch} onChange={e => setF({ ...f, pitch: e.target.value })} placeholder={L("How you'd approach this job, and which past work proves you can do it. At least 40 characters.", "هتشتغل عليها إزاي، وأنهي شغل سابق بيثبت إنك تقدر. ٤٠ حرف على الأقل.")} />
          <small className="faint">{f.pitch.trim().length}/40+</small>
        </div>
        <div className="card card--pad form">
          <h2>{L("Attach relevant work (1–3)", "أرفق شغل مشابه (١–٣)")}</h2>
          <div className="pick-art">{me.portfolio.map(p => <button key={p} type="button" className={f.samples.includes(p) ? "on" : ""} onClick={() => toggle(p)}><Art title={p} alt={p} /></button>)}</div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}><Link className="btn btn--lg" to={"/talent/jobs/" + b.id}>{L("Cancel", "إلغاء")}</Link><button className="btn btn--primary btn--lg" disabled={!ok} onClick={send}><Send />{L("Send proposal", "ابعت العرض")}</button></div>
      </div>
      <aside className="card card--pad stack">
        <h3 className="row"><ShieldCheck size={16} />{L("How Vitals reviews proposals", "Vitals بتراجع العروض إزاي")}</h3>
        <ol className="next-steps">
          <li><span className="next-steps__n">1</span><div><b>{L("Fit with the brief", "مناسبته للبريف")}</b><span className="small muted">{L("Does your approach answer what the client asked?", "طريقتك بتجاوب على طلب العميل؟")}</span></div></li>
          <li><span className="next-steps__n">2</span><div><b>{L("Relevant work", "شغل مشابه")}</b><span className="small muted">{L("The samples you attach matter more than words.", "النماذج اللي بترفقها أهم من الكلام.")}</span></div></li>
          <li><span className="next-steps__n">3</span><div><b>{L("Realistic price and time", "سعر ووقت واقعيين")}</b><span className="small muted">{L("We don't reward the cheapest bid. We reward the right one.", "مش بنكافئ أرخص عرض. بنكافئ العرض الصح.")}</span></div></li>
        </ol>
        <p className="small muted">{L("The best 3 go to the client with a note on why. You always get feedback, picked or not.", "أحسن ٣ بيروحوا للعميل مع سبب الاختيار. وبيوصلك رأينا في كل الحالات.")}</p>
      </aside>
    </div>
  </div>;
}

// ---------- proposals, contracts, earnings, profile ----------
export function MyProposals() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const props = db.proposals.filter(p => p.talent_id === meOf(db).id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("My proposals", "عروضي")}</h1><p className="muted">{L("Every proposal gets a decision and a reason.", "كل عرض بياخد قرار وسبب.")}</p></div><Link className="btn btn--primary" to="/talent/jobs"><Search />{L("Find work", "دوّر على شغل")}</Link></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Job", "الشغلانة")}</th><th>{L("Your price", "سعرك")}</th><th>{L("Sent", "اتبعت")}</th><th>{L("Status", "الحالة")}</th><th>{L("Reviewer feedback", "رأي المراجع")}</th></tr></thead>
      <tbody>{props.length === 0 ? <tr><td colSpan={5}><Empty icon={<Send />} title={L("No proposals yet", "مفيش عروض لسه")} /></td></tr> : props.map(p => { const b = db.briefs.find(x => x.id === p.brief_id)!; return <tr key={p.id}>
        <td><Link to={"/talent/jobs/" + b.id}><b>{b.title}</b></Link><div className="small faint">{b.client}</div></td>
        <td>{money(p.price)} <span className="small faint">· {p.days}{L("d", " يوم")}</span></td>
        <td className="small muted">{ago(p.created_at, lang)}</td>
        <td><ProposalPill s={p.status} /></td>
        <td className="small" style={{ maxWidth: 360 }}>{p.status === "screening" ? <span className="faint">{L("In review, usually within a day", "بيتراجع، غالبًا خلال يوم")}</span> : p.why || p.feedback || "—"}</td>
      </tr>; })}</tbody>
    </table></div></div>
  </div>;
}

export function Work() {
  const { L, lang } = useI18n();
  const db = useDB();
  const toast = useToast();
  const me = meOf(db);
  const jobs = myJobs(db).filter(b => b.status === "in_progress");
  const [up, setUp] = useState<Brief | null>(null);
  const [f, setF] = useState({ title: "", art: me.portfolio[0] || "", note: "" });
  return <div className="page">
    <div className="page-head__t"><h1>{L("Contracts", "العقود الحالية")}</h1><p className="muted">{L("Deliver here. Vitals QA checks your files against the job before the client sees them.", "سلّم من هنا. مراجعة Vitals بتشوف ملفاتك على الشغلانة قبل ما العميل يشوفها.")}</p></div>
    {jobs.length === 0 && <div className="card"><Empty icon={<Briefcase />} title={L("No active contracts", "مفيش عقود شغالة")} action={<Link className="btn btn--primary btn--sm" to="/talent/jobs">{L("Find work", "دوّر على شغل")}</Link>} /></div>}
    {jobs.map(b => { const ds = db.deliveries.filter(x => x.brief_id === b.id && x.talent_id === me.id).sort((a, c) => c.version - a.version); return <div key={b.id} className="card">
      <div className="card__h"><div><h2>{b.title}</h2><span className="small faint">{b.client} · {L("client deadline", "ميعاد العميل")} {date(b.deadline, lang, { day: "numeric", month: "long" })}</span></div><button className="btn btn--primary btn--sm" onClick={() => { setUp(b); setF({ title: b.title, art: me.portfolio[0] || "", note: "" }); }}><Upload />{L("Submit work", "سلّم شغل")}</button></div>
      <div className="card__b stack">
        <div className="grid2" style={{ alignItems: "start" }}><Timeline b={b} who="talent" /><div className="stack" style={{ gap: 8 }}><RuleMeters b={b} /><p className="small muted">{L("On the 3rd QA return, or the 2nd time the client says it doesn't match the brief, the contract moves to another member.", "عند الرجوع التالت من المراجعة، أو تاني مرة العميل يقول إنه مش زي البريف، العقد بيتحول لعضو تاني.")}</p></div></div>
        <Switches b={b} />
        {ds.map(x => <div key={x.id} className="delivery">
          <Art title={x.art} className="delivery__art" alt={x.title} />
          <div className="stack" style={{ gap: 6 }}>
            <div className="row row--between"><b>{x.title} · v{x.version}</b><QAPill s={x.qa} /></div>
            <p className="small muted">{x.note}</p>
            {x.qa_note && <div className={"qa-box small" + (x.qa === "returned" ? " qa-box--bad" : "")}><ShieldCheck size={15} /><span><b>{x.qa_by}:</b> {x.qa_note}</span></div>}
            {x.client === "waiting" && <span className="pill pill--info"><Clock size={12} />{L("With the client", "عند العميل")}</span>}
            {x.client === "changes" && <div className="qa-box small qa-box--bad"><span><b>{x.client_kind === "off_brief" ? L("Doesn't match the brief", "مش زي البريف") : L("Client revision", "تعديل من العميل")}:</b> {x.client_note}</span></div>}
            {x.client === "approved" && <span className="pill pill--ok"><CheckCircle2 size={12} />{L("Approved, payment released", "اتوافق واتصرف المبلغ")}</span>}
          </div>
        </div>)}
      </div>
    </div>; })}
    {up && <Modal title={L("Submit work for QA", "سلّم الشغل للمراجعة")} onClose={() => setUp(null)} footer={<>
      <button className="btn" onClick={() => setUp(null)}>{L("Cancel", "إلغاء")}</button>
      <button className="btn btn--primary" disabled={!f.note.trim()} onClick={() => { actions.deliver(up.id, me.id, f.title, f.art, f.note.trim()); setUp(null); toast(L("Sent to Vitals QA", "اتبعت لمراجعة الجودة")); }}>{L("Submit", "سلّم")}</button>
    </>}>
      <div className="form">
        <label className="field"><span>{L("Title", "العنوان")}</span><input className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
        <div className="field"><span>{L("File (demo: pick a sample)", "الملف (تجربة: اختار نموذج)")}</span><div className="pick-art">{me.portfolio.map(p => <button key={p} type="button" className={f.art === p ? "on" : ""} onClick={() => setF({ ...f, art: p })}><Art title={p} alt={p} /></button>)}</div></div>
        <label className="field"><span>{L("What's in this version", "إيه اللي في النسخة دي")}</span><textarea className="txt" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></label>
      </div>
    </Modal>}
  </div>;
}

export function Earnings() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const rows = myJobs(db).map(b => ({ b, p: db.proposals.find(p => p.id === b.hired_proposal_id)! })).filter(r => r.p);
  return <div className="page">
    <div className="page-head__t"><h1>{L("Earnings", "الأرباح")}</h1><p className="muted">{L("Clients pay into escrow before you start. You're paid the moment they approve.", "العميل بيدفع في الضمان قبل ما تبدأ، وبتقبض أول ما يوافق.")}</p></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Contract", "العقد")}</th><th>{L("Client", "العميل")}</th><th>{L("Amount", "المبلغ")}</th><th>{L("Status", "الحالة")}</th></tr></thead>
      <tbody>{rows.map(({ b, p }) => <tr key={b.id}><td><b>{b.title}</b><div className="small faint">{date(b.deadline, lang, { day: "numeric", month: "short", year: "numeric" })}</div></td><td>{b.client}</td><td>{money(p.price)}</td>
        <td>{b.status === "delivered" ? <span className="pill pill--ok">{L("Paid", "اتصرف")}</span> : <span className="pill pill--info"><Lock size={12} />{L("In escrow", "محجوز")}</span>}</td></tr>)}</tbody>
    </table></div></div>
    <p className="small faint"><Wallet size={13} /> {L("Withdrawals go to your bank or wallet once a payment provider is connected.", "السحب بيروح لحسابك البنكي أو المحفظة بعد ربط مزوّد الدفع.")}</p>
  </div>;
}

export function MyProfile() {
  const db = useDB();
  const { L } = useI18n();
  return <><div className="page" style={{ paddingBottom: 0 }}><div className="page-head__t"><h1>{L("My profile", "بروفايلي")}</h1><p className="muted">{L("This is what clients see. Your packages let them hire you directly.", "ده اللي العملاء بيشوفوه. الباقات بتخليهم يختاروك مباشرة.")}</p></div></div><TalentProfile self={meOf(db).id} /></>;
}
