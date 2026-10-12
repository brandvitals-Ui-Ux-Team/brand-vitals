import { Inbox, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SendFlow } from "../components/SendFlow";
import { Empty, KIND_LABEL, MemberChip, StatusPill, Thumb } from "../components/ui";
import { date, isOverdue } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { daysBetween } from "../lib/logic";
import type { DeliverableStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";

type TabKey = "open" | DeliverableStatus | "all";

export function Approvals() {
  const { L, lang } = useI18n();
  const { ws, members } = useWorkspace();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState<TabKey>("open");
  const [client, setClient] = useState("");
  const [q, setQ] = useState("");
  const f = { workspace_id: ws.id };
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: versions } = useRows("versions", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const proj = (id: string) => projects.find(p => p.id === id);
  const clientOf = (pid: string) => clients.find(c => c.id === proj(pid)?.client_id);

  const count = (k: TabKey) => deliverables.filter(d => k === "all" || (k === "open" ? d.status !== "approved" : d.status === k)).length;
  const rows = useMemo(() => deliverables
    .filter(d => tab === "all" || (tab === "open" ? d.status !== "approved" : d.status === tab))
    .filter(d => !client || proj(d.project_id)?.client_id === client)
    .filter(d => !q || d.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const order: Record<DeliverableStatus, number> = { changes: 0, in_review: 1, draft: 2, approved: 3 };
      return order[a.status] - order[b.status] || (a.due_date || "9").localeCompare(b.due_date || "9");
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deliverables, tab, client, q, projects]);

  const TABS: [TabKey, string, string][] = [["open", "Open", "مفتوحة"], ["in_review", "Waiting on client", "عند العميل"], ["changes", "Changes requested", "مطلوب تعديل"], ["draft", "Drafts", "مسودات"], ["approved", "Approved", "معتمدة"], ["all", "All", "الكل"]];
  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Approvals", "الموافقات")}</h1><p className="muted">{L("Every deliverable, its version, and where it stands with the client.", "كل تسليمة، ونسختها، ووضعها مع العميل.")}</p></div>
      <button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("Send for approval", "ابعت للموافقة")}</button>
    </div>
    <div className="tabs">{TABS.map(([k, en, ar]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{L(en, ar)}<span className="count">{count(k)}</span></button>)}</div>
    <div className="row">
      <input className="inp" style={{ maxWidth: 260 }} placeholder={L("Filter by title…", "فلترة بالعنوان…")} value={q} onChange={e => setQ(e.target.value)} />
      <select className="sel" style={{ maxWidth: 220 }} value={client} onChange={e => setClient(e.target.value)} aria-label={L("Filter by client", "فلترة حسب العميل")}><option value="">{L("All clients", "كل العملاء")}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    <div className="card">
      {rows.length === 0 ? <Empty icon={<Inbox />} title={L("Nothing here", "لا يوجد شيء هنا")} text={L("Create a deliverable, upload a version and send it to the client on WhatsApp.", "أنشئ تسليمة، وارفع نسخة، وابعتها للعميل على واتساب.")} action={<button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("Send for approval", "ابعت للموافقة")}</button>} /> :
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{L("Deliverable", "التسليمة")}</th><th className="hide-sm">{L("Client", "العميل")}</th><th>{L("Status", "الحالة")}</th><th className="hide-sm">{L("Revisions", "التعديلات")}</th><th className="hide-sm">{L("Due", "الموعد")}</th><th className="hide-sm">{L("Owner", "المسؤول")}</th></tr></thead>
          <tbody>{rows.map(d => {
            const v = versions.filter(x => x.deliverable_id === d.id).sort((a, b) => b.number - a.number)[0];
            return <tr key={d.id} className="click" onClick={() => nav("/deliverables/" + d.id)}>
              <td><div className="row" style={{ flexWrap: "nowrap" }}><Thumb v={v} kind={d.kind} /><div style={{ minWidth: 0 }}><Link to={"/deliverables/" + d.id} className="li__t" style={{ display: "block" }} onClick={e => e.stopPropagation()}>{d.title}</Link><span className="faint small">{L(...KIND_LABEL[d.kind])} · v{d.current_version} · {proj(d.project_id)?.name}</span></div></div></td>
              <td className="hide-sm">{clientOf(d.project_id)?.name}</td>
              <td><div className="stack" style={{ gap: 4 }}><StatusPill s={d.status} />{d.status === "in_review" && d.sent_at && <span className="faint small">{L(`${daysBetween(d.sent_at)}d waiting`, `منتظر ${daysBetween(d.sent_at)} يوم`)}</span>}</div></td>
              <td className="hide-sm">{d.revision_count}{d.out_of_scope && <span className="pill pill--violet pill--plain" style={{ marginInlineStart: 6 }}>{L("Over limit", "فوق الحد")}</span>}</td>
              <td className="hide-sm"><span className={"due" + (d.status !== "approved" && isOverdue(d.due_date) ? " due--over" : "")}>{date(d.due_date, lang) || "—"}</span></td>
              <td className="hide-sm"><MemberChip m={members.find(m => m.id === d.assignee_id)} /></td>
            </tr>;
          })}</tbody>
        </table></div>}
    </div>
    {sp.get("new") && <SendFlow onClose={() => setSp({})} />}
  </div>;
}
