// Joining Vitals Crew = submitting a portfolio for review. Nobody gets a working account by
// signing up: the dashboard stays locked until a reviewer approves portfolio, test and interview.
import { ArrowLeft, ArrowRight, Check, ImagePlus, Lock, LogIn, PartyPopper, ShieldCheck, Sparkles, Trash2, UploadCloud, User, Users } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { TheRules } from "../components/guarantee";
import { APP_STEPS, Art, CAT, LevelBadge, StagePill, Stepper, appDone, useToast } from "../components/ui";
import { fileToDataUrl } from "../lib/image";
import { actions, useDB } from "../lib/store";
import type { Category, Piece, TalentKind } from "../lib/types";
import { MkNav } from "./shared";

const MIN_PIECES = 3, MAX_PIECES = 8;
const SAMPLES: Record<Category, string[]> = {
  design: ["New seasonal menu post", "Weekend offer story", "Cold brew launch carousel"], motion: ["Latte art reel", "Launch film · rough cut", "Vitamin C serum ad · UGC"],
  video: ["Vitamin C serum ad · UGC", "Barista story post", "Launch film · rough cut"], copy: ["Ramadan bundle static", "New seasonal menu post", "Weekend offer story"],
  social: ["Ramadan bundle static", "Weekend offer story", "Cold brew launch carousel"], web: ["Key visual · Family courtyard", "Key visual · Sunset terrace", "New seasonal menu post"],
  ads: ["Cold brew launch carousel", "Vitamin C serum ad · UGC", "Ramadan bundle static"], photo: ["Barista story post", "Key visual · Sunset terrace", "Key visual · Family courtyard"]
};
const myAppKey = "crew-my-application";
const getMine = () => { try { return localStorage.getItem(myAppKey); } catch { return null; } };
const setMine = (id: string | null) => { try { if (id) localStorage.setItem(myAppKey, id); else localStorage.removeItem(myAppKey); } catch { /* ignore */ } };

function Frame({ children, hero }: { children: ReactNode; hero?: ReactNode }) {
  return <div className="mk">
    <MkNav light />
    {hero}
    <div className="join">{children}</div>
  </div>;
}

// Hero 2 · "the fan": a fanned stack of real portfolio pieces above a centered headline.
function FanHero({ pieces }: { pieces: string[] }) {
  const { L } = useI18n();
  return <section className="fan-hero">
    <div className="fan" aria-hidden>{pieces.slice(0, 5).map((p, i) => <Art key={i} title={p} />)}</div>
    <span className="mk-eyebrow"><ShieldCheck size={14} />{L("Reviewed by people, 100%", "مراجعة بشرية ١٠٠٪")}</span>
    <h1>{L("Show us your", "ورّينا")} <span className="mk-grad-text">{L("best work.", "أحسن شغلك.")}</span></h1>
    <p>{L("Joining Vitals Crew starts with your portfolio, not a signup form. A reviewer looks at every piece, then a paid test and a short interview.", "الانضمام لـ Vitals Crew بيبدأ بالبورتفوليو، مش فورم تسجيل. مراجع بيشوف كل قطعة، وبعدين اختبار عملي مدفوع ومقابلة قصيرة.")}</p>
  </section>;
}

export function Join() {
  const { L } = useI18n();
  const toast = useToast();
  const db = useDB();
  const [id, setId] = useState<string | null>(getMine);
  const [step, setStep] = useState(0);
  const [signin, setSignin] = useState(false);
  const [f, setF] = useState({ name: "", email: "", title: "", city: "", category: "design" as Category, kind: "solo" as TalentKind, members: 1, links: "" });
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [agree, setAgree] = useState({ own: false, rules: false });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mine = db.applications.find(a => a.id === id);
  if (mine) return <Frame><Status appId={mine.id} onNew={() => { setMine(null); setId(null); setStep(0); }} /></Frame>;

  const okYou = f.name.trim().length > 1 && /\S+@\S+\.\S+/.test(f.email) && f.title.trim().length > 1;
  const okWork = pieces.length >= MIN_PIECES && pieces.every(p => p.title.trim());
  const add = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    try {
      const room = MAX_PIECES - pieces.length;
      const next: Piece[] = [];
      for (const file of Array.from(files).slice(0, room)) next.push({ title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), src: await fileToDataUrl(file), role: "solo" });
      setPieces(p => [...p, ...next]);
    } catch (e) { toast(String((e as Error).message), true); } finally { setBusy(false); }
  };
  const submit = () => {
    const nid = actions.apply({ ...f, portfolio: [], pieces });
    setMine(nid); setId(nid); toast(L("Portfolio sent for review", "البورتفوليو اتبعت للمراجعة"));
  };
  const steps = [L("You", "انت"), L("Portfolio", "البورتفوليو"), L("The rules", "القواعد")];

  const fanPieces = pieces.length >= 3 ? pieces.map(p => p.src) : SAMPLES[f.category].concat(["Latte art reel", "Ramadan bundle static"]);
  if (signin) return <Frame><SignIn onBack={() => setSignin(false)} onFound={x => { setMine(x); setId(x); }} /></Frame>;
  return <Frame hero={<FanHero pieces={fanPieces} />}>
    <div style={{ textAlign: "center" }}><button className="link-btn small" onClick={() => setSignin(true)}><LogIn size={14} />{L("Already applied? Check your status", "قدّمت قبل كده؟ شوف حالتك")}</button></div>
    <ol className="wizard">{steps.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}><span>{i < step ? <Check size={14} /> : i + 1}</span>{s}</li>)}</ol>

    <div className="card join__card">
      {step === 0 && <div className="form">
        <div className="grid2">
          <button type="button" className={"choice choice--big" + (f.kind === "solo" ? " on" : "")} onClick={() => setF({ ...f, kind: "solo", members: 1 })}><User /><b>{L("I'm a freelancer", "أنا فريلانسر")}</b><span className="small muted">{L("Just me", "لوحدي")}</span></button>
          <button type="button" className={"choice choice--big" + (f.kind === "team" ? " on" : "")} onClick={() => setF({ ...f, kind: "team", members: Math.max(2, f.members) })}><Users /><b>{L("We're a team", "إحنا فريق")}</b><span className="small muted">{L("A studio or a crew", "استوديو أو فريق")}</span></button>
        </div>
        <div className="form-row">
          <label className="field"><span>{f.kind === "team" ? L("Team name", "اسم الفريق") : L("Full name", "الاسم بالكامل")}</span><input className="inp" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
          <label className="field"><span>{L("Email", "الإيميل")}</span><input className="inp" type="email" dir="ltr" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="you@studio.com" /></label>
        </div>
        <div className="form-row">
          <label className="field"><span>{L("What you do", "بتعمل إيه")}</span><input className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder={L("e.g. Motion designer", "مثلًا: مصمم موشن")} /></label>
          {f.kind === "team" ? <label className="field"><span>{L("Team size", "عدد الفريق")}</span><input className="inp" type="number" min={2} value={f.members} onChange={e => setF({ ...f, members: Math.max(2, +e.target.value) })} /></label>
            : <label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></label>}
        </div>
        <div className="field"><span>{L("Main skill", "المجال الأساسي")}</span><div className="chips">{(Object.keys(CAT) as Category[]).map(c => <button key={c} type="button" className={"chip-btn" + (f.category === c ? " on" : "")} onClick={() => setF({ ...f, category: c })}>{L(...CAT[c])}</button>)}</div></div>
      </div>}

      {step === 1 && <div className="form">
        <div className="row row--between"><div><h2>{L("Your best work", "أحسن شغلك")}</h2><p className="small muted">{L(`At least ${MIN_PIECES} pieces, up to ${MAX_PIECES}. Real client work beats concepts.`, `${MIN_PIECES} قطع على الأقل ولحد ${MAX_PIECES}. شغل عملاء حقيقي أحسن من الكونسبت.`)}</p></div>
          <span className={"counter" + (pieces.length >= MIN_PIECES ? " ok" : "")}>{pieces.length}/{MIN_PIECES}+</span></div>
        <div className="drop-zone" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files); }}>
          <UploadCloud /><b>{busy ? L("Preparing…", "بنجهّز…") : L("Drop images here or click to upload", "اسحب الصور هنا أو اضغط للرفع")}</b><span className="small muted">JPG · PNG · WebP</span>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = ""; }} />
        </div>
        {pieces.length < MIN_PIECES && <button type="button" className="link-btn small" onClick={() => setPieces(SAMPLES[f.category].map(t => ({ title: t, src: t, role: "solo" })))}><Sparkles size={14} />{L("Demo: fill with sample pieces", "تجربة: املا بقطع نموذجية")}</button>}
        <div className="pieces">{pieces.map((p, i) => <div key={i} className="piece">
          <Art title={p.src} alt={p.title} />
          <input className="inp" value={p.title} onChange={e => setPieces(ps => ps.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder={L("Project name", "اسم المشروع")} />
          <div className="row row--between">
            <select className="sel" value={p.role} onChange={e => setPieces(ps => ps.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
              <option value="solo">{L("I did it all", "عملته كله")}</option><option value="lead">{L("I led it", "كنت القائد")}</option><option value="part">{L("Part of a team", "جزء من فريق")}</option>
            </select>
            <button className="icon-btn" onClick={() => setPieces(ps => ps.filter((_, j) => j !== i))} aria-label={L("Remove", "حذف")}><Trash2 /></button>
          </div>
        </div>)}
          {pieces.length > 0 && pieces.length < MAX_PIECES && <button className="piece piece--add" onClick={() => fileRef.current?.click()}><ImagePlus /><span className="small">{L("Add more", "أضف كمان")}</span></button>}
        </div>
        <label className="field"><span>{L("Links (Behance, Dribbble, Instagram, Vimeo)", "لينكات (بيهانس، دريبل، إنستجرام، ڤيميو)")}</span><input className="inp" dir="ltr" value={f.links} onChange={e => setF({ ...f, links: e.target.value })} placeholder="behance.net/you" /></label>
      </div>}

      {step === 2 && <div className="form">
        <h2>{L("How Crew works", "Crew بتشتغل إزاي")}</h2>
        <TheRules compact />
        <label className="check"><input type="checkbox" checked={agree.own} onChange={e => setAgree({ ...agree, own: e.target.checked })} />{L("All pieces are mine or my team's, and I'm allowed to show them.", "كل القطع شغلي أو شغل فريقي، ومسموحلي أعرضها.")}</label>
        <label className="check"><input type="checkbox" checked={agree.rules} onChange={e => setAgree({ ...agree, rules: e.target.checked })} />{L("I accept the quality rules: work can move to another member after 3 QA rounds or 2 off-brief client rejections.", "موافق على قواعد الجودة: الشغلانة ممكن تتحول لعضو تاني بعد ٣ جولات مراجعة أو رفضين من العميل لعدم المطابقة.")}</label>
      </div>}
    </div>

    <div className="row row--between">
      {step > 0 ? <button className="btn btn--lg" onClick={() => setStep(step - 1)}><ArrowLeft className="flip-rtl" />{L("Back", "رجوع")}</button> : <span />}
      {step < 2 ? <button className="btn btn--primary btn--lg" disabled={step === 0 ? !okYou : !okWork} onClick={() => setStep(step + 1)}>{L("Next", "التالي")}<ArrowRight className="flip-rtl" /></button>
        : <button className="btn btn--primary btn--lg" disabled={!agree.own || !agree.rules} onClick={submit}><ShieldCheck />{L("Send my portfolio for review", "ابعت البورتفوليو للمراجعة")}</button>}
    </div>
  </Frame>;
}

function SignIn({ onBack, onFound }: { onBack: () => void; onFound: (id: string) => void }) {
  const { L } = useI18n();
  const db = useDB();
  const [email, setEmail] = useState("");
  const [miss, setMiss] = useState(false);
  const go = () => { const a = db.applications.find(x => x.email.toLowerCase() === email.trim().toLowerCase()); if (a) onFound(a.id); else setMiss(true); };
  return <div className="card join__card form" style={{ maxWidth: 480, marginInline: "auto" }}>
    <h2>{L("Check your application", "تابع طلبك")}</h2>
    <label className="field"><span>{L("The email you applied with", "الإيميل اللي قدّمت بيه")}</span><input className="inp" type="email" dir="ltr" value={email} onChange={e => { setEmail(e.target.value); setMiss(false); }} onKeyDown={e => e.key === "Enter" && go()} autoFocus /></label>
    {miss && <p className="small" style={{ color: "var(--bad)" }}>{L("No application with this email.", "مفيش طلب بالإيميل ده.")}</p>}
    <p className="small faint">{L("Demo emails: omar.fathy@example.com, frame.lab@example.com", "إيميلات تجريبية: omar.fathy@example.com، frame.lab@example.com")}</p>
    <div className="row row--between"><button className="btn" onClick={onBack}>{L("Back", "رجوع")}</button><button className="btn btn--primary" onClick={go}><LogIn />{L("Continue", "كمّل")}</button></div>
  </div>;
}

function Status({ appId, onNew }: { appId: string; onNew: () => void }) {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const a = db.applications.find(x => x.id === appId)!;
  const last = a.history.at(-1);
  const talentId = "t-" + a.id;
  const approved = a.stage === "approved" && db.talents.some(t => t.id === talentId);
  return <div className="stack" style={{ gap: 18 }}>
    <div className={"status-hero" + (approved ? " status-hero--ok" : a.stage === "rejected" ? " status-hero--bad" : "")}>
      {approved ? <PartyPopper /> : a.stage === "rejected" ? <Lock /> : <ShieldCheck />}
      <div><h1>{approved ? L(`You're in, ${a.name.split(" ")[0]}!`, `اتقبلت يا ${a.name.split(" ")[0]}!`) : a.stage === "rejected" ? L("Not this time", "مش المرة دي") : L("Your portfolio is with our reviewers", "البورتفوليو عند المراجعين")}</h1>
        <p>{approved ? L("Your dashboard is unlocked. Briefs that match your skills are waiting.", "الداشبورد اتفتح. البريفات المناسبة لمجالك مستنياك.") : a.stage === "rejected" ? (last?.note || "") : L("Your dashboard unlocks when a reviewer approves you. Usually within 3 working days per step.", "الداشبورد بيتفتح لما مراجع يوافق عليك. غالبًا خلال ٣ أيام عمل لكل مرحلة.")}</p></div>
      <StagePill s={a.stage} />
    </div>
    <div className="card card--pad"><Stepper steps={APP_STEPS} done={appDone(a.stage)} active={a.stage !== "rejected"} /></div>
    {last && a.stage !== "rejected" && <div className="hint"><ShieldCheck />{L("Reviewer", "المراجع")} {last.by}: {last.note}</div>}
    {approved ? <div className="row"><button className="btn btn--primary btn--lg" onClick={() => { actions.setTalent(talentId); nav("/talent"); }}>{L("Open my dashboard", "افتح الداشبورد")}<ArrowRight className="flip-rtl" /></button>{a.level && <LevelBadge level={a.level} />}</div>
      : <div className="locked card">
        <div className="locked__veil"><Lock /><b>{L("Locked until you're approved", "مقفول لحد ما تتقبل")}</b><span className="small">{L("No one works on Vitals Crew without passing review.", "محدش بيشتغل على Vitals Crew من غير ما يعدّي المراجعة.")}</span></div>
        <div className="grid3 locked__fake">{[L("Matched briefs", "بريفات مناسبة"), L("Escrow for you", "محجوز ليك"), L("Your level", "مستواك")].map(x => <div key={x} className="card kpi"><span className="kpi__l">{x}</span><span className="kpi__v">••</span></div>)}</div>
      </div>}
    <div className="card card--pad stack"><h3>{L("What you sent", "اللي بعته")}</h3><div className="pieces pieces--static">{(a.pieces.length ? a.pieces : a.portfolio.map(t => ({ title: t, src: t, role: "" }))).map((p, i) => <div key={i} className="piece"><Art title={p.src} alt={p.title} /><span className="small ellipsis">{p.title}</span></div>)}</div></div>
    <p className="small faint">{L("Demo tip: open the Review view, approve this application step by step, then come back here.", "جرّب: افتح عرض المراجعة، ووافق على الطلب ده خطوة بخطوة، وارجع هنا.")} <Link to="/ops/applications" className="link">{L("Open Review", "افتح المراجعة")}</Link> · <button className="link-btn small" onClick={onNew}>{L("Start a new application", "قدّم طلب جديد")}</button></p>
  </div>;
}
