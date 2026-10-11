// /api/connect — connect a workspace to third-party tools.
//   GET                          → which integrations this deployment can offer
//   POST ?action=start           → { url } to send the admin to the provider's consent screen
//   GET  ?action=callback        → provider redirects here; tokens are encrypted and stored
//   POST ?action=save_key        → Stripe / Tap / Paymob API keys (validated where possible)
//   POST ?action=disconnect      → remove a connection
//   GET  ?action=resources       → lists to map to (ClickUp lists, Asana projects, ad accounts, pages)
//   POST ?action=settings        → save non-secret settings for a connection
import { admin, APP_URL, env, handle, json, loadConnection, markError, query, readJson, redirect, requireMember, saveConnection, sign, verify } from "./_lib/server.js";
import { asana, clickup, enabled, fresh, googleAds, meta, OAUTH } from "./_lib/providers.js";

const KEY_PROVIDERS = ["stripe", "tap", "paymob"];
const callbackUrl = provider => `${APP_URL()}/api/connect?action=callback&provider=${provider}`;

export default handle(async (req, res) => {
  const q = query(req);
  const action = q.get("action") || "";

  if (req.method === "GET" && !action) {
    return json(res, 200, {
      server: !!(env("SUPABASE_SERVICE_ROLE_KEY") && env("TOKEN_ENC_KEY")),
      oauth: Object.fromEntries(Object.keys(OAUTH).map(p => [p, enabled(p)])),
      google_ads_dev_token: !!env("GOOGLE_ADS_DEVELOPER_TOKEN"),
      payments: true,
      ai: !!env("ANTHROPIC_API_KEY"),
      transcribe: !!env("ELEVENLABS_API_KEY"),
      email: !!env("RESEND_API_KEY"),
      sync: !!env("SYNC_SECRET"),
      publishing: !!env("CRON_SECRET")
    });
  }

  if (action === "callback") {
    const provider = q.get("provider");
    const back = (msg, ok) => redirect(res, `${APP_URL()}/app/integrations?${ok ? "connected" : "error"}=${encodeURIComponent(ok ? provider : msg)}`);
    if (q.get("error")) return back(q.get("error_description") || q.get("error"), false);
    let st;
    try { st = verify(q.get("state")); } catch (e) { return back(e.message, false); }
    if (st.provider !== provider || !OAUTH[provider]) return back("Provider mismatch", false);
    try {
      const { secret, label } = await OAUTH[provider].exchange(q.get("code"), callbackUrl(provider));
      await saveConnection(admin(), { workspace_id: st.ws, provider, account_label: label, secret, user_id: st.uid });
      return back("", true);
    } catch (e) { return back(e.message, false); }
  }

  if (req.method === "POST") {
    const b = await readJson(req, 20000);
    const ws = String(b.workspace_id || "");
    const provider = String(b.provider || "");
    if (!ws) return json(res, 400, { error: "workspace_id required" });
    const sb = admin();

    if (action === "start") {
      const { user } = await requireMember(req, ws, true);
      if (!enabled(provider)) return json(res, 501, { error: `${provider} is not set up on this deployment (missing client id/secret)` });
      return json(res, 200, { url: OAUTH[provider].authorize(callbackUrl(provider), sign({ ws, uid: user.id, provider })) });
    }

    if (action === "save_key") {
      const { user } = await requireMember(req, ws, true);
      if (!KEY_PROVIDERS.includes(provider)) return json(res, 400, { error: "Unknown provider" });
      const k = b.keys || {};
      let secret, label;
      if (provider === "stripe") {
        if (!/^(sk|rk)_(live|test)_/.test(k.secret_key || "")) return json(res, 400, { error: "Use a Stripe secret or restricted key (sk_… / rk_…)" });
        const r = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: "Bearer " + k.secret_key } });
        if (!r.ok) return json(res, 400, { error: "Stripe rejected this key" });
        secret = { secret_key: k.secret_key }; label = k.secret_key.includes("_test_") ? "Stripe (test mode)" : "Stripe";
      } else if (provider === "tap") {
        if (!/^sk_(live|test)_/.test(k.secret_key || "")) return json(res, 400, { error: "Use a Tap secret key (sk_…)" });
        secret = { secret_key: k.secret_key }; label = k.secret_key.includes("_test_") ? "Tap (test mode)" : "Tap";
      } else {
        if (!k.secret_key || !k.public_key || !k.integration_ids || !k.hmac_secret) return json(res, 400, { error: "Paymob needs secret key, public key, integration id(s) and HMAC secret" });
        secret = { secret_key: k.secret_key, public_key: k.public_key, integration_ids: String(k.integration_ids), hmac_secret: k.hmac_secret }; label = "Paymob";
      }
      const conn = await saveConnection(sb, { workspace_id: ws, provider, account_label: label, secret, user_id: user.id });
      return json(res, 200, { ok: true, id: conn.id, label });
    }

    if (action === "disconnect") {
      await requireMember(req, ws, true);
      await sb.from("connections").delete().eq("workspace_id", ws).eq("provider", provider);
      return json(res, 200, { ok: true });
    }

    if (action === "settings") {
      await requireMember(req, ws, true);
      const settings = b.settings && typeof b.settings === "object" ? b.settings : {};
      const { error } = await sb.from("connections").update({ settings }).eq("workspace_id", ws).eq("provider", provider);
      if (error) return json(res, 400, { error: error.message });
      return json(res, 200, { ok: true });
    }
  }

  if (req.method === "GET" && action === "resources") {
    const ws = q.get("workspace_id") || "";
    const provider = q.get("provider") || "";
    await requireMember(req, ws);
    const sb = admin();
    const c = await loadConnection(sb, ws, provider);
    if (!c) return json(res, 404, { error: "Not connected" });
    try {
      const [secret, changed] = await fresh(provider, c.secret);
      if (changed) await saveConnection(sb, { workspace_id: ws, provider, account_label: c.conn.account_label, settings: c.conn.settings, secret });
      let items = [];
      if (provider === "clickup") items = await clickup.lists(secret);
      else if (provider === "asana") items = await asana.projects(secret);
      else if (provider === "meta") items = { ad_accounts: await meta.adAccounts(secret), pages: (await meta.pages(secret)).map(p => ({ id: p.id, name: p.name, instagram: p.instagram })) };
      else if (provider === "google_ads") items = await googleAds.customers(secret);
      return json(res, 200, { items });
    } catch (e) {
      if (e.status === 401) await markError(sb, c.conn.id, e.message);
      throw e;
    }
  }

  json(res, 404, { error: "Unknown action" });
});
