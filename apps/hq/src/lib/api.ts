// Picks the backend. Production sets VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// at build time (Vercel → Environment Variables). Without them, the app runs in
// demo mode inside the browser. A browser-local override (Settings → Backend)
// lets an admin try a Supabase project before redeploying.
import type { Backend } from "./backend";
import { LocalBackend } from "./local";
import { SupabaseBackend } from "./supa";

const OVERRIDE_KEY = "hq-supabase-override";
export interface SupaConfig { url: string; key: string }

export function supabaseConfig(): (SupaConfig & { source: "env" | "local" }) | null {
  try {
    const o = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "null");
    if (o && o.url && o.key) return { ...o, source: "local" };
  } catch { /* ignore */ }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? { url, key, source: "env" } : null;
}
export function setSupabaseOverride(c: SupaConfig | null) {
  if (c) localStorage.setItem(OVERRIDE_KEY, JSON.stringify(c)); else localStorage.removeItem(OVERRIDE_KEY);
  location.reload();
}

const cfg = supabaseConfig();
export const api: Backend = cfg ? new SupabaseBackend(cfg.url, cfg.key) : new LocalBackend();
export const isDemo = api.mode === "demo";
