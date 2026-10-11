// Invoices: bill approved extra work (or anything else), get a payment link
// (Paymob / Tap / Stripe), send it on the client's channel, track payment.
import { Check, CreditCard, ExternalLink, FileText, MoreHorizontal, Plus, Printer, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChannelButton } from "../components/ChannelButton";
import { Confirm, Empty, Field, Modal, Popover, useAction } from "../components/ui";
import { createInvoice, log } from "../lib/actions";
import { api, isDemo } from "../lib/api";
import { invoiceMsg } from "../lib/channels";
import { date, invoiceUrl, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { server } from "../lib/server";
import type { ChangeOrder, Invoice, InvoiceLine, InvoiceStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";

export function InvoicePill({ s }: { s: InvoiceStatus }) {
  const { L } = useI18n();
  const m: Record<InvoiceStatus, [string, string, string]> = { draft: ["", "Draft", "مسودة"], sent: ["pill--info", "Awaiting payment", "بانتظار الدفع"], paid: ["pill--ok", "Paid", "اتدفعت"], void: ["pill--bad", "Void", "ملغية"] };
  return <span className={"pill " + m[s][0]}>{L(m[s][1], m[s][2])}</span>;
}

export function InvoiceForm({ onClose, from }: { onClose: () => void; from?: ChangeOrder }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const { run, busy } = useAction();
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const fromProject = from ? projects.find(p => p.id === from.project_id) : null;
  const [clientId, setClientId] = useState(fromProject?.client_id || "");
  const [title, setTitle] = useState(from?.title || "");
  const [currency, setCurrency] = useState(from?.currency || ws.currency);
  const [due, setDue] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [lines, setLines] = useState<InvoiceLine[]>(from ? [{ description: from.title, qty: 1, unit_price: Number(from.amount) }] : [{ description: "", qty: 1, unit_price: 0 }]);
  const total = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const cid = clientId || fromProject?.client_id || "";
  return <Modal wide title={L("New invoice", "فاتورة جديدة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" disabled={busy || !cid || !title.trim() || total <= 0} onClick={() => run(async () => { await createInvoice(ws, me, { client_id: cid, project_id: from?.project_id || null, change_order_id: from?.id || null, title: title.trim(), lines, currency, due_date: due || null }); onClose(); }, L("Invoice created", "اتعملت الفاتورة"))}>{L("Create invoice", "إنشاء الفاتورة")}</button>
  </>}>
    <div className="form">
      <div className="form-row">
        <Field label={L("Client", "العميل")}><select className="sel" value={cid} onChange={e => setClientId(e.target.value)} disabled={!!from}><option value="">{L("Choose…", "اختر…")}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label={L("Title", "العنوان")}><input className="inp" value={title} onChange={e => setTitle(e.target.value)} /></Field>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="small" style={{ fontWeight: 600, color: "var(--text-2)" }}>{L("Lines", "البنود")}</span>
        {lines.map((l, i) => <div key={i} className="row" style={{ flexWrap: "nowrap" }}>
          <input className="inp" placeholder={L("Description", "الوصف")} value={l.description} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, description: e.target.value } : y))} />
          <input className="inp" type="number" min="1" style={{ width: 80 }} value={l.qty} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, qty: Number(e.target.value) } : y))} />
          <input className="inp" type="number" min="0" style={{ width: 120 }} value={l.unit_price} onChange={e => setLines(x => x.map((y, j) => j === i ? { ...y, unit_price: Number(e.target.value) } : y))} />
          {lines.length > 1 && <button className="icon-btn" onClick={() => setLines(x => x.filter((_, j) => j !== i))} aria-label={L("Remove", "حذف")}><X /></button>}
        </div>)}
        <button className="btn btn--sm btn--ghost" style={{ justifySelf: "start" }} onClick={() => setLines(x => [...x, { description: "", qty: 1, unit_price: 0 }])}><Plus />{L("Add line", "إضافة بند")}</button>
      </div>
      <div className="form-row">
        <Field label={L("Currency", "العملة")}><input className="inp" value={currency} onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 3))} dir="ltr" /></Field>
        <Field label={L("Due date", "تاريخ الاستحقاق")}><input className="inp" type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
      </div>
      <div className="row row--between" style={{ padding: 12, borderRadius: 10, background: "var(--sunken)" }}><span className="muted">{L("Total", "الإجمالي")}</span><b style={{ fontSize: 18 }}>{money(total, currency || "EGP", "en")}</b></div>
    </div>
  </Modal>;
}

export function Invoices() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const { run } = useAction();
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");
  const [del, setDel] = useState<Invoice | null>(null);
  const { rows: invoices } = useRows("invoices", { workspace_id: ws.id });
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: cos } = useRows("change_orders", { workspace_id: ws.id });
  const outstanding = invoices.filter(i => i.status === "sent").reduce((s, i) => s + Number(i.amount), 0);
  const month = new Date().toISOString().slice(0, 7);
  const paidMonth = invoices.filter(i => i.status === "paid" && (i.paid_at || "").startsWith(month)).reduce((s, i) => s + Number(i.amount), 0);
  const unbilled = cos.filter(c => c.status === "approved" && !invoices.some(i => i.change_order_id === c.id));
  const fromCo = sp.get("from") ? cos.find(c => c.id === sp.get("from")) : undefined;
  const rows = invoices.filter(i => tab === "all" || i.status === tab).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const payLink = (i: Invoice) => run(async () => { const r = await server<{ url: string; provider: string }>("/api/pay?action=create", { invoice_id: i.id }); return r; }, L("Payment link ready", "لينك الدفع جاهز"));
  const markPaid = (i: Invoice) => run(async () => { await api.update("invoices", i.id, { status: "paid", paid_at: new Date().toISOString(), provider: i.provider || "manual" }); await log(ws, me.name, "invoice.paid", `marked invoice ${i.number} as paid`, i.project_id, i.id, { amount: i.amount, currency: i.currency }); }, L("Marked as paid", "اتعلّمت مدفوعة"));

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Invoices", "الفواتير")}</h1><p className="muted">{L("Bill approved extra work in one click, with a payment link the client can pay right away.", "حاسب على الشغل الإضافي المتوافق عليه بضغطة، مع لينك دفع العميل يدفع منه على طول.")}</p></div>
      <button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("New invoice", "فاتورة جديدة")}</button>
    </div>
    <div className="grid3">
      <div className="card kpi"><span className="kpi__l">{L("Awaiting payment", "بانتظار الدفع")}</span><span className="kpi__v">{money(outstanding, ws.currency, lang)}</span></div>
      <div className="card kpi kpi--accent"><span className="kpi__l">{L("Paid this month", "اتدفع الشهر ده")}</span><span className="kpi__v">{money(paidMonth, ws.currency, lang)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Approved extra work not billed", "شغل إضافي متوافق عليه ولسه ما اتحاسبش")}</span><span className="kpi__v">{unbilled.length}</span>
        {unbilled[0] && <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => setSp({ new: "1", from: unbilled[0].id })}>{L("Bill “" + unbilled[0].title.slice(0, 24) + "”", "احسب «" + unbilled[0].title.slice(0, 24) + "»")}</button>}</div>
    </div>
    <div className="seg" style={{ justifySelf: "start" }}>{(["all", "draft", "sent", "paid", "void"] as const).map(k => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{({ all: L("All", "الكل"), draft: L("Drafts", "مسودات"), sent: L("Awaiting", "منتظرة"), paid: L("Paid", "مدفوعة"), void: L("Void", "ملغية") })[k]}</button>)}</div>
    <div className="card">{rows.length === 0 ? <Empty icon={<FileText />} title={L("No invoices yet", "مفيش فواتير لسه")} /> :
      <div className="table-wrap"><table className="table">
        <thead><tr><th>{L("Invoice", "الفاتورة")}</th><th className="hide-sm">{L("Client", "العميل")}</th><th>{L("Amount", "المبلغ")}</th><th>{L("Status", "الحالة")}</th><th className="hide-sm">{L("Due", "الاستحقاق")}</th><th /></tr></thead>
        <tbody>{rows.map(i => { const c = clients.find(x => x.id === i.client_id); return <tr key={i.id}>
          <td><b className="mono">{i.number}</b><div className="small">{i.title}</div></td>
          <td className="hide-sm">{c?.name}</td>
          <td className="nowrap"><b>{money(i.amount, i.currency, lang)}</b></td>
          <td><InvoicePill s={i.status} />{i.provider && i.provider !== "manual" && <div className="faint small">{i.provider}</div>}</td>
          <td className="hide-sm faint small">{i.status === "paid" ? date(i.paid_at, lang) : date(i.due_date, lang)}</td>
          <td><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
            {(i.status === "draft" || i.status === "sent") && c && <ChannelButton small client={c} before={async () => { if (i.status === "draft") await api.update("invoices", i.id, { status: "sent", sent_at: new Date().toISOString() }); }} build={() => invoiceMsg(ws, c, i.number, money(i.amount, i.currency, c.lang), invoiceUrl(i.token))} label={() => i.status === "draft" ? L("Send", "إرسال") : L("Resend", "إعادة إرسال")} />}
            <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("More", "المزيد")}><MoreHorizontal /></button>}>{close => <>
              {i.status !== "paid" && i.status !== "void" && !isDemo && <button onClick={() => { close(); payLink(i); }}><CreditCard />{i.payment_url ? L("New payment link", "لينك دفع جديد") : L("Create payment link", "اعمل لينك دفع")}</button>}
              {i.status !== "paid" && i.status !== "void" && <button onClick={() => { close(); markPaid(i); }}><Check />{L("Mark as paid", "علّمها مدفوعة")}</button>}
              <a href={invoiceUrl(i.token)} target="_blank" rel="noopener" onClick={close}><ExternalLink />{L("Client view", "صفحة العميل")}</a>
              <a href={invoiceUrl(i.token) + "?print=1"} target="_blank" rel="noopener" onClick={close}><Printer />{L("Print / PDF", "طباعة / PDF")}</a>
              {i.status !== "paid" && i.status !== "void" && <button onClick={() => { close(); run(() => api.update("invoices", i.id, { status: "void" })); }}><X />{L("Void", "إلغاء الفاتورة")}</button>}
              {i.status === "draft" && <><hr /><button style={{ color: "var(--bad)" }} onClick={() => { close(); setDel(i); }}><Trash2 />{L("Delete", "حذف")}</button></>}
            </>}</Popover>
          </div></td>
        </tr>; })}</tbody>
      </table></div>}</div>
    {sp.get("new") && <InvoiceForm from={fromCo} onClose={() => setSp({})} />}
    {del && <Confirm danger title={L("Delete draft invoice?", "حذف مسودة الفاتورة؟")} text={del.number} yes={L("Delete", "حذف")} onClose={() => setDel(null)} onYes={() => run(() => api.remove("invoices", del.id))} />}
  </div>;
}
