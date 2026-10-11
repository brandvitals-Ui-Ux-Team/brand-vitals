// /api/pay — payment links for invoices, and provider webhooks that mark them paid.
//   POST ?action=create  { invoice_id, provider? }  (member) → { url }
//   POST ?action=webhook&provider=stripe|tap|paymob&ws=…   (provider → us)
// Webhooks never trust the payload alone: Stripe/Tap are re-fetched from the
// provider's API with the agency's key; Paymob is verified with its HMAC.
import crypto from "node:crypto";
import { admin, APP_URL, handle, json, loadConnection, query, readJson, readRaw, requireMember, safeEqual } from "./_lib/server.js";
import { payments } from "./_lib/providers.js";

const PAYMOB_FIELDS = ["amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id", "integration_id", "is_3d_secure", "is_auth", "is_capture",
  "is_refunded", "is_standalone_payment", "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success"];
const dig = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

async function markPaid(sb, inv, provider) {
  if (inv.status === "paid") return;
  await sb.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.id);
  await sb.from("activity").insert({ workspace_id: inv.workspace_id, type: "invoice.paid", project_id: inv.project_id, entity_id: inv.id, actor: provider, summary: `invoice ${inv.number} was paid`, data: { amount: inv.amount, currency: inv.currency } });
}

export default handle(async (req, res) => {
  const q = query(req);
  const action = q.get("action");
  const sb = admin();

  if (action === "create") {
    const b = await readJson(req, 10000);
    const { data: inv } = await sb.from("invoices").select("*").eq("id", String(b.invoice_id || "")).maybeSingle();
    if (!inv) return json(res, 404, { error: "Invoice not found" });
    await requireMember(req, inv.workspace_id);
    if (inv.status === "paid" || inv.status === "void") return json(res, 409, { error: "Invoice is " + inv.status });
    const { data: client } = await sb.from("clients").select("name, email, phone").eq("id", inv.client_id).single();
    const order = b.provider ? [b.provider] : ["paymob", "tap", "stripe"];
    for (const provider of order) {
      const c = await loadConnection(sb, inv.workspace_id, provider);
      if (!c) continue;
      const urls = { success: `${APP_URL()}/app/i/${inv.token}?paid=1`, cancel: `${APP_URL()}/app/i/${inv.token}`, webhook: `${APP_URL()}/api/pay?action=webhook&provider=${provider}&ws=${inv.workspace_id}` };
      const r = provider === "stripe" ? await payments.stripe(c.secret.secret_key, inv, urls)
        : provider === "tap" ? await payments.tap(c.secret.secret_key, inv, urls, client)
        : await payments.paymob(c.secret, inv, urls, client);
      await sb.from("invoices").update({ provider, payment_url: r.url, provider_ref: r.ref, status: inv.status === "draft" ? "sent" : inv.status, sent_at: inv.sent_at || new Date().toISOString() }).eq("id", inv.id);
      return json(res, 200, { url: r.url, provider });
    }
    return json(res, 409, { error: "Connect Stripe, Paymob or Tap in Integrations to create payment links" });
  }

  if (action === "webhook") {
    const provider = q.get("provider");
    const ws = q.get("ws") || "";
    const raw = await readRaw(req, 200000);
    let body = {}; try { body = JSON.parse(raw); } catch { /* ignore */ }
    const c = await loadConnection(sb, ws, provider);
    if (!c) return json(res, 404, { error: "Unknown workspace" });
    if (provider === "stripe") {
      const session = body?.data?.object;
      if (!session?.id || !String(body.type || "").startsWith("checkout.session")) return json(res, 200, { ignored: true });
      const { data: inv } = await sb.from("invoices").select("*").eq("workspace_id", ws).eq("provider_ref", session.id).maybeSingle();
      if (inv && await payments.stripePaid(c.secret.secret_key, session.id)) await markPaid(sb, inv, "Stripe");
      return json(res, 200, { ok: true });
    }
    if (provider === "tap") {
      const id = body?.id;
      const { data: inv } = id ? await sb.from("invoices").select("*").eq("workspace_id", ws).eq("provider_ref", id).maybeSingle() : { data: null };
      if (inv && await payments.tapPaid(c.secret.secret_key, id)) await markPaid(sb, inv, "Tap");
      return json(res, 200, { ok: true });
    }
    if (provider === "paymob") {
      const obj = body?.obj || {};
      const concat = PAYMOB_FIELDS.map(f => { const v = dig(obj, f); return v == null ? "" : String(v); }).join("");
      const mac = crypto.createHmac("sha512", c.secret.hmac_secret).update(concat).digest("hex");
      if (!safeEqual(mac, String(q.get("hmac") || ""))) return json(res, 401, { error: "Bad HMAC" });
      const ref = obj?.payment_key_claims?.extra?.special_reference || obj?.order?.merchant_order_id || obj?.special_reference;
      const { data: inv } = ref ? await sb.from("invoices").select("*").eq("workspace_id", ws).eq("id", ref).maybeSingle() : { data: null };
      if (inv && obj.success === true && obj.pending === false) await markPaid(sb, inv, "Paymob");
      return json(res, 200, { ok: true });
    }
  }
  json(res, 404, { error: "Unknown action" });
});
