// Production backend: Supabase (Postgres + Auth + Storage). Every table is
// protected by row-level security (members only see their workspace); the
// public review and change-order pages go through SECURITY DEFINER functions
// that only accept the unguessable link token. Schema: supabase/migrations.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Backend, CODecision, Filter, ReviewResponse, Row } from "./backend";
import { uid } from "./backend";
import { emitChange } from "./bus";
import type { ChangeOrderPayload, ID, PortalPayload, ReviewPayload, SessionUser, TableName, Workspace } from "./types";

const toUser = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): SessionUser | null =>
  u ? { id: u.id, email: u.email || "", name: String((u.user_metadata && u.user_metadata.name) || (u.email || "").split("@")[0]) } : null;

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export class SupabaseBackend implements Backend {
  mode = "supabase" as const;
  sb: SupabaseClient;
  constructor(url: string, key: string) {
    this.sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  }
  async session() { const { data } = await this.sb.auth.getSession(); return toUser(data.session?.user); }
  async signIn(email: string, password: string) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password }); fail(error);
    return toUser(data.user)!;
  }
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin + "/app/" } }); fail(error);
    return data.session ? toUser(data.user)! : "confirm";
  }
  async signOut() { await this.sb.auth.signOut(); }
  async resetPassword(email: string) {
    const { error } = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/app/" }); fail(error);
  }
  onAuth(cb: (u: SessionUser | null) => void) {
    const { data } = this.sb.auth.onAuthStateChange((_e, s) => cb(toUser(s?.user)));
    return () => data.subscription.unsubscribe();
  }

  async myWorkspaces() {
    const { data, error } = await this.sb.from("workspaces").select("*").order("created_at"); fail(error);
    return (data || []) as Workspace[];
  }
  async createWorkspace(name: string, currency: string, ownerName: string) {
    const { data, error } = await this.sb.rpc("hq_create_workspace", { p_name: name, p_currency: currency, p_owner_name: ownerName }); fail(error);
    emitChange();
    return data as Workspace;
  }
  async acceptInvite(token: string, name: string) {
    const { data, error } = await this.sb.rpc("hq_accept_invite", { p_token: token, p_name: name }); fail(error);
    emitChange();
    return data as ID;
  }

  async list<T extends TableName>(table: T, filter: Filter<T> = {}) {
    const { data, error } = await this.sb.from(table).select("*").match(filter as Record<string, unknown>).order("created_at"); fail(error);
    return (data || []) as Row<T>[];
  }
  async get<T extends TableName>(table: T, id: ID) {
    const { data, error } = await this.sb.from(table).select("*").eq("id", id).maybeSingle(); fail(error);
    return (data as Row<T>) || null;
  }
  async insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
    const { data, error } = await this.sb.from(table).insert(row as object).select("*").single(); fail(error);
    emitChange();
    return data as Row<T>;
  }
  async update<T extends TableName>(table: T, id: ID, patch: Partial<Row<T>>) {
    const { data, error } = await this.sb.from(table).update(patch as object).eq("id", id).select("*").single(); fail(error);
    emitChange();
    return data as Row<T>;
  }
  async remove(table: TableName, id: ID) {
    const { error } = await this.sb.from(table).delete().eq("id", id); fail(error);
    emitChange();
  }
  async upload(workspaceId: ID, file: File) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${workspaceId}/${uid()}/${safe}`;
    const { error } = await this.sb.storage.from("hq-files").upload(path, file, { contentType: file.type, upsert: false }); fail(error);
    const { data } = this.sb.storage.from("hq-files").getPublicUrl(path);
    return { url: data.publicUrl, name: file.name, type: file.type };
  }

  async reviewGet(token: string) {
    const { data, error } = await this.sb.rpc("hq_review_get", { p_token: token }); fail(error);
    return (data as ReviewPayload) || null;
  }
  async reviewRespond(token: string, r: ReviewResponse) {
    const { error } = await this.sb.rpc("hq_review_respond", { p_token: token, p_action: r.action, p_name: r.name, p_comment: r.comment, p_pins: r.pins || [] }); fail(error);
  }
  async portalGet(token: string) {
    const { data, error } = await this.sb.rpc("hq_portal_get", { p_token: token }); fail(error);
    return (data as PortalPayload) || null;
  }
  async changeOrderGet(token: string) {
    const { data, error } = await this.sb.rpc("hq_co_get", { p_token: token }); fail(error);
    return (data as ChangeOrderPayload) || null;
  }
  async changeOrderRespond(token: string, d: CODecision) {
    const { error } = await this.sb.rpc("hq_co_respond", { p_token: token, p_action: d.action, p_name: d.name }); fail(error);
  }
}
