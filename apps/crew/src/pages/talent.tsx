// Talent side: matched opportunities, proposals that pass through Vitals review, QA'd deliveries, earnings.
import { Briefcase, CheckCircle2, Clock, FileSearch, Lock, Send, ShieldCheck, Upload, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { Art, BriefPill, CAT, Empty, LevelBadge, Modal, ProposalPill, QAPill, ScoreBars, VettedMark, useMoney, useToast } from "../components/ui";
import { ME, actions, avg, talentOf, useDB } from "../lib/store";
import type { Brief, DB } from "../lib/types";

const useMe = (db: DB) => talentOf(db, ME.talent.id)!;
const myJobs = (db: DB) => db.briefs.filter(b => db.proposals.some(p => p.id === b.hired_proposal_id && p.talent_id === ME.talent.id));

export function TalentHome() {
  const { L } = useI18n();
  const db = useDB();
  const money = useMoney();
  const me = useMe(db);
  const jobs = myJobs(db);
  const priceOf = (b: Brief) => db.proposals.find(p => p.id === b.hired_proposal_id)?.price || 0;
  const escrow = jobs.filter(b => b.status === "in_progress").reduce((s, b) => s + priceOf(b), 0);
  const paid = jobs.filter(b => b.status === "delivered").reduce((s, b) => s + priceOf(b), 0);
  const props = db.proposals.filter(p => p.talent_id === me.id);
  const opps = db.briefs.filter(b => b.status === "sourcing" && !props.some(p => p.brief_id === b.id));
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L(`Hi ${me.name.split(" ")[0]}`, `أهلًا ${me.name.split(" ")[0]}`)}</h1><p className="muted">{L("Here's your work, your proposals and your standing.", "ده شغلك وعروضك ومستواك.")}</p></div>
      <Link className="btn btn--primary" to="/talent/jobs"><FileSearch />{L(`${opps.length} matched opportunities`, `${opps.length} فرصة مناسبة`)}</Link></div>
    <div className="grid4">
      <div className="card kpi kpi--accent"><span className="kpi__l"><Lock />{L("In escrow for you", "محجوز ليك")}</span><span className="kpi__v">{money(escrow)}</span><span className="kpi__s">{L("Paid when the client approves", "بيتصرف لما العميل يوافق")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Wallet />{L("Earned on Vitals Crew", "أرباحك على Vitals Crew")}</span><span className="kpi__v">{money(paid)}</span><span className="kpi__s">{L("Released payments", "مبالغ اتصرفت")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Send />{L("Proposals in review", "عروض بتتراجع")}</span><span className="kpi__v">{props.filter(p => p.status === "screening").length}</span><span className="kpi__s">{L("Reviewed within a day", "بتتراجع خلال يوم")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Briefcase />{L("Active jobs", "شغل حالي")}</span><span className="kpi__v">{jobs.filter(b => b.status === "in_progress").length}</span><span className="kpi__s">{me.on_time}% {L("on time", "في الميعاد")}</span></div>
    </div>
    <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("Matched for you", "مناسب ليك")}</h2><Link to="/talent/jobs" className="small" style={{ color: "var(--accent)" }}>{L("All opportunities", "كل الفرص")}</Link></div>
        <div className="list">{opps.length === 0 ? <Empty icon={<FileSearch />} title={L("No open briefs right now", "مفيش بريفات مفتوحة دلوقتي")} /> : opps.map(b => <Link key={b.id} to="/talent/jobs" className="li"><span className="li__main"><span className="li__t">{b.title}</span><span className="li__s">{b.client} · {L(...CAT[b.category])} · {money(b.budget)}</span></span>{b.category === me.category && <span className="pill pill--ok pill--plain">{L("Your skill", "مجالك")}</span>}</Link>)}</div>
      </div>
      <div className="card card--pad stack">
        <div className="row row--between"><h3>{L("Your vetting profile", "ملف الاعتماد")}</h3><LevelBadge level={me.level} /></div>
        <VettedMark t={me} />
        <ScoreBars s={me.scores} />
        <p className="small muted">{L(`Average ${avg(me.scores).toFixed(1)} / 5. Scores update after every delivery our QA team reviews. Elite needs 4.8+ over 30 jobs.`, `المتوسط ${avg(me.scores).toFixed(1)} من ٥. الدرجات بتتحدث بعد كل تسليم بيراجعه فريق الجودة. النخبة محتاجة ٤.٨+ على ٣٠ شغلانة.`)}</p>
      </div>
    </div>
  </div>;
}

export function Opportunities() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const toast = useToast();
  const me = useMe(db);
  const [open, setOpen] = useState<Brief | null>(null);
  const [f, setF] = useState({ price: 0, days: 10, pitch: "" });
  const props = db.proposals.filter(p => p.talent_id === me.id);
  const list = db.briefs.filter(b => b.status === "sourcing");
  return <div className="page">
    <div className="page-head__t"><h1>{L("Opportunities", "الفرص")}</h1><p className="muted">{L("Every brief here was reviewed by Vitals first: real budget, clear scope, verified client.", "كل بريف هنا اتراجع من Vitals الأول: ميزانية حقيقية، مطلوب واضح، وعميل موثّق.")}</p></div>
    <div className="callout callout--violet"><ShieldCheck /><span className="small">{L("Your proposal goes to our review team, not straight to the client. We send the client the best 3, with a note on why. No race to the bottom on price.", "عرضك بيروح لفريق المراجعة مش للعميل على طول. بنبعت للعميل أحسن ٣ مع سبب الاختيار. مفيش حرق أسعار.")}</span></div>
    <div className="grid2">{list.map(b => { const mine = props.find(p => p.brief_id === b.id); return <div key={b.id} className="card card--pad stack">
      <div className="row row--between"><span className="tag">{L(...CAT[b.category])}</span>{b.mode === "managed" && <span className="pill pill--violet pill--plain">{L("Managed by Vitals", "بإدارة Vitals")}</span>}</div>
      <h3 style={{ fontSize: 17 }}>{b.title}</h3>
      <p className="small muted">{b.description}</p>
      <div className="row small faint"><span>{b.client}</span>·<span>{L("Budget", "الميزانية")} <b className="muted">{money(b.budget)}</b></span>·<span>{L("due", "التسليم")} {date(b.deadline, lang)}</span></div>
      {b.reviewer_note && <div className="hint small"><ShieldCheck />{b.reviewer_note}</div>}
      <div className="row row--between"><span className="small faint">{db.proposals.filter(p => p.brief_id === b.id).length} {L("proposals so far", "عرض لحد دلوقتي")}</span>
        {mine ? <ProposalPill s={mine.status} /> : <button className="btn btn--primary btn--sm" onClick={() => { setOpen(b); setF({ price: Math.round(b.budget * 0.9), days: 10, pitch: "" }); }}><Send />{L("Send proposal", "قدّم عرض")}</button>}</div>
    </div>; })}</div>
    {open && <Modal title={L("Proposal for", "عرض على") + " " + open.title} onClose={() => setOpen(null)} footer={<>
      <button className="btn" onClick={() => setOpen(null)}>{L("Cancel", "إلغاء")}</button>
      <button className="btn btn--primary" disabled={f.pitch.trim().length < 20 || f.price <= 0} onClick={() => { actions.propose(open.id, me.id, f.price, f.days, f.pitch.trim()); setOpen(null); toast(L("Sent to the Vitals review team", "اتبعت لفريق مراجعة Vitals")); }}>{L("Send for review", "ابعت للمراجعة")}</button>
    </>}>
      <div className="form">
        <div className="form-row">
          <label className="field"><span>{L("Your price (EGP)", "سعرك (جنيه)")}</span><input className="inp" type="number" value={f.price} onChange={e => setF({ ...f, price: +e.target.value })} /></label>
          <label className="field"><span>{L("Days to deliver", "أيام التسليم")}</span><input className="inp" type="number" min={1} value={f.days} onChange={e => setF({ ...f, days: +e.target.value })} /></label>
        </div>
        <label className="field"><span>{L("Your approach", "هتشتغل إزاي")}</span><textarea className="txt" style={{ minHeight: 110 }} value={f.pitch} onChange={e => setF({ ...f, pitch: e.target.value })} placeholder={L("How you'll solve this brief, and which past work proves it. At least 20 characters.", "هتحل البريف إزاي، وأنهي شغل سابق بيثبت ده. ٢٠ حرف على الأقل.")} /></label>
        <p className="small faint">{L(`The client pays your price. Vitals Crew's fee is charged to the client, not taken from you.`, "العميل بيدفع سعرك كامل. رسوم Vitals Crew على العميل، مش بتتخصم منك.")}</p>
      </div>
    </Modal>}
  </div>;
}

export function MyProposals() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const props = db.proposals.filter(p => p.talent_id === ME.talent.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <div className="page">
    <div className="page-head__t"><h1>{L("My proposals", "عروضي")}</h1><p className="muted">{L("Every proposal gets a decision and, if it isn't shortlisted, a reason. You always know where you stand.", "كل عرض بياخد قرار، ولو ما اترشحش بتعرف السبب. دايمًا عارف انت فين.")}</p></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Brief", "البريف")}</th><th>{L("Your price", "سعرك")}</th><th>{L("Sent", "اتبعت")}</th><th>{L("Status", "الحالة")}</th><th>{L("Reviewer feedback", "رأي المراجع")}</th></tr></thead>
      <tbody>{props.map(p => { const b = db.briefs.find(x => x.id === p.brief_id)!; return <tr key={p.id}>
        <td><b>{b.title}</b><div className="small faint">{b.client}</div></td>
        <td>{money(p.price)} <span className="small faint">· {p.days}{L("d", " يوم")}</span></td>
        <td className="small muted">{ago(p.created_at, lang)}</td>
        <td><ProposalPill s={p.status} /></td>
        <td className="small" style={{ maxWidth: 360 }}>{p.status === "screening" ? <span className="faint">{L("Waiting for review", "مستني المراجعة")}</span> : p.why || p.feedback || "—"}{p.score != null && <div className="faint">{L("Score", "التقييم")} {p.score.toFixed(1)}/5</div>}</td>
      </tr>; })}</tbody>
    </table></div></div>
  </div>;
}

export function Work() {
  const { L, lang } = useI18n();
  const db = useDB();
  const toast = useToast();
  const me = useMe(db);
  const jobs = myJobs(db).filter(b => b.status === "in_progress");
  const [up, setUp] = useState<Brief | null>(null);
  const [f, setF] = useState({ title: "", art: me.portfolio[0] || "", note: "" });
  return <div className="page">
    <div className="page-head__t"><h1>{L("Active work", "الشغل الحالي")}</h1><p className="muted">{L("Deliver here. Our QA team checks your files against the brief, usually within 4 working hours, then sends them to the client.", "سلّم من هنا. فريق الجودة بيراجع ملفاتك على البريف خلال ٤ ساعات عمل غالبًا، وبعدها بيبعتها للعميل.")}</p></div>
    {jobs.length === 0 && <div className="card"><Empty icon={<Briefcase />} title={L("No active jobs", "مفيش شغل حالي")} /></div>}
    {jobs.map(b => { const ds = db.deliveries.filter(x => x.brief_id === b.id).sort((a, c) => c.version - a.version); return <div key={b.id} className="card">
      <div className="card__h"><div><h2>{b.title}</h2><span className="small faint">{b.client} · {L("due", "التسليم")} {date(b.deadline, lang, { day: "numeric", month: "long" })}</span></div><BriefPill s={b.status} /></div>
      <div className="card__b stack">
        {ds.map(x => <div key={x.id} className="delivery">
          <Art title={x.art} className="delivery__art" alt={x.title} />
          <div className="stack" style={{ gap: 6 }}>
            <div className="row row--between"><b>{x.title} · v{x.version}</b><QAPill s={x.qa} /></div>
            <p className="small muted">{x.note}</p>
            {x.qa_note && <div className={"qa-box small" + (x.qa === "returned" ? " qa-box--bad" : "")}><ShieldCheck size={15} /><span><b>{x.qa_by}:</b> {x.qa_note}</span></div>}
            {x.client === "waiting" && <span className="pill pill--info"><Clock size={12} />{L("With the client", "عند العميل")}</span>}
            {x.client === "changes" && <div className="qa-box small qa-box--bad"><span><b>{L("Client asked for", "العميل طلب")}:</b> {x.client_note}</span></div>}
            {x.client === "approved" && <span className="pill pill--ok"><CheckCircle2 size={12} />{L("Approved, payment released", "اتوافق واتصرف المبلغ")}</span>}
          </div>
        </div>)}
        <button className="btn btn--primary" style={{ justifySelf: "start" }} onClick={() => { setUp(b); setF({ title: b.title, art: me.portfolio[0] || "", note: "" }); }}><Upload />{L("Submit a delivery", "سلّم شغل")}</button>
      </div>
    </div>; })}
    {up && <Modal title={L("Submit for quality review", "سلّم لمراجعة الجودة")} onClose={() => setUp(null)} footer={<>
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
  const jobs = myJobs(db);
  const rows = jobs.map(b => ({ b, p: db.proposals.find(p => p.id === b.hired_proposal_id)! }));
  return <div className="page">
    <div className="page-head__t"><h1>{L("Earnings", "الأرباح")}</h1><p className="muted">{L("Clients pay into escrow before you start. You're paid the moment they approve.", "العميل بيدفع في الضمان قبل ما تبدأ، وبتقبض أول ما يوافق.")}</p></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Job", "الشغلانة")}</th><th>{L("Client", "العميل")}</th><th>{L("Amount", "المبلغ")}</th><th>{L("Status", "الحالة")}</th></tr></thead>
      <tbody>{rows.map(({ b, p }) => <tr key={b.id}><td><b>{b.title}</b><div className="small faint">{date(b.deadline, lang, { day: "numeric", month: "short", year: "numeric" })}</div></td><td>{b.client}</td><td>{money(p.price)}</td>
        <td>{b.status === "delivered" ? <span className="pill pill--ok">{L("Paid", "اتصرف")}</span> : <span className="pill pill--info">{L("In escrow", "محجوز")}</span>}</td></tr>)}</tbody>
    </table></div></div>
  </div>;
}
