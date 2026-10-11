// /api/sync — mirror Vitals Approve into ClickUp / Asana.
// Called by the database (pg_net trigger on activity, header x-sync-secret) or by
// a signed-in member ({ deliverable_id }) for "sync now". Each deliverable gets
// one task in the project's mapped list/project; client decisions become comments.
import { admin, APP_URL, env, handle, json, loadConnection, markError, readJson, requireMember, safeEqual, saveConnection } from "./_lib/server.js";
import { asana, clickup, fresh } from "./_lib/providers.js";

const EVENTS = new Set(["deliverable.created", "review.sent", "version.added", "approval.approved", "approval.changes", "approval.recorded", "message.client"]);

async function syncDeliverable(sb, deliverableId, note) {
  const { data: d } = await sb.from("deliverables").select("*").eq("id", deliverableId).maybeSingle();
  if (!d) return [];
  const { data: p } = await sb.from("projects").select("*").eq("id", d.project_id).maybeSingle();
  const targets = (p && p.sync_targets) || {};
  const done = [];
  for (const provider of ["clickup", "asana"]) {
    const dest = provider === "clickup" ? targets.clickup?.list_id : targets.asana?.project_gid;
    if (!dest) continue;
    const c = await loadConnection(sb, d.workspace_id, provider);
    if (!c) continue;
    try {
      const [secret, changed] = await fresh(provider, c.secret);
      if (changed) await saveConnection(sb, { workspace_id: d.workspace_id, provider, account_label: c.conn.account_label, settings: c.conn.settings, secret });
      const api = provider === "clickup" ? clickup : asana;
      let { data: link } = await sb.from("external_links").select("*").eq("provider", provider).eq("entity_type", "deliverable").eq("entity_id", d.id).maybeSingle();
      if (!link) {
        const review = `${APP_URL()}/app/deliverables/${d.id}`;
        const t = await api.createTask(secret, dest, { name: d.title, description: `Tracked in Vitals Approve: ${review}`, due: d.due_date });
        const external_id = String(t.id || t.gid);
        const url = t.url || t.permalink_url || (provider === "asana" ? `https://app.asana.com/0/${dest}/${external_id}` : "");
        ({ data: link } = await sb.from("external_links").insert({ workspace_id: d.workspace_id, provider, entity_type: "deliverable", entity_id: d.id, external_id, url }).select("*").single());
      }
      if (note) await api.comment(secret, link.external_id, note);
      if (provider === "asana" && d.status === "approved") await asana.complete(secret, link.external_id).catch(() => {});
      done.push({ provider, task: link.external_id, url: link.url });
    } catch (e) {
      if (e.status === 401) await markError(sb, c.conn.id, e.message);
      done.push({ provider, error: String(e.message || e) });
    }
  }
  return done;
}

export default handle(async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });
  const body = await readJson(req, 50000);
  const sb = admin();
  const secret = env("SYNC_SECRET");
  if (req.headers["x-sync-secret"]) {
    if (!secret || !safeEqual(req.headers["x-sync-secret"], secret)) return json(res, 401, { error: "Bad sync secret" });
    const a = body;
    if (!EVENTS.has(a.type) || !a.entity_id) return json(res, 200, { skipped: true });
    const note = a.type === "deliverable.created" ? "" : `${a.actor} ${a.summary}`;
    // message.client on a deliverable thread → the entity is the deliverable itself
    if (a.type === "message.client" && a.data?.thread_type !== "deliverable") return json(res, 200, { skipped: true });
    return json(res, 200, { results: await syncDeliverable(sb, a.entity_id, note) });
  }
  const { data: d } = await sb.from("deliverables").select("workspace_id").eq("id", String(body.deliverable_id || "")).maybeSingle();
  if (!d) return json(res, 404, { error: "Deliverable not found" });
  await requireMember(req, d.workspace_id);
  json(res, 200, { results: await syncDeliverable(sb, body.deliverable_id, body.note || "") });
});
