// Shared pieces for Vitals Hire: labels, pills, the application pipeline, job cards, toasts,
// notifications and the plain dashboard frame. Each account has one role, so the frame shows only that role's menu.
import { AlertCircle, Bell, Bookmark, BookmarkCheck, Briefcase, Building2, CheckCircle2, ClipboardList, FilePlus2, Home, LogOut, MapPin, Menu, Moon, RotateCcw, Search, ShieldCheck, Sun, UserRound, UserPlus, X, ShieldAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ago, initials, money as fmtMoney } from "../../hq/src/lib/format";
import { useI18n } from "../../hq/src/lib/i18n";
import { ME, VISIBLE_TO_COMPANY, actions, auth, candidateOf, companyOf, currentUser, homeOf, justSignedOut, matchScore, notesFor, resetDemo, savedOf, useDB, type Company, type Edu, type Field, type Job, type JobType, type Level, type Role, type Stage, type WorkMode } from "./store";

export const FIELD: Record<Field, [string, string]> = {
  design: ["Design", "تصميم"], content: ["Content", "محتوى"], media: ["Media buying", "شراء إعلانات"], social: ["Social media", "سوشيال ميديا"],
  brand: ["Brand & strategy", "براند واستراتيجية"], motion: ["Motion & video", "موشن وفيديو"], performance: ["Performance marketing", "تسويق أداء"], pr: ["PR & communications", "علاقات عامة"]
};
export const TYPE: Record<JobType, [string, string]> = { full_time: ["Full-time", "دوام كامل"], part_time: ["Part-time", "دوام جزئي"], contract: ["Contract", "عقد مؤقت"] };
export const MODE: Record<WorkMode, [string, string]> = { onsite: ["On-site", "من المكتب"], hybrid: ["Hybrid", "هجين"], remote: ["Remote", "عن بُعد"] };
export const LEVEL: Record<Level, [string, string]> = { junior: ["Junior", "مبتدئ"], mid: ["Mid-level", "متوسط"], senior: ["Senior", "خبير"], lead: ["Lead", "قيادي"] };
export const EDU: Record<Edu, [string, string]> = { any: ["Not required", "مش شرط"], bachelor: ["Bachelor's degree", "بكالوريوس"], master: ["Master's degree", "ماجستير"] };

/** Picks the Arabic version when the app is in Arabic and one exists. */
export function useT() {
  const { L } = useI18n();
  return (en: string, ar?: string) => L(en, ar || en);
}
export function useMoney() {
  const { lang } = useI18n();
  return (n: number, c = "EGP") => fmtMoney(n, c, lang);
}
export function useSalary() {
  const money = useMoney();
  const { L } = useI18n();
  return (min: number, max: number, c: string) => `${money(min, c)} – ${money(max, c)} ${L("/ month", "/ شهريًا")}`;
}

// ---------- the candidate's view of an application ----------
export const PIPE: [string, string][] = [["Applied", "اتقدّم"], ["Screened by Brand Vitals", "اتفرز من Brand Vitals"], ["With the company", "عند الشركة"], ["Interview", "مقابلة"], ["Offer", "عرض"]];
export const pipeDone = (s: Stage) => ({ screening: 1, not_matched: 2, shortlisted: 2, interview: 3, offer: 4, hired: 5, not_selected: 3 })[s];

export function StagePill({ s, company }: { s: Stage; company?: boolean }) {
  const { L } = useI18n();
  const m: Record<Stage, [string, string, string]> = {
    screening: ["pill--warn", "Being screened", "قيد الفرز"], not_matched: ["pill--bad", "Not a match", "مش مناسب"],
    shortlisted: ["pill--info", company ? "New · screened" : "Sent to the company", company ? "جديد · اتفرز" : "اتبعت للشركة"], interview: ["pill--violet", "Interview", "مقابلة"],
    offer: ["pill--ok", "Offer", "عرض"], hired: ["pill--ok", "Hired", "اتعيّن"], not_selected: ["", "Not selected", "لم يتم الاختيار"]
  };
  const [c, en, ar] = m[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}

export function Pipeline({ s }: { s: Stage }) {
  const { L } = useI18n();
  const done = pipeDone(s);
  const stopped = s === "not_matched" || s === "not_selected" || s === "hired";
  return <ol className="rc-pipe">{PIPE.map(([en, ar], i) => <li key={i} className={i < done ? "done" : i === done && !stopped ? "now" : ""}>
    <span className="rc-pipe__dot">{i < done ? <CheckCircle2 size={15} /> : i + 1}</span><span>{L(en, ar)}</span>
  </li>)}</ol>;
}

export function Fit({ n }: { n: number | null }) {
  const { L } = useI18n();
  if (n == null) return <span className="faint small">—</span>;
  return <span className="rc-fit" title={L(`Fit ${n} of 5`, `التوافق ${n} من 5`)}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? "on" : ""} />)}<b>{n}/5</b></span>;
}
export function Match({ pct }: { pct: number }) {
  const { L } = useI18n();
  const tone = pct >= 75 ? "hi" : pct >= 50 ? "mid" : "lo";
  return <span className={"rc-match rc-match--" + tone} title={L("How your profile matches this job", "بروفايلك مناسب للوظيفة دي قد إيه")}>{L(`${pct}% match`, `توافق ${pct}٪`)}</span>;
}

export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" | "xl" }) {
  return <span className={"avatar rc-av" + (size ? " avatar--" + size : "")}>{initials(name)}</span>;
}
export function Logo({ co, size }: { co: Company; size?: "lg" }) {
  return <span className={"rc-co" + (size ? " rc-co--lg" : "")} style={{ background: co.color }}>{initials(co.name)}</span>;
}
export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty">{icon}<h3>{title}</h3>{text && <p className="small">{text}</p>}{action}</div>;
}

/** Sends a signed-out visitor to sign up as a candidate, then back here. */
export function useNeedCandidate() {
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const { L } = useI18n();
  return (why: [string, string]) => { toast(L(...why)); nav("/signup?as=candidate&next=" + encodeURIComponent(loc.pathname + loc.search)); };
}

export function SaveBtn({ id, label }: { id: string; label?: boolean }) {
  const { L } = useI18n();
  const db = useDB();
  const toast = useToast();
  const need = useNeedCandidate();
  if (ME.role && ME.role !== "candidate") return null;
  const on = !!ME.candidate && savedOf(db, ME.candidate).includes(id);
  return <button type="button" className={"rc-save" + (on ? " on" : "") + (label ? " rc-save--label" : "")} aria-pressed={on} aria-label={on ? L("Unsave job", "إلغاء الحفظ") : L("Save job", "احفظ الوظيفة")}
    onClick={e => {
      e.preventDefault(); e.stopPropagation();
      if (!ME.candidate) return need(["Create a free profile to save jobs.", "اعمل بروفايل مجاني عشان تحفظ الوظايف."]);
      actions.toggleSave(id); toast(on ? L("Removed from saved jobs", "اتشالت من المحفوظات") : L("Saved. Find it under Saved jobs.", "اتحفظت. هتلاقيها في الوظايف المحفوظة."));
    }}>
    {on ? <BookmarkCheck /> : <Bookmark />}{label && <span>{on ? L("Saved", "محفوظة") : L("Save", "احفظ")}</span>}
  </button>;
}

/** Job card used in search, saved jobs, similar jobs and company pages. */
export function JobCard({ j, compact }: { j: Job; compact?: boolean }) {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const salary = useSalary();
  const co = companyOf(db, j.company_id);
  const me = candidateOf(db, ME.candidate);
  const applied = !!me && db.applications.some(a => a.job_id === j.id && a.candidate_id === me.id);
  const fresh = Date.now() - new Date(j.posted_at).getTime() < 2 * 86400000;
  const count = db.applications.filter(a => a.job_id === j.id).length;
  return <Link to={"/view/" + j.id} className={"rc-job" + (compact ? " rc-job--compact" : "")}>
    <Logo co={co} />
    <span className="rc-job__main">
      <span className="rc-job__top"><b className="rc-job__t">{T(j.title, j.title_ar)}</b>{j.saudi && <span className="rc-saudi">{L("Saudization role", "وظيفة توطين")}</span>}{fresh && <span className="rc-new">{L("New", "جديد")}</span>}</span>
      <span className="rc-job__co">{T(co.name, co.name_ar)} · <MapPin size={12} /> {T(j.city, j.city_ar)}</span>
      {!compact && <span className="rc-job__tags"><span className="tag">{L(...TYPE[j.type])}</span><span className="tag">{L(...MODE[j.mode])}</span><span className="tag">{L(...LEVEL[j.level])} · {L(`${j.exp_min}–${j.exp_max} yrs`, `${j.exp_min}–${j.exp_max} سنين`)}</span><span className="tag">{L(...FIELD[j.field])}</span></span>}
      {!compact && <span className="rc-job__meta small faint">{ago(j.posted_at, lang)} · {L(`${count} applicants`, `${count} متقدم`)}{j.status === "closed" ? " · " + L("Closed", "مقفولة") : ""}</span>}
    </span>
    <span className="rc-job__side">
      {!compact && <span className="rc-job__pay">{salary(j.salary_min, j.salary_max, j.currency)}</span>}
      <span className="rc-job__badges">{applied ? <span className="pill pill--ok">{L("Applied", "اتقدّمت")}</span> : me ? <Match pct={matchScore(me, j)} /> : null}<SaveBtn id={j.id} /></span>
    </span>
  </Link>;
}

// ---------- toasts ----------
const ToastCtx = createContext<(text: string, err?: boolean) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; err?: boolean }[]>([]);
  const push = useCallback((text: string, err?: boolean) => {
    const id = Date.now() + Math.random();
    setItems(x => [...x, { id, text, err }]);
    setTimeout(() => setItems(x => x.filter(t => t.id !== id)), 3400);
  }, []);
  return <ToastCtx.Provider value={push}>{children}
    <div className="toasts" role="status" aria-live="polite">{items.map(t => <div key={t.id} className={"toast" + (t.err ? " toast--err" : "")}>{t.err ? <AlertCircle /> : <CheckCircle2 />}<span>{t.text}</span></div>)}</div>
  </ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

export function Modal({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const { L } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return createPortal(<div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__h"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label={L("Close", "إغلاق")}><X /></button></div>
      <div className="modal__b">{children}</div>
      {footer && <div className="modal__f">{footer}</div>}
    </div>
  </div>, document.body);
}

// ---------- shell ----------
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => { try { return JSON.parse(localStorage.getItem("hq-theme") || '"light"'); } catch { return "light"; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem("hq-theme", JSON.stringify(theme)); } catch { /* ignore */ } }, [theme]);
  return [theme, setTheme] as const;
}
/** What the signed-in person is: one of the three roles, or a visitor browsing jobs. */
export type Who = Role | "guest";

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open, close]);
  return ref;
}

function Bells({ role, who }: { role: Role; who: string }) {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutside(open, close);
  const mine = notesFor(db, role, who);
  const unread = mine.filter(n => !n.read).length;
  return <div className="rc-bell" ref={ref}>
    <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label={L(`Notifications (${unread} unread)`, `الإشعارات (${unread} جديدة)`)} aria-expanded={open}><Bell />{unread > 0 && <span className="rc-bell__n">{unread}</span>}</button>
    {open && <div className="menu rc-bell__menu">
      <div className="rc-bell__h"><b>{L("Notifications", "الإشعارات")}</b>{unread > 0 && <button className="link small" onClick={() => actions.readAll(role, who)}>{L("Mark all read", "علّم الكل مقروء")}</button>}</div>
      {mine.length === 0 ? <p className="small faint" style={{ padding: 12 }}>{L("Nothing yet.", "مفيش حاجة لسه.")}</p> : mine.slice(0, 12).map(n =>
        <button key={n.id} className={"rc-bell__i" + (n.read ? "" : " unread")} onClick={() => { actions.read(n.id); setOpen(false); nav(n.link); }}>
          <span>{T(n.text, n.text_ar)}</span><span className="small faint">{ago(n.at, lang)}</span>
        </button>)}
    </div>}
  </div>;
}

export const ROLE_LABEL: Record<Role, [string, string]> = { candidate: ["Job seeker", "باحث عن وظيفة"], company: ["Company", "شركة"], screening: ["Brand Vitals screening", "فرز Brand Vitals"] };

/** The avatar opens the account menu: who you are, your pages, demo reset and sign out. */
function Account() {
  const { L } = useI18n();
  const T = useT();
  const db = useDB();
  const nav = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutside(open, close);
  const u = currentUser(db);
  if (!u) return null;
  const co = u.role === "company" ? companyOf(db, u.ref) : null;
  const go = (to: string) => { setOpen(false); nav(to); };
  return <div className="rc-acct" ref={ref}>
    <button className="rc-acct__btn" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu" aria-label={L("Account menu", "قائمة الحساب")}>
      <Avatar name={u.name} />
    </button>
    {open && <div className="menu rc-acct__menu" role="menu">
      <div className="rc-acct__id"><Avatar name={u.name} size="lg" /><span><b>{T(u.name, u.name_ar)}</b><span className="small faint" dir="ltr">{u.email}</span><span className="rc-role">{L(...ROLE_LABEL[u.role])}{co ? " · " + T(co.name, co.name_ar) : ""}</span></span></div>
      {u.role === "candidate" && <>
        <button role="menuitem" onClick={() => go("/profile")}><UserRound />{L("My profile", "بروفايلي")}</button>
        <button role="menuitem" onClick={() => go("/applications")}><ClipboardList />{L("My applications", "طلباتي")}</button>
      </>}
      {u.role === "company" && <>
        <button role="menuitem" onClick={() => go("/companies/" + u.ref)}><Building2 />{L("Public company page", "صفحة الشركة العامة")}</button>
        <button role="menuitem" onClick={() => go("/company/post")}><FilePlus2 />{L("Post a job", "انشر وظيفة")}</button>
      </>}
      {u.role === "screening" && <button role="menuitem" onClick={() => go("/screening")}><ShieldCheck />{L("Screening queue", "طابور الفرز")}</button>}
      <hr />
      <button role="menuitem" className="rc-acct__demo" onClick={() => { setOpen(false); resetDemo(); toast(L("Demo data reset", "اتعمل ريست للبيانات التجريبية")); }}><RotateCcw />{L("Reset demo data", "إعادة ضبط البيانات التجريبية")}</button>
      <button role="menuitem" onClick={() => { setOpen(false); auth.signOut(); nav("/signin"); toast(L("Signed out", "اتسجّل الخروج")); }}><LogOut />{L("Sign out", "تسجيل الخروج")}</button>
    </div>}
  </div>;
}

/** Keeps each area for its own role. Visitors are sent to sign up (or sign in for the team); other roles go home. */
export function Need({ role, children }: { role: Role; children: ReactNode }) {
  const db = useDB();
  const loc = useLocation();
  const u = currentUser(db);
  const next = encodeURIComponent(loc.pathname + loc.search);
  if (!u) return <Navigate replace to={justSignedOut() ? "/signin" : role === "screening" ? `/signin?as=team&next=${next}` : `/signup?as=${role}&next=${next}`} />;
  if (u.role !== role) return <Navigate replace to={homeOf(u.role)} />;
  return <>{children}</>;
}

export function Shell({ children }: { children: ReactNode }) {
  const { L, lang, setLang } = useI18n();
  const [theme, setTheme] = useTheme();
  const [side, setSide] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const db = useDB();
  const u = currentUser(db);
  const who: Who = u?.role || "guest";
  useEffect(() => { setSide(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const myJobs = db.jobs.filter(j => j.company_id === ME.company);
  const newForCompany = db.applications.filter(a => a.stage === "shortlisted" && !a.viewed && myJobs.some(j => j.id === a.job_id)).length;
  const queue = db.applications.filter(a => a.stage === "screening").length;
  const active = db.applications.filter(a => a.candidate_id === ME.candidate && ["screening", ...VISIBLE_TO_COMPANY].includes(a.stage) && a.stage !== "not_selected").length;
  const next = encodeURIComponent(loc.pathname + loc.search);

  const A = ({ to, icon, label, count, end }: { to: string; icon: ReactNode; label: string; count?: number; end?: boolean }) =>
    <NavLink to={to} end={end} className={({ isActive }) => "nav-a" + (isActive ? " active" : "")}>{icon}<span>{label}</span>{!!count && <span className="count">{count}</span>}</NavLink>;

  return <div className="shell rc-shell">
    <aside className={"side" + (side ? " open" : "")} aria-label={L("Main navigation", "التنقل الرئيسي")}>
      <div className="side__brand"><a href="/hire.html"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Hire" /></a></div>
      {(who === "candidate" || who === "guest") && <>
        <button className="big-send" onClick={() => nav("/search")}><Search />{L("Find jobs", "دوّر على وظيفة")}</button>
        <A to="/search" icon={<Briefcase />} label={L("Jobs", "الوظائف")} />
      </>}
      {who === "candidate" && <>
        <A to="/applications" icon={<ClipboardList />} label={L("My applications", "طلباتي")} count={active} />
        <A to="/saved" icon={<Bookmark />} label={L("Saved jobs", "الوظايف المحفوظة")} count={savedOf(db, ME.candidate).length} />
        <A to="/profile" icon={<UserRound />} label={L("My profile", "بروفايلي")} />
      </>}
      {who === "guest" && <div className="rc-join">
        <b>{L("Apply with one profile", "قدّم ببروفايل واحد")}</b>
        <span className="small muted">{L("Every application is answered within 48 hours.", "كل طلب بياخد رد خلال ٤٨ ساعة.")}</span>
        <Link className="btn btn--primary btn--sm btn--block" to={`/signup?as=candidate&next=${next}`}><UserPlus />{L("Create a free profile", "اعمل بروفايل مجاني")}</Link>
        <Link className="link small" to="/signup?as=company">{L("Hiring? Post a job", "بتوظّف؟ انشر وظيفة")}</Link>
      </div>}
      {who === "company" && <>
        <button className="big-send" onClick={() => nav("/company/post")}><FilePlus2 />{L("Post a job", "انشر وظيفة")}</button>
        <A to="/company" end icon={<Home />} label={L("Overview", "نظرة عامة")} count={newForCompany} />
        <A to="/company/jobs" icon={<Briefcase />} label={L("Jobs and applicants", "الوظائف والمتقدمين")} />
        <NavLink to={"/companies/" + ME.company} className="nav-a"><Building2 /><span>{L("Public company page", "صفحة الشركة العامة")}</span></NavLink>
      </>}
      {who === "screening" && <>
        <A to="/screening" end icon={<ShieldCheck />} label={L("Screening queue", "طابور الفرز")} count={queue} />
        <A to="/screening/done" icon={<ClipboardList />} label={L("Screened", "اتفرزوا")} />
      </>}
      <div className="side__foot">
        <div className="demo-pill"><ShieldAlert /><span>{L("Preview with sample data", "نسخة تجريبية ببيانات مثال")}</span></div>
        <div className="rc-edge"><ShieldCheck /><span>{L("Every application is screened by Brand Vitals before a company sees it.", "كل طلب بيتفرز من Brand Vitals قبل ما الشركة تشوفه.")}</span></div>
        <a className="nav-a" href="/hire.html"><span style={{ width: 17 }} />{L("About Vitals Hire", "عن Vitals Hire")}</a>
      </div>
    </aside>
    {side && <div className="overlay" style={{ zIndex: 80, background: "rgba(0,0,0,.3)" }} onClick={() => setSide(false)} />}
    <div className="main">
      <header className="top">
        <button className="icon-btn top__burger" onClick={() => setSide(true)} aria-label={L("Open menu", "فتح القائمة")}><Menu /></button>
        {u && <span className="rc-role rc-hide-m">{L(...ROLE_LABEL[u.role])}</span>}
        <div className="top__r">
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
          {u ? <><Bells role={u.role} who={u.ref} /><Account /></> : <>
            <Link className="btn btn--sm btn--ghost" to={`/signin?next=${next}`}>{L("Sign in", "تسجيل الدخول")}</Link>
            <Link className="btn btn--sm btn--primary rc-hide-m" to={`/signup?next=${next}`}>{L("Join", "انضم")}</Link>
          </>}
        </div>
      </header>
      <main id="content" className="main__in">{children}</main>
    </div>
  </div>;
}

/** /jobs/ opens your home when signed in; visitors get the Vitals Hire page on the Brand Vitals site, so the brand is seen inside its family.
 *  Opened from the phone home screen (?app=1), visitors go straight to the jobs instead. */
export function Landing() {
  const db = useDB();
  const u = currentUser(db);
  const app = new URLSearchParams(location.search).has("app");
  useEffect(() => { if (!u && !app) window.location.replace("/hire.html"); }, [u, app]);
  return u ? <Navigate replace to={homeOf(u.role)} /> : app ? <Navigate replace to="/search" /> : null;
}
