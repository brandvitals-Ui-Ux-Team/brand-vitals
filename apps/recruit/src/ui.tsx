// Shared pieces for Vitals Recruit: labels, pills, the application pipeline, job cards, toasts,
// notifications and the plain dashboard frame with a "viewing as" menu (candidate / company / screening).
import { AlertCircle, Bell, Bookmark, BookmarkCheck, Briefcase, Building2, CheckCircle2, ChevronDown, ClipboardList, FilePlus2, Home, MapPin, Menu, Moon, RotateCcw, Search, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ago, initials, money as fmtMoney } from "../../hq/src/lib/format";
import { useI18n } from "../../hq/src/lib/i18n";
import { ME, VISIBLE_TO_COMPANY, actions, candidateOf, companyOf, matchScore, resetDemo, useDB, type Company, type Edu, type Field, type Job, type JobType, type Level, type Role, type Stage, type WorkMode } from "./store";

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

export function SaveBtn({ id, label }: { id: string; label?: boolean }) {
  const { L } = useI18n();
  const db = useDB();
  const toast = useToast();
  const on = db.saved.includes(id);
  return <button type="button" className={"rc-save" + (on ? " on" : "") + (label ? " rc-save--label" : "")} aria-pressed={on} aria-label={on ? L("Unsave job", "إلغاء الحفظ") : L("Save job", "احفظ الوظيفة")}
    onClick={e => { e.preventDefault(); e.stopPropagation(); actions.toggleSave(id); toast(on ? L("Removed from saved jobs", "اتشالت من المحفوظات") : L("Saved. Find it under Saved jobs.", "اتحفظت. هتلاقيها في الوظايف المحفوظة.")); }}>
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
  const me = candidateOf(db, ME.candidate)!;
  const applied = db.applications.some(a => a.job_id === j.id && a.candidate_id === ME.candidate);
  const fresh = Date.now() - new Date(j.posted_at).getTime() < 2 * 86400000;
  const count = db.applications.filter(a => a.job_id === j.id).length;
  return <Link to={"/jobs/" + j.id} className={"rc-job" + (compact ? " rc-job--compact" : "")}>
    <Logo co={co} />
    <span className="rc-job__main">
      <span className="rc-job__top"><b className="rc-job__t">{T(j.title, j.title_ar)}</b>{fresh && <span className="rc-new">{L("New", "جديد")}</span>}</span>
      <span className="rc-job__co">{T(co.name, co.name_ar)} · <MapPin size={12} /> {T(j.city, j.city_ar)}</span>
      {!compact && <span className="rc-job__tags"><span className="tag">{L(...TYPE[j.type])}</span><span className="tag">{L(...MODE[j.mode])}</span><span className="tag">{L(...LEVEL[j.level])} · {L(`${j.exp_min}–${j.exp_max} yrs`, `${j.exp_min}–${j.exp_max} سنين`)}</span><span className="tag">{L(...FIELD[j.field])}</span></span>}
      {!compact && <span className="rc-job__meta small faint">{ago(j.posted_at, lang)} · {L(`${count} applicants`, `${count} متقدم`)}{j.status === "closed" ? " · " + L("Closed", "مقفولة") : ""}</span>}
    </span>
    <span className="rc-job__side">
      {!compact && <span className="rc-job__pay">{salary(j.salary_min, j.salary_max, j.currency)}</span>}
      <span className="rc-job__badges">{applied ? <span className="pill pill--ok">{L("Applied", "اتقدّمت")}</span> : <Match pct={matchScore(me, j)} />}<SaveBtn id={j.id} /></span>
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
export const roleOf = (path: string): Role => path === "/company" || path.startsWith("/company/") ? "company" : path.startsWith("/screening") ? "screening" : "candidate";

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, close]);
  return ref;
}

function Bells({ role }: { role: Role }) {
  const { L, lang } = useI18n();
  const T = useT();
  const db = useDB();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutside(open, close);
  const mine = db.notes.filter(n => n.to === role);
  const unread = mine.filter(n => !n.read).length;
  return <div className="rc-bell" ref={ref}>
    <button className="icon-btn" onClick={() => setOpen(o => !o)} aria-label={L(`Notifications (${unread} unread)`, `الإشعارات (${unread} جديدة)`)} aria-expanded={open}><Bell />{unread > 0 && <span className="rc-bell__n">{unread}</span>}</button>
    {open && <div className="menu rc-bell__menu">
      <div className="rc-bell__h"><b>{L("Notifications", "الإشعارات")}</b>{unread > 0 && <button className="link small" onClick={() => actions.readAll(role)}>{L("Mark all read", "علّم الكل مقروء")}</button>}</div>
      {mine.length === 0 ? <p className="small faint" style={{ padding: 12 }}>{L("Nothing yet.", "مفيش حاجة لسه.")}</p> : mine.slice(0, 12).map(n =>
        <button key={n.id} className={"rc-bell__i" + (n.read ? "" : " unread")} onClick={() => { actions.read(n.id); setOpen(false); nav(n.link); }}>
          <span>{T(n.text, n.text_ar)}</span><span className="small faint">{ago(n.at, lang)}</span>
        </button>)}
    </div>}
  </div>;
}

export function Shell({ children }: { children: ReactNode }) {
  const { L, lang, setLang } = useI18n();
  const T = useT();
  const [theme, setTheme] = useTheme();
  const [side, setSide] = useState(false);
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  const menuRef = useOutside(menu, closeMenu);
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const db = useDB();
  const role = roleOf(loc.pathname);
  useEffect(() => { setSide(false); setMenu(false); window.scrollTo(0, 0); }, [loc.pathname]);

  const me = candidateOf(db, ME.candidate)!;
  const co = companyOf(db, ME.company);
  const myJobs = db.jobs.filter(j => j.company_id === ME.company);
  const newForCompany = db.applications.filter(a => a.stage === "shortlisted" && !a.viewed && myJobs.some(j => j.id === a.job_id)).length;
  const queue = db.applications.filter(a => a.stage === "screening").length;
  const active = db.applications.filter(a => a.candidate_id === ME.candidate && ["screening", ...VISIBLE_TO_COMPANY].includes(a.stage) && a.stage !== "not_selected").length;

  const A = ({ to, icon, label, count, end }: { to: string; icon: ReactNode; label: string; count?: number; end?: boolean }) =>
    <NavLink to={to} end={end} className={({ isActive }) => "nav-a" + (isActive ? " active" : "")}>{icon}<span>{label}</span>{!!count && <span className="count">{count}</span>}</NavLink>;
  const roles: [Role, string, string, string, ReactNode][] = [
    ["candidate", "/jobs", L("Candidate", "متقدم"), `${T(me.name, me.name_ar)} · ${T(me.headline, me.headline_ar)}`, <UserRound />],
    ["company", "/company", L("Company", "شركة"), `${T(ME.hr, ME.hr_ar)} · ${T(co.name, co.name_ar)}`, <Building2 />],
    ["screening", "/screening", L("Brand Vitals screening", "فرز Brand Vitals"), `${T(ME.screener, ME.screener_ar)} · ${L("Talent team", "فريق المواهب")}`, <ShieldCheck />]
  ];
  const cur = roles.find(r => r[0] === role)!;

  return <div className="shell rc-shell">
    <aside className={"side" + (side ? " open" : "")} aria-label={L("Main navigation", "التنقل الرئيسي")}>
      <div className="side__brand"><a href="/recruit.html"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Recruit" /></a></div>
      {role === "candidate" && <>
        <button className="big-send" onClick={() => nav("/jobs")}><Search />{L("Find jobs", "دوّر على وظيفة")}</button>
        <A to="/jobs" icon={<Briefcase />} label={L("Jobs", "الوظائف")} />
        <A to="/applications" icon={<ClipboardList />} label={L("My applications", "طلباتي")} count={active} />
        <A to="/saved" icon={<Bookmark />} label={L("Saved jobs", "الوظايف المحفوظة")} count={db.saved.length} />
        <A to="/profile" icon={<UserRound />} label={L("My profile", "بروفايلي")} />
      </>}
      {role === "company" && <>
        <button className="big-send" onClick={() => nav("/company/post")}><FilePlus2 />{L("Post a job", "انشر وظيفة")}</button>
        <A to="/company" end icon={<Home />} label={L("Overview", "نظرة عامة")} count={newForCompany} />
        <A to="/company/jobs" icon={<Briefcase />} label={L("Jobs and applicants", "الوظائف والمتقدمين")} />
        <NavLink to={"/companies/" + ME.company} className="nav-a"><Building2 /><span>{L("Public company page", "صفحة الشركة العامة")}</span></NavLink>
      </>}
      {role === "screening" && <>
        <A to="/screening" end icon={<ShieldCheck />} label={L("Screening queue", "طابور الفرز")} count={queue} />
        <A to="/screening/done" icon={<ClipboardList />} label={L("Screened", "اتفرزوا")} />
      </>}
      <div className="side__foot">
        <div className="rc-edge"><ShieldCheck /><span>{L("Every application is screened by Brand Vitals before a company sees it.", "كل طلب بيتفرز من Brand Vitals قبل ما الشركة تشوفه.")}</span></div>
        <a className="nav-a" href="/recruit.html"><span style={{ width: 17 }} />{L("About Vitals Recruit", "عن Vitals Recruit")}</a>
      </div>
    </aside>
    {side && <div className="overlay" style={{ zIndex: 80, background: "rgba(0,0,0,.3)" }} onClick={() => setSide(false)} />}
    <div className="main">
      <header className="top">
        <button className="icon-btn top__burger" onClick={() => setSide(true)} aria-label={L("Open menu", "فتح القائمة")}><Menu /></button>
        <div className="rc-viewas" ref={menuRef}>
          <button className="rc-viewas__btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>
            <span className="faint">{L("Viewing as", "بتشوف كـ")}</span><b>{cur[2]}</b><ChevronDown size={15} />
          </button>
          {menu && <div className="menu rc-viewas__menu">
            <p className="small faint" style={{ padding: "6px 10px" }}>{L("Demo: the same hiring pipeline from each side.", "تجربة: نفس خط التوظيف من كل جانب.")}</p>
            {roles.map(([r, to, label, who, icon]) => <button key={r} className={r === role ? "on" : ""} onClick={() => nav(to)}>{icon}<span style={{ display: "grid", textAlign: "start" }}><b>{label}</b><span className="small faint">{who}</span></span></button>)}
          </div>}
        </div>
        <div className="top__r">
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
          <Bells role={role} />
          <button className="icon-btn rc-hide-m" onClick={() => { resetDemo(); toast(L("Demo data reset", "اتعمل ريست للبيانات التجريبية")); }} aria-label={L("Reset demo data", "إعادة ضبط البيانات")} title={L("Reset demo data", "إعادة ضبط البيانات")}><RotateCcw /></button>
          <span className="rc-hide-m"><Avatar name={cur[3].split(" · ")[0]} /></span>
        </div>
      </header>
      {children}
    </div>
  </div>;
}

/** /recruit/ opens the Recruit page on the Brand Vitals site, so the brand is always seen inside its family. */
export function Landing() {
  useEffect(() => { window.location.replace("/recruit.html"); }, []);
  return null;
}
