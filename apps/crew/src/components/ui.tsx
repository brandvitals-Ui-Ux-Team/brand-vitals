import { AlertCircle, BadgeCheck, CheckCircle2, Crown, Gem, ShieldCheck, Users, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { demoDesign } from "../../../hq/src/lib/designs";
import { initials, money as fmtMoney } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import type { AppStage, BriefStatus, Category, Level, ProposalStatus, QA, Scores, Talent } from "../lib/types";

export const CAT: Record<Category, [string, string]> = {
  design: ["Design & branding", "تصميم وهوية"], motion: ["Motion & 3D", "موشن وثري دي"], video: ["Video & UGC", "فيديو وUGC"],
  copy: ["Copywriting", "كتابة محتوى"], social: ["Social media", "سوشيال ميديا"], web: ["Web", "مواقع"], ads: ["Performance ads", "إعلانات أداء"], photo: ["Photography", "تصوير"]
};
export const LEVEL: Record<Level, [string, string, string]> = { vetted: ["Vetted", "معتمد", "pill--info"], pro: ["Pro", "محترف", "pill--violet"], elite: ["Elite", "نخبة", "pill--warn"] };

export function useMoney() {
  const { lang } = useI18n();
  return (n: number, c = "EGP") => fmtMoney(n, c, lang);
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

// ---------- modal ----------
export function Modal({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { L } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return createPortal(<div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={"modal" + (wide ? " modal--wide" : "")} role="dialog" aria-modal="true">
      <div className="modal__h"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label={L("Close", "إغلاق")}><X /></button></div>
      <div className="modal__b">{children}</div>
      {footer && <div className="modal__f">{footer}</div>}
    </div>
  </div>, document.body);
}

const COLORS = ["#C2185B", "#2F5FD0", "#B26B00", "#6D4AD6", "#097A53", "#007299", "#8A5A00", "#3B7D23"];
export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  const c = COLORS[[...(name || "?")].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];
  return <span className={"avatar" + (size ? " avatar--" + size : "")} style={{ background: c }} title={name}>{initials(name)}</span>;
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty">{icon}<h3>{title}</h3>{text && <p className="small">{text}</p>}{action}</div>;
}

// ---------- artwork (finished-looking demo designs) ----------
export function Art({ title, className = "", alt = "" }: { title: string; className?: string; alt?: string }) {
  const url = title.startsWith("data:") ? title : demoDesign(title, 2) || demoDesign(title, 1);
  return <div className={"art " + className}>{url ? <img src={url} alt={alt} /> : null}</div>;
}

// ---------- badges ----------
export function LevelBadge({ level }: { level: Level }) {
  const { L } = useI18n();
  const [en, ar, c] = LEVEL[level];
  return <span className={"pill pill--plain " + c}>{level === "elite" ? <Crown size={13} /> : level === "pro" ? <Gem size={13} /> : <BadgeCheck size={13} />}{L(en, ar)}</span>;
}
export function VettedMark({ t }: { t: Talent }) {
  const { L } = useI18n();
  return <span className="vetted" title={L("Reviewed and approved by the Vitals Crew review team", "اتراجع واتقبل من فريق مراجعة Vitals Crew")}><ShieldCheck size={14} />{t.kind === "in_house" ? L("Brand Vitals team", "فريق براند ڤايتلز") : L("Vetted by Vitals", "معتمد من Vitals")}</span>;
}
export function KindTag({ t }: { t: Talent }) {
  const { L } = useI18n();
  if (t.kind === "solo") return null;
  return <span className="tag"><Users size={12} style={{ marginInlineEnd: 4 }} />{L(`Team of ${t.members}`, `فريق من ${t.members}`)}</span>;
}

export const CRITERIA: [keyof Scores, string, string][] = [
  ["craft", "Craft", "جودة الشغل"], ["brief", "Brief fit", "فهم البريف"], ["communication", "Communication", "التواصل"], ["reliability", "Reliability", "الالتزام"]
];
export function ScoreBars({ s }: { s: Scores }) {
  const { L } = useI18n();
  return <div className="scores">{CRITERIA.map(([k, en, ar]) => <div key={k} className="score">
    <span className="small muted">{L(en, ar)}</span>
    <span className="score__bar"><i style={{ width: `${(s[k] / 5) * 100}%` }} /></span>
    <b className="small">{s[k] ? s[k].toFixed(1) : "—"}</b>
  </div>)}</div>;
}
export function ScoreInput({ value, onChange }: { value: Scores; onChange: (s: Scores) => void }) {
  const { L } = useI18n();
  return <div className="stack" style={{ gap: 10 }}>{CRITERIA.map(([k, en, ar]) => <div key={k} className="row row--between">
    <span className="small" style={{ fontWeight: 600 }}>{L(en, ar)}</span>
    <span className="seg">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={value[k] === n ? "on" : ""} onClick={() => onChange({ ...value, [k]: n })}>{n}</button>)}</span>
  </div>)}</div>;
}

// ---------- status pills ----------
export function BriefPill({ s }: { s: BriefStatus }) {
  const { L } = useI18n();
  const m: Record<BriefStatus, [string, string, string]> = {
    review: ["pill--warn", "Being reviewed", "قيد المراجعة"], sourcing: ["pill--info", "Matching talent", "بنختار المواهب"],
    shortlist: ["pill--violet", "Shortlist ready", "القائمة جاهزة"], in_progress: ["pill--info", "In progress", "شغال"], delivered: ["pill--ok", "Delivered", "اتسلّم"]
  };
  const [c, en, ar] = m[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}
export function ProposalPill({ s }: { s: ProposalStatus }) {
  const { L } = useI18n();
  const m: Record<ProposalStatus, [string, string, string]> = {
    screening: ["pill--warn", "In review by Vitals", "بيتراجع من Vitals"], shortlisted: ["pill--violet", "Shortlisted", "في القائمة المختصرة"],
    declined: ["pill--bad", "Not shortlisted", "لم يتم الترشيح"], hired: ["pill--ok", "Hired", "اتختار"], not_selected: ["", "Client chose another", "العميل اختار غيره"]
  };
  const [c, en, ar] = m[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}
export function QAPill({ s }: { s: QA }) {
  const { L } = useI18n();
  const m: Record<QA, [string, string, string]> = { pending: ["pill--warn", "In quality review", "في مراجعة الجودة"], passed: ["pill--ok", "Passed Vitals QA", "عدّى مراجعة الجودة"], returned: ["pill--bad", "Returned with notes", "رجع بملاحظات"] };
  const [c, en, ar] = m[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}
export function StagePill({ s }: { s: AppStage }) {
  const { L } = useI18n();
  const m: Record<AppStage, [string, string, string]> = {
    portfolio: ["pill--warn", "Portfolio review", "مراجعة البورتفوليو"], test: ["pill--info", "Skill test", "اختبار عملي"],
    interview: ["pill--violet", "Interview", "مقابلة"], approved: ["pill--ok", "Accepted", "مقبول"], rejected: ["pill--bad", "Not accepted", "غير مقبول"]
  };
  const [c, en, ar] = m[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}

// ---------- pipeline stepper ----------
export function Stepper({ steps, done, active }: { steps: [string, string][]; done: number; active?: boolean }) {
  const { L } = useI18n();
  return <ol className="stepper">{steps.map(([en, ar], i) => <li key={i} className={i < done ? "done" : i === done && active !== false ? "now" : ""}>
    <span className="stepper__dot">{i < done ? <CheckCircle2 size={16} /> : i + 1}</span><span className="stepper__l">{L(en, ar)}</span>
  </li>)}</ol>;
}
export const BRIEF_STEPS: [string, string][] = [["Brief posted", "البريف اتنشر"], ["Reviewed by Vitals", "اتراجع من Vitals"], ["Vetted shortlist", "قائمة مختصرة معتمدة"], ["Hired & working", "اتختار وبيشتغل"], ["QA-checked delivery", "تسليم بعد مراجعة الجودة"]];
export const briefDone = (s: BriefStatus) => ({ review: 1, sourcing: 2, shortlist: 3, in_progress: 4, delivered: 5 })[s];
export const APP_STEPS: [string, string][] = [["Portfolio review", "مراجعة البورتفوليو"], ["Skill test", "اختبار عملي"], ["Interview", "مقابلة"], ["Accepted", "القبول"]];
export const appDone = (s: AppStage) => ({ portfolio: 0, test: 1, interview: 2, approved: 4, rejected: 0 })[s];
