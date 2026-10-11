// Third-party providers: OAuth details and the API calls Vitals Approve makes.
// Each provider is enabled by setting its client id/secret in the environment.
import { env } from "./server.js";

const form = obj => new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== "")).toString();
async function call(url, opts = {}) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 300) }; }
  if (!r.ok) {
    const msg = body.err || body.error?.message || body.errors?.[0]?.message || body.error_description || body.error || body.message || body.raw || "HTTP " + r.status;
    throw Object.assign(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)), { status: r.status === 401 ? 401 : 502 });
  }
  return body;
}

export const OAUTH = {
  clickup: {
    id: () => env("CLICKUP_CLIENT_ID"), secret: () => env("CLICKUP_CLIENT_SECRET"),
    authorize: (redirect, state) => `https://app.clickup.com/api?${form({ client_id: env("CLICKUP_CLIENT_ID"), redirect_uri: redirect, state })}`,
    async exchange(code) {
      const t = await call(`https://api.clickup.com/api/v2/oauth/token?${form({ client_id: env("CLICKUP_CLIENT_ID"), client_secret: env("CLICKUP_CLIENT_SECRET"), code })}`, { method: "POST" });
      const me = await call("https://api.clickup.com/api/v2/user", { headers: { Authorization: t.access_token } });
      return { secret: { access_token: t.access_token }, label: me.user?.email || me.user?.username || "ClickUp" };
    }
  },
  asana: {
    id: () => env("ASANA_CLIENT_ID"), secret: () => env("ASANA_CLIENT_SECRET"),
    authorize: (redirect, state) => `https://app.asana.com/-/oauth_authorize?${form({ client_id: env("ASANA_CLIENT_ID"), redirect_uri: redirect, response_type: "code", state })}`,
    async exchange(code, redirect) {
      const t = await call("https://app.asana.com/-/oauth_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "authorization_code", client_id: env("ASANA_CLIENT_ID"), client_secret: env("ASANA_CLIENT_SECRET"), redirect_uri: redirect, code }) });
      return { secret: { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + (t.expires_in || 3600) * 1000 }, label: t.data?.email || t.data?.name || "Asana" };
    },
    async refresh(secret) {
      const t = await call("https://app.asana.com/-/oauth_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "refresh_token", client_id: env("ASANA_CLIENT_ID"), client_secret: env("ASANA_CLIENT_SECRET"), refresh_token: secret.refresh_token }) });
      return { ...secret, access_token: t.access_token, expires_at: Date.now() + (t.expires_in || 3600) * 1000 };
    }
  },
  meta: {
    id: () => env("META_APP_ID"), secret: () => env("META_APP_SECRET"),
    authorize: (redirect, state) => `https://www.facebook.com/${GRAPH()}/dialog/oauth?${form({ client_id: env("META_APP_ID"), redirect_uri: redirect, state,
      scope: "ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish" })}`,
    async exchange(code, redirect) {
      const t = await call(`https://graph.facebook.com/${GRAPH()}/oauth/access_token?${form({ client_id: env("META_APP_ID"), client_secret: env("META_APP_SECRET"), redirect_uri: redirect, code })}`);
      // swap for a long-lived (~60 day) user token
      const long = await call(`https://graph.facebook.com/${GRAPH()}/oauth/access_token?${form({ grant_type: "fb_exchange_token", client_id: env("META_APP_ID"), client_secret: env("META_APP_SECRET"), fb_exchange_token: t.access_token })}`);
      const me = await call(`https://graph.facebook.com/${GRAPH()}/me?fields=name&access_token=${encodeURIComponent(long.access_token)}`);
      return { secret: { access_token: long.access_token, expires_at: Date.now() + (long.expires_in || 5184000) * 1000 }, label: me.name || "Meta" };
    }
  },
  google_ads: {
    id: () => env("GOOGLE_CLIENT_ID"), secret: () => env("GOOGLE_CLIENT_SECRET"),
    authorize: (redirect, state) => `https://accounts.google.com/o/oauth2/v2/auth?${form({ client_id: env("GOOGLE_CLIENT_ID"), redirect_uri: redirect, response_type: "code", state,
      scope: "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email", access_type: "offline", prompt: "consent" })}`,
    async exchange(code, redirect) {
      const t = await call("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "authorization_code", client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), redirect_uri: redirect, code }) });
      const me = await call("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: "Bearer " + t.access_token } });
      return { secret: { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + (t.expires_in || 3600) * 1000 }, label: me.email || "Google Ads" };
    },
    async refresh(secret) {
      const t = await call("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "refresh_token", client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), refresh_token: secret.refresh_token }) });
      return { ...secret, access_token: t.access_token, expires_at: Date.now() + (t.expires_in || 3600) * 1000 };
    }
  }
};
export const GRAPH = () => env("META_GRAPH_VERSION") || "v21.0";
export const GADS = () => env("GOOGLE_ADS_API_VERSION") || "v21";
export const enabled = p => !!(OAUTH[p] && OAUTH[p].id() && OAUTH[p].secret());

// Fresh access token (refreshing where the provider supports it). Returns [secret, changed].
export async function fresh(provider, secret) {
  const p = OAUTH[provider];
  if (p && p.refresh && secret.refresh_token && secret.expires_at && secret.expires_at < Date.now() + 60_000) return [await p.refresh(secret), true];
  return [secret, false];
}

// ---------- ClickUp ----------
export const clickup = {
  auth: s => ({ Authorization: s.access_token, "Content-Type": "application/json" }),
  async lists(s) {
    const out = [];
    const { teams } = await call("https://api.clickup.com/api/v2/team", { headers: clickup.auth(s) });
    for (const t of teams || []) {
      const { spaces } = await call(`https://api.clickup.com/api/v2/team/${t.id}/space?archived=false`, { headers: clickup.auth(s) });
      for (const sp of spaces || []) {
        const { folders } = await call(`https://api.clickup.com/api/v2/space/${sp.id}/folder?archived=false`, { headers: clickup.auth(s) });
        for (const f of folders || []) for (const l of f.lists || []) out.push({ id: l.id, name: `${t.name} / ${sp.name} / ${f.name} / ${l.name}` });
        const { lists } = await call(`https://api.clickup.com/api/v2/space/${sp.id}/list?archived=false`, { headers: clickup.auth(s) });
        for (const l of lists || []) out.push({ id: l.id, name: `${t.name} / ${sp.name} / ${l.name}` });
      }
    }
    return out;
  },
  createTask: (s, listId, { name, description, due }) => call(`https://api.clickup.com/api/v2/list/${listId}/task`, { method: "POST", headers: clickup.auth(s),
    body: JSON.stringify({ name, markdown_description: description, ...(due ? { due_date: new Date(due + "T12:00:00Z").getTime() } : {}) }) }),
  comment: (s, taskId, text) => call(`https://api.clickup.com/api/v2/task/${taskId}/comment`, { method: "POST", headers: clickup.auth(s), body: JSON.stringify({ comment_text: text, notify_all: false }) })
};

// ---------- Asana ----------
export const asana = {
  auth: s => ({ Authorization: "Bearer " + s.access_token, "Content-Type": "application/json", Accept: "application/json" }),
  async projects(s) {
    const { data: ws } = await call("https://app.asana.com/api/1.0/workspaces", { headers: asana.auth(s) });
    const out = [];
    for (const w of ws || []) {
      const { data } = await call(`https://app.asana.com/api/1.0/projects?workspace=${w.gid}&archived=false&limit=100`, { headers: asana.auth(s) });
      for (const p of data || []) out.push({ id: p.gid, name: `${w.name} / ${p.name}` });
    }
    return out;
  },
  createTask: (s, projectGid, { name, description, due }) => call("https://app.asana.com/api/1.0/tasks", { method: "POST", headers: asana.auth(s),
    body: JSON.stringify({ data: { name, notes: description, projects: [projectGid], ...(due ? { due_on: due } : {}) } }) }).then(r => r.data),
  comment: (s, taskGid, text) => call(`https://app.asana.com/api/1.0/tasks/${taskGid}/stories`, { method: "POST", headers: asana.auth(s), body: JSON.stringify({ data: { text } }) }),
  complete: (s, taskGid) => call(`https://app.asana.com/api/1.0/tasks/${taskGid}`, { method: "PUT", headers: asana.auth(s), body: JSON.stringify({ data: { completed: true } }) })
};

// ---------- Meta (ads results + publishing) ----------
const g = (path, s, params = {}) => call(`https://graph.facebook.com/${GRAPH()}/${path}?${form({ ...params, access_token: s.access_token })}`);
export const meta = {
  async adAccounts(s) { const r = await g("me/adaccounts", s, { fields: "account_id,name,currency", limit: 100 }); return (r.data || []).map(a => ({ id: a.account_id, name: a.name, currency: a.currency })); },
  async pages(s) {
    const r = await g("me/accounts", s, { fields: "id,name,access_token,instagram_business_account{id,username}", limit: 100 });
    return (r.data || []).map(p => ({ id: p.id, name: p.name, page_token: p.access_token, instagram: p.instagram_business_account || null }));
  },
  async adInsights(s, adId) {
    const r = await g(`${adId}/insights`, s, { fields: "spend,impressions,clicks,ctr,cpc,actions,action_values,purchase_roas,account_currency", date_preset: "last_30d" });
    const x = (r.data || [])[0] || {};
    const purchases = (x.actions || []).find(a => /purchase$/.test(a.action_type));
    const leads = (x.actions || []).find(a => /lead$/.test(a.action_type));
    const value = (x.action_values || []).find(a => /purchase$/.test(a.action_type));
    return { spend: +x.spend || 0, impressions: +x.impressions || 0, clicks: +x.clicks || 0, ctr: +x.ctr || 0, cpc: +x.cpc || 0,
      conversions: +(purchases?.value || leads?.value || 0), revenue: +(value?.value || 0), roas: +((x.purchase_roas || [])[0]?.value || 0), currency: x.account_currency || "", period: "last_30d" };
  },
  // Publish a photo post to a Facebook Page, or an image to Instagram (2-step container flow).
  async publish(pageToken, target, { imageUrl, caption }) {
    const post = (path, params) => call(`https://graph.facebook.com/${GRAPH()}/${path}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form({ ...params, access_token: pageToken }) });
    if (target.network === "facebook") { const r = await post(`${target.id}/photos`, { url: imageUrl, caption }); return r.post_id || r.id; }
    const c = await post(`${target.id}/media`, { image_url: imageUrl, caption });
    const r = await post(`${target.id}/media_publish`, { creation_id: c.id });
    return r.id;
  }
};

// ---------- Google Ads ----------
export const googleAds = {
  headers(s, loginCustomer) {
    return { Authorization: "Bearer " + s.access_token, "developer-token": env("GOOGLE_ADS_DEVELOPER_TOKEN"), "Content-Type": "application/json", ...(loginCustomer ? { "login-customer-id": loginCustomer } : {}) };
  },
  async customers(s) {
    const r = await call(`https://googleads.googleapis.com/${GADS()}/customers:listAccessibleCustomers`, { headers: googleAds.headers(s) });
    return (r.resourceNames || []).map(n => ({ id: n.split("/")[1], name: n.split("/")[1] }));
  },
  async adMetrics(s, customerId, adId, loginCustomer) {
    const cid = String(customerId).replace(/-/g, "");
    const r = await call(`https://googleads.googleapis.com/${GADS()}/customers/${cid}/googleAds:search`, { method: "POST", headers: googleAds.headers(s, loginCustomer),
      body: JSON.stringify({ query: `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr, metrics.average_cpc, metrics.conversions, metrics.conversions_value, customer.currency_code FROM ad_group_ad WHERE ad_group_ad.ad.id = ${Number(adId)} AND segments.date DURING LAST_30_DAYS` }) });
    const rows = r.results || [];
    const sum = k => rows.reduce((a, x) => a + Number(x.metrics?.[k] || 0), 0);
    const spend = sum("costMicros") / 1e6, revenue = sum("conversionsValue");
    return { spend, impressions: sum("impressions"), clicks: sum("clicks"), ctr: rows.length ? sum("clicks") / Math.max(1, sum("impressions")) : 0, cpc: sum("clicks") ? spend / sum("clicks") : 0,
      conversions: sum("conversions"), revenue, roas: spend ? revenue / spend : 0, currency: rows[0]?.customer?.currencyCode || "", period: "last_30_days" };
  }
};

// ---------- Payments ----------
export const payments = {
  async stripe(key, inv, urls) {
    const body = new URLSearchParams({ mode: "payment", success_url: urls.success, cancel_url: urls.cancel, "metadata[invoice_id]": inv.id, client_reference_id: inv.id,
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": inv.currency.toLowerCase(), "line_items[0][price_data][unit_amount]": String(Math.round(Number(inv.amount) * 100)),
      "line_items[0][price_data][product_data][name]": `${inv.number} · ${inv.title}`.slice(0, 250) });
    const r = await call("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" }, body });
    return { url: r.url, ref: r.id };
  },
  async stripePaid(key, ref) { const r = await call(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(ref)}`, { headers: { Authorization: "Bearer " + key } }); return r.payment_status === "paid"; },
  async tap(key, inv, urls, client) {
    const r = await call("https://api.tap.company/v2/charges", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(inv.amount), currency: inv.currency, description: `${inv.number} · ${inv.title}`, reference: { transaction: inv.id, order: inv.number },
        customer: { first_name: client.name || "Client", email: client.email || undefined }, source: { id: "src_all" }, redirect: { url: urls.success }, post: { url: urls.webhook } }) });
    return { url: r.transaction?.url, ref: r.id };
  },
  async tapPaid(key, ref) { const r = await call(`https://api.tap.company/v2/charges/${encodeURIComponent(ref)}`, { headers: { Authorization: "Bearer " + key } }); return r.status === "CAPTURED"; },
  // Paymob unified checkout (Intention API)
  async paymob(sec, inv, urls, client) {
    const r = await call("https://accept.paymob.com/v1/intention/", { method: "POST", headers: { Authorization: "Token " + sec.secret_key, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(Number(inv.amount) * 100), currency: inv.currency, payment_methods: (sec.integration_ids || "").split(",").map(x => Number(x.trim())).filter(Boolean),
        items: [{ name: `${inv.number} ${inv.title}`.slice(0, 50), amount: Math.round(Number(inv.amount) * 100), quantity: 1 }],
        billing_data: { first_name: client.name || "Client", last_name: "-", email: client.email || "na@example.com", phone_number: client.phone || "+200000000000" },
        special_reference: inv.id, notification_url: urls.webhook, redirection_url: urls.success }) });
    return { url: `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(sec.public_key)}&clientSecret=${encodeURIComponent(r.client_secret)}`, ref: String(r.id || "") };
  }
};
