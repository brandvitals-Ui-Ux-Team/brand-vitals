import { CheckCircle2, FileSignature, Info, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, useToast } from "../components/ui";
import { api } from "../lib/api";
import { onChange } from "../lib/bus";
import { date, money } from "../lib/format";
import { I18nProvider, useI18n } from "../lib/i18n";
import type { ChangeOrderPayload, Dialect, Lang } from "../lib/types";
import { LEGACY_NAME_KEY, nameKey } from "./Review";

export function ChangeOrderReview() {
  const { token = "" } = useParams();
  const [data, setData] = useState<ChangeOrderPayload | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang | undefined>();
  const [dialect, setDialect] = useState<Dialect | undefined>();
  const load = useCallback(() => api.changeOrderGet(token).then(d => { setData(d); setLang(l => l || d?.client.lang); setDialect(d?.client.dialect); }).catch(() => setData(null)), [token]);
  useEffect(() => { load(); return onChange(load); }, [load]);
  return <I18nProvider force={lang} dialect={dialect}><Body data={data} token={token} setLang={setLang} reload={load} /></I18nProvider>;
}

function Body({ data, token, setLang, reload }: { data: ChangeOrderPayload | null | undefined; token: string; setLang: (l: Lang) => void; reload: () => void }) {
  const { L, lang } = useI18n();
  const toast = useToast();
  const [name, setName] = useState("");
  const nk = data?.client.name ? nameKey(data?.client.name) : "";
  // the name this client used last time on this device (still editable)
  useEffect(() => { if (nk && !name) setName(localStorage.getItem(nk) || localStorage.getItem(LEGACY_NAME_KEY) || ""); }, [nk]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  if (data === undefined) return <Spinner />;
  if (data === null) return <div className="center" style={{ minHeight: "100vh", padding: 20 }}><div className="card card--pad stack" style={{ maxWidth: 420, textAlign: "center" }}><Info style={{ margin: "0 auto" }} /><h2>{L("This link isn't valid", "اللينك ده مش صالح")}</h2></div></div>;
  const co = data.change_order;
  const decide = async (action: "approved" | "declined") => {
    if (!name.trim()) { toast(L("Please write your name first", "اكتب اسمك الأول من فضلك"), "err"); return; }
    setBusy(true);
    try { localStorage.setItem(nk || LEGACY_NAME_KEY, name.trim()); await api.changeOrderRespond(token, { action, name: name.trim() }); toast(action === "approved" ? L("Approved. The team will start right away.", "تمت الموافقة. الفريق هيبدأ فورًا.") : L("Declined. The team has been notified.", "تم الرفض. الفريق اتبلّغ.")); reload(); }
    catch (e) { toast(String((e as Error).message), "err"); }
    finally { setBusy(false); }
  };
  return <div className="public">
    <div className="public__top">
      <div><b>{data.workspace.name}</b><div className="faint small">{data.project.name} · {data.client.name}</div></div>
      <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
    </div>
    <div className="public__body" style={{ maxWidth: 640 }}>
      <div className="card card--pad stack" style={{ gap: 16 }}>
        <div className="row"><span className="tl__ico tl__ico--violet"><FileSignature /></span><span className="faint small">{L("Extra work", "شغل إضافي")} · {date(co.created_at, lang, { day: "numeric", month: "long", year: "numeric" })}</span></div>
        <h1>{co.title}</h1>
        {co.description && <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{co.description}</p>}
        <div className="row row--between" style={{ padding: "14px 16px", borderRadius: 12, background: "var(--sunken)" }}><span className="muted">{L("Price", "السعر")}</span><b style={{ fontSize: 22 }}>{money(co.amount, co.currency, lang)}</b></div>
        <p className="faint small">{L("This is extra work outside the original agreement. The team starts once you approve.", "ده شغل إضافي خارج الاتفاق الأصلي. الفريق هيبدأ بعد موافقتك.")}</p>
        {co.status === "sent" ? <>
          <label className="field"><span>{L("Your name", "اسمك")}</span><input className="inp" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          <div className="grid2"><button className="btn btn--primary btn--lg" disabled={busy} onClick={() => decide("approved")}><CheckCircle2 />{L("Approve", "موافق")}</button><button className="btn btn--lg" disabled={busy} onClick={() => decide("declined")}><XCircle />{L("Decline", "رفض")}</button></div>
        </> : <div className={"callout " + (co.status === "approved" ? "callout--ok" : "callout--warn")}>{co.status === "approved" ? <CheckCircle2 /> : <XCircle />}<span>{co.status === "approved" ? L(`Approved by ${co.decided_by}`, `وافق عليه ${co.decided_by}`) : L(`Declined by ${co.decided_by}`, `رفضه ${co.decided_by}`)}{co.decided_at ? " · " + date(co.decided_at, lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span></div>}
      </div>
      <div className="powered"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />{L("Extra work approvals by Vitals GO", "موافقات الشغل الإضافي عبر Vitals GO")}</div>
    </div>
  </div>;
}
