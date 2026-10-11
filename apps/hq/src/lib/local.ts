// Demo backend: a full working copy of Vitals Approve inside this browser.
// Tables live in localStorage; uploaded files in IndexedDB. Changes made in
// one tab (for example a client approving on the review link) show up live
// in the other tabs.
import type { Backend, CODecision, Filter, ReviewResponse, Row } from "./backend";
import { nowIso, token, uid } from "./backend";
import { emitChange } from "./bus";
import { classify } from "./logic";
import { seed } from "./seed";
import type { ChangeOrderPayload, Client, ID, Pin, PortalPayload, ReviewPayload, SessionUser, SharedMessage, TableName, Tables, ThreadType, Workspace } from "./types";

const KEY = "hq-demo-db-v1";
const USER_KEY = "hq-demo-user";
type DB = { [K in TableName]: Tables[K][] };

const empty = (): DB => ({ workspaces: [], members: [], invites: [], clients: [], projects: [], scope_items: [], deliverables: [], versions: [], feedback: [], change_orders: [], tasks: [], comments: [], activity: [], messages: [], webhooks: [] });

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db: DB = Object.assign(empty(), JSON.parse(raw));
      db.clients.forEach(c => { if (!c.portal_token) c.portal_token = token(); if (!c.preferred_channel) c.preferred_channel = c.phone ? "whatsapp" : "email"; if (c.chat_webhook == null) c.chat_webhook = ""; });
      db.deliverables.forEach(d => { if (d.publish_date === undefined) d.publish_date = null; if (d.reminded_at === undefined) d.reminded_at = null; });
      db.feedback.forEach(f => { if (!Array.isArray(f.pins)) f.pins = []; });
      db.workspaces.forEach(w => { if (!w.remind_after_days) w.remind_after_days = 2; });
      return db;
    }
  } catch { /* ignore */ }
  return empty();
}
const cleanPins = (p: Pin[] | undefined): Pin[] => (Array.isArray(p) ? p : []).slice(0, 30).map(x => ({ x: Math.min(100, Math.max(0, Number(x.x) || 0)), y: Math.min(100, Math.max(0, Number(x.y) || 0)), text: String(x.text || "").slice(0, 500) }));

// ---- IndexedDB file store -------------------------------------------------
const IDB_NAME = "hq-demo-files";
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function idbPut(id: string, blob: Blob) {
  const db = await idb();
  await new Promise<void>((res, rej) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(blob, id); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
export async function idbGet(id: string): Promise<Blob | null> {
  const db = await idb();
  return new Promise((res, rej) => { const tx = db.transaction("files"); const q = tx.objectStore("files").get(id); q.onsuccess = () => res((q.result as Blob) || null); q.onerror = () => rej(q.error); });
}

export class LocalBackend implements Backend {
  mode = "demo" as const;
  private db: DB = load();
  private authSubs = new Set<(u: SessionUser | null) => void>();

  constructor() {
    window.addEventListener("storage", e => {
      if (e.key === KEY) { this.db = load(); emitChange(); }
      if (e.key === USER_KEY) this.authSubs.forEach(f => f(this.user()));
    });
  }
  private save() { localStorage.setItem(KEY, JSON.stringify(this.db)); emitChange(); }
  private user(): SessionUser | null { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
  private setUser(u: SessionUser | null) {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY);
    this.authSubs.forEach(f => f(u));
  }
  private ensureSeed(u: SessionUser) {
    if (!this.db.workspaces.length) { this.db = seed(u); this.save(); }
    else if (!this.db.members.some(m => m.user_id === u.id)) {
      // a new demo user joins the existing demo workspace as owner
      const ws = this.db.workspaces[0];
      this.db.members.push({ id: uid(), workspace_id: ws.id, user_id: u.id, role: "owner", name: u.name, email: u.email, created_at: nowIso() });
      this.save();
    }
  }

  // ---- auth (demo: no passwords are stored) ----
  async session() { return this.user(); }
  async signIn(email: string) {
    const u: SessionUser = { id: "demo-" + email.toLowerCase(), email, name: email.split("@")[0] };
    this.ensureSeed(u); this.setUser(u); return u;
  }
  async signUp(email: string, _password: string, name: string) {
    const u: SessionUser = { id: "demo-" + email.toLowerCase(), email, name: name || email.split("@")[0] };
    this.ensureSeed(u); this.setUser(u); return u;
  }
  async signOut() { this.setUser(null); }
  async resetPassword() { /* nothing to reset in demo mode */ }
  onAuth(cb: (u: SessionUser | null) => void) { this.authSubs.add(cb); return () => { this.authSubs.delete(cb); }; }
  async resetDemo() { localStorage.removeItem(KEY); this.db = empty(); const u = this.user(); if (u) this.ensureSeed(u); emitChange(); }

  // ---- workspaces ----
  async myWorkspaces() {
    const u = this.user(); if (!u) return [];
    const ids = new Set(this.db.members.filter(m => m.user_id === u.id).map(m => m.workspace_id));
    return this.db.workspaces.filter(w => ids.has(w.id));
  }
  async createWorkspace(name: string, currency: string, ownerName: string): Promise<Workspace> {
    const u = this.user(); if (!u) throw new Error("Not signed in");
    const ws: Workspace = { id: uid(), name, currency, owner_id: u.id, created_at: nowIso(),
      wa_template_en: "Hi {client}, {item} is ready for your review: {link}",
      wa_template_ar: "أهلًا {client}، {item} جاهز للمراجعة: {link}", remind_after_days: 2 };
    this.db.workspaces.push(ws);
    this.db.members.push({ id: uid(), workspace_id: ws.id, user_id: u.id, role: "owner", name: ownerName || u.name, email: u.email, created_at: nowIso() });
    this.save();
    return ws;
  }
  async acceptInvite(tok: string, name: string) {
    const u = this.user(); if (!u) throw new Error("Not signed in");
    const inv = this.db.invites.find(i => i.token === tok && !i.accepted_at);
    if (!inv) throw new Error("Invite not found or already used");
    inv.accepted_at = nowIso();
    if (!this.db.members.some(m => m.user_id === u.id && m.workspace_id === inv.workspace_id))
      this.db.members.push({ id: uid(), workspace_id: inv.workspace_id, user_id: u.id, role: inv.role, name: name || u.name, email: u.email, created_at: nowIso() });
    this.save();
    return inv.workspace_id;
  }

  // ---- generic CRUD ----
  async list<T extends TableName>(table: T, filter: Filter<T> = {}) {
    const rows = this.db[table] as Row<T>[];
    const keys = Object.keys(filter) as (keyof Row<T>)[];
    return rows.filter(r => keys.every(k => r[k] === filter[k])).map(r => ({ ...r }));
  }
  async get<T extends TableName>(table: T, id: ID) {
    const r = (this.db[table] as Row<T>[]).find(x => (x as { id: ID }).id === id);
    return r ? { ...r } : null;
  }
  async insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
    const full = { id: uid(), created_at: nowIso(), ...row } as Row<T>;
    (this.db[table] as Row<T>[]).push(full);
    if (table === "activity") this.fire(full as unknown as Parameters<LocalBackend["fire"]>[0]);
    this.save();
    return { ...full };
  }
  async update<T extends TableName>(table: T, id: ID, patch: Partial<Row<T>>) {
    const r = (this.db[table] as Row<T>[]).find(x => (x as { id: ID }).id === id);
    if (!r) throw new Error("Not found");
    Object.assign(r as object, patch);
    this.save();
    return { ...r };
  }
  // Mirrors the ON DELETE CASCADE rules of the SQL schema.
  private cascade(table: TableName, id: ID) {
    const rows = this.db[table] as { id: ID }[];
    const i = rows.findIndex(x => x.id === id);
    if (i >= 0) rows.splice(i, 1);
    const kids: [TableName, string][] = ({
      clients: [["projects", "client_id"], ["messages", "client_id"]],
      projects: [["scope_items", "project_id"], ["deliverables", "project_id"], ["change_orders", "project_id"], ["tasks", "project_id"], ["messages", "thread_id"]],
      deliverables: [["versions", "deliverable_id"], ["feedback", "deliverable_id"], ["comments", "entity_id"], ["messages", "thread_id"]],
      tasks: [["comments", "entity_id"]]
    } as Partial<Record<TableName, [TableName, string][]>>)[table] || [];
    for (const [child, col] of kids)
      for (const r of (this.db[child] as unknown as Record<string, ID>[]).filter(r => r[col] === id)) this.cascade(child, r.id);
    if (table === "scope_items") this.db.deliverables.forEach(d => { if (d.scope_item_id === id) d.scope_item_id = null; });
    if (table === "members") this.db.tasks.forEach(t => { if (t.assignee_id === id) t.assignee_id = null; });
  }
  async remove(table: TableName, id: ID) {
    this.cascade(table, id);
    this.save();
  }
  async upload(_ws: ID, file: File) {
    if (file.size > 25 * 1024 * 1024) throw new Error("Files up to 25 MB in demo mode");
    const id = uid();
    await idbPut(id, file);
    return { url: "idb:" + id, name: file.name, type: file.type };
  }

  // ---- public client endpoints ----
  // Demo mode: deliver activity to the workspace's webhooks from the browser
  // (production does this in the database with pg_net).
  private fire(a: { workspace_id: ID; type: string; actor: string; summary: string; project_id: ID | null; entity_id: ID | null; data: Record<string, unknown>; created_at: string }) {
    for (const h of this.db.webhooks.filter(w => w.workspace_id === a.workspace_id && w.active && w.events.includes(a.type))) {
      if (h.kind === "generic") fetch(h.url, { method: "POST", mode: "no-cors", body: JSON.stringify({ event: a.type, ...a, secret: h.secret }) }).catch(() => {});
      else fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: h.kind, webhook: h.url, text: `${a.actor} ${a.summary}` }) }).catch(() => {});
    }
  }
  private activity(workspace_id: ID, type: string, project_id: ID | null, entity_id: ID | null, actor: string, summary: string, data: Record<string, unknown> = {}) {
    const a = { id: uid(), workspace_id, type, project_id, entity_id, actor, summary, data, created_at: nowIso() };
    this.db.activity.push(a);
    this.fire(a);
  }
  async reviewGet(tok: string): Promise<ReviewPayload | null> {
    const d = this.db.deliverables.find(x => x.review_token === tok);
    if (!d) return null;
    const p = this.db.projects.find(x => x.id === d.project_id)!;
    const c = this.db.clients.find(x => x.id === p.client_id)!;
    const w = this.db.workspaces.find(x => x.id === d.workspace_id)!;
    const s = d.scope_item_id ? this.db.scope_items.find(x => x.id === d.scope_item_id) : null;
    return {
      workspace: { name: w.name, currency: w.currency }, client: { name: c.name, lang: c.lang, portal_token: c.portal_token }, project: { name: p.name },
      deliverable: { id: d.id, title: d.title, kind: d.kind, status: d.status, current_version: d.current_version, revision_count: d.revision_count, approved_at: d.approved_at, publish_date: d.publish_date },
      revisions_included: s ? s.revisions_included : null,
      versions: this.db.versions.filter(v => v.deliverable_id === d.id).sort((a, b) => b.number - a.number),
      feedback: this.db.feedback.filter(f => f.deliverable_id === d.id).sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(f => ({ kind: f.kind, author_name: f.author_name, comment: f.comment, version_number: f.version_number, created_at: f.created_at, pins: f.pins || [] }))
    };
  }
  async reviewRespond(tok: string, r: ReviewResponse) {
    const d = this.db.deliverables.find(x => x.review_token === tok);
    if (!d) throw new Error("Link not found");
    if (d.status !== "in_review") throw new Error("This version is no longer awaiting review");
    const name = (r.name || "").trim().slice(0, 120) || "Client";
    const comment = (r.comment || "").trim().slice(0, 4000);
    const s = d.scope_item_id ? this.db.scope_items.find(x => x.id === d.scope_item_id) : null;
    if (r.action === "approved") {
      d.status = "approved"; d.approved_at = nowIso();
      this.db.feedback.push({ id: uid(), workspace_id: d.workspace_id, deliverable_id: d.id, version_number: d.current_version, kind: "approved", author_name: name, comment, classification: null, resolved: true, pins: [], created_at: nowIso() });
      this.activity(d.workspace_id, "approval.approved", d.project_id, d.id, name, `approved “${d.title}” v${d.current_version}`);
    } else {
      const pins = cleanPins(r.pins);
      if (!comment && !pins.length) throw new Error("Please describe the changes");
      d.status = "changes"; d.revision_count += 1;
      if (s && d.revision_count > s.revisions_included) d.out_of_scope = true;
      const cls = classify(comment + " " + pins.map(p => p.text).join(" ")).kind;
      this.db.feedback.push({ id: uid(), workspace_id: d.workspace_id, deliverable_id: d.id, version_number: d.current_version, kind: "changes", author_name: name, comment, classification: cls, resolved: false, pins, created_at: nowIso() });
      this.activity(d.workspace_id, "approval.changes", d.project_id, d.id, name, `requested changes on “${d.title}” v${d.current_version}`, { classification: cls, pins: pins.length });
    }
    this.save();
  }
  async changeOrderGet(tok: string): Promise<ChangeOrderPayload | null> {
    const co = this.db.change_orders.find(x => x.token === tok && x.status !== "draft");
    if (!co) return null;
    const p = this.db.projects.find(x => x.id === co.project_id)!;
    const c = this.db.clients.find(x => x.id === p.client_id)!;
    const w = this.db.workspaces.find(x => x.id === co.workspace_id)!;
    return { workspace: { name: w.name }, client: { name: c.name, lang: c.lang }, project: { name: p.name },
      change_order: { title: co.title, description: co.description, amount: co.amount, currency: co.currency, status: co.status, decided_by: co.decided_by, decided_at: co.decided_at, created_at: co.created_at } };
  }
  async changeOrderRespond(tok: string, dcs: CODecision) {
    const co = this.db.change_orders.find(x => x.token === tok);
    if (!co) throw new Error("Link not found");
    if (co.status !== "sent") throw new Error("This change order is not awaiting a decision");
    co.status = dcs.action; co.decided_by = (dcs.name || "").trim().slice(0, 120) || "Client"; co.decided_at = nowIso();
    this.activity(co.workspace_id, "change_order." + dcs.action, co.project_id, co.id, co.decided_by, `${dcs.action} change order “${co.title}”`, { amount: co.amount, currency: co.currency });
    this.save();
  }
  // ---- conversations (client side) ----
  private shared(threadId: ID, type: ThreadType): SharedMessage[] {
    return this.db.messages.filter(m => m.thread_id === threadId && m.thread_type === type && m.visibility === "client")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(m => ({ author_name: m.author_name, author_type: m.author_type, body: m.body, attachments: m.attachments || [], created_at: m.created_at }));
  }
  private clientSays(c: Client, type: ThreadType, threadId: ID, name: string, body: string, projectId: ID | null) {
    const b = (body || "").trim().slice(0, 4000);
    if (!b) throw new Error("Message is empty");
    const nm = (name || "").trim().slice(0, 120) || c.name;
    const cls = classify(b).kind;
    this.db.messages.push({ id: uid(), workspace_id: c.workspace_id, thread_type: type, thread_id: threadId, client_id: c.id, visibility: "client", author_type: "client",
      author_member_id: null, author_name: nm, body: b, attachments: [], mentions: [], classification: cls === "new_request" ? cls : null, created_at: nowIso() });
    this.activity(c.workspace_id, "message.client", projectId, threadId, nm, `wrote: “${b.slice(0, 140)}”`, { classification: cls, thread_type: type });
    this.save();
  }
  async reviewMessages(tok: string) { const d = this.db.deliverables.find(x => x.review_token === tok); return d ? this.shared(d.id, "deliverable") : []; }
  async reviewMessage(tok: string, name: string, body: string) {
    const d = this.db.deliverables.find(x => x.review_token === tok); if (!d) throw new Error("Link not found");
    const p = this.db.projects.find(x => x.id === d.project_id)!; const c = this.db.clients.find(x => x.id === p.client_id)!;
    this.clientSays(c, "deliverable", d.id, name, body, d.project_id);
  }
  async portalMessages(tok: string) { const c = this.db.clients.find(x => x.portal_token === tok); return c ? this.shared(c.id, "client") : []; }
  async portalMessage(tok: string, name: string, body: string) {
    const c = this.db.clients.find(x => x.portal_token === tok); if (!c) throw new Error("Link not found");
    this.clientSays(c, "client", c.id, name, body, null);
  }
  async portalGet(tok: string): Promise<PortalPayload | null> {
    const c = this.db.clients.find(x => x.portal_token === tok);
    if (!c) return null;
    const w = this.db.workspaces.find(x => x.id === c.workspace_id)!;
    const projects = this.db.projects.filter(p => p.client_id === c.id);
    const pids = new Set(projects.map(p => p.id));
    const recent = Date.now() - 45 * 86400000;
    const items = this.db.deliverables
      .filter(d => pids.has(d.project_id) && d.status !== "draft" && (d.status !== "approved" || new Date(d.approved_at || 0).getTime() > recent))
      .sort((a, b) => (a.publish_date || a.due_date || a.created_at).localeCompare(b.publish_date || b.due_date || b.created_at))
      .map(d => {
        const v = this.db.versions.find(x => x.deliverable_id === d.id && x.number === d.current_version);
        return { title: d.title, kind: d.kind, status: d.status, review_token: d.review_token, project: projects.find(p => p.id === d.project_id)!.name, current_version: d.current_version,
          publish_date: d.publish_date, due_date: d.due_date, sent_at: d.sent_at, approved_at: d.approved_at, thumb: v ? { file_url: v.file_url, file_type: v.file_type, link_url: v.link_url } : null };
      });
    const change_orders = this.db.change_orders.filter(x => pids.has(x.project_id) && x.status !== "draft").sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(x => ({ title: x.title, amount: x.amount, currency: x.currency, status: x.status, token: x.token, created_at: x.created_at }));
    return { workspace: { name: w.name, currency: w.currency }, client: { name: c.name, lang: c.lang }, items, change_orders };
  }
}

export { token };
