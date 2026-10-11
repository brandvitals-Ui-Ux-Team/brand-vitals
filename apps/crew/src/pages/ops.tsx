// Vitals Crew review team: the quality gate. Vets applicants, approves briefs,
// screens proposals into a shortlist, and QA-checks every delivery before a client sees it.
import { ArrowLeft, Briefcase, CheckCircle2, ClipboardCheck, Clock, Gauge, Plus, Send, ShieldCheck, ThumbsDown, UserCheck, Users, XCircle } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { TalentCard } from "../components/TalentCard";
import { APP_STEPS, Art, Avatar, BriefPill, CAT, Empty, LEVEL, LevelBadge, Modal, ProposalPill, ScoreBars, ScoreInput, StagePill, Stepper, appDone, useMoney, useToast } from "../components/ui";
import { ME, actions, avg, talentOf, useDB } from "../lib/store";
import type { Application, Brief, Delivery, Level, Proposal, Scores } from "../lib/types";
import { HowWeVet } from "./shared";

export function OpsHome() {
  const { L, lang } = useI18n();
  const db = useDB();
  const apps = db.applications.filter(a => ["portfolio", "test", "interview"].includes(a.stage));
  const briefsReview = db.briefs.filter(b => b.status === "review");
  const toScreen = db.proposals.filter(p => p.status === "screening");
  const qa = db.deliveries.filter(x => x.qa === "pending");
  const reviewed = db.deliveries.filter(x => x.qa !== "pending");
  const firstPass = reviewed.length ? Math.round((reviewed.filter(x => x.qa === "passed" && x.version === 1).length / Math.max(1, reviewed.filter(x => x.version === 1).length)) * 100) : 0;
  const rate = Math.round((db.stats.accepted_90d / db.stats.applied_90d) * 100);
  const Q = ({ to, icon, n, en, ar, sub }: { to: string; icon: ReactElement; n: number; en: string; ar: string; sub: string }) =>
    <Link to={to} className="card kpi queue">{icon}<span className="kpi__v">{n}</span><span className="kpi__l">{L(en, ar)}</span><span className="kpi__s">{sub}</span></Link>;
  return <div className="page">
    <div className="page-head__t"><h1>{L("Review console", "لوحة المراجعة")}</h1><p className="muted">{L("Nothing reaches a client without passing through this team. This is the edge.", "مفيش حاجة بتوصل لعميل من غير ما تعدي على الفريق ده. ده الفرق.")}</p></div>
    <div className="grid4">
      <Q to="/ops/applications" icon={<UserCheck />} n={apps.length} en="Applicants to vet" ar="متقدمين للاعتماد" sub={L("Portfolio, test, interview", "بورتفوليو، اختبار، مقابلة")} />
      <Q to="/ops/briefs" icon={<Briefcase />} n={briefsReview.length} en="Briefs to approve" ar="بريفات للاعتماد" sub={L("Scope and budget check", "مراجعة المطلوب والميزانية")} />
      <Q to="/ops/briefs" icon={<Send />} n={toScreen.length} en="Proposals to screen" ar="عروض للمراجعة" sub={L("Build the shortlist of 3", "اعمل قائمة الـ ٣")} />
      <Q to="/ops/qa" icon={<ClipboardCheck />} n={qa.length} en="Deliveries in QA" ar="تسليمات للمراجعة" sub={L("Before the client sees them", "قبل ما العميل يشوفها")} />
    </div>
    <div className="grid3">
      <div className="card kpi"><span className="kpi__l"><ShieldCheck />{L("Acceptance rate, 90 days", "نسبة القبول، ٩٠ يوم")}</span><span className="kpi__v">{rate}%</span><span className="kpi__s">{db.stats.accepted_90d} / {db.stats.applied_90d} {L("applicants", "متقدم")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Gauge />{L("QA pass on first try", "نجاح المراجعة من أول مرة")}</span><span className="kpi__v">{firstPass}%</span><span className="kpi__s">{L("Returned work never reaches the client", "الشغل المرتجع مابيوصلش للعميل")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Clock />{L("Average review time", "متوسط وقت المراجعة")}</span><span className="kpi__v">{db.stats.review_hours}h</span><span className="kpi__s">{L("Target: under 24h", "الهدف: أقل من ٢٤ ساعة")}</span></div>
    </div>
    <div className="card">
      <div className="card__h"><h2>{L("Latest activity", "آخر النشاط")}</h2></div>
      <div className="list">{db.activity.slice(0, 8).map(a => <div key={a.id} className="li"><Avatar name={a.who} size="sm" /><span className="li__main"><span style={{ whiteSpace: "normal" }}><b>{a.who}</b> {L(a.en, a.ar)}</span><span className="li__s">{ago(a.at, lang)}</span></span></div>)}</div>
    </div>
    <HowWeVet />
  </div>;
}

// ---------- talent vetting ----------
export function Applications() {
  const { L, lang } = useI18n();
  const db = useDB();
  const [tab, setTab] = useState<"open" | "done">("open");
  const [open, setOpen] = useState<Application | null>(null);
  const list = db.applications.filter(a => (tab === "open") === ["portfolio", "test", "interview"].includes(a.stage));
  return <div className="page">
    <div className="page-head__t"><h1>{L("Talent vetting", "اعتماد المواهب")}</h1><p className="muted">{L("Four gates. Each needs a scored decision and a written reason the applicant can read.", "٤ مراحل. كل مرحلة محتاجة تقييم بالدرجات وسبب مكتوب يقدر المتقدم يقراه.")}</p></div>
    <div className="tabs"><button className={tab === "open" ? "on" : ""} onClick={() => setTab("open")}>{L("In progress", "قيد المراجعة")}<span className="count">{db.applications.filter(a => ["portfolio", "test", "interview"].includes(a.stage)).length}</span></button><button className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>{L("Decided", "اتحسم")}</button></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Applicant", "المتقدم")}</th><th>{L("Skill", "المجال")}</th><th>{L("Stage", "المرحلة")}</th><th>{L("Score", "التقييم")}</th><th>{L("Applied", "قدّم")}</th><th /></tr></thead>
      <tbody>{list.length === 0 ? <tr><td colSpan={6}><Empty icon={<UserCheck />} title={L("Queue is clear", "مفيش طلبات")} /></td></tr> : list.map(a => <tr key={a.id} className="click" onClick={() => setOpen(a)}>
        <td><div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={a.name} size="sm" /><div><b>{a.name}</b><div className="small faint">{a.title} · {a.city}{a.kind === "team" ? ` · ${L("team of", "فريق من")} ${a.members}` : ""}</div></div></div></td>
        <td>{L(...CAT[a.category])}</td><td><StagePill s={a.stage} /></td><td>{a.scores ? avg(a.scores).toFixed(1) : "—"}</td><td className="small muted">{ago(a.submitted_at, lang)}</td>
        <td><button className="btn btn--sm">{["portfolio", "test", "interview"].includes(a.stage) ? L("Review", "راجع") : L("View", "عرض")}</button></td>
      </tr>)}</tbody>
    </table></div></div>
    {open && <ReviewApp a={db.applications.find(x => x.id === open.id)!} onClose={() => setOpen(null)} />}
  </div>;
}

function ReviewApp({ a, onClose }: { a: Application; onClose: () => void }) {
  const { L, lang } = useI18n();
  const toast = useToast();
  const [s, setS] = useState<Scores>(() => { const x = a.scores || { craft: 0, brief: 0, communication: 0, reliability: 0 }; return { craft: Math.round(x.craft), brief: Math.round(x.brief), communication: Math.round(x.communication), reliability: Math.round(x.reliability) }; });
  const [note, setNote] = useState("");
  const [level, setLevel] = useState<Level>("vetted");
  const live = ["portfolio", "test", "interview"].includes(a.stage);
  const need: (keyof Scores)[] = a.stage === "portfolio" ? ["craft"] : a.stage === "test" ? ["craft", "brief"] : ["craft", "brief", "communication", "reliability"];
  const ready = need.every(k => s[k] > 0) && note.trim().length >= 10;
  const go = (d: "advance" | "approve" | "reject") => { actions.review(a.id, s, d, note.trim(), level); toast(d === "reject" ? L("Decision sent with feedback", "القرار اتبعت مع الملاحظات") : d === "approve" ? L(`${a.name} is now in the network`, `${a.name} بقى في الشبكة`) : L("Moved to the next step", "اتنقل للمرحلة الجاية")); onClose(); };
  const nextLabel = a.stage === "portfolio" ? L("Invite to skill test", "ابعت اختبار عملي") : L("Invite to interview", "ادعي لمقابلة");
  return <Modal wide title={a.name} onClose={onClose} footer={live ? <>
    <button className="btn btn--danger" disabled={!ready} onClick={() => go("reject")}><ThumbsDown />{L("Not accepted", "رفض")}</button>
    {a.stage === "interview" ? <button className="btn btn--primary" disabled={!ready} onClick={() => go("approve")}><CheckCircle2 />{L("Accept as", "اقبل كـ")} {L(...(LEVEL[level].slice(0, 2) as [string, string]))}</button>
      : <button className="btn btn--primary" disabled={!ready} onClick={() => go("advance")}>{nextLabel}</button>}
  </> : undefined}>
    <div className="stack">
      <Stepper steps={APP_STEPS} done={appDone(a.stage)} active={a.stage !== "rejected"} />
      <div className="row small muted">{a.title} · {L(...CAT[a.category])} · {a.city} · <a href={"https://" + a.links} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }} dir="ltr">{a.links}</a></div>
      <div className="pick-art pick-art--static">{a.portfolio.map(p => <Art key={p} title={p} alt={p} />)}</div>
      {a.history.length > 0 && <div className="tl">{a.history.map((h, i) => <div key={i} className="tl__i"><span className={"tl__ico " + (h.stage === "rejected" ? "tl__ico--bad" : h.stage === "approved" ? "tl__ico--ok" : "tl__ico--violet")}><ShieldCheck /></span><div><b className="small">{h.by}</b> <StagePill s={h.stage} /><p className="small">{h.note}</p><span className="small faint">{date(h.at, lang)}</span></div></div>)}</div>}
      {live && <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card card--pad stack"><h3>{L("Scorecard", "التقييم")}</h3><ScoreInput value={s} onChange={setS} />
          <p className="small faint">{a.stage === "portfolio" ? L("At this step: score craft.", "في المرحلة دي: قيّم جودة الشغل.") : a.stage === "test" ? L("At this step: craft and brief fit from the test.", "في المرحلة دي: الجودة وفهم البريف من الاختبار.") : L("Final step: all four.", "المرحلة الأخيرة: الأربعة.")}</p></div>
        <div className="stack">
          <label className="field"><span>{L("Reason (the applicant will read this)", "السبب (المتقدم هيقراه)")}</span><textarea className="txt" style={{ minHeight: 110 }} value={note} onChange={e => setNote(e.target.value)} placeholder={L("Be specific and kind. At least 10 characters.", "كن محدد ولطيف. ١٠ حروف على الأقل.")} /></label>
          {a.stage === "interview" && <div className="field"><span>{L("Level", "المستوى")}</span><div className="seg">{(Object.keys(LEVEL) as Level[]).map(l => <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>{L(LEVEL[l][0], LEVEL[l][1])}</button>)}</div></div>}
        </div>
      </div>}
    </div>
  </Modal>;
}

// ---------- briefs & shortlists ----------
export function OpsBriefs() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const toast = useToast();
  const [approve, setApprove] = useState<Brief | null>(null);
  const [note, setNote] = useState("");
  const groups: [string, string, Brief[]][] = [
    ["To approve", "للاعتماد", db.briefs.filter(b => b.status === "review")],
    ["Sourcing: screen proposals", "مرحلة الترشيح: راجع العروض", db.briefs.filter(b => b.status === "sourcing")],
    ["Live", "شغالة", db.briefs.filter(b => b.status === "shortlist" || b.status === "in_progress")]
  ];
  return <div className="page">
    <div className="page-head__t"><h1>{L("Briefs & shortlists", "البريفات والترشيحات")}</h1><p className="muted">{L("Approve briefs before talent sees them, then screen every proposal into a shortlist of 3.", "اعتمد البريف قبل ما المواهب تشوفه، وبعدين راجع كل العروض واعمل قائمة من ٣.")}</p></div>
    {groups.map(([en, ar, list]) => <div key={en} className="card">
      <div className="card__h"><h2>{L(en, ar)}</h2><span className="faint small">{list.length}</span></div>
      <div className="list">{list.length === 0 ? <p className="small faint" style={{ padding: 16 }}>{L("Nothing here.", "مفيش حاجة.")}</p> : list.map(b => { const ps = db.proposals.filter(p => p.brief_id === b.id); return <div key={b.id} className="li">
        <span className="li__main"><span className="li__t">{b.title}</span><span className="li__s">{b.client} · {L(...CAT[b.category])} · {money(b.budget)} · {L("due", "التسليم")} {date(b.deadline, lang)} · {ago(b.created_at, lang)}</span></span>
        {b.status === "sourcing" && <span className="small muted">{ps.filter(p => p.status === "screening").length} {L("to screen", "للمراجعة")} · {ps.filter(p => p.status === "shortlisted").length} {L("shortlisted", "مرشح")}</span>}
        <BriefPill s={b.status} />
        {b.status === "review" ? <button className="btn btn--sm btn--primary" onClick={() => { setApprove(b); setNote(""); }}>{L("Review", "راجع")}</button>
          : b.status === "sourcing" ? <Link className="btn btn--sm btn--primary" to={"/ops/briefs/" + b.id}>{L("Screen", "راجع العروض")}</Link> : <Link className="btn btn--sm" to={"/ops/briefs/" + b.id}>{L("Open", "افتح")}</Link>}
      </div>; })}</div>
    </div>)}
    {approve && <Modal title={approve.title} onClose={() => setApprove(null)} footer={<>
      <button className="btn" onClick={() => setApprove(null)}>{L("Later", "بعدين")}</button>
      <button className="btn btn--primary" disabled={note.trim().length < 5} onClick={() => { actions.approveBrief(approve.id, note.trim()); setApprove(null); toast(L("Brief approved and opened to vetted talent", "البريف اتعتمد واتفتح للمواهب المعتمدة")); }}><CheckCircle2 />{L("Approve & open to talent", "اعتمد وافتحه للمواهب")}</button>
    </>}>
      <div className="stack">
        <div className="row small muted">{approve.client} · {L(...CAT[approve.category])} · {money(approve.budget)} · {date(approve.deadline, lang, { day: "numeric", month: "long" })}</div>
        <p>{approve.description}</p>
        <div className="checklist small">{[L("Scope is clear and deliverable", "المطلوب واضح وممكن تنفيذه"), L("Budget fits the market for this level", "الميزانية مناسبة للمستوى"), L("Timeline is realistic", "الميعاد واقعي"), L("Client identity verified", "هوية العميل موثقة")].map(c => <label key={c} className="check"><input type="checkbox" defaultChecked />{c}</label>)}</div>
        <label className="field"><span>{L("Note for client and talent", "ملاحظة للعميل والمواهب")}</span><textarea className="txt" value={note} onChange={e => setNote(e.target.value)} placeholder={L("e.g. Clarified: 8 pages, Egyptian Arabic, English version included.", "مثلًا: اتوضح: ٨ صفحات، مصري، ومعاه نسخة إنجليزي.")} /></label>
      </div>
    </Modal>}
  </div>;
}

export function ScreenBrief() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const toast = useToast();
  const nav = useNavigate();
  const b = db.briefs.find(x => x.id === id);
  const [dec, setDec] = useState<{ p: Proposal; d: "shortlist" | "decline" } | null>(null);
  if (!b) return <div className="page"><Empty icon={<Briefcase />} title={L("Brief not found", "البريف مش موجود")} /></div>;
  const ps = db.proposals.filter(p => p.brief_id === id).sort((a, c) => (c.score || 0) - (a.score || 0));
  const short = ps.filter(p => p.status === "shortlisted").length;
  const inHouse = ps.some(p => talentOf(db, p.talent_id)?.kind === "in_house");
  return <div className="page">
    <Link to="/ops/briefs" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Briefs", "البريفات")}</Link>
    <div className="page-head"><div className="page-head__t"><div className="row"><h1>{b.title}</h1><BriefPill s={b.status} /></div><p className="muted">{b.client} · {money(b.budget)} · {L("due", "التسليم")} {date(b.deadline, lang)}</p></div>
      {b.status === "sourcing" && <div className="row">
        {!inHouse && <button className="btn" onClick={() => { actions.propose(b.id, "t-bv", Math.round(b.budget * 0.98), 12, "Brand Vitals in-house team: strategy, production and delivery under one roof."); toast(L("In-house bid added. It gets screened like any other.", "اتضاف عرض الفريق الداخلي، وبيتراجع زي أي عرض.")); }}><Plus />{L("Bid as Brand Vitals", "قدّم كبراند ڤايتلز")}</button>}
        <button className="btn btn--primary" disabled={short === 0} onClick={() => { actions.sendShortlist(b.id); toast(L("Shortlist sent to the client", "القائمة اتبعتت للعميل")); nav("/ops/briefs"); }}><Send />{L(`Send shortlist (${short})`, `ابعت القائمة (${short})`)}</button>
      </div>}</div>
    <p className="small">{b.description}</p>
    {b.status === "sourcing" && <div className="hint"><ShieldCheck />{L("Shortlist up to 3. Write why each one fits; the client reads it. Declined talent gets your feedback.", "رشّح لحد ٣. اكتب ليه كل واحد مناسب؛ العميل بيقرا ده. واللي مااترشحش بيوصله رأيك.")}</div>}
    <div className="stack">{ps.length === 0 ? <div className="card"><Empty icon={<Send />} title={L("No proposals yet", "مفيش عروض لسه")} /></div> : ps.map(p => { const t = talentOf(db, p.talent_id)!; return <div key={p.id} className="card screen">
      <div className="screen__art">{t.portfolio.slice(0, 2).map(x => <Art key={x} title={x} alt={x} />)}</div>
      <div className="stack" style={{ gap: 8 }}>
        <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={t.name} /><div style={{ flex: 1 }}><b>{t.name}</b> <span className="small muted">· {L(t.title, t.title_ar)}</span></div><LevelBadge level={t.level} /><ProposalPill s={p.status} /></div>
        <p className="small">“{p.pitch}”</p>
        <div className="row small muted"><b style={{ color: "var(--text)" }}>{money(p.price)}</b> · {p.days} {L("days", "يوم")} · {t.jobs} {L("jobs", "شغلانة")} · {t.on_time}% {L("on time", "في الميعاد")}</div>
        {(p.why || p.feedback) && <div className={"qa-box small" + (p.status === "declined" ? " qa-box--bad" : "")}><ShieldCheck size={15} /><span>{p.why || p.feedback}{p.score != null && ` · ${p.score.toFixed(1)}/5`}</span></div>}
      </div>
      <div className="screen__side"><ScoreBars s={t.scores} />
        {p.status === "screening" && <div className="row"><button className="btn btn--sm btn--primary" disabled={short >= 3} onClick={() => setDec({ p, d: "shortlist" })}><CheckCircle2 />{L("Shortlist", "رشّح")}</button><button className="btn btn--sm" onClick={() => setDec({ p, d: "decline" })}><XCircle />{L("Decline", "ارفض")}</button></div>}</div>
    </div>; })}</div>
    {dec && <Decide p={dec.p} d={dec.d} onClose={() => setDec(null)} />}
  </div>;
}

function Decide({ p, d, onClose }: { p: Proposal; d: "shortlist" | "decline"; onClose: () => void }) {
  const { L } = useI18n();
  const [score, setScore] = useState(4);
  const [text, setText] = useState("");
  return <Modal title={d === "shortlist" ? L("Why this talent fits", "ليه الموهبة دي مناسبة") : L("Feedback for the talent", "رأيك للموهبة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className={"btn " + (d === "shortlist" ? "btn--primary" : "btn--danger")} disabled={text.trim().length < 10} onClick={() => { actions.screen(p.id, d, score, text.trim()); onClose(); }}>{d === "shortlist" ? L("Add to shortlist", "أضف للقائمة") : L("Decline with feedback", "ارفض مع الرأي")}</button>
  </>}>
    <div className="form">
      <div className="field"><span>{L("Fit score", "درجة المناسبة")}</span><div className="seg">{[1, 2, 3, 4, 5].map(n => <button key={n} className={score === n ? "on" : ""} onClick={() => setScore(n)}>{n}</button>)}</div></div>
      <textarea className="txt" style={{ minHeight: 110 }} value={text} onChange={e => setText(e.target.value)} autoFocus placeholder={d === "shortlist" ? L("The client reads this. What makes them right for this brief?", "العميل هيقرا ده. إيه اللي يخليهم مناسبين للبريف؟") : L("Be specific and useful.", "خليك محدد ومفيد.")} />
    </div>
  </Modal>;
}

// ---------- delivery QA ----------
const CHECKS: [string, string, string][] = [["brief", "Matches the brief", "مطابق للبريف"], ["brand", "On brand (logo, colours, type)", "مطابق للهوية"], ["specs", "Right sizes and formats", "المقاسات والصيغ صح"], ["language", "Arabic and English proofread", "العربي والإنجليزي متراجعين"], ["files", "Source files included", "ملفات المصدر موجودة"]];
export function QAQueue() {
  const { L, lang } = useI18n();
  const db = useDB();
  const toast = useToast();
  const pending = db.deliveries.filter(x => x.qa === "pending");
  const done = db.deliveries.filter(x => x.qa !== "pending").sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).slice(0, 6);
  const [sel, setSel] = useState<Delivery | null>(pending[0] || null);
  const [checks, setChecks] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const cur = sel ? db.deliveries.find(x => x.id === sel.id) : null;
  const b = cur ? db.briefs.find(x => x.id === cur.brief_id) : null;
  const decide = (pass: boolean) => { if (!cur) return; actions.qa(cur.id, pass, note.trim() || (pass ? L("Passed all checks.", "عدّى كل البنود.") : ""), checks); toast(pass ? L("Passed and sent to the client", "اتعتمد واتبعت للعميل") : L("Returned to the talent", "رجع للموهبة")); setSel(null); setChecks([]); setNote(""); };
  return <div className="page">
    <div className="page-head__t"><h1>{L("Delivery QA", "مراجعة الجودة")}</h1><p className="muted">{L("Every file is checked against the brief before the client sees it. Returned work never reaches the client.", "كل ملف بيتراجع على البريف قبل ما العميل يشوفه. الشغل المرتجع مابيوصلش للعميل.")}</p></div>
    <div className="split">
      <div className="card">{!cur || !b ? <Empty icon={<ClipboardCheck />} title={pending.length ? L("Pick a delivery", "اختار تسليم") : L("QA queue is clear", "مفيش تسليمات للمراجعة")} /> : <div className="card__b stack">
        <div className="row row--between"><div><h2>{cur.title} · v{cur.version}</h2><span className="small faint">{b.title} · {b.client} · {talentOf(db, cur.talent_id)?.name} · {ago(cur.submitted_at, lang)}</span></div></div>
        <Art title={cur.art} className="qa-art" alt={cur.title} />
        <p className="small"><b>{L("Talent note", "ملاحظة الموهبة")}:</b> {cur.note}</p>
        <div className="hint small"><Briefcase />{L("Brief", "البريف")}: {b.description}</div>
        <div className="checklist">{CHECKS.map(([k, en, ar]) => <label key={k} className="check"><input type="checkbox" checked={checks.includes(k)} onChange={e => setChecks(e.target.checked ? [...checks, k] : checks.filter(c => c !== k))} />{L(en, ar)}</label>)}</div>
        <textarea className="txt" value={note} onChange={e => setNote(e.target.value)} placeholder={L("Notes (required when returning)", "ملاحظات (لازم لو هترجعه)")} />
        <div className="row"><button className="btn btn--primary" disabled={checks.length < CHECKS.length} onClick={() => decide(true)}><CheckCircle2 />{L("Pass & send to client", "اعتمد وابعت للعميل")}</button><button className="btn btn--danger" disabled={note.trim().length < 10} onClick={() => decide(false)}><XCircle />{L("Return with notes", "رجّعه بملاحظات")}</button></div>
        {checks.length < CHECKS.length && <p className="small faint">{L("All five checks are needed to pass.", "لازم الخمس بنود عشان يعدي.")}</p>}
      </div>}</div>
      <div className="stack">
        <div className="card"><div className="card__h"><h3>{L("Waiting", "مستني")}</h3><span className="small faint">{pending.length}</span></div>
          <div className="list">{pending.map(x => <button key={x.id} className={"li" + (cur?.id === x.id ? " li--on" : "")} style={{ width: "100%", textAlign: "start" }} onClick={() => { setSel(x); setChecks([]); setNote(""); }}><Art title={x.art} className="thumb" /><span className="li__main"><span className="li__t">{x.title} · v{x.version}</span><span className="li__s">{talentOf(db, x.talent_id)?.name} · {ago(x.submitted_at, lang)}</span></span></button>)}</div></div>
        <div className="card"><div className="card__h"><h3>{L("Recently reviewed", "اتراجع مؤخرًا")}</h3></div>
          <div className="list">{done.map(x => <div key={x.id} className="li"><Art title={x.art} className="thumb" /><span className="li__main"><span className="li__t">{x.title} · v{x.version}</span><span className="li__s">{x.qa === "passed" ? L("Passed", "اتعتمد") : L("Returned", "رجع")} · {x.qa_by}</span></span></div>)}</div></div>
      </div>
    </div>
  </div>;
}

export function Network() {
  const { L } = useI18n();
  const db = useDB();
  const by = (l: Level) => db.talents.filter(t => t.level === l).length;
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Talent network", "شبكة المواهب")}</h1><p className="muted">{L(`${db.talents.length} members · ${by("elite")} elite · ${by("pro")} pro · ${by("vetted")} vetted`, `${db.talents.length} عضو · ${by("elite")} نخبة · ${by("pro")} محترف · ${by("vetted")} معتمد`)}</p></div>
      <Link className="btn" to="/apply"><Users />{L("Application form", "فورم التقديم")}</Link></div>
    <div className="grid3">{db.talents.map(t => <TalentCard key={t.id} t={t} />)}</div>
    <p className="small faint">{L("Levels are re-scored after every QA-reviewed delivery. Two returned deliveries in a row trigger a quality review.", "المستويات بتتحدث بعد كل تسليم بيتراجع. تسليمين مرتجعين ورا بعض بيفتحوا مراجعة جودة.")} · {ME.ops.name}</p>
  </div>;
}
