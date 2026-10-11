// The app talks to one Backend. Two implementations:
//  - LocalBackend: demo mode, everything in this browser (localStorage + IndexedDB)
//  - SupabaseBackend: real multi-user SaaS (Postgres + Auth + Storage + RLS)
import type { ChangeOrderPayload, ID, InvoicePayload, Pin, PortalPayload, ReviewPayload, SessionUser, SharedMessage, TableName, Tables, Workspace } from "./types";

export type Row<T extends TableName> = Tables[T];
export type Filter<T extends TableName> = Partial<Row<T>>;

export interface ReviewResponse { action: "approved" | "changes"; name: string; comment: string; pins?: Pin[] }
export interface CODecision { action: "approved" | "declined"; name: string }

export interface Backend {
  mode: "demo" | "supabase";
  // auth
  session(): Promise<SessionUser | null>;
  signIn(email: string, password: string): Promise<SessionUser>;
  signUp(email: string, password: string, name: string): Promise<SessionUser | "confirm">;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  onAuth(cb: (u: SessionUser | null) => void): () => void;
  // workspaces the user belongs to
  myWorkspaces(): Promise<Workspace[]>;
  createWorkspace(name: string, currency: string, ownerName: string): Promise<Workspace>;
  acceptInvite(token: string, name: string): Promise<ID>;
  // data (always scoped to a workspace by the caller)
  list<T extends TableName>(table: T, filter?: Filter<T>): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: ID): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, row: Partial<Row<T>>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: ID, patch: Partial<Row<T>>): Promise<Row<T>>;
  remove(table: TableName, id: ID): Promise<void>;
  upload(workspaceId: ID, file: File): Promise<{ url: string; name: string; type: string }>;
  // public (no login) endpoints for clients
  reviewGet(token: string): Promise<ReviewPayload | null>;
  reviewRespond(token: string, r: ReviewResponse): Promise<void>;
  changeOrderGet(token: string): Promise<ChangeOrderPayload | null>;
  changeOrderRespond(token: string, d: CODecision): Promise<void>;
  portalGet(token: string): Promise<PortalPayload | null>;
  invoiceGet(token: string): Promise<InvoicePayload | null>;
  // client-side conversation (shared messages only), by token
  reviewMessages(token: string): Promise<SharedMessage[]>;
  reviewMessage(token: string, name: string, body: string): Promise<void>;
  portalMessages(token: string): Promise<SharedMessage[]>;
  portalMessage(token: string, name: string, body: string): Promise<void>;
  // demo only
  resetDemo?(): Promise<void>;
}

export const uid = (): string =>
  (globalThis.crypto && "randomUUID" in crypto) ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2);

// Unguessable public tokens for review / change-order links.
export const token = (): string => {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
};

export const nowIso = () => new Date().toISOString();
