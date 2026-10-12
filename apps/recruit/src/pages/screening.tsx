// Brand Vitals screening: every application lands here first. A screener scores the fit,
// writes one honest line, and either sends the profile to the company or tells the candidate why not.
import { ArrowLeft, Check, ClipboardList, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, actions, appOf, candidateOf, companyOf, jobOf, useDB } from "../store";
import { Avatar, Empty, Fit, LEVEL, StagePill, useToast } from "../ui";
import { CandidateCard } from "./candidate";

export function Queue({ done }: { done?: boolean }) {
  const { L, lang } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const list = db.applications.filter(a => done ? a.stage !== "screening" : a.stage === "screening");
  const over = (at: string) => Date.now() - new Date(at).getTime() > 36 * 3600000;
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{done ? L("Screened", "اتفرزوا") : L("Screening queue", "طابور الفرز")}</h1><p className="muted">{L("Every application gets an answer within 48 hours.", "كل طلب بياخد رد خلال ٤٨ ساعة.")}</p></div></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Applicant", "المتقدم")}</th><th>{L("Job", "الوظيفة")}</th><th>{L("Applied", "اتقدّم")}</th><th>{done ? L("Fit", "التوافق") : L("Due", "الميعاد")}</th>{done && <th>{L("Result", "النتيجة")}</th>}</tr></thead>
      <tbody>{list.length === 0 ? <tr><td colSpan={5}><Empty icon={<ClipboardList />} title={L("Queue is clear", "الطابور فاضي")} /></td></tr> : list.map(a => {
        const c = candidateOf(db, a.candidate_id)!; const j = jobOf(db, a.job_id)!;
        return <tr key={a.id} className="click" onClick={() => nav("/screening/review/" + a.id)}>
          <td><span className="rc-who"><Avatar name={c.name} size="sm" /><span><b>{c.name}</b><span className="small faint">{c.headline}</span></span></span></td>
          <td><b>{j.title}</b><div className="small faint">{companyOf(db, j.company_id).name} · {L(...LEVEL[j.level])}</div></td>
          <td className="small">{ago(a.applied_at, lang)}</td>
          <td>{done ? <Fit n={a.fit} /> : <span className={"pill " + (over(a.applied_at) ? "pill--bad" : "pill--warn")}>{over(a.applied_at) ? L("Due today", "النهارده") : L("Within 48h", "خلال ٤٨ ساعة")}</span>}</td>
          {done && <td><StagePill s={a.stage} /></td>}
        </tr>;
      })}</tbody>
    </table></div></div>
  </div>;
}

export function Review() {
  const { L } = useI18n();
  const { id = "" } = useParams();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const a = appOf(db, id);
  const [fit, setFit] = useState(a?.fit ?? 0);
  const [note, setNote] = useState(a?.screen_note ?? "");
  if (!a) return <div className="page"><Empty icon={<ClipboardList />} title={L("Application not found", "الطلب مش موجود")} /></div>;
  const j = jobOf(db, a.job_id)!;
  const c = candidateOf(db, a.candidate_id)!;
  const co = companyOf(db, j.company_id);
  const ready = fit > 0 && note.trim().length > 10;
  const decide = (pass: boolean) => {
    actions.move(a.id, pass ? "shortlisted" : "not_matched", ME.screener, note.trim(), fit);
    toast(pass ? L(`Sent to ${co.name}`, `اتبعت لـ ${co.name}`) : L("Candidate told, with your note", "المتقدم اتبلغ بملاحظتك"));
    nav("/screening");
  };
  return <div className="page">
    <Link to="/screening" className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{L("Screening queue", "طابور الفرز")}</Link>
    <div className="split rc-split--wide">
      <CandidateCard c={c} contact={false} />
      <div className="stack rc-sticky">
        <div className="card card--pad stack">
          <h3>{j.title}</h3>
          <p className="small muted">{co.name} · {L(...LEVEL[j.level])}</p>
          <ul className="rc-req">{j.requirements.map((r, i) => <li key={i}><Check size={15} />{r}</li>)}</ul>
          {a.cover && <p className="small">“{a.cover}”</p>}
        </div>
        <div className="card card--pad stack">
          <h3><ShieldCheck size={16} /> {L("Your screening", "الفرز بتاعك")}</h3>
          {a.stage !== "screening" && <StagePill s={a.stage} />}
          <div className="field"><span>{L("Fit with this job", "التوافق مع الوظيفة")}</span><div className="rc-fitpick">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={n <= fit ? "on" : ""} onClick={() => setFit(n)} aria-label={`${n}/5`}>{n}</button>)}</div></div>
          <label className="field"><span>{L("One honest line (the company or the candidate reads it)", "سطر واحد بصراحة (الشركة أو المتقدم هيقراه)")}</span><textarea className="txt" style={{ minHeight: 96 }} value={note} onChange={e => setNote(e.target.value)} placeholder={L("Why they fit, or why not, in plain words.", "ليه مناسب أو ليه لأ، بكلام واضح.")} /></label>
          <button className="btn btn--primary btn--block" disabled={!ready} onClick={() => decide(true)}><Check />{L(`Send to ${co.name}`, `ابعته لـ ${co.name}`)}</button>
          <button className="btn btn--block" disabled={!ready} onClick={() => decide(false)}><X />{L("Not a match · tell the candidate", "مش مناسب · بلّغ المتقدم")}</button>
        </div>
      </div>
    </div>
  </div>;
}
