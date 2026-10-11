// /api/ads?deliverable_id=… — live results (last 30 days) for the ad linked to a
// deliverable. ad_ref formats: "meta:<ad_id>" or "google:<customer_id>:<ad_id>".
import { admin, handle, json, loadConnection, markError, query, requireMember, saveConnection } from "./_lib/server.js";
import { fresh, googleAds, meta } from "./_lib/providers.js";

export default handle(async (req, res) => {
  const id = query(req).get("deliverable_id") || "";
  const sb = admin();
  const { data: d } = await sb.from("deliverables").select("id, workspace_id, ad_ref").eq("id", id).maybeSingle();
  if (!d) return json(res, 404, { error: "Deliverable not found" });
  await requireMember(req, d.workspace_id);
  const ref = String(d.ad_ref || "");
  const m = ref.match(/^meta:(\d+)$/) || ref.match(/^google:([\d-]+):(\d+)$/);
  if (!m) return json(res, 400, { error: "Link an ad first (Meta ad ID, or Google Ads customer ID + ad ID)" });
  const provider = ref.startsWith("meta:") ? "meta" : "google_ads";
  const c = await loadConnection(sb, d.workspace_id, provider);
  if (!c) return json(res, 409, { error: `Connect ${provider === "meta" ? "Meta" : "Google Ads"} in Integrations first` });
  try {
    const [secret, changed] = await fresh(provider, c.secret);
    if (changed) await saveConnection(sb, { workspace_id: d.workspace_id, provider, account_label: c.conn.account_label, settings: c.conn.settings, secret });
    const metrics = provider === "meta" ? await meta.adInsights(secret, m[1]) : await googleAds.adMetrics(secret, m[1], m[2], c.conn.settings?.login_customer_id);
    res.setHeader("Cache-Control", "private, max-age=600");
    json(res, 200, { provider, metrics });
  } catch (e) {
    if (e.status === 401) await markError(sb, c.conn.id, e.message);
    throw e;
  }
});
