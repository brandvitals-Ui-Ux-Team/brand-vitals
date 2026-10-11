import type { Lang } from "./types";

export function money(amount: number | null | undefined, currency: string, lang: Lang) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch { return `${currency} ${n.toLocaleString()}`; }
}

export function date(d: string | null | undefined, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!d) return "";
  const v = d.length === 10 ? new Date(d + "T12:00:00") : new Date(d);
  return v.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", opts);
}

export function ago(d: string | null | undefined, lang: Lang) {
  if (!d) return "";
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar-EG" : "en", { numeric: "auto" });
  if (s < 60) return rtf.format(-s, "second");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), "day");
  return date(d, lang, { day: "numeric", month: "short", year: "numeric" });
}

export const initials = (name: string) => (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export const today = () => new Date().toISOString().slice(0, 10);
export const isOverdue = (d: string | null) => !!d && d < today();

// Public links (review / change order) always point at this deployment.
export const reviewUrl = (token: string) => `${location.origin}/app/r/${token}`;
export const coUrl = (token: string) => `${location.origin}/app/co/${token}`;
export const inviteUrl = (token: string) => `${location.origin}/app/join/${token}`;

// wa.me needs digits only, with country code.
export function waLink(phone: string, text: string) {
  const digits = (phone || "").replace(/\D/g, "").replace(/^00/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
export const portalUrl = (token: string) => `${location.origin}/app/c/${token}`;
