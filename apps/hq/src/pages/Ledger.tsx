import { Check, Download, FileSignature, PencilRuler, ScrollText, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Empty } from "../components/ui";
import { summary } from "../lib/activity";
import { date } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useWorkspace } from "../lib/ws";

// An append-only record of every client decision: approvals, change requests,
// change-order decisions. Exportable as CSV for disputes and accounting.
export function Ledger() {
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const [kind, setKind] = useState<"all" | "approval" | "changes" | "co">("all");
  const [client, setClient] = useState("");
  const f = { workspace_id: ws.id };
  const { rows: activity } = useRows("activity", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const clientOf = (pid: string | null) => clients.find(c => c.id === projects.find(p => p.id === pid)?.client_id);
  const rows = useMemo(() => activity
    .filter(a => /^(approval\.|change_order\.(approved|declined))/.test(a.type))
    .filter(a => kind === "all" || (kind === "approval" ? a.type === "approval.approved" || a.type === "approval.recorded" : kind === "changes" ? a.type === "approval.changes" : a.type.startsWith("change_order")))
    .filter(a => !client || clientOf(a.project_id)?.id === client)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, kind, client, projects, clients]);

  const exportCsv = () => {
    const esc = (s: string) => '"' + String(s).replace(/"/g, '""') + '"';
    const lines = [["Date", "Client", "Project", "By", "Event", "Type"].join(",")].concat(rows.map(a => [a.created_at, clientOf(a.project_id)?.name || "", projects.find(p => p.id === a.project_id)?.name || "", a.actor, a.summary, a.type].map(esc).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a"); el.href = url; el.download = `vitals-hq-ledger-${new Date().toISOString().slice(0, 10)}.csv`; el.click();
    URL.revokeObjectURL(url);
  };
  const ico = (t: string) => t === "approval.changes" ? <span className="tl__ico tl__ico--warn"><PencilRuler /></span> : t === "change_order.declined" ? <span className="tl__ico tl__ico--bad"><X /></span> : t.startsWith("change_order") ? <span className="tl__ico tl__ico--violet"><FileSignature /></span> : <span className="tl__ico tl__ico--ok"><Check /></span>;

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("History", "السجل")}</h1><p className="muted">{L("Who approved what, and when. Timestamped from the client's own link, so there is no “I never approved that”.", "مين وافق على إيه وإمتى. متسجل من لينك العميل نفسه، فمفيش «أنا ما وافقتش على ده».")}</p></div>
      <button className="btn" onClick={exportCsv} disabled={!rows.length}><Download />{L("Export CSV", "تصدير CSV")}</button>
    </div>
    <div className="row">
      <div className="seg">{(["all", "approval", "changes", "co"] as const).map(k => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{({ all: L("All", "الكل"), approval: L("Approvals", "موافقات"), changes: L("Change requests", "طلبات تعديل"), co: L("Extra work", "شغل إضافي") })[k]}</button>)}</div>
      <select className="sel" style={{ width: "auto" }} value={client} onChange={e => setClient(e.target.value)}><option value="">{L("All clients", "كل العملاء")}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    <div className="card">{rows.length === 0 ? <Empty icon={<ScrollText />} title={L("No entries yet", "لا توجد سجلات بعد")} text={L("Client decisions from review links appear here automatically.", "قرارات العملاء من لينكات المراجعة بتظهر هنا تلقائيًا.")} /> :
      <div className="table-wrap"><table className="table">
        <thead><tr><th style={{ width: 44 }} /><th>{L("Event", "الحدث")}</th><th className="hide-sm">{L("Client", "العميل")}</th><th>{L("When", "التوقيت")}</th></tr></thead>
        <tbody>{rows.map(a => <tr key={a.id}>
          <td>{ico(a.type)}</td>
          <td><b>{a.actor}</b> {summary(a.summary, lang)}{a.type === "approval.recorded" && <span className="pill pill--plain" style={{ marginInlineStart: 6 }}>{L("recorded by team", "سجّله الفريق")}</span>}
            {a.entity_id && a.type.startsWith("approval") && <div><Link className="small" style={{ color: "var(--accent)" }} to={"/deliverables/" + a.entity_id}>{L("View deliverable", "عرض التسليمة")}</Link></div>}</td>
          <td className="hide-sm">{clientOf(a.project_id)?.name}<div className="faint small">{projects.find(p => p.id === a.project_id)?.name}</div></td>
          <td className="nowrap small">{date(a.created_at, lang, { day: "numeric", month: "short", year: "numeric" })}<div className="faint">{new Date(a.created_at).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</div></td>
        </tr>)}</tbody>
      </table></div>}</div>
  </div>;
}
