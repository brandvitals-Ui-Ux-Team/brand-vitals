// Shared helpers for the serverless functions (files under api/_lib are not
// deployed as endpoints). Auth, Supabase service client, encryption, signing.
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const env = name => process.env[name] || "";
export const SB_URL = () => env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
export const SB_ANON = () => env("SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY");
export const APP_URL = () => (env("APP_URL") || "https://brandvitals.io").replace(/\/$/, "");

export function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
export function redirect(res, url) { res.statusCode = 302; res.setHeader("Location", url); res.end(); }
export const query = req => new URL(req.url, "http://x").searchParams;

export async function readRaw(req, limit = 6_000_000) {
  if (typeof req.body === "string") return req.body;
  if (req.body && Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > limit) throw new Error("Request too large"); chunks.push(c); }
  return Buffer.concat(chunks).toString("utf8");
}
export async function readJson(req, limit) { const raw = await readRaw(req, limit); return raw ? JSON.parse(raw) : {}; }

// ---------- Supabase ----------
export function admin() {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!SB_URL() || !key) throw Object.assign(new Error("Server integrations need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"), { status: 501 });
  return createClient(SB_URL(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}
// The signed-in app user behind a request (Authorization: Bearer <access token>).
export async function currentUser(req) {
  const auth = req.headers.authorization || "";
  if (!/^Bearer\s+\S+/.test(auth) || !SB_URL() || !SB_ANON()) return null;
  const r = await fetch(SB_URL().replace(/\/$/, "") + "/auth/v1/user", { headers: { apikey: SB_ANON(), Authorization: auth } });
  return r.ok ? r.json() : null;
}
// Throws unless the user is a member (or admin) of the workspace.
export async function requireMember(req, workspaceId, needAdmin = false) {
  const user = await currentUser(req);
  if (!user) throw Object.assign(new Error("Sign in required"), { status: 401 });
  const { data } = await admin().from("members").select("role").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (!data) throw Object.assign(new Error("Not a member of this workspace"), { status: 403 });
  if (needAdmin && !["owner", "admin"].includes(data.role)) throw Object.assign(new Error("Admins only"), { status: 403 });
  return { user, role: data.role };
}

// ---------- secrets at rest (AES-256-GCM) ----------
const encKey = () => {
  const k = env("TOKEN_ENC_KEY");
  if (!k) throw Object.assign(new Error("TOKEN_ENC_KEY is not set"), { status: 501 });
  return crypto.createHash("sha256").update(k).digest();
};
export function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}
export function decrypt(str) {
  const [v, iv, tag, data] = String(str).split(".");
  if (v !== "v1") throw new Error("Unknown secret format");
  const d = crypto.createDecipheriv("aes-256-gcm", encKey(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8"));
}

// ---------- signed, expiring state (OAuth) ----------
const stateKey = () => env("OAUTH_STATE_SECRET") || env("TOKEN_ENC_KEY");
export function sign(payload, ttlSeconds = 600) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  const mac = crypto.createHmac("sha256", stateKey()).update(body).digest("base64url");
  return body + "." + mac;
}
export function verify(token) {
  const [body, mac] = String(token || "").split(".");
  if (!body || !mac) throw new Error("Bad state");
  const want = crypto.createHmac("sha256", stateKey()).update(body).digest("base64url");
  if (want.length !== mac.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac))) throw new Error("Bad state signature");
  const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (p.exp < Date.now() / 1000) throw new Error("State expired");
  return p;
}
export const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

// ---------- connections ----------
export async function loadConnection(sb, workspaceId, provider) {
  const { data: conn } = await sb.from("connections").select("*").eq("workspace_id", workspaceId).eq("provider", provider).eq("status", "active").maybeSingle();
  if (!conn) return null;
  const { data: sec } = await sb.from("connection_secrets").select("data").eq("connection_id", conn.id).maybeSingle();
  return { conn, secret: sec ? decrypt(sec.data) : {} };
}
export async function saveConnection(sb, { workspace_id, provider, account_label, settings = {}, secret, user_id }) {
  const { data: conn, error } = await sb.from("connections").upsert({ workspace_id, provider, account_label, settings, status: "active", last_error: "", connected_by: user_id || null }, { onConflict: "workspace_id,provider" }).select("*").single();
  if (error) throw new Error(error.message);
  await sb.from("connection_secrets").upsert({ connection_id: conn.id, data: encrypt(secret), updated_at: new Date().toISOString() });
  return conn;
}
export async function markError(sb, connId, message) {
  await sb.from("connections").update({ status: "error", last_error: String(message).slice(0, 500) }).eq("id", connId);
}

export function handle(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) { json(res, e.status || 500, { error: String(e.message || e) }); }
  };
}
