import { AlertCircle, CheckCircle2, FileText, Film, Globe, Image as ImageIcon, Link2, PenLine, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFileUrl } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { initials } from "../lib/format";
import type { COStatus, DeliverableKind, DeliverableStatus, Member, Priority, Version } from "../lib/types";

// ---------- toasts ----------
interface Toast { id: number; text: string; kind: "ok" | "err" }
const ToastCtx = createContext<(text: string, kind?: "ok" | "err") => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems(x => [...x, { id, text, kind }]);
    setTimeout(() => setItems(x => x.filter(t => t.id !== id)), kind === "err" ? 6000 : 3200);
  }, []);
  return <ToastCtx.Provider value={push}>{children}
    <div className="toasts" role="status" aria-live="polite">{items.map(t =>
      <div key={t.id} className={"toast" + (t.kind === "err" ? " toast--err" : "")}>{t.kind === "err" ? <AlertCircle /> : <CheckCircle2 />}<span>{t.text}</span></div>)}</div>
  </ToastCtx.Provider>;
}
export const useToast = () => useContext(ToastCtx);

// Wraps an async action with a busy flag and an error toast.
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> => {
    setBusy(true);
    try { const r = await fn(); if (ok) toast(ok); return r; }
    catch (e) { toast(String((e as Error).message || e), "err"); return undefined; }
    finally { setBusy(false); }
  }, [toast]);
  return { busy, run };
}

// ---------- modal ----------
export function Modal({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { L } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    const prev = document.activeElement as HTMLElement | null;
    return () => { document.removeEventListener("keydown", k); prev?.focus?.(); };
  }, [onClose]);
  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (wide ? " modal--wide" : "")} role="dialog" aria-modal="true">
        <div className="modal__h"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label={L("Close", "إغلاق")}><X /></button></div>
        <div className="modal__b">{children}</div>
        {footer && <div className="modal__f">{footer}</div>}
      </div>
    </div>, document.body);
}

export function Confirm({ title, text, danger, onYes, onClose, yes }: { title: string; text: string; danger?: boolean; yes?: string; onYes: () => void; onClose: () => void }) {
  const { L } = useI18n();
  return <Modal title={title} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className={"btn " + (danger ? "btn--danger" : "btn--primary")} onClick={() => { onYes(); onClose(); }} autoFocus>{yes || L("Confirm", "تأكيد")}</button>
  </>}><p className="muted">{text}</p></Modal>;
}

// ---------- popover menu ----------
export function Popover({ trigger, children, align = "end", className = "" }: { trigger: (open: () => void, isOpen: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: "start" | "end"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  return <div className="pop-wrap" ref={ref}>
    {trigger(() => setOpen(o => !o), open)}
    {open && <div className={"menu " + className} style={{ [align === "end" ? "insetInlineEnd" : "insetInlineStart"]: 0, top: "calc(100% + 6px)" }}>{children(() => setOpen(false))}</div>}
  </div>;
}

// ---------- avatar ----------
const COLORS = ["#097A53", "#2F5FD0", "#B26B00", "#6D4AD6", "#C9353F", "#007299", "#8A5A00", "#3B7D23"];
export function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  const c = COLORS[[...(name || "?")].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];
  return <span className={"avatar" + (size ? " avatar--" + size : "")} style={{ background: c }} title={name}>{initials(name)}</span>;
}
export function MemberChip({ m }: { m: Member | undefined | null }) {
  const { L } = useI18n();
  if (!m) return <span className="faint small">{L("Unassigned", "غير مُسند")}</span>;
  return <span className="row" style={{ gap: 6 }}><Avatar name={m.name} size="sm" /><span className="small">{m.name}</span></span>;
}

// ---------- status pills ----------
export function StatusPill({ s }: { s: DeliverableStatus }) {
  const { L } = useI18n();
  const map: Record<DeliverableStatus, [string, string, string]> = {
    draft: ["", "Draft", "مسودة"], in_review: ["pill--info", "Waiting on client", "عند العميل"],
    changes: ["pill--warn", "Changes requested", "مطلوب تعديل"], approved: ["pill--ok", "Approved", "معتمد"]
  };
  const [c, en, ar] = map[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}
export function COPill({ s }: { s: COStatus }) {
  const { L } = useI18n();
  const map: Record<COStatus, [string, string, string]> = {
    draft: ["", "Draft", "مسودة"], sent: ["pill--info", "Awaiting client", "بانتظار العميل"],
    approved: ["pill--ok", "Approved", "موافق عليه"], declined: ["pill--bad", "Declined", "مرفوض"]
  };
  const [c, en, ar] = map[s];
  return <span className={"pill " + c}>{L(en, ar)}</span>;
}
export function Prio({ p }: { p: Priority }) {
  const { L } = useI18n();
  const t: Record<Priority, [string, string]> = { low: ["Low", "منخفضة"], medium: ["Medium", "متوسطة"], high: ["High", "عالية"], urgent: ["Urgent", "عاجلة"] };
  return <span className={"prio prio--" + p}><i />{L(...t[p])}</span>;
}
export const KIND_LABEL: Record<DeliverableKind, [string, string]> = {
  design: ["Design", "تصميم"], video: ["Video", "فيديو"], copy: ["Copy", "نص"], post: ["Social post", "بوست"], web: ["Web page", "صفحة ويب"], other: ["Other", "أخرى"]
};
export function KindIcon({ k }: { k: DeliverableKind }) {
  if (k === "video") return <Film />;
  if (k === "copy") return <PenLine />;
  if (k === "web") return <Globe />;
  if (k === "other") return <FileText />;
  return <ImageIcon />;
}

// ---------- files ----------
export function Thumb({ v, kind, large }: { v?: Version | null; kind: DeliverableKind; large?: boolean }) {
  const url = useFileUrl(v?.file_url);
  const isImg = !!v && /^image\//.test(v.file_type) && url;
  return <div className={"thumb" + (large ? " thumb--lg" : "")}>{isImg ? <img src={url} alt="" loading="lazy" /> : v?.link_url ? <Link2 /> : <KindIcon k={kind} />}</div>;
}
export function Preview({ v, kind }: { v: Version; kind: DeliverableKind }) {
  const { L } = useI18n();
  const url = useFileUrl(v.file_url);
  const t = v.file_type || "";
  return <div className="preview">
    {url && t.startsWith("image/") ? <img src={url} alt={v.file_name} /> :
      url && t.startsWith("video/") ? <video src={url} controls playsInline /> :
      url && t === "application/pdf" ? <iframe src={url} title={v.file_name} /> :
      <div className="preview__file">
        <div className="thumb"><KindIcon k={kind} /></div>
        {url && <a className="btn btn--primary" href={url} target="_blank" rel="noopener" download={v.file_name}>{L("Open file", "فتح الملف")} · {v.file_name}</a>}
        {v.link_url && <a className="btn" href={v.link_url} target="_blank" rel="noopener noreferrer"><Link2 />{L("Open link", "فتح الرابط")}</a>}
        {!url && !v.link_url && <p className="muted">{L("No file attached to this version.", "لا يوجد ملف في هذه النسخة.")}</p>}
      </div>}
  </div>;
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty">{icon}<h3>{title}</h3>{text && <p className="small">{text}</p>}{action}</div>;
}
export function Spinner() { return <div className="center"><div className="spinner" /></div>; }

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
