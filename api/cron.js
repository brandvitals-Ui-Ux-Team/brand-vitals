// /api/cron — daily job (Vercel Cron, Authorization: Bearer $CRON_SECRET).
// Publishes approved posts whose publish date has arrived to their Facebook Page
// / Instagram account, using the workspace's Meta connection.
import { admin, env, handle, json, loadConnection, safeEqual } from "./_lib/server.js";
import { meta } from "./_lib/providers.js";

export default handle(async (req, res) => {
  const secret = env("CRON_SECRET");
  const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/, "");
  if (!secret || !safeEqual(auth, secret)) return json(res, 401, { error: "Unauthorized" });
  const sb = admin();
  const today = new Date().toISOString().slice(0, 10);
  const { data: due } = await sb.from("deliverables").select("*").eq("auto_publish", true).eq("status", "approved").is("published_at", null).lte("publish_date", today).limit(50);
  const results = [];
  const pagesCache = new Map();
  for (const d of due || []) {
    const targets = Array.isArray(d.publish_targets) ? d.publish_targets : [];
    if (!targets.length) continue;
    try {
      const c = await loadConnection(sb, d.workspace_id, "meta");
      if (!c) throw new Error("Meta is not connected");
      const { data: v } = await sb.from("versions").select("file_url, file_type").eq("deliverable_id", d.id).eq("number", d.current_version).maybeSingle();
      if (!v || !/^image\//.test(v.file_type) || !/^https:\/\//.test(v.file_url)) throw new Error("Only image posts with an uploaded file can be auto-published");
      if (!pagesCache.has(d.workspace_id)) pagesCache.set(d.workspace_id, await meta.pages(c.secret));
      const pages = pagesCache.get(d.workspace_id);
      const ids = [];
      for (const t of targets) {
        const page = pages.find(p => p.id === t.id || p.instagram?.id === t.id);
        if (!page) throw new Error(`No access to ${t.network} account ${t.id}`);
        ids.push(await meta.publish(page.page_token, t, { imageUrl: v.file_url, caption: d.caption || d.title }));
      }
      await sb.from("deliverables").update({ published_at: new Date().toISOString(), publish_error: "" }).eq("id", d.id);
      await sb.from("activity").insert({ workspace_id: d.workspace_id, type: "post.published", project_id: d.project_id, entity_id: d.id, actor: "Vitals GO", summary: `published “${d.title}”`, data: { ids } });
      results.push({ id: d.id, ok: true });
    } catch (e) {
      await sb.from("deliverables").update({ publish_error: String(e.message || e).slice(0, 500) }).eq("id", d.id);
      results.push({ id: d.id, error: String(e.message || e) });
    }
  }
  json(res, 200, { date: today, processed: results.length, results });
});
