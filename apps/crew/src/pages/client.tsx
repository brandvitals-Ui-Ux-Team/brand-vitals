// Client side: post a brief, receive a vetted shortlist, hire with escrow, approve QA-checked work.
import { ArrowLeft, CheckCircle2, ClipboardCheck, FilePlus2, Lock, MessageSquareQuote, PenLine, ShieldCheck, Sparkles, Star, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ago, date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { TalentCard } from "../components/TalentCard";
import { Art, Avatar, BRIEF_STEPS, BriefPill, CAT, Empty, LevelBadge, Modal, QAPill, ScoreBars, Stepper, VettedMark, briefDone, useMoney, useToast } from "../components/ui";
import { FEE, ME, actions, hiredTalent, talentOf, useDB } from "../lib/store";
import type { Brief, Category, Level, Proposal } from "../lib/types";
import { HowWeVet } from "./shared";

export function ClientHome() {
  const { L, lang } = useI18n();
  const db = useDB();
  const money = useMoney();
  const mine = db.briefs.filter(b => b.client === ME.client.company);
  const live = mine.filter(b => b.status !== "delivered");
  const escrow = mine.filter(b => b.status === "in_progress").reduce((s, b) => s + (hiredTalent(db, b)?.p.price || 0), 0);
  const waiting = db.deliveries.filter(x => x.client === "waiting" && mine.some(b => b.id === x.brief_id));
  const shortlists = mine.filter(b => b.status === "shortlist");
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L(`Welcome back, ${ME.client.name.split(" ")[0]}`, `أهلًا ${ME.client.name.split(" ")[0]}`)}</h1>
      <p className="muted">{L("Every freelancer you see here was reviewed by our team, and every delivery is checked before it reaches you.", "كل فريلانسر هنا اتراجع من فريقنا، وكل تسليم بيتراجع قبل ما يوصلك.")}</p></div>
      <Link className="btn btn--primary" to="/client/new"><FilePlus2 />{L("Post a brief", "انشر بريف")}</Link></div>

    <div className="grid4">
      <div className="card kpi kpi--accent"><span className="kpi__l"><Sparkles />{L("Shortlists ready", "قوائم جاهزة")}</span><span className="kpi__v">{shortlists.length}</span><span className="kpi__s">{L("Curated by our reviewers", "مختارة من المراجعين")}</span></div>
      <div className="card kpi"><span className="kpi__l"><ClipboardCheck />{L("Deliveries to approve", "تسليمات للموافقة")}</span><span className="kpi__v">{waiting.length}</span><span className="kpi__s">{L("Already passed our QA", "عدّت مراجعة الجودة")}</span></div>
      <div className="card kpi"><span className="kpi__l"><Lock />{L("Held in escrow", "محجوز بأمان")}</span><span className="kpi__v">{money(escrow)}</span><span className="kpi__s">{L("Released only when you approve", "بيتصرف لما توافق بس")}</span></div>
      <div className="card kpi"><span className="kpi__l"><CheckCircle2 />{L("Projects delivered", "مشاريع اتسلمت")}</span><span className="kpi__v">{mine.filter(b => b.status === "delivered").length}</span><span className="kpi__s">{L("All time", "من البداية")}</span></div>
    </div>

    {(shortlists.length > 0 || waiting.length > 0) && <div className="grid2">
      {shortlists.map(b => <Link key={b.id} to={"/client/briefs/" + b.id} className="action-card"><Sparkles /><span><b>{L("Your shortlist is ready", "القائمة المختصرة جاهزة")}</b><span className="small muted">{b.title} · {L(`${db.proposals.filter(p => p.brief_id === b.id && p.status === "shortlisted").length} vetted options`, `${db.proposals.filter(p => p.brief_id === b.id && p.status === "shortlisted").length} اختيارات معتمدة`)}</span></span></Link>)}
      {waiting.map(x => <Link key={x.id} to={"/client/briefs/" + x.brief_id} className="action-card action-card--ok"><ClipboardCheck /><span><b>{L("New delivery to review", "تسليم جديد للمراجعة")}</b><span className="small muted">{x.title} · v{x.version} · {L("passed Vitals QA", "عدّى مراجعة الجودة")}</span></span></Link>)}
    </div>}

    <div className="card">
      <div className="card__h"><h2>{L("Your briefs", "البريفات بتاعتك")}</h2><span className="faint small">{live.length} {L("active", "شغالة")}</span></div>
      <div className="list">{mine.length === 0 ? <Empty icon={<FilePlus2 />} title={L("No briefs yet", "مفيش بريفات لسه")} /> : mine.map(b => <Link key={b.id} to={"/client/briefs/" + b.id} className="li brief-li">
        <span className="li__main"><span className="li__t">{b.title}</span><span className="li__s">{L(...CAT[b.category])} · {money(b.budget, b.currency)} · {L("due", "التسليم")} {date(b.deadline, lang)}</span></span>
        <span className="mini-steps" aria-hidden>{BRIEF_STEPS.map((_, i) => <i key={i} className={i < briefDone(b.status) ? "on" : ""} />)}</span>
        <BriefPill s={b.status} />
      </Link>)}</div>
    </div>
    <HowWeVet />
  </div>;
}

export function NewBrief() {
  const { L } = useI18n();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const db = useDB();
  const pref = talentOf(db, sp.get("talent"));
  const [f, setF] = useState({ title: "", category: (pref?.category || "design") as Category, description: "", budget: 15000, deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), mode: "shortlist" as Brief["mode"] });
  const ok = f.title.trim().length > 3 && f.description.trim().length > 10 && f.budget > 0;
  const submit = () => {
    const id = actions.postBrief({ ...f, preferred_talent: pref?.id || null });
    toast(L("Brief sent. Our team reviews it within 24 hours.", "البريف اتبعت. فريقنا هيراجعه خلال ٢٤ ساعة."));
    nav("/client/briefs/" + id);
  };
  return <div className="page" style={{ maxWidth: 880 }}>
    <Link to="/client" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Home", "الرئيسية")}</Link>
    <div className="page-head__t"><h1>{L("Post a brief", "انشر بريف")}</h1><p className="muted">{L("Tell us what you need. We review the brief, open it to vetted talent only, and send you a shortlist of the best 3.", "قولنا محتاج إيه. هنراجع البريف، ونفتحه للمواهب المعتمدة بس، ونبعتلك أحسن ٣.")}</p></div>
    {pref && <div className="callout callout--violet"><Star /><span>{L(`You asked for ${pref.name}. We'll invite them first and still add vetted alternatives.`, `طلبت ${pref.name}. هنبعتله الأول، ومعاه بدائل معتمدة.`)}</span></div>}
    <div className="card card--pad form">
      <label className="field"><span>{L("What do you need?", "محتاج إيه؟")}</span><input className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={L("e.g. 6 UGC ads for our new serum", "مثلًا: ٦ إعلانات UGC للسيروم الجديد")} autoFocus /></label>
      <div className="field"><span>{L("Category", "المجال")}</span><div className="chips">{(Object.keys(CAT) as Category[]).map(c => <button key={c} type="button" className={"chip-btn" + (f.category === c ? " on" : "")} onClick={() => setF({ ...f, category: c })}>{L(...CAT[c])}</button>)}</div></div>
      <label className="field"><span>{L("Details", "التفاصيل")}</span><textarea className="txt" style={{ minHeight: 120 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder={L("Goal, deliverables, formats, language, references…", "الهدف، المطلوب، المقاسات، اللغة، أمثلة…")} /></label>
      <div className="form-row">
        <label className="field"><span>{L("Budget (EGP)", "الميزانية (جنيه)")}</span><input className="inp" type="number" min={0} step={500} value={f.budget} onChange={e => setF({ ...f, budget: +e.target.value })} /></label>
        <label className="field"><span>{L("Deadline", "ميعاد التسليم")}</span><input className="inp" type="date" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })} /></label>
      </div>
      <div className="field"><span>{L("How should we run it?", "عايزنا نمشيه إزاي؟")}</span>
        <div className="grid2">
          <button type="button" className={"choice" + (f.mode === "shortlist" ? " on" : "")} onClick={() => setF({ ...f, mode: "shortlist" })}><b>{L("Send me a shortlist", "ابعتولي ترشيحات")}</b><span className="small muted">{L("We screen every proposal and send you the best 3. You choose.", "بنراجع كل العروض ونبعتلك أحسن ٣، وانت تختار.")}</span></button>
          <button type="button" className={"choice" + (f.mode === "managed" ? " on" : "")} onClick={() => setF({ ...f, mode: "managed" })}><b>{L("Fully managed", "إدارة كاملة")}</b><span className="small muted">{L("We build the right crew, manage it and own delivery quality.", "إحنا نجمع الفريق المناسب وندير الشغل ونضمن الجودة.")}</span></button>
        </div></div>
    </div>
    <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn--primary btn--lg" disabled={!ok} onClick={submit}><ShieldCheck />{L("Send for review", "ابعته للمراجعة")}</button></div>
  </div>;
}

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
  if (!b) return <div className="page"><Empty icon={<FilePlus2 />} title={L("Brief not found", "البريف مش موجود")} /></div>;
  const hired = hiredTalent(db, b);
  const dels = db.deliveries.filter(x => x.brief_id === id && x.qa === "passed").sort((a, c) => c.version - a.version);
  const screened = db.proposals.filter(p => p.brief_id === id).length;
  return <div className="page">
    <Link to="/client" className="crumbs small muted row"><ArrowLeft size={14} className="flip-rtl" />{L("Your briefs", "البريفات بتاعتك")}</Link>
    <div className="page-head"><div className="page-head__t"><div className="row"><h1>{b.title}</h1><BriefPill s={b.status} /></div>
      <p className="muted">{L(...CAT[b.category])} · {money(b.budget, b.currency)} · {L("due", "التسليم")} {date(b.deadline, lang, { day: "numeric", month: "long" })} · {b.mode === "managed" ? L("Fully managed", "إدارة كاملة") : L("Shortlist", "ترشيحات")}</p></div></div>
    <div className="card card--pad"><Stepper steps={BRIEF_STEPS} done={briefDone(b.status)} active={b.status !== "delivered"} /></div>

    {b.status === "review" && <div className="callout callout--warn"><ShieldCheck /><span><b>{L("Our team is reviewing your brief.", "فريقنا بيراجع البريف.")}</b> {L("We check scope, budget and timeline so only the right talent sees it. Usually within 24 hours.", "بنتأكد من المطلوب والميزانية والميعاد عشان يوصل للمواهب المناسبة بس. عادة خلال ٢٤ ساعة.")}</span></div>}
    {b.status === "sourcing" && <div className="callout callout--info"><Sparkles /><span><b>{L("Matching vetted talent.", "بنختار المواهب المعتمدة.")}</b> {L(`${screened} proposals received so far. We screen each one and send you only the best 3.`, `وصل ${screened} عرض لحد دلوقتي. بنراجع كل واحد ونبعتلك أحسن ٣ بس.`)}</span></div>}
    {b.reviewer_note && <div className="hint"><MessageSquareQuote />{L("Reviewer note", "ملاحظة المراجع")}: {b.reviewer_note}</div>}

    {shortlist.length > 0 && <div className="stack">
      <div className="row row--between"><h2>{b.status === "shortlist" ? L("Your vetted shortlist", "القائمة المختصرة المعتمدة") : L("Shortlist", "القائمة المختصرة")}</h2>
        <span className="small faint">{L(`Picked from ${screened} proposals by our review team`, `اتختاروا من ${screened} عرض بواسطة فريق المراجعة`)}</span></div>
      <div className="grid3">{shortlist.map(p => { const t = talentOf(db, p.talent_id)!; return <div key={p.id} className={"card pick" + (p.status === "hired" ? " pick--hired" : "") + (p.status === "not_selected" ? " pick--muted" : "")}>
        <div className="talent__art">{t.portfolio.slice(0, 2).map(x => <Art key={x} title={x} alt={x} />)}</div>
        <div className="card__b stack" style={{ gap: 10 }}>
          <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={t.name} /><div style={{ flex: 1, minWidth: 0 }}><b>{t.name}</b><div className="small muted">{L(t.title, t.title_ar)}</div></div><LevelBadge level={t.level as Level} /></div>
          <VettedMark t={t} />
          <div className="why"><b className="small">{L("Why we picked them", "ليه اخترناهم")}</b><p className="small">{p.why}</p></div>
          <p className="small muted">“{p.pitch}”</p>
          <ScoreBars s={t.scores} />
          <div className="row row--between"><span><b style={{ fontSize: 18 }}>{money(p.price)}</b> <span className="small faint">· {p.days} {L("days", "يوم")}</span></span>
            {b.status === "shortlist" ? <button className="btn btn--primary btn--sm" onClick={() => setHire(p)}>{L("Hire", "اختار")}</button> : p.status === "hired" ? <span className="pill pill--ok">{L("Hired", "اتختار")}</span> : null}</div>
        </div>
      </div>; })}</div>
    </div>}

    {hired && b.status !== "shortlist" && <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("Deliveries", "التسليمات")}</h2><span className="small faint">{L("You only see work that passed our QA", "بتشوف بس الشغل اللي عدّى مراجعة الجودة")}</span></div>
        <div className="card__b stack">
          {dels.length === 0 && <Empty icon={<ClipboardCheck />} title={L("Nothing to review yet", "مفيش حاجة للمراجعة لسه")} text={L("When the talent delivers, our QA team checks it against your brief first.", "لما الموهبة تسلّم، فريق الجودة بيراجعه على البريف الأول.")} />}
          {dels.map(x => <div key={x.id} className="delivery">
            <Art title={x.art} className="delivery__art" alt={x.title} />
            <div className="stack" style={{ gap: 8 }}>
              <div className="row row--between"><b>{x.title} · v{x.version}</b><QAPill s={x.qa} /></div>
              <p className="small muted">{x.note}</p>
              <div className="qa-box small"><ShieldCheck size={15} /><span><b>{L("QA by", "راجعه")} {x.qa_by}:</b> {x.qa_note}</span></div>
              {x.client === "waiting" ? <div className="row"><button className="btn btn--primary" onClick={() => { actions.clientDecide(x.id, true, ""); toast(L("Approved. Payment released to the talent.", "اتوافق عليه واتصرف المبلغ للموهبة.")); }}><CheckCircle2 />{L("Approve & release payment", "وافق واصرف المبلغ")}</button><button className="btn" onClick={() => setChanges(x.id)}><PenLine />{L("Request changes", "اطلب تعديل")}</button></div>
                : x.client === "approved" ? <span className="pill pill--ok">{L("You approved this", "وافقت عليه")}</span> : x.client === "changes" ? <span className="pill pill--warn">{L("Changes requested", "طلبت تعديل")}: {x.client_note}</span> : null}
            </div>
          </div>)}
        </div>
      </div>
      <div className="stack">
        <div className="card card--pad stack">
          <h3>{L("Your talent", "الموهبة")}</h3>
          <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={hired.t!.name} /><div><b>{hired.t!.name}</b><div className="small muted">{L(hired.t!.title, hired.t!.title_ar)}</div></div></div>
          <VettedMark t={hired.t!} />
        </div>
        <div className="card card--pad stack">
          <h3 className="row"><Wallet size={16} />{L("Payment", "الدفع")}</h3>
          <div className="row row--between small"><span className="muted">{L("Agreed price", "السعر المتفق عليه")}</span><b>{money(hired.p.price)}</b></div>
          <div className="row row--between small"><span className="muted">{L("Status", "الحالة")}</span>{b.status === "delivered" ? <span className="pill pill--ok">{L("Released", "اتصرف")}</span> : <span className="pill pill--info"><Lock size={12} />{L("In escrow", "محجوز بأمان")}</span>}</div>
        </div>
      </div>
    </div>}

    {hire && <Modal title={L("Hire and fund escrow", "اختار واحجز المبلغ")} onClose={() => setHire(null)} footer={<>
      <button className="btn" onClick={() => setHire(null)}>{L("Cancel", "إلغاء")}</button>
      <button className="btn btn--primary" onClick={() => { actions.hire(b.id, hire.id); setHire(null); toast(L("Hired. The money is held safely until you approve the work.", "تم. المبلغ محجوز بأمان لحد ما توافق على الشغل.")); }}><Lock />{L("Confirm & pay into escrow", "أكد وادفع للضمان")}</button>
    </>}>
      <div className="stack">
        <p>{L(`You're hiring ${talentOf(db, hire.talent_id)?.name} for “${b.title}”.`, `هتختار ${talentOf(db, hire.talent_id)?.name} لـ «${b.title}».`)}</p>
        <div className="receipt">
          <div><span>{L("Talent price", "سعر الموهبة")}</span><b>{money(hire.price)}</b></div>
          <div><span>{L("Vitals Crew fee", "رسوم Vitals Crew")} ({FEE * 100}%)</span><b>{money(hire.price * FEE)}</b></div>
          <div className="receipt__t"><span>{L("Total, held in escrow", "الإجمالي، محجوز بأمان")}</span><b>{money(hire.price * (1 + FEE))}</b></div>
        </div>
        <div className="callout callout--ok"><ShieldCheck /><span className="small">{L("The fee covers vetting, QA on every delivery and a free replacement if the talent doesn't deliver. Payment is released only when you approve.", "الرسوم بتغطي الاعتماد ومراجعة الجودة على كل تسليم واستبدال مجاني لو الموهبة ما سلّمتش. المبلغ مايتصرفش غير لما توافق.")}</span></div>
      </div>
    </Modal>}
    {changes && <ChangesModal onClose={() => setChanges(null)} onSend={n => { actions.clientDecide(changes, false, n); setChanges(null); toast(L("Sent to the talent", "اتبعت للموهبة")); }} />}
    <p className="small faint">{L("Posted", "اتنشر")} {ago(b.created_at, lang)}</p>
  </div>;
}

function ChangesModal({ onClose, onSend }: { onClose: () => void; onSend: (n: string) => void }) {
  const { L } = useI18n();
  const [n, setN] = useState("");
  return <Modal title={L("What should change?", "إيه اللي يتغير؟")} onClose={onClose} footer={<><button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button><button className="btn btn--primary" disabled={!n.trim()} onClick={() => onSend(n.trim())}>{L("Send", "ابعت")}</button></>}>
    <textarea className="txt" style={{ minHeight: 110, width: "100%" }} value={n} onChange={e => setN(e.target.value)} autoFocus placeholder={L("Be specific: what, where, why", "حدد: إيه، فين، وليه")} />
  </Modal>;
}

export function Directory() {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const [cat, setCat] = useState<Category | "all">("all");
  const [kind, setKind] = useState<"all" | "solo" | "team">("all");
  const list = db.talents.filter(t => (cat === "all" || t.category === cat) && (kind === "all" || (kind === "solo" ? t.kind === "solo" : t.kind !== "solo")));
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Vetted talent", "المواهب المعتمدة")}</h1><p className="muted">{L(`${db.talents.length} freelancers and teams. Each passed portfolio review, a paid skill test and an interview.`, `${db.talents.length} فريلانسر وفريق. كل واحد عدّى مراجعة البورتفوليو واختبار عملي ومقابلة.`)}</p></div>
      <div className="seg">{([["all", L("All", "الكل")], ["solo", L("Freelancers", "أفراد")], ["team", L("Teams", "فرق")]] as const).map(([k, l]) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{l}</button>)}</div></div>
    <div className="chips"><button className={"chip-btn" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>{L("All skills", "كل المجالات")}</button>{(Object.keys(CAT) as Category[]).map(c => <button key={c} className={"chip-btn" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{L(...CAT[c])}</button>)}</div>
    <div className="grid3">{list.map(t => <TalentCard key={t.id} t={t} footer={<button className="btn btn--sm" onClick={() => nav("/client/new?talent=" + t.id)}>{L("Request", "اطلب")}</button>} />)}</div>
  </div>;
}
