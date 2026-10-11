// Server function tests (no network): crypto, OAuth state, provider request
// shapes with a mocked fetch, and the security gates of each endpoint.
// Usage: npm run test:api
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.TOKEN_ENC_KEY = "test-key-please-change";
process.env.SYNC_SECRET = "sync-secret";
process.env.CRON_SECRET = "cron-secret";
delete process.env.SUPABASE_URL; delete process.env.VITE_SUPABASE_URL;

const S = await import("../_lib/server.js");
const P = await import("../_lib/providers.js");

function mockRes() {
  const r = { statusCode: 200, headers: {}, body: "", setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b || ""; } };
  return r;
}
function mockReq({ method = "GET", url = "/", headers = {}, body } = {}) {
  return { method, url, headers, body };
}
const realFetch = globalThis.fetch;
function withFetch(handler, fn) {
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => { calls.push({ url: String(url), opts }); const [status, body] = handler(String(url), opts); return new Response(JSON.stringify(body), { status }); };
  return fn(calls).finally(() => { globalThis.fetch = realFetch; });
}

test("secrets encrypt and decrypt, tampering is detected", () => {
  const enc = S.encrypt({ access_token: "abc", n: 1 });
  assert.match(enc, /^v1\./);
  assert.ok(!enc.includes("abc"), "ciphertext must not contain the token");
  assert.deepEqual(S.decrypt(enc), { access_token: "abc", n: 1 });
  const parts = enc.split(".");
  parts[3] = Buffer.from("tampered").toString("base64");
  assert.throws(() => S.decrypt(parts.join(".")));
});

test("OAuth state is signed and expires", () => {
  const t = S.sign({ ws: "w1", uid: "u1", provider: "clickup" });
  assert.equal(S.verify(t).ws, "w1");
  const [body] = t.split(".");
  assert.throws(() => S.verify(body + ".forged"), /signature/);
  const old = S.sign({ ws: "w1" }, -10);
  assert.throws(() => S.verify(old), /expired/);
});

test("ClickUp task creation hits the list endpoint with the token", () => withFetch(() => [200, { id: "t123", url: "https://app.clickup.com/t/t123" }], async calls => {
  const t = await P.clickup.createTask({ access_token: "tok" }, "L9", { name: "Post 1", description: "d", due: "2026-11-05" });
  assert.equal(t.id, "t123");
  assert.equal(calls[0].url, "https://api.clickup.com/api/v2/list/L9/task");
  assert.equal(calls[0].opts.headers.Authorization, "tok");
  assert.equal(JSON.parse(calls[0].opts.body).due_date, Date.parse("2026-11-05T12:00:00Z"));
}));

test("Asana task is created in the project", () => withFetch(() => [201, { data: { gid: "g1" } }], async calls => {
  const t = await P.asana.createTask({ access_token: "tok" }, "P1", { name: "Post", description: "x" });
  assert.equal(t.gid, "g1");
  assert.deepEqual(JSON.parse(calls[0].opts.body).data.projects, ["P1"]);
  assert.equal(calls[0].opts.headers.Authorization, "Bearer tok");
}));

test("Meta insights are normalized (spend, purchases, ROAS)", () => withFetch(() => [200, { data: [{ spend: "120.5", impressions: "10000", clicks: "250", ctr: "2.5", cpc: "0.48",
  actions: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "12" }], action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "980" }],
  purchase_roas: [{ action_type: "omni_purchase", value: "8.13" }], account_currency: "EGP" }] }], async calls => {
  const m = await P.meta.adInsights({ access_token: "tok" }, "555");
  assert.equal(m.spend, 120.5); assert.equal(m.conversions, 12); assert.equal(m.revenue, 980); assert.equal(m.roas, 8.13); assert.equal(m.currency, "EGP");
  assert.match(calls[0].url, /\/555\/insights\?/);
}));

test("Google Ads metrics are summed from micros", () => withFetch(() => [200, { results: [
  { metrics: { impressions: "1000", clicks: "50", costMicros: "25000000", conversions: 5, conversionsValue: 500 }, customer: { currencyCode: "SAR" } },
  { metrics: { impressions: "1000", clicks: "50", costMicros: "25000000", conversions: 5, conversionsValue: 500 }, customer: { currencyCode: "SAR" } }] }], async calls => {
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "dev";
  const m = await P.googleAds.adMetrics({ access_token: "tok" }, "123-456-7890", "99");
  assert.equal(m.spend, 50); assert.equal(m.clicks, 100); assert.equal(m.roas, 20); assert.equal(m.currency, "SAR");
  assert.match(calls[0].url, /customers\/1234567890\/googleAds:search$/);
  assert.equal(calls[0].opts.headers["developer-token"], "dev");
  assert.match(JSON.parse(calls[0].opts.body).query, /ad_group_ad\.ad\.id = 99/);
}));

test("Stripe checkout uses minor units and the invoice id", () => withFetch(() => [200, { id: "cs_1", url: "https://checkout.stripe.com/x" }], async calls => {
  const r = await P.payments.stripe("sk_test_1", { id: "inv1", number: "INV-1", title: "Extra", amount: 1500.5, currency: "EGP" }, { success: "https://a/s", cancel: "https://a/c" });
  assert.equal(r.url, "https://checkout.stripe.com/x");
  const body = new URLSearchParams(calls[0].opts.body);
  assert.equal(body.get("line_items[0][price_data][unit_amount]"), "150050");
  assert.equal(body.get("line_items[0][price_data][currency]"), "egp");
  assert.equal(body.get("metadata[invoice_id]"), "inv1");
}));

test("provider errors surface the provider's message", () => withFetch(() => [400, { err: "List not found" }], async () => {
  await assert.rejects(P.clickup.comment({ access_token: "t" }, "x", "hi"), /List not found/);
}));

test("notify: only Slack/Teams webhooks, email needs a key", async () => {
  const notify = (await import("../notify.js")).default;
  let res = mockRes();
  await notify(mockReq({ method: "POST", body: { channel: "slack", webhook: "https://evil.example.com", text: "x" } }), res);
  assert.equal(res.statusCode, 400);
  res = mockRes();
  await notify(mockReq({ method: "POST", body: { channel: "email", to: "a@b.co", text: "x" } }), res);
  assert.equal(res.statusCode, 501);
});

test("ai, connect and sync refuse anonymous callers", async () => {
  for (const [mod, req] of [
    ["../ai.js", mockReq({ method: "POST", body: { action: "summarize", workspace_id: "w" } })],
    ["../connect.js", mockReq({ method: "POST", url: "/api/connect?action=start", body: { workspace_id: "w", provider: "clickup" } })],
    ["../sync.js", mockReq({ method: "POST", headers: { "x-sync-secret": "wrong" }, body: { type: "approval.approved", entity_id: "e" } })]
  ]) {
    const fn = (await import(mod)).default;
    const res = mockRes();
    await fn(req, res);
    assert.ok([401, 501].includes(res.statusCode), `${mod} returned ${res.statusCode}: ${res.body}`);
  }
});

test("cron needs the cron secret", async () => {
  const cron = (await import("../cron.js")).default;
  const res = mockRes();
  await cron(mockReq({ headers: { authorization: "Bearer nope" } }), res);
  assert.equal(res.statusCode, 401);
});

test("connect reports what the deployment can do", async () => {
  process.env.CLICKUP_CLIENT_ID = "id"; process.env.CLICKUP_CLIENT_SECRET = "s";
  const connect = (await import("../connect.js")).default;
  const res = mockRes();
  await connect(mockReq({ url: "/api/connect" }), res);
  const j = JSON.parse(res.body);
  assert.equal(j.oauth.clickup, true);
  assert.equal(j.oauth.asana, false);
  assert.equal(j.server, false);
});
