// Public invoice page (no login): view, pay, print.
import { CheckCircle2, CreditCard, Info, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "../components/ui";
import { api } from "../lib/api";
import { date, money } from "../lib/format";
import { I18nProvider, useI18n } from "../lib/i18n";
import type { InvoicePayload, Lang } from "../lib/types";

export function InvoiceView() {
  const { token = "" } = useParams();
  const [data, setData] = useState<InvoicePayload | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang | undefined>();
  const load = useCallback(() => api.invoiceGet(token).then(d => { setData(d); setLang(l => l || d?.client.lang); }).catch(() => setData(null)), [token]);
  useEffect(() => { load(); }, [load]);
  // After paying, the provider redirects back with ?paid=1; the webhook may land a moment later.
  useEffect(() => {
    if (!new URLSearchParams(location.search).get("paid") || data?.invoice.status === "paid") return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [data, load]);
  useEffect(() => { if (data && new URLSearchParams(location.search).get("print")) setTimeout(() => window.print(), 400); }, [data]);
  return <I18nProvider force={lang}><Body data={data} setLang={setLang} /></I18nProvider>;
}

function Body({ data, setLang }: { data: InvoicePayload | null | undefined; setLang: (l: Lang) => void }) {
  const { L, lang } = useI18n();
  if (data === undefined) return <Spinner />;
  if (data === null) return <div className="center" style={{ minHeight: "100vh", padding: 20 }}><div className="card card--pad stack" style={{ maxWidth: 420, textAlign: "center" }}><Info style={{ margin: "0 auto" }} /><h2>{L("This invoice isn't available", "الفاتورة دي مش متاحة")}</h2></div></div>;
  const i = data.invoice;
  return <div className="public">
    <div className="public__top no-print">
      <div><b>{data.workspace.name}</b><div className="faint small">{L("Invoice", "فاتورة")} {i.number}</div></div>
      <div className="row"><button className="btn btn--sm" onClick={() => window.print()}><Printer />{L("Print / PDF", "طباعة / PDF")}</button><button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button></div>
    </div>
    <div className="public__body" style={{ maxWidth: 760 }}>
      <div className="card card--pad stack invoice" style={{ gap: 18 }}>
        <div className="row row--between" style={{ alignItems: "flex-start" }}>
          <div><h1>{L("Invoice", "فاتورة")}</h1><div className="mono">{i.number}</div></div>
          <div style={{ textAlign: "end" }}><b>{data.workspace.name}</b><div className="faint small">{L("Issued", "تاريخ الإصدار")}: {date(i.sent_at || i.created_at, lang, { day: "numeric", month: "long", year: "numeric" })}</div>{i.due_date && <div className="faint small">{L("Due", "الاستحقاق")}: {date(i.due_date, lang, { day: "numeric", month: "long", year: "numeric" })}</div>}</div>
        </div>
        <div><span className="faint small">{L("Billed to", "إلى")}</span><div><b>{data.client.name}</b></div></div>
        <table className="table">
          <thead><tr><th>{L("Description", "الوصف")}</th><th>{L("Qty", "الكمية")}</th><th>{L("Price", "السعر")}</th><th style={{ textAlign: "end" }}>{L("Total", "الإجمالي")}</th></tr></thead>
          <tbody>{(i.lines || []).map((l, n) => <tr key={n}><td>{l.description}</td><td>{l.qty}</td><td>{money(l.unit_price, i.currency, lang)}</td><td style={{ textAlign: "end" }}>{money(l.qty * l.unit_price, i.currency, lang)}</td></tr>)}</tbody>
        </table>
        <div className="row row--between" style={{ padding: "14px 16px", borderRadius: 12, background: "var(--sunken)" }}><span className="muted">{L("Amount due", "المبلغ المستحق")}</span><b style={{ fontSize: 24 }}>{money(i.amount, i.currency, lang)}</b></div>
        {i.status === "paid" ? <div className="callout callout--ok"><CheckCircle2 /><span>{L("Paid", "اتدفعت")} · {date(i.paid_at, lang, { day: "numeric", month: "long", year: "numeric" })}. {L("Thank you!", "شكرًا!")}</span></div>
          : i.status === "void" ? <div className="callout callout--warn"><Info /><span>{L("This invoice was cancelled.", "الفاتورة دي اتلغت.")}</span></div>
          : i.payment_url ? <a className="btn btn--primary btn--lg no-print" href={i.payment_url}><CreditCard />{L("Pay now", "ادفع دلوقتي")}</a>
          : <p className="muted small">{L("The agency will share payment details with you.", "الوكالة هتبعتلك تفاصيل الدفع.")}</p>}
      </div>
      <div className="powered no-print"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />{L("Invoices by Vitals Approve", "الفواتير عبر Vitals Approve")}</div>
    </div>
  </div>;
}
