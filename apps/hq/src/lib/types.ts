// Domain model for Vitals GO. Mirrors supabase/migrations/*.sql.
export type ID = string;
export type Lang = "en" | "ar";
export type Role = "owner" | "admin" | "member";

export interface Workspace {
  id: ID; name: string; currency: string; owner_id: ID; created_at: string;
  wa_template_en: string; wa_template_ar: string; remind_after_days: number;
}
export interface Member { id: ID; workspace_id: ID; user_id: ID; role: Role; name: string; email: string; created_at: string }
export interface Invite { id: ID; workspace_id: ID; email: string; role: Role; token: string; accepted_at: string | null; created_at: string }

export interface Client {
  id: ID; workspace_id: ID; name: string; contact_name: string; phone: string; email: string; lang: Lang; notes: string; portal_token: string;
  preferred_channel: Channel; chat_webhook: string; created_at: string;
}

export type ProjectStatus = "active" | "paused" | "done";
export interface Project {
  id: ID; workspace_id: ID; client_id: ID; name: string; status: ProjectStatus; color: string;
  start_date: string | null; due_date: string | null; budget: number | null; created_at: string;
  sync_targets: { clickup?: { list_id: string; name?: string }; asana?: { project_gid: string; name?: string } };
}

export type Period = "project" | "month";
export interface ScopeItem {
  id: ID; workspace_id: ID; project_id: ID; title: string; kind: DeliverableKind;
  quantity: number; period: Period; revisions_included: number; extra_price: number; created_at: string;
}

export type DeliverableKind = "design" | "video" | "copy" | "post" | "web" | "other";
export type DeliverableStatus = "draft" | "in_review" | "changes" | "approved";
export interface Deliverable {
  id: ID; workspace_id: ID; project_id: ID; scope_item_id: ID | null; title: string; kind: DeliverableKind;
  status: DeliverableStatus; due_date: string | null; assignee_id: ID | null; review_token: string;
  current_version: number; revision_count: number; out_of_scope: boolean; sent_at: string | null; approved_at: string | null;
  publish_date: string | null; reminded_at: string | null; created_at: string;
  ad_ref: string; caption: string; auto_publish: boolean; publish_targets: PublishTarget[]; published_at: string | null; publish_error: string;
}
export interface Version {
  id: ID; workspace_id: ID; deliverable_id: ID; number: number; file_url: string; file_name: string; file_type: string;
  link_url: string; note: string; created_by: string; created_at: string;
}

export type FeedbackKind = "approved" | "changes";
export type Classification = "revision" | "new_request";
export interface Feedback {
  id: ID; workspace_id: ID; deliverable_id: ID; version_number: number; kind: FeedbackKind;
  author_name: string; comment: string; classification: Classification | null; resolved: boolean; pins: Pin[]; created_at: string;
}
// A point on the artwork (percent of width/height) with the client's note.
export interface Pin { x: number; y: number; text: string }

export type COStatus = "draft" | "sent" | "approved" | "declined";
export interface ChangeOrder {
  id: ID; workspace_id: ID; project_id: ID; deliverable_id: ID | null; feedback_id: ID | null; title: string; description: string;
  amount: number; currency: string; status: COStatus; token: string; decided_by: string; decided_at: string | null; created_at: string;
}

export type TaskStatus = "todo" | "doing" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export interface Task {
  id: ID; workspace_id: ID; project_id: ID | null; deliverable_id: ID | null; title: string; description: string;
  status: TaskStatus; priority: Priority; assignee_id: ID | null; due_date: string | null; position: number; created_at: string;
}

export interface Comment { id: ID; workspace_id: ID; entity_type: "deliverable" | "task"; entity_id: ID; author_name: string; body: string; created_at: string }

export interface Activity {
  id: ID; workspace_id: ID; type: string; project_id: ID | null; entity_id: ID | null; actor: string; summary: string; data: Record<string, unknown>; created_at: string;
}

export type Channel = "email" | "whatsapp" | "sms" | "slack" | "teams" | "link";

// Conversations: a thread lives on a client, a project or a deliverable.
// "internal" messages are team-only; "client" messages are shared with the client.
export type ThreadType = "client" | "project" | "deliverable";
export interface Attachment { url: string; name: string; type: string }
export interface Message {
  id: ID; workspace_id: ID; thread_type: ThreadType; thread_id: ID; client_id: ID | null;
  visibility: "internal" | "client"; author_type: "member" | "client"; author_member_id: ID | null; author_name: string;
  body: string; attachments: Attachment[]; mentions: ID[]; classification: Classification | null; created_at: string;
}
export interface SharedMessage { author_name: string; author_type: "member" | "client"; body: string; attachments: Attachment[]; created_at: string }

export type WebhookKind = "generic" | "slack" | "teams";
export interface Webhook { id: ID; workspace_id: ID; name: string; kind: WebhookKind; url: string; events: string[]; secret: string; active: boolean; created_at: string }

export interface PublishTarget { network: "facebook" | "instagram"; id: string; name?: string }
export type Provider = "clickup" | "asana" | "meta" | "google_ads" | "stripe" | "paymob" | "tap";
export interface Connection { id: ID; workspace_id: ID; provider: Provider; account_label: string; settings: Record<string, unknown>; status: "active" | "error" | "revoked"; last_error: string; created_at: string }
export interface ExternalLink { id: ID; workspace_id: ID; provider: string; entity_type: "deliverable" | "change_order" | "invoice"; entity_id: ID; external_id: string; url: string; created_at: string }
export interface InvoiceLine { description: string; qty: number; unit_price: number }
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export interface Invoice {
  id: ID; workspace_id: ID; client_id: ID; project_id: ID | null; change_order_id: ID | null; number: string; title: string; lines: InvoiceLine[];
  amount: number; currency: string; status: InvoiceStatus; provider: "" | "stripe" | "paymob" | "tap" | "manual"; payment_url: string; provider_ref: string;
  token: string; due_date: string | null; sent_at: string | null; paid_at: string | null; created_at: string;
}
export interface InvoicePayload {
  workspace: { name: string }; client: { name: string; lang: Lang };
  invoice: Pick<Invoice, "number" | "title" | "lines" | "amount" | "currency" | "status" | "payment_url" | "due_date" | "sent_at" | "paid_at" | "created_at">;
}

export interface Tables {
  workspaces: Workspace; members: Member; invites: Invite; clients: Client; projects: Project; scope_items: ScopeItem;
  deliverables: Deliverable; versions: Version; feedback: Feedback; change_orders: ChangeOrder; tasks: Task; comments: Comment; activity: Activity;
  messages: Message; webhooks: Webhook; connections: Connection; external_links: ExternalLink; invoices: Invoice;
}
export type TableName = keyof Tables;

export interface SessionUser { id: ID; email: string; name: string }

// What a client sees on the public review page (no login).
export interface ReviewPayload {
  workspace: { name: string; currency: string };
  client: { name: string; lang: Lang; portal_token?: string };
  project: { name: string };
  deliverable: Pick<Deliverable, "id" | "title" | "kind" | "status" | "current_version" | "revision_count" | "approved_at" | "publish_date">;
  revisions_included: number | null;
  versions: Version[];
  feedback: Pick<Feedback, "kind" | "author_name" | "comment" | "version_number" | "created_at" | "pins">[];
}
export interface ChangeOrderPayload {
  workspace: { name: string };
  client: { name: string; lang: Lang };
  project: { name: string };
  change_order: Pick<ChangeOrder, "title" | "description" | "amount" | "currency" | "status" | "decided_by" | "decided_at" | "created_at">;
}

// Client portal: everything a client needs, one permanent link.
export interface PortalItem {
  title: string; kind: DeliverableKind; status: DeliverableStatus; review_token: string; project: string; current_version: number;
  publish_date: string | null; due_date: string | null; sent_at: string | null; approved_at: string | null;
  thumb: { file_url: string; file_type: string; link_url: string } | null;
}
export interface PortalPayload {
  workspace: { name: string; currency: string };
  client: { name: string; lang: Lang };
  items: PortalItem[];
  change_orders: { title: string; amount: number; currency: string; status: COStatus; token: string; created_at: string }[];
}
