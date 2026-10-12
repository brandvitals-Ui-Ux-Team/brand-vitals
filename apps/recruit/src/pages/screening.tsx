// Brand Vitals screening: every application lands here first. A screener scores the fit,
// writes one honest line, and either sends the profile to the company or tells the candidate why not.
import { ArrowLeft, Check, ClipboardList, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ago } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, actions, appOf, candidateOf, companyOf, jobOf, matchScore, skillMatch, useDB } from "../store";
import { Avatar, Empty, Fit, LEVEL, Match, StagePill, useT, useToast } from "../ui";
import { CandidateCard } from "./candidate";

export function Queue({ done }: { done?: boolean }) {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const nav = useNavigate();
  const list = db.applications.filter(a => done ? a.stage !== "screening" : a.stage === "screening").sort((a, b) => done ? b.applied_at.localeCompare(a.applied_at) : a.applied_at.localeCompare(b.applied_at));
  const over = (at: string) => Date.now() - new Date(at).getTime() > 36 * 3600000;
  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{done ? L("Screened", "اتفرزوا") : L("Screening queue", "طابور الفرز")}</h1><p className="muted">{done ? L("Every decision, with the note the company or candidate read.", "كل قرار، بالملاحظة اللي الشركة أو المتقدم قراها.") : L("Oldest first. Every application gets an answer within 48 hours.", "الأقدم الأول. كل طلب بياخد رد خلال ٤٨ ساعة.")}</p></div></div>
    <div className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>{L("Applicant", "المتقدم")}</th><th>{L("Job", "الوظيفة")}</th><th>{L("Applied", "اتقدّم")}</th><th>{L("Auto match", "التوافق التلقائي")}</th><th>{done ? L("Result", "النتيجة") : L("Due", "الميعاد")}</th></tr></thead>
      <tbody>{list.length === 0 ? <tr><td colSpan={5}><Empty icon={<ClipboardList />} title={L("Queue is clear", "الطابور فاضي")} /></td></tr> : list.map(a => {
        const c = candidateOf(db, a.candidate_id)!; const j = jobOf(db, a.job_id)!;
        return <tr key={a.id} className="click" onClick={() => nav("/screening/review/" + a.id)}>
          <td><span className="rc-who"><Avatar name={c.name} size="sm" /><span><b>{T(c.name, c.name_ar)}</b><span className="small faint">{T(c.headline, c.headline_ar)}</span></span></span></td>
          <td><b>{T(j.title, j.title_ar)}</b><div className="small faint">{T(companyOf(db, j.company_id).name, companyOf(db, j.company_id).name_ar)} · {L(...LEVEL[j.level])}</div></td>
          <td className="small">{ago(a.applied_at, lang)}</td>
          <td>{done ? <Fit n={a.fit} /> : <Match pct={matchScore(c, j)} />}</td>
          <td>{done ? <StagePill s={a.stage} /> : <span className={"pill " + (over(a.applied_at) ? "pill--bad" : "pill--warn")}>{over(a.applied_at) ? L("Due today", "النهارده") : L("Within 48h", "خلال ٤٨ ساعة")}</span>}</td>
        </tr>;
      })}</tbody>
    </table></div></div>
  </div>;
}

export function Review() {
  const { L, lang } = useI18n();
  const T = useT();
  const { id = "" } = useParams();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const a = appOf(db, id);
  const [fit, setFit] = useState(a?.fit ?? 0);
  const [note, setNote] = useState(a ? T(a.screen_note, a.screen_note_ar) : "");
  if (!a) return <div className="page"><Empty icon={<ClipboardList />} title={L("Application not found", "الطلب مش موجود")} /></div>;
  const j = jobOf(db, a.job_id)!;
  const c = candidateOf(db, a.candidate_id)!;
  const co = companyOf(db, j.company_id);
  const sm = skillMatch(c, j);
  const pending = a.stage === "screening";
  const ready = fit > 0 && note.trim().length > 10;
  const reqs = lang === "ar" && j.requirements_ar.length ? j.requirements_ar : j.requirements;
  const decide = (pass: boolean) => {
    actions.move(a.id, pass ? "shortlisted" : "not_matched", ME.screener, note.trim(), fit);
    toast(pass ? L(`Sent to ${co.name}`, `اتبعت لـ ${co.name_ar}`) : L("Candidate told, with your note", "المتقدم اتبلغ بملاحظتك"));
    nav("/screening");
  };
  return <div className="page">
    <Link to={pending ? "/screening" : "/screening/done"} className="link-btn small"><ArrowLeft size={15} className="flip-rtl" />{pending ? L("Screening queue", "طابور الفرز") : L("Screened", "اتفرزوا")}</Link>
    <div className="split rc-split--wide">
      <CandidateCard c={c} contact={false} />
      <div className="stack rc-sticky">
        <div className="card card--pad stack">
          <h3>{T(j.title, j.title_ar)}</h3>
          <p className="small muted">{T(co.name, co.name_ar)} · {L(...LEVEL[j.level])} · {L(`${j.exp_min}–${j.exp_max} years`, `${j.exp_min}–${j.exp_max} سنين`)}</p>
          <ul className="rc-req">{reqs.map((r, i) => <li key={i}><Check size={15} />{r}</li>)}</ul>
          {a.cover && <p className="small">“{a.cover}”</p>}
        </div>
        <div className="card card--pad stack">
          <div className="rc-row" style={{ justifyContent: "space-between" }}><h3><Sparkles size={16} /> {L("Auto match", "التوافق التلقائي")}</h3><Match pct={matchScore(c, j)} /></div>
          <p className="small">{L(`Skills: ${sm.have.length} of ${j.skills.length}`, `المهارات: ${sm.have.length} من ${j.skills.length}`)}{sm.missing.length ? " · " + L("missing ", "ناقص ") + sm.missing.join(L(", ", "، ")) : ""}</p>
          <p className="small muted">{L(`${c.years} years of experience; the job asks ${j.exp_min}–${j.exp_max}.`, `${c.years} سنين خبرة؛ والوظيفة طالبة ${j.exp_min}–${j.exp_max}.`)} {L("A hint only. The decision is yours.", "ده مؤشر بس. القرار ليك.")}</p>
        </div>
        <div className="card card--pad stack">
          <h3><ShieldCheck size={16} /> {L("Your screening", "الفرز بتاعك")}</h3>
          {!pending && <StagePill s={a.stage} />}
          <div className="field"><span>{L("Fit with this job", "التوافق مع الوظيفة")}</span><div className="rc-fitpick">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={n <= fit ? "on" : ""} onClick={() => setFit(n)} aria-label={`${n}/5`} disabled={!pending}>{n}</button>)}</div></div>
          <label className="field"><span>{L("One honest line (the company or the candidate reads it)", "سطر واحد بصراحة (الشركة أو المتقدم هيقراه)")}</span><textarea className="txt" style={{ minHeight: 96 }} value={note} readOnly={!pending} onChange={e => setNote(e.target.value)} placeholder={L("Why they fit, or why not, in plain words.", "ليه مناسب أو ليه لأ، بكلام واضح.")} /></label>
          {pending && <>
            <button className="btn btn--primary btn--block" disabled={!ready} onClick={() => decide(true)}><Check />{L(`Send to ${co.name}`, `ابعته لـ ${co.name_ar}`)}</button>
            <button className="btn btn--block" disabled={!ready} onClick={() => decide(false)}><X />{L("Not a match · tell the candidate", "مش مناسب · بلّغ المتقدم")}</button>
            {!ready && <p className="small faint">{L("Pick a fit score and write at least one line.", "اختار درجة توافق واكتب سطر على الأقل.")}</p>}
          </>}
        </div>
      </div>
    </div>
  </div>;
}
