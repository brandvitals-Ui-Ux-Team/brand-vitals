import { Copy, ExternalLink, FileSignature, MoreHorizontal, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Confirm, COPill, Empty, Field, Modal, Popover, useAction, useToast } from "../components/ui";
import { createChangeOrder, sendChangeOrder } from "../lib/actions";
import { ChannelButton } from "../components/ChannelButton";
import { deliver, extraWorkMsg } from "../lib/channels";
import { api } from "../lib/api";
import { coUrl, date, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { ChangeOrder, COStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";

export function ChangeOrderForm({ onClose, preset }: { onClose: () => void; preset: Partial<ChangeOrder> }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const [v, setV] = useState<Partial<ChangeOrder>>({ currency: ws.currency, ...preset });
  const { busy, run } = useAction();
  const save = (andSend: boolean) => run(async () => {
    const co = await createChangeOrder(ws, me, { ...v, title: (v.title || "").trim(), amount: Number(v.amount || 0) });
    if (andSend) {
      const sent = await sendChangeOrder(ws, me, co);
      const p = projects.find(x => x.id === co.project_id);
      const c = clients.find(x => x.id === p?.client_id);
      if (c) await deliver(ws, c, extraWorkMsg(ws, c, sent, money(co.amount, co.currency, c.lang)));
    }
    onClose();
  }, andSend ? L("Sent to the client", "اتبعتت للعميل") : L("Saved as draft", "اتحفظت كمسودة"));
  const valid = v.project_id && (v.title || "").trim();
  return <Modal title={L("Add extra work", "إضافة شغل إضافي")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn" disabled={busy || !valid} onClick={() => save(false)}>{L("Save draft", "حفظ كمسودة")}</button>
    <button className="btn btn--primary" disabled={busy || !valid} onClick={() => save(true)}><Send />{L("Send to client", "ابعت للعميل")}</button>
  </>}>
    <div className="form">
      <p className="muted small">{L("The client gets a link to approve or decline. Approved extra work counts as earned revenue.", "العميل بيوصله لينك يوافق أو يرفض. الشغل الإضافي الموافق عليه بيتحسب إيراد.")}</p>
      {!preset.project_id && <Field label={L("Project", "المشروع")}><select className="sel" value={v.project_id || ""} onChange={e => setV({ ...v, project_id: e.target.value })}><option value="">{L("Choose…", "اختر…")}</option>{projects.map(p => <option key={p.id} value={p.id}>{clients.find(c => c.id === p.client_id)?.name} · {p.name}</option>)}</select></Field>}
      <Field label={L("What's the extra work?", "إيه الشغل الإضافي؟")}><input className="inp" value={v.title || ""} onChange={e => setV({ ...v, title: e.target.value })} autoFocus /></Field>
      <Field label={L("Details for the client", "التفاصيل للعميل")}><textarea className="txt" value={v.description || ""} onChange={e => setV({ ...v, description: e.target.value })} /></Field>
      <div className="form-row">
        <Field label={L("Price", "السعر")}><input className="inp" type="number" min="0" value={v.amount ?? 0} onChange={e => setV({ ...v, amount: Number(e.target.value) })} /></Field>
        <Field label={L("Currency", "العملة")}><input className="inp" value={v.currency || ""} onChange={e => setV({ ...v, currency: e.target.value.toUpperCase().slice(0, 3) })} dir="ltr" /></Field>
      </div>
    </div>
  </Modal>;
}

export function ChangeOrders() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const toast = useToast();
  const { run } = useAction();
  const [tab, setTab] = useState<COStatus | "all">("all");
  const [create, setCreate] = useState(false);
  const [del, setDel] = useState<ChangeOrder | null>(null);
  const { rows: cos } = useRows("change_orders", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const clientOf = (pid: string) => clients.find(c => c.id === projects.find(p => p.id === pid)?.client_id);
  const sum = (s: COStatus) => cos.filter(c => c.status === s).reduce((a, c) => a + Number(c.amount), 0);
  const rows = cos.filter(c => tab === "all" || c.status === tab).sort((a, b) => b.created_at.localeCompare(a.created_at));


  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Extra work", "الشغل الإضافي")}</h1><p className="muted">{L("Anything outside the agreement, priced and approved by the client before you start.", "أي حاجة برا الاتفاق، بسعر، والعميل يوافق عليها قبل ما تبدأ.")}</p></div>
      <button className="btn btn--primary" onClick={() => setCreate(true)}><Plus />{L("Add extra work", "إضافة شغل إضافي")}</button>
    </div>
    <div className="grid3">
      <div className="card kpi kpi--accent"><span className="kpi__l">{L("Earned (approved)", "اتحصّل (موافق عليه)")}</span><span className="kpi__v">{money(sum("approved"), ws.currency, lang)}</span><span className="kpi__s">{cos.filter(c => c.status === "approved").length} {L("items", "عناصر")}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Awaiting client", "بانتظار العميل")}</span><span className="kpi__v">{money(sum("sent"), ws.currency, lang)}</span><span className="kpi__s">{cos.filter(c => c.status === "sent").length} {L("open", "مفتوحة")}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Declined", "مرفوض")}</span><span className="kpi__v">{money(sum("declined"), ws.currency, lang)}</span><span className="kpi__s">{L("Worth a conversation", "يستاهل كلام")}</span></div>
    </div>
    <div className="seg" style={{ justifySelf: "start" }}>{(["all", "draft", "sent", "approved", "declined"] as const).map(k => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{({ all: L("All", "الكل"), draft: L("Drafts", "مسودات"), sent: L("Sent", "مُرسلة"), approved: L("Approved", "موافق عليها"), declined: L("Declined", "مرفوضة") })[k]}</button>)}</div>
    <div className="card">{rows.length === 0 ? <Empty icon={<FileSignature />} title={L("No extra work yet", "مفيش شغل إضافي لسه")} text={L("When a client asks for something outside the agreement, Approve flags it and you price it here.", "لما العميل يطلب حاجة برا الاتفاق، Approve بينبّهك وتسعّرها هنا.")} /> :
      <div className="table-wrap"><table className="table">
        <thead><tr><th>{L("Extra work", "شغل إضافي")}</th><th className="hide-sm">{L("Client", "العميل")}</th><th>{L("Amount", "المبلغ")}</th><th>{L("Status", "الحالة")}</th><th className="hide-sm">{L("Date", "التاريخ")}</th><th /></tr></thead>
        <tbody>{rows.map(c => { const cl = clientOf(c.project_id); return <tr key={c.id}>
          <td><b>{c.title}</b>{c.description && <div className="faint small ellipsis" style={{ maxWidth: 380 }}>{c.description}</div>}{c.deliverable_id && <Link className="small" style={{ color: "var(--accent)" }} to={"/deliverables/" + c.deliverable_id}>{L("View deliverable", "عرض التسليمة")}</Link>}</td>
          <td className="hide-sm">{cl?.name}</td>
          <td className="nowrap"><b>{money(c.amount, c.currency, lang)}</b></td>
          <td><COPill s={c.status} />{c.decided_by && <div className="faint small">{c.decided_by}</div>}</td>
          <td className="hide-sm faint small">{date(c.decided_at || c.created_at, lang)}</td>
          <td><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            {c.status === "draft" && cl && <ChannelButton small client={cl} before={() => sendChangeOrder(ws, me, c)} build={() => extraWorkMsg(ws, cl, c, money(c.amount, c.currency, cl.lang))} label={() => L("Send", "إرسال")} />}
            {c.status === "approved" && <Link className="btn btn--sm" to={"/invoices?new=1&from=" + c.id}>{L("Invoice", "فاتورة")}</Link>}
            {c.status === "sent" && cl && <ChannelButton small primary={false} client={cl} build={() => extraWorkMsg(ws, cl, c, money(c.amount, c.currency, cl.lang))} label={() => L("Resend", "إعادة إرسال")} />}
            <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("More", "المزيد")}><MoreHorizontal /></button>}>{close => <>
              <button onClick={() => { close(); navigator.clipboard?.writeText(coUrl(c.token)).then(() => toast(L("Link copied", "تم نسخ الرابط"))); }}><Copy />{L("Copy client link", "نسخ لينك العميل")}</button>
              {c.status !== "draft" && <a href={coUrl(c.token)} target="_blank" rel="noopener" onClick={close}><ExternalLink />{L("Open client view", "افتح صفحة العميل")}</a>}
              {(c.status === "draft" || c.status === "declined") && <button style={{ color: "var(--bad)" }} onClick={() => { close(); setDel(c); }}><Trash2 />{L("Delete", "حذف")}</button>}
            </>}</Popover>
          </div></td>
        </tr>; })}</tbody>
      </table></div>}</div>
    {create && <ChangeOrderForm onClose={() => setCreate(false)} preset={{}} />}
    {del && <Confirm danger title={L("Delete this extra work?", "حذف الشغل الإضافي ده؟")} text={del.title} yes={L("Delete", "حذف")} onClose={() => setDel(null)} onYes={() => run(() => api.remove("change_orders", del.id))} />}
  </div>;
}
