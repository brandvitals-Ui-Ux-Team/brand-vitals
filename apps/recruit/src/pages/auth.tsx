// Sign up and sign in. Everyone starts by saying who they are: a job seeker or a company.
// The Brand Vitals screening team has no public sign-up; their accounts are created by Brand Vitals.
import { ArrowLeft, ArrowRight, Briefcase, Building2, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { DEMO, auth, currentUser, homeOf, useDB, validEmail, type Field, type Role } from "../store";
import { FIELD, ROLE_LABEL, useTheme, useToast } from "../ui";

/** Only follow `next` inside the app, and only into an area the role can open. */
function landing(role: Role, next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return homeOf(role);
  const area: Role | null = next === "/company" || next.startsWith("/company/") ? "company" : next.startsWith("/screening") ? "screening" : /^\/(applications|profile|saved)/.test(next) ? "candidate" : null;
  return area && area !== role ? homeOf(role) : next;
}

function Frame({ who, children }: { who: "candidate" | "company" | "team" | null; children: ReactNode }) {
  const { L, lang, setLang } = useI18n();
  const [theme] = useTheme();
  const points: Record<string, [string, string][]> = {
    candidate: [["One profile for every application. No cover letter required.", "بروفايل واحد لكل طلباتك. من غير جواب تغطية."], ["Brand Vitals reads it and answers within 48 hours.", "Brand Vitals بتقراه وبترد خلال ٤٨ ساعة."], ["Salary shown on every job. No guessing.", "المرتب مكتوب في كل وظيفة. من غير تخمين."], ["Follow each application step by step.", "تابع كل طلب خطوة بخطوة."]],
    company: [["Post a job in one page, with the salary range.", "انشر وظيفة في صفحة واحدة بنطاق المرتب."], ["Brand Vitals screens every applicant first.", "Brand Vitals بتفرز كل متقدم الأول."], ["You meet the matches only, each with a fit score and a note.", "بتقابل المناسبين بس، كل واحد بدرجة توافق وملاحظة."], ["Candidates are told at every step, so your brand stays respected.", "المتقدمين بيتبلغوا في كل خطوة، فاسم شركتك بيفضل محترم."]],
    team: [["Every application lands in your queue, oldest first.", "كل طلب بيوصل طابورك، الأقدم الأول."], ["Score the fit, write one honest line, decide.", "حدّد التوافق، اكتب سطر صريح، وقرّر."], ["Candidates and companies hear back within 48 hours.", "المتقدمين والشركات بيوصلهم رد خلال ٤٨ ساعة."]]
  };
  const list = points[who || "candidate"];
  return <div className="auth rc-auth">
    <aside className="auth__side" aria-label="Vitals Recruit">
      <a href="/recruit.html"><img src={`${import.meta.env.BASE_URL}logo-light.svg`} alt="Vitals Recruit" style={{ height: 30, width: "auto" }} /></a>
      <div style={{ display: "grid", gap: 26 }}>
        <h2>{who === "company" ? L("Meet only the people worth interviewing.", "قابل اللي يستاهلوا المقابلة بس.") : who === "team" ? L("Screening, done properly.", "فرز معمول صح.") : L("Creative and marketing jobs, screened.", "وظايف كرييتيف وماركتينج، متفرزة.")}</h2>
        <ul>{list.map(([en, ar]) => <li key={en}><CheckCircle2 />{L(en, ar)}</li>)}</ul>
      </div>
      <p style={{ color: "#8EA0C4", fontSize: 12 }}>{L("A Brand Vitals company", "إحدى شركات Brand Vitals")}</p>
    </aside>
    <main className="auth__main">
      <div className="auth__box">
        <div className="row row--between">
          <a href="/recruit.html" className="rc-auth__logo"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Recruit" /></a>
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
        </div>
        {children}
      </div>
    </main>
  </div>;
}

function Password({ value, set, auto }: { value: string; set: (v: string) => void; auto: string }) {
  const { L } = useI18n();
  const [show, setShow] = useState(false);
  return <label className="field"><span>{L("Password", "كلمة المرور")}</span>
    <span className="rc-pw"><input className="inp" type={show ? "text" : "password"} value={value} onChange={e => set(e.target.value)} required minLength={auto === "new-password" ? 8 : undefined} autoComplete={auto} dir="ltr" />
      <button type="button" className="icon-btn" onClick={() => setShow(s => !s)} aria-label={show ? L("Hide password", "إخفاء كلمة المرور") : L("Show password", "إظهار كلمة المرور")}>{show ? <EyeOff /> : <Eye />}</button></span>
    {auto === "new-password" && <small>{L("At least 8 characters.", "٨ حروف على الأقل.")}</small>}
  </label>;
}

export function SignIn() {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const team = sp.get("as") === "team";
  const next = sp.get("next");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const u = currentUser(db);
  if (u) return <Navigate replace to={landing(u.role, next)} />;
  const done = (role: Role, name: string) => { toast(L(`Welcome back, ${name.split(" ")[0]}`, `أهلًا بيك تاني يا ${name.split(" ")[0]}`)); nav(landing(role, next), { replace: true }); };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (!validEmail(email)) return setErr(L("Enter a valid email.", "اكتب إيميل صحيح."));
    setBusy(true);
    const r = await auth.signIn(email, pw);
    setBusy(false);
    if (r === "wrong") return setErr(L("That email and password don't match an account.", "الإيميل وكلمة المرور مش مطابقين لأي حساب."));
    if (team && r.role !== "screening") { auth.signOut(); return setErr(L("This sign-in is for the Brand Vitals screening team.", "تسجيل الدخول ده لفريق الفرز في Brand Vitals.")); }
    done(r.role, r.name);
  };
  const demo = (role: Role) => { const x = auth.demo(role); if (x) done(x.role, x.name); };
  const demos: [Role, ReactNode, string, string][] = [["candidate", <UserRound />, "Sara Hassan", "سارة حسن"], ["company", <Building2 />, "Atlas Residences", "أطلس ريزيدنسز"], ["screening", <ShieldCheck />, "Mostafa Ali", "مصطفى علي"]];
  return <Frame who={team ? "team" : null}>
    <div><h1>{team ? L("Brand Vitals team sign-in", "دخول فريق Brand Vitals") : L("Sign in", "تسجيل الدخول")}</h1>
      <p className="muted small">{team ? L("Screening accounts are created by Brand Vitals. There is no public sign-up.", "حسابات الفرز بتعملها Brand Vitals. مفيش تسجيل عام.") : L("Job seekers and companies use the same sign-in. You land on your own home.", "الباحثين عن وظايف والشركات ليهم نفس الدخول. وكل واحد بيدخل على صفحته.")}</p></div>
    <form className="form" onSubmit={submit} noValidate>
      <label className="field"><span>{team ? L("Work email", "إيميل الشغل") : L("Email", "الإيميل")}</span><input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" dir="ltr" autoFocus /></label>
      <Password value={pw} set={setPw} auto="current-password" />
      {err && <p className="rc-err" role="alert">{err}</p>}
      <button className="btn btn--primary btn--lg btn--block" disabled={busy}>{L("Sign in", "تسجيل الدخول")}</button>
    </form>
    {!team && <p className="small rc-center">{L("New here?", "جديد هنا؟")} <Link className="link" to={"/signup" + (next ? "?next=" + encodeURIComponent(next) : "")}>{L("Create an account", "اعمل حساب")}</Link></p>}
    <div className="rc-demo">
      <div className="or">{L("Demo accounts", "حسابات تجريبية")}</div>
      <p className="small faint">{L("Try each side of the same hiring pipeline. Saved in this browser only.", "جرّب كل جانب من نفس خط التوظيف. محفوظة في المتصفح ده بس.")}</p>
      <div className="rc-demo__list">{demos.filter(d => !team || d[0] === "screening").map(([r, ic, en, ar]) => <button key={r} type="button" className="rc-demo__b" onClick={() => demo(r)}>
        {ic}<span><b>{L(...ROLE_LABEL[r])}</b><span className="small faint">{L(en, ar)} · <span dir="ltr">{DEMO[r].email}</span></span></span><ArrowRight size={16} className="flip-rtl" />
      </button>)}</div>
    </div>
    {team ? <p className="small rc-center"><Link className="link" to="/signin">{L("Not on the team? Back to sign-in", "مش من الفريق؟ ارجع لتسجيل الدخول")}</Link></p>
      : <p className="small rc-center faint"><Link className="link" to="/signin?as=team">{L("Brand Vitals team sign-in", "دخول فريق Brand Vitals")}</Link></p>}
  </Frame>;
}

const SIZES = ["1–50", "50–200", "200–500", "500+"];

export function SignUp() {
  const { L } = useI18n();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const as = sp.get("as");
  const role = as === "candidate" || as === "company" ? as : null;
  const next = sp.get("next");
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name: "", email: "", password: "", agree: false, headline: "", fields: [] as Field[], years: "", city: "", title: "", company: "", industry: "", size: SIZES[0] });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const u = currentUser(db);
  if (u) return <Navigate replace to={landing(u.role, next)} />;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }));
  const pick = (r: "candidate" | "company") => { const n = new URLSearchParams(sp); n.set("as", r); setSp(n); setStep(1); setErr(""); };

  if (!role) return <Frame who={null}>
    <div><h1>{L("Join Vitals Recruit", "انضم لـ Vitals Recruit")}</h1><p className="muted small">{L("Tell us who you are. You'll only see what's made for you.", "قولنا إنت مين. هتشوف اللي معمول ليك بس.")}</p></div>
    <div className="rc-pick">
      <button type="button" className="rc-pick__b" onClick={() => pick("candidate")}><span className="rc-pick__ic"><Briefcase /></span><span><b>{L("I'm looking for a job", "بدوّر على وظيفة")}</b><span className="small muted">{L("Build one profile, apply in a tap, and hear back on every application.", "اعمل بروفايل واحد، قدّم بضغطة، وخد رد على كل طلب.")}</span></span><ArrowRight size={18} className="flip-rtl" /></button>
      <button type="button" className="rc-pick__b" onClick={() => pick("company")}><span className="rc-pick__ic"><Building2 /></span><span><b>{L("I'm hiring", "بوظّف")}</b><span className="small muted">{L("Post jobs and meet only applicants Brand Vitals has screened.", "انشر وظايف وقابل بس المتقدمين اللي Brand Vitals فرزتهم.")}</span></span><ArrowRight size={18} className="flip-rtl" /></button>
    </div>
    <p className="small rc-center">{L("Already have an account?", "عندك حساب؟")} <Link className="link" to={"/signin" + (next ? "?next=" + encodeURIComponent(next) : "")}>{L("Sign in", "سجّل الدخول")}</Link></p>
    <p className="small rc-center faint"><Link className="link" to="/signin?as=team">{L("Brand Vitals team sign-in", "دخول فريق Brand Vitals")}</Link></p>
  </Frame>;

  const cand = role === "candidate";
  const step1 = (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (f.name.trim().length < 2) return setErr(L("Enter your full name.", "اكتب اسمك بالكامل."));
    if (!validEmail(f.email)) return setErr(L("Enter a valid email.", "اكتب إيميل صحيح."));
    if (db.users.some(x => x.email.toLowerCase() === f.email.trim().toLowerCase())) return setErr(L("An account with this email already exists. Sign in instead.", "فيه حساب بالإيميل ده. سجّل الدخول بدل كده."));
    if (f.password.length < 8) return setErr(L("Use at least 8 characters for the password.", "استخدم ٨ حروف على الأقل لكلمة المرور."));
    if (!f.agree) return setErr(L("Please agree to the terms and privacy policy.", "لازم توافق على الشروط وسياسة الخصوصية."));
    setStep(2);
  };
  const finish = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    if (cand && !f.headline.trim()) return setErr(L("Add your current or target job title.", "اكتب مسماك الحالي أو اللي بتدوّر عليه."));
    if (cand && !f.fields.length) return setErr(L("Pick at least one field.", "اختار مجال واحد على الأقل."));
    if (!cand && f.company.trim().length < 2) return setErr(L("Enter the company name.", "اكتب اسم الشركة."));
    if (!f.city.trim()) return setErr(L("Enter the city.", "اكتب المدينة."));
    setBusy(true);
    const r = await auth.signUp({ role, name: f.name, email: f.email, password: f.password, headline: f.headline, fields: f.fields, years: Math.max(0, +f.years || 0), city: f.city, title: f.title, company: f.company, industry: f.industry, size: f.size });
    setBusy(false);
    if (r === "taken") { setStep(1); return setErr(L("An account with this email already exists. Sign in instead.", "فيه حساب بالإيميل ده. سجّل الدخول بدل كده.")); }
    toast(cand ? L("Account created. Add your CV to apply.", "الحساب اتعمل. ارفع الـ CV عشان تقدّم.") : L("Account created. Post your first job.", "الحساب اتعمل. انشر أول وظيفة."));
    nav(next ? landing(r.role, next) : cand ? "/profile" : "/company/post", { replace: true });
  };

  return <Frame who={role}>
    <div>
      <button type="button" className="link-btn small" onClick={() => step === 2 ? setStep(1) : pick(cand ? "company" : "candidate")} hidden={step === 1}><ArrowLeft size={15} className="flip-rtl" />{L("Back", "رجوع")}</button>
      <span className="rc-steps-n">{L(`Step ${step} of 2`, `خطوة ${step} من ٢`)} · {L(...ROLE_LABEL[role])}</span>
      <h1>{step === 1 ? (cand ? L("Create your profile", "اعمل بروفايلك") : L("Create your company account", "اعمل حساب شركتك")) : cand ? L("About your career", "عن شغلك") : L("About the company", "عن الشركة")}</h1>
      {step === 1 && <p className="small muted">{cand ? L("Hiring?", "بتوظّف؟") : L("Looking for a job?", "بتدوّر على وظيفة؟")} <button type="button" className="link" onClick={() => pick(cand ? "company" : "candidate")}>{cand ? L("Create a company account", "اعمل حساب شركة") : L("Create a job seeker profile", "اعمل بروفايل باحث عن وظيفة")}</button></p>}
    </div>
    {step === 1 ? <form className="form" onSubmit={step1} noValidate>
      <label className="field"><span>{L("Full name", "الاسم بالكامل")}</span><input className="inp" value={f.name} onChange={e => set("name", e.target.value)} required autoComplete="name" autoFocus /></label>
      {!cand && <label className="field"><span>{L("Your job title", "مسماك الوظيفي")}</span><input className="inp" value={f.title} onChange={e => set("title", e.target.value)} placeholder={L("HR Manager", "مدير موارد بشرية")} autoComplete="organization-title" /></label>}
      <label className="field"><span>{cand ? L("Email", "الإيميل") : L("Work email", "إيميل الشغل")}</span><input className="inp" type="email" value={f.email} onChange={e => set("email", e.target.value)} required autoComplete="email" dir="ltr" /></label>
      <Password value={f.password} set={v => set("password", v)} auto="new-password" />
      <label className="rc-check rc-check--plain"><input type="checkbox" checked={f.agree} onChange={e => set("agree", e.target.checked)} /><span className="small">{L("I agree to the ", "موافق على ")}<a className="link" href="/terms.html" target="_blank" rel="noopener">{L("Terms", "الشروط")}</a>{L(" and the ", " و")}<a className="link" href="/privacy.html" target="_blank" rel="noopener">{L("Privacy Policy", "سياسة الخصوصية")}</a>.</span></label>
      {err && <p className="rc-err" role="alert">{err}</p>}
      <button className="btn btn--primary btn--lg btn--block">{L("Continue", "كمّل")}<ArrowRight className="flip-rtl" /></button>
    </form> : <form className="form" onSubmit={finish} noValidate>
      {cand ? <>
        <label className="field"><span>{L("Current or target job title", "مسماك الحالي أو اللي بتدوّر عليه")}</span><input className="inp" value={f.headline} onChange={e => set("headline", e.target.value)} placeholder={L("Social Media Specialist", "أخصائي سوشيال ميديا")} autoFocus /></label>
        <div className="field"><span>{L("Fields you want to work in", "المجالات اللي عايز تشتغل فيها")}</span><div className="chips">{(Object.keys(FIELD) as Field[]).map(x => <button key={x} type="button" className={"chip-btn" + (f.fields.includes(x) ? " on" : "")} aria-pressed={f.fields.includes(x)} onClick={() => set("fields", f.fields.includes(x) ? f.fields.filter(y => y !== x) : [...f.fields, x])}>{L(...FIELD[x])}</button>)}</div></div>
        <div className="grid2">
          <label className="field"><span>{L("Years of experience", "سنين الخبرة")}</span><input className="inp" type="number" inputMode="numeric" min={0} max={40} value={f.years} onChange={e => set("years", e.target.value)} placeholder="0" /></label>
          <label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={f.city} onChange={e => set("city", e.target.value)} placeholder={L("Cairo, Riyadh…", "القاهرة، الرياض…")} autoComplete="address-level2" /></label>
        </div>
      </> : <>
        <label className="field"><span>{L("Company name", "اسم الشركة")}</span><input className="inp" value={f.company} onChange={e => set("company", e.target.value)} autoComplete="organization" autoFocus /></label>
        <label className="field"><span>{L("Industry", "المجال")}</span><input className="inp" value={f.industry} onChange={e => set("industry", e.target.value)} placeholder={L("Real estate, retail, agency…", "عقارات، تجزئة، وكالة…")} /></label>
        <div className="grid2">
          <label className="field"><span>{L("City", "المدينة")}</span><input className="inp" value={f.city} onChange={e => set("city", e.target.value)} placeholder={L("Cairo, Riyadh…", "القاهرة، الرياض…")} /></label>
          <label className="field"><span>{L("Company size", "حجم الشركة")}</span><select className="sel" value={f.size} onChange={e => set("size", e.target.value)}>{SIZES.map(x => <option key={x} value={x}>{L(`${x} employees`, `${x} موظف`)}</option>)}</select></label>
        </div>
      </>}
      {err && <p className="rc-err" role="alert">{err}</p>}
      <button className="btn btn--primary btn--lg btn--block" disabled={busy}><Sparkles />{cand ? L("Create my profile", "اعمل بروفايلي") : L("Create company account", "اعمل حساب الشركة")}</button>
    </form>}
  </Frame>;
}
