// Calls to the deployment's serverless functions (/api/*), signed with the
// current user's session so the server can check workspace membership.
import { api, isDemo } from "./api";

export async function authHeader(): Promise<Record<string, string>> {
  const sb = (api as unknown as { sb?: { auth: { getSession(): Promise<{ data: { session: { access_token: string } | null } }> } } }).sb;
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  return data.session ? { Authorization: "Bearer " + data.session.access_token } : {};
}

export async function server<T = unknown>(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<T> {
  const r = await fetch(path, { method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(await authHeader()) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `Request failed (${r.status})`);
  return j as T;
}

export interface Capabilities {
  server: boolean; oauth: Record<string, boolean>; google_ads_dev_token: boolean; payments: boolean;
  ai: boolean; transcribe: boolean; email: boolean; sync: boolean; publishing: boolean;
}
let capsP: Promise<Capabilities> | null = null;
export const capabilities = () => (capsP ||= server<Capabilities>("/api/connect").catch(() => ({ server: false, oauth: {}, google_ads_dev_token: false, payments: false, ai: false, transcribe: false, email: false, sync: false, publishing: false })));

// Server-side integrations need real accounts (Supabase) and server keys.
export const liveOnlyReason = (en: boolean) => isDemo
  ? (en ? "Available once Vitals GO is live with accounts (Supabase). Demo data stays in your browser, so the server can't act on it." : "متاحة لما Vitals GO يشتغل بحسابات حقيقية (Supabase). بيانات الديمو في متصفحك بس، فالسيرفر ما يقدرش يتعامل معاها.")
  : "";
