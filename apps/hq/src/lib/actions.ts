// All writes go through here so every important event lands in the activity
// log (which also powers the Approvals Ledger and notifications).
import { api } from "./api";
import { nowIso, token } from "./backend";
import { coUrl, fillTemplate, portalUrl, reviewUrl, waLink } from "./format";
import type { ChangeOrder, Client, Deliverable, Feedback, ID, Lang, Member, Project, ScopeItem, Task, Workspace } from "./types";

export async function log(ws: Workspace, actor: string, type: string, summary: string, project_id: ID | null = null, entity_id: ID | null = null, data: Record<string, unknown> = {}) {
  await api.insert("activity", { workspace_id: ws.id, type, summary, actor, project_id, entity_id, data });
}

// ---------- clients / projects / scope ----------
export async function saveClient(ws: Workspace, me: Member, c: Partial<Client> & { id?: ID }) {
  if (c.id) return api.update("clients", c.id, c);
  const row = await api.insert("clients", { workspace_id: ws.id, name: c.name || "", contact_name: c.contact_name || "", phone: c.phone || "", email: c.email || "", lang: c.lang || "ar", notes: c.notes || "", portal_token: token(), preferred_channel: c.preferred_channel || (c.phone ? "whatsapp" : "email"), chat_webhook: c.chat_webhook || "" });
  await log(ws, me.name, "client.created", `added client “${row.name}”`, null, row.id);
  return row;
}
export async function saveProject(ws: Workspace, me: Member, p: Partial<Project> & { id?: ID }) {
  if (p.id) return api.update("projects", p.id, p);
  const row = await api.insert("projects", { workspace_id: ws.id, client_id: p.client_id!, name: p.name || "", status: "active", color: p.color || "#2EE6A6", start_date: p.start_date || null, due_date: p.due_date || null, budget: p.budget ?? null, sync_targets: {} });
  await log(ws, me.name, "project.created", `created project “${row.name}”`, row.id, row.id);
  return row;
}
export async function saveScopeItem(ws: Workspace, s: Partial<ScopeItem> & { id?: ID }) {
  if (s.id) return api.update("scope_items", s.id, s);
  return api.insert("scope_items", { workspace_id: ws.id, project_id: s.project_id!, title: s.title || "", kind: s.kind || "design", quantity: s.quantity ?? 1, period: s.period || "project", revisions_included: s.revisions_included ?? 2, extra_price: s.extra_price ?? 0 });
}

// ---------- deliverables ----------
export async function createDeliverable(ws: Workspace, me: Member, d: Partial<Deliverable>) {
  const row = await api.insert("deliverables", {
    workspace_id: ws.id, project_id: d.project_id!, scope_item_id: d.scope_item_id || null, title: d.title || "", kind: d.kind || "design",
    status: "draft", due_date: d.due_date || null, assignee_id: d.assignee_id || null, review_token: token(), current_version: 0, revision_count: 0,
    out_of_scope: false, sent_at: null, approved_at: null, publish_date: d.publish_date || null, reminded_at: null,
    ad_ref: "", caption: "", auto_publish: false, publish_targets: [], published_at: null, publish_error: ""
  });
  await log(ws, me.name, "deliverable.created", `created deliverable “${row.title}”`, row.project_id, row.id);
  return row;
}

export async function addVersion(ws: Workspace, me: Member, d: Deliverable, v: { file?: File | null; link?: string; note?: string }) {
  let file = { url: "", name: "", type: "" };
  if (v.file) file = await api.upload(ws.id, v.file);
  const number = d.current_version + 1;
  await api.insert("versions", { workspace_id: ws.id, deliverable_id: d.id, number, file_url: file.url, file_name: file.name, file_type: file.type, link_url: (v.link || "").trim(), note: (v.note || "").trim(), created_by: me.name });
  // New work answers the open feedback.
  const open = await api.list("feedback", { deliverable_id: d.id, resolved: false });
  await Promise.all(open.map(f => api.update("feedback", f.id, { resolved: true })));
  const upd = await api.update("deliverables", d.id, { current_version: number, status: "draft" });
  await log(ws, me.name, "version.added", `uploaded v${number} of “${d.title}”`, d.project_id, d.id);
  return upd;
}

export async function sendForReview(ws: Workspace, me: Member, d: Deliverable) {
  if (d.current_version < 1) throw new Error("Upload a version first");
  const upd = await api.update("deliverables", d.id, { status: "in_review", sent_at: nowIso() });
  await log(ws, me.name, "review.sent", `sent “${d.title}” v${d.current_version} for review`, d.project_id, d.id);
  return upd;
}

export function reviewMessage(ws: Workspace, client: Client, d: Deliverable, lang: Lang = client.lang) {
  const tpl = lang === "ar" ? ws.wa_template_ar : ws.wa_template_en;
  return fillTemplate(tpl, { client: client.contact_name || client.name, item: d.title, link: reviewUrl(d.review_token), agency: ws.name, version: String(d.current_version) });
}
export const reviewWhatsApp = (ws: Workspace, client: Client, d: Deliverable) => waLink(client.phone, reviewMessage(ws, client, d));
export function reminderWhatsApp(ws: Workspace, client: Client, d: Deliverable) {
  const t = client.lang === "ar"
    ? `أهلًا ${client.contact_name || client.name}، تذكير بسيط: ${d.title} لسه مستني موافقتك 🙏 ${reviewUrl(d.review_token)}
— ${ws.name}`
    : `Hi ${client.contact_name || client.name}, a quick reminder: ${d.title} is still waiting for your approval 🙏 ${reviewUrl(d.review_token)}
— ${ws.name}`;
  return waLink(client.phone, t);
}

// Agency records an approval received outside HQ (call, meeting, email).
export async function recordApproval(ws: Workspace, me: Member, d: Deliverable, who: string, note: string) {
  await api.insert("feedback", { workspace_id: ws.id, deliverable_id: d.id, version_number: d.current_version, kind: "approved", author_name: who || "Client", comment: (note ? note + " · " : "") + `recorded by ${me.name}`, classification: null, resolved: true, pins: [] });
  await api.update("deliverables", d.id, { status: "approved", approved_at: nowIso() });
  await log(ws, me.name, "approval.recorded", `recorded ${who || "client"}'s approval of “${d.title}” v${d.current_version}`, d.project_id, d.id);
}

export async function setFeedbackClass(f: Feedback, classification: Feedback["classification"]) {
  return api.update("feedback", f.id, { classification });
}

// ---------- change orders ----------
export async function createChangeOrder(ws: Workspace, me: Member, c: Partial<ChangeOrder>) {
  const row = await api.insert("change_orders", {
    workspace_id: ws.id, project_id: c.project_id!, deliverable_id: c.deliverable_id || null, feedback_id: c.feedback_id || null,
    title: c.title || "", description: c.description || "", amount: Number(c.amount || 0), currency: c.currency || ws.currency, status: "draft", token: token(), decided_by: "", decided_at: null
  });
  if (c.feedback_id) await api.update("feedback", c.feedback_id, { resolved: true });
  await log(ws, me.name, "change_order.created", `drafted change order “${row.title}”`, row.project_id, row.id, { amount: row.amount, currency: row.currency });
  return row;
}
export async function sendChangeOrder(ws: Workspace, me: Member, c: ChangeOrder) {
  const upd = await api.update("change_orders", c.id, { status: "sent" });
  await log(ws, me.name, "change_order.sent", `sent change order “${c.title}”`, c.project_id, c.id, { amount: c.amount, currency: c.currency });
  return upd;
}
export function changeOrderWhatsApp(client: Client, c: ChangeOrder, amountLabel: string) {
  const t = client.lang === "ar"
    ? `أهلًا ${client.contact_name || client.name}، ده طلب إضافي خارج نطاق الاتفاق: ${c.title} (${amountLabel}). ممكن توافق أو ترفض من هنا: ${coUrl(c.token)}`
    : `Hi ${client.contact_name || client.name}, here is a change order for work outside the agreed scope: ${c.title} (${amountLabel}). You can approve or decline here: ${coUrl(c.token)}`;
  return waLink(client.phone, t);
}

// ---------- tasks ----------
export async function saveTask(ws: Workspace, me: Member, t: Partial<Task> & { id?: ID }) {
  if (t.id) return api.update("tasks", t.id, t);
  const row = await api.insert("tasks", { workspace_id: ws.id, project_id: t.project_id || null, deliverable_id: t.deliverable_id || null, title: t.title || "", description: t.description || "",
    status: t.status || "todo", priority: t.priority || "medium", assignee_id: t.assignee_id ?? me.id, due_date: t.due_date || null, position: t.position ?? Date.now() });
  await log(ws, me.name, "task.created", `created task “${row.title}”`, row.project_id, row.id);
  return row;
}
export async function moveTask(ws: Workspace, me: Member, t: Task, status: Task["status"]) {
  if (t.status === status) return t;
  const upd = await api.update("tasks", t.id, { status, position: Date.now() });
  if (status === "done") await log(ws, me.name, "task.done", `completed “${t.title}”`, t.project_id, t.id);
  return upd;
}

// ---------- team ----------
export async function inviteMember(ws: Workspace, me: Member, email: string, role: "admin" | "member") {
  const row = await api.insert("invites", { workspace_id: ws.id, email: email.trim().toLowerCase(), role, token: token(), accepted_at: null });
  await log(ws, me.name, "team.invited", `invited ${row.email}`);
  return row;
}

// ---------- one-step send (the "Send for approval" flow) ----------
export async function quickSend(ws: Workspace, me: Member, input: { project_id: ID; title: string; kind: Deliverable["kind"]; scope_item_id: ID | null; publish_date: string | null; file: File | null; link: string; note: string; draftOnly?: boolean }) {
  const d = await createDeliverable(ws, me, { project_id: input.project_id, title: input.title, kind: input.kind, scope_item_id: input.scope_item_id, publish_date: input.publish_date, assignee_id: me.id });
  if (!input.file && !input.link.trim()) return d; // planned item, no file yet
  const withVersion = await addVersion(ws, me, d, { file: input.file, link: input.link, note: input.note });
  return input.draftOnly ? withVersion : sendForReview(ws, me, withVersion);
}

// Send several ready items at once (e.g. a month of posts) and share the client portal.
export async function sendBatch(ws: Workspace, me: Member, items: Deliverable[]) {
  const ready = items.filter(d => d.current_version > 0 && (d.status === "draft" || d.status === "changes"));
  for (const d of ready) await sendForReview(ws, me, d);
  return ready.length;
}
export function portalMessage(ws: Workspace, client: Client, count: number) {
  const name = client.contact_name || client.name;
  return client.lang === "ar"
    ? `أهلًا ${name}، عندك ${count} ${count === 1 ? "حاجة مستنية" : "حاجات مستنية"} موافقتك. تقدر تراجعهم كلهم من هنا: ${portalUrl(client.portal_token)}\n— ${ws.name}`
    : `Hi ${name}, you have ${count} item${count === 1 ? "" : "s"} waiting for your approval. Review them all here: ${portalUrl(client.portal_token)}\n— ${ws.name}`;
}
export const portalWhatsApp = (ws: Workspace, client: Client, count: number) => waLink(client.phone, portalMessage(ws, client, count));

// One reminder per client (not per item), then remember we reminded them.
export async function markReminded(items: Deliverable[]) {
  const at = nowIso();
  await Promise.all(items.map(d => api.update("deliverables", d.id, { reminded_at: at })));
}

// ---------- invoices ----------
export async function createInvoice(ws: Workspace, me: Member, inv: { client_id: ID; project_id?: ID | null; change_order_id?: ID | null; title: string; lines: { description: string; qty: number; unit_price: number }[]; currency: string; due_date?: string | null }) {
  const existing = await api.list("invoices", { workspace_id: ws.id });
  const next = existing.reduce((m, i) => Math.max(m, Number((i.number.match(/(\d+)$/) || [])[1] || 0)), 0) + 1;
  const amount = inv.lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.unit_price || 0), 0);
  const row = await api.insert("invoices", { workspace_id: ws.id, client_id: inv.client_id, project_id: inv.project_id || null, change_order_id: inv.change_order_id || null,
    number: "INV-" + String(next).padStart(4, "0"), title: inv.title, lines: inv.lines, amount, currency: inv.currency, status: "draft", provider: "", payment_url: "", provider_ref: "",
    token: token(), due_date: inv.due_date || null, sent_at: null, paid_at: null });
  await log(ws, me.name, "invoice.created", `created invoice ${row.number}`, row.project_id, row.id, { amount, currency: inv.currency });
  return row;
}
