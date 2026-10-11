// Deliverable side cards for the native integrations: task sync, ad results, publishing.
import { BarChart3, ExternalLink, RefreshCw, Send, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, isDemo } from "../lib/api";
import { date, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { server } from "../lib/server";
import type { Deliverable, Project, PublishTarget } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { Modal, useAction } from "./ui";

const demoNote = (L: (a: string, b: string) => string) => <p className="faint small">{L("Works once Vitals Approve is live with accounts.", "بيشتغل لما Vitals Approve يشتغل بحسابات حقيقية.")}</p>;

export function SyncCard({ d, project }: { d: Deliverable; project: Project | undefined }) {
  const { L } = useI18n();
  const { run, busy } = useAction();
  const { rows: links } = useRows("external_links", { entity_id: d.id });
  const targets = project?.sync_targets || {};
  const has = !!(targets.clickup?.list_id || targets.asana?.project_gid);
  if (!has && !links.length) return null;
  return <div className="card card--pad stack">
    <h3 className="row"><Share2 size={16} />{L("Task sync", "مزامنة المهام")}</h3>
    {links.map(l => <a key={l.id} className="row small" style={{ gap: 6, color: "var(--accent)" }} href={l.url} target="_blank" rel="noopener"><ExternalLink size={14} />{l.provider === "clickup" ? "ClickUp" : "Asana"} · {L("open task", "افتح التاسك")}</a>)}
    {isDemo ? demoNote(L) : <button className="btn btn--sm" disabled={busy} onClick={() => run(() => server("/api/sync", { deliverable_id: d.id }), L("Synced", "اتزامنت"))}><RefreshCw />{links.length ? L("Sync now", "زامن دلوقتي") : L("Create task", "اعمل تاسك")}</button>}
  </div>;
}

interface Metrics { spend: number; impressions: number; clicks: number; ctr: number; cpc: number; conversions: number; revenue: number; roas: number; currency: string }
export function ResultsCard({ d }: { d: Deliverable }) {
  const { L, lang } = useI18n();
  const { run } = useAction();
  const [ref, setRef] = useState(d.ad_ref);
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => setRef(d.ad_ref), [d.ad_ref]);
  useEffect(() => {
    setM(null); setErr("");
    if (isDemo || !d.ad_ref) return;
    setLoading(true);
    server<{ metrics: Metrics }>(`/api/ads?deliverable_id=${d.id}`).then(r => setM(r.metrics)).catch(e => setErr(String(e.message))).finally(() => setLoading(false));
  }, [d.id, d.ad_ref]);
  const valid = /^meta:\d+$/.test(ref) || /^google:[\d-]+:\d+$/.test(ref) || ref === "";
  const cur = m?.currency || "USD";
  const n = (x: number) => x.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });
  return <div className="card card--pad stack">
    <h3 className="row"><BarChart3 size={16} />{L("Ad results", "نتايج الإعلان")}</h3>
    {m ? <div className="grid2" style={{ gap: 8 }}>
      {[[L("Spend", "الصرف"), money(m.spend, cur, lang)], [L("ROAS", "العائد"), m.roas ? n(m.roas) + "×" : "—"], [L("Conversions", "التحويلات"), n(m.conversions)], [L("Clicks", "النقرات"), n(m.clicks)], [L("CTR", "نسبة النقر"), n(m.ctr > 1 ? m.ctr : m.ctr * 100) + "%"], [L("CPC", "تكلفة النقرة"), money(m.cpc, cur, lang)]].map(([k, v]) =>
        <div key={k} style={{ padding: 8, borderRadius: 8, background: "var(--sunken)" }}><div className="faint small">{k}</div><b>{v}</b></div>)}
      <p className="faint small" style={{ gridColumn: "1 / -1" }}>{L("Last 30 days", "آخر 30 يوم")}</p>
    </div> : loading ? <div className="spinner" /> : err ? <p className="small" style={{ color: "var(--bad)" }}>{err}</p> : null}
    <div className="stack" style={{ gap: 6 }}>
      <input className="inp mono" dir="ltr" value={ref} onChange={e => setRef(e.target.value.trim())} placeholder="meta:120210000000 · google:123-456-7890:6543210" />
      <p className="faint small">{L("Link the live ad: “meta:<ad ID>” or “google:<customer ID>:<ad ID>”.", "اربط الإعلان: «meta:<رقم الإعلان>» أو «google:<رقم الحساب>:<رقم الإعلان>».")}</p>
      {ref !== d.ad_ref && <button className="btn btn--sm btn--primary" disabled={!valid} onClick={() => run(() => api.update("deliverables", d.id, { ad_ref: ref }), L("Ad linked", "اتربط الإعلان"))}>{L("Save", "حفظ")}</button>}
      {isDemo && d.ad_ref && demoNote(L)}
    </div>
  </div>;
}

export function PublishCard({ d }: { d: Deliverable }) {
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const { run } = useAction();
  const { rows: conns } = useRows("connections", { workspace_id: ws.id });
  const metaOn = conns.some(c => c.provider === "meta" && c.status === "active");
  const [caption, setCaption] = useState(d.caption);
  const [pages, setPages] = useState<{ id: string; name: string; instagram: { id: string; username: string } | null }[]>([]);
  useEffect(() => setCaption(d.caption), [d.caption]);
  useEffect(() => { if (metaOn && !isDemo) server<{ items: { pages: typeof pages } }>(`/api/connect?action=resources&provider=meta&workspace_id=${ws.id}`).then(r => setPages(r.items.pages || [])).catch(() => {}); }, [metaOn, ws.id]);
  if (d.kind !== "post" && d.kind !== "design" && d.kind !== "video") return null;
  const targets = d.publish_targets || [];
  const options: PublishTarget[] = pages.flatMap(p => [{ network: "facebook" as const, id: p.id, name: "Facebook · " + p.name }, ...(p.instagram ? [{ network: "instagram" as const, id: p.instagram.id, name: "Instagram · @" + p.instagram.username }] : [])]);
  const toggle = (t: PublishTarget) => { const on = targets.some(x => x.id === t.id); return run(() => api.update("deliverables", d.id, { publish_targets: on ? targets.filter(x => x.id !== t.id) : [...targets, t] })); };
  return <div className="card card--pad stack">
    <h3 className="row"><Send size={16} />{L("Publishing", "النشر")}</h3>
    {d.published_at ? <span className="pill pill--ok">{L("Published", "اتنشر")} · {date(d.published_at, lang)}</span>
      : d.publish_error ? <p className="small" style={{ color: "var(--bad)" }}>{d.publish_error}</p> : null}
    <textarea className="txt" style={{ minHeight: 70 }} value={caption} onChange={e => setCaption(e.target.value)} onBlur={() => caption !== d.caption && run(() => api.update("deliverables", d.id, { caption }))} placeholder={L("Caption for the post", "الكابشن بتاع البوست")} />
    {!metaOn ? <p className="faint small">{L("Connect Meta in Integrations to publish approved posts automatically on their publish date.", "اربط Meta من الربط عشان البوستات المتوافق عليها تتنشر لوحدها في يوم نشرها.")} <Link to="/integrations" style={{ color: "var(--accent)" }}>{L("Integrations", "الربط")}</Link></p> : <>
      <div className="chips">{options.map(o => <button key={o.id} type="button" className={"chip-btn" + (targets.some(t => t.id === o.id) ? " on" : "")} onClick={() => toggle(o)}>{o.name}</button>)}</div>
      <label className="check small"><input type="checkbox" checked={d.auto_publish} onChange={e => run(() => api.update("deliverables", d.id, { auto_publish: e.target.checked }))} disabled={!targets.length || !d.publish_date} />
        {d.publish_date ? L(`Publish automatically on ${date(d.publish_date, lang)} once approved`, `انشره لوحده يوم ${date(d.publish_date, lang)} بعد الموافقة`) : L("Set a publish date first", "حدد تاريخ النشر الأول")}</label>
    </>}
  </div>;
}

export function ProjectSyncForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const { run, busy } = useAction();
  const { rows: conns } = useRows("connections", { workspace_id: ws.id });
  const [lists, setLists] = useState<Record<string, { id: string; name: string }[]>>({});
  const [t, setT] = useState(project.sync_targets || {});
  useEffect(() => {
    for (const p of ["clickup", "asana"] as const) if (conns.some(c => c.provider === p && c.status === "active"))
      server<{ items: { id: string; name: string }[] }>(`/api/connect?action=resources&provider=${p}&workspace_id=${ws.id}`).then(r => setLists(x => ({ ...x, [p]: r.items }))).catch(() => {});
  }, [conns, ws.id]);
  return <Modal title={L("Sync this project", "زامن المشروع ده")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" disabled={busy} onClick={() => run(async () => { await api.update("projects", project.id, { sync_targets: t }); onClose(); }, L("Saved", "اتحفظ"))}>{L("Save", "حفظ")}</button>
  </>}>
    <div className="form">
      {!conns.some(c => c.provider === "clickup" || c.provider === "asana") && <p className="muted">{L("Connect ClickUp or Asana in Integrations first.", "اربط ClickUp أو Asana من صفحة الربط الأول.")}</p>}
      {(["clickup", "asana"] as const).filter(p => conns.some(c => c.provider === p)).map(p => <label key={p} className="field"><span>{p === "clickup" ? L("ClickUp list", "ليستة ClickUp") : L("Asana project", "مشروع Asana")}</span>
        <select className="sel" value={p === "clickup" ? t.clickup?.list_id || "" : t.asana?.project_gid || ""} onChange={e => {
          const it = (lists[p] || []).find(x => x.id === e.target.value);
          setT(p === "clickup" ? { ...t, clickup: e.target.value ? { list_id: e.target.value, name: it?.name } : undefined } : { ...t, asana: e.target.value ? { project_gid: e.target.value, name: it?.name } : undefined });
        }}><option value="">{L("Don't sync", "ما تزامنش")}</option>{(lists[p] || []).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>)}
      <p className="faint small">{L("New deliverables become tasks there; client approvals, change requests and messages are added as comments.", "التسليمات الجديدة بتبقى تاسكات هناك، وموافقات العميل وطلباته ورسايله بتتضاف كتعليقات.")}</p>
    </div>
  </Modal>;
}
