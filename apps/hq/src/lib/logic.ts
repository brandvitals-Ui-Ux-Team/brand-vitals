// Business rules shared by the demo backend and the UI.
// The Supabase backend runs the same rules in SQL (see supabase/migrations).
import type { Classification, Deliverable, ScopeItem } from "./types";

// Classifies client feedback: is this a revision of the current work, or a new request
// that falls outside the agreed scope? Works on English, Arabic (Egyptian/Gulf/MSA) and Franco.
const NEW_REQUEST = [
  /\b(add(itional)?|another|extra|new|one more|also (make|design|create|do)|can you (also )?(make|create|design|shoot)|more (posts?|designs?|videos?|reels?|stories|pages?|versions?))\b/i,
  /(كمان|زود|زوّد|ضيف|ضيفوا|اضافي|إضافي|إضافية|جديد|جديدة|واحد تاني|واحدة تانية|تاني واحد|بوست تاني|فيديو تاني|عايز(ين)? (كمان|تصميم|فيديو|بوست|ريل)|اعمل(وا)? لنا|ممكن تعمل(وا)?|نسخة إضافية|صفحة جديدة)/,
  /\b(kaman|zawed|zawd|gedid|wa7ed tany)\b/i
];
const REVISION = [
  /\b(change|fix|adjust|tweak|edit|make it|bigger|smaller|color|colour|font|move|replace|remove|instead|typo|logo)\b/i,
  /(غير|غيّر|عدل|عدّل|صلح|صلّح|كبر|كبّر|صغر|صغّر|اللون|الخط|شيل|حرك|بدل|بدّل|بدال|غلط)/
];

export function classify(text: string): { kind: Classification; confidence: number } {
  const t = (text || "").trim();
  if (!t) return { kind: "revision", confidence: 0.3 };
  const n = NEW_REQUEST.filter(r => r.test(t)).length;
  const r = REVISION.filter(re => re.test(t)).length;
  if (n > 0 && n >= r) return { kind: "new_request", confidence: Math.min(0.95, 0.6 + 0.15 * n) };
  return { kind: "revision", confidence: r ? Math.min(0.95, 0.6 + 0.15 * r) : 0.5 };
}

// Is this deliverable over its included revision rounds?
export function overRevisionLimit(d: Deliverable, scope?: ScopeItem | null): boolean {
  if (!scope) return false;
  return d.revision_count > scope.revisions_included;
}

// Usage of a scope item: how many deliverables were made vs the agreed quantity.
export function scopeUsage(item: ScopeItem, deliverables: Deliverable[]) {
  const mine = deliverables.filter(d => d.scope_item_id === item.id);
  let used = mine.length;
  if (item.period === "month") {
    const now = new Date();
    used = mine.filter(d => { const c = new Date(d.created_at); return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear(); }).length;
  }
  const extraRevisions = mine.reduce((s, d) => s + Math.max(0, d.revision_count - item.revisions_included), 0);
  return { used, total: item.quantity, over: Math.max(0, used - item.quantity), extraRevisions };
}

export const daysBetween = (a: string | Date, b: string | Date = new Date()) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
