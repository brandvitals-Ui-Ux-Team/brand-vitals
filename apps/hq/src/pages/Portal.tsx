// Client portal: one permanent link per client (no login). Everything waiting
// for them in one place, with "approve selected" for busy weeks.
import { CalendarDays, Check, CheckCircle2, FileSignature, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SharedThread } from "../components/Thread";
import { Spinner, Thumb, useToast } from "../components/ui";
import { api } from "../lib/api";
import { onChange } from "../lib/bus";
import { date, money } from "../lib/format";
import { I18nProvider, useI18n } from "../lib/i18n";
import type { Lang, PortalItem, PortalPayload, Version } from "../lib/types";
import { nameKey } from "./Review";

export function Portal() {
  const { token = "" } = useParams();
  const [data, setData] = useState<PortalPayload | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang | undefined>();
  const load = useCallback(() => api.portalGet(token).then(d => { setData(d); setLang(l => l || d?.client.lang); }).catch(() => setData(null)), [token]);
  useEffect(() => { load(); return onChange(load); }, [load]);
  return <I18nProvider force={lang}><Body data={data} setLang={setLang} reload={load} token={token} /></I18nProvider>;
}

const asVersion = (i: PortalItem) => (i.thumb ? ({ ...i.thumb, file_name: i.title } as unknown as Version) : null);

function Body({ data, setLang, reload, token }: { data: PortalPayload | null | undefined; setLang: (l: Lang) => void; reload: () => void; token: string }) {
  const { L, lang } = useI18n();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [name, setName] = useState(() => localStorage.getItem(nameKey) || "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) document.title = `${data.client.name} · ${data.workspace.name}`; }, [data]);
  if (data === undefined) return <Spinner />;
  if (data === null) return <div className="center" style={{ minHeight: "100vh", padding: 20 }}><div className="card card--pad stack" style={{ maxWidth: 420, textAlign: "center" }}><Info style={{ margin: "0 auto" }} /><h2>{L("This link isn't valid", "اللينك ده مش صالح")}</h2><p className="muted">{L("Ask the agency for your portal link.", "اطلب لينك البوابة من الوكالة.")}</p></div></div>;

  const waiting = data.items.filter(i => i.status === "in_review");
  const working = data.items.filter(i => i.status === "changes");
  const approved = data.items.filter(i => i.status === "approved");
  const cos = data.change_orders.filter(c => c.status === "sent");
  const toggle = (t: string) => setPicked(p => { const n = new Set(p); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const approveSelected = async () => {
    if (!name.trim()) { toast(L("Please write your name first", "اكتب اسمك الأول من فضلك"), "err"); return; }
    setBusy(true);
    try {
      localStorage.setItem(nameKey, name.trim());
      for (const t of picked) await api.reviewRespond(t, { action: "approved", name: name.trim(), comment: "" });
      toast(L(`Approved ${picked.size}. Thank you!`, `تمت الموافقة على ${picked.size}. شكرًا!`));
      setPicked(new Set()); reload();
    } catch (e) { toast(String((e as Error).message), "err"); }
    finally { setBusy(false); }
  };
  const Card = ({ i, selectable }: { i: PortalItem; selectable?: boolean }) => <div style={{ position: "relative" }}>
    <Link to={"/r/" + i.review_token} className="pcard">
      <Thumb v={asVersion(i)} kind={i.kind} large />
      <div className="pcard__b"><b className="ellipsis">{i.title}</b><span className="faint small">{i.project}{i.publish_date ? " · " + L("goes live ", "ينزل ") + date(i.publish_date, lang) : ""}</span></div>
    </Link>
    {selectable && <label className="check" style={{ position: "absolute", top: 18, insetInlineStart: 18, background: "var(--surface)", padding: "4px 8px", borderRadius: 8, boxShadow: "var(--shadow-1)" }}>
      <input type="checkbox" checked={picked.has(i.review_token)} onChange={() => toggle(i.review_token)} /><span className="small">{L("Select", "اختيار")}</span></label>}
  </div>;

  return <div className="public">
    <div className="public__top">
      <div><b>{data.workspace.name}</b><div className="faint small">{L("Approval portal", "بوابة الموافقات")} · {data.client.name}</div></div>
      <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
    </div>
    <div className="public__body">
      <div className="stack" style={{ gap: 4 }}>
        <h1>{L(`Hi ${data.client.name}`, `أهلًا ${data.client.name}`)}</h1>
        <p className="muted">{waiting.length + cos.length === 0 ? L("Nothing needs your approval right now.", "مفيش حاجة محتاجة موافقتك دلوقتي.") : L(`${waiting.length + cos.length} thing(s) need your approval. Tap any item to review it, or select several and approve them together.`, `فيه ${waiting.length + cos.length} حاجة محتاجة موافقتك. اضغط على أي حاجة تراجعها، أو اختار كذا حاجة ووافق عليهم مرة واحدة.`)}</p>
      </div>

      {waiting.length > 0 && <section className="stack">
        <div className="row row--between"><h2>{L("Waiting for your approval", "مستنية موافقتك")}</h2>
          <button className="btn btn--sm" onClick={() => setPicked(picked.size === waiting.length ? new Set() : new Set(waiting.map(w => w.review_token)))}>{picked.size === waiting.length ? L("Clear selection", "إلغاء الاختيار") : L("Select all", "اختيار الكل")}</button></div>
        <div className="portal-grid">{waiting.map(i => <Card key={i.review_token} i={i} selectable />)}</div>
      </section>}

      {cos.length > 0 && <section className="stack">
        <h2>{L("Extra work to confirm", "شغل إضافي محتاج تأكيدك")}</h2>
        <div className="card"><div className="list">{cos.map(c => <Link key={c.token} to={"/co/" + c.token} className="li">
          <span className="tl__ico tl__ico--violet"><FileSignature /></span>
          <span className="li__main"><span className="li__t">{c.title}</span><span className="li__s">{date(c.created_at, lang)}</span></span>
          <b>{money(c.amount, c.currency, lang)}</b><span className="btn btn--sm">{L("Review", "مراجعة")}</span>
        </Link>)}</div></div>
      </section>}

      {working.length > 0 && <section className="stack">
        <h2>{L("Being updated by the team", "الفريق بيعدّلها")}</h2>
        <div className="portal-grid">{working.map(i => <Card key={i.review_token} i={i} />)}</div>
      </section>}

      {approved.length > 0 && <section className="stack">
        <h2 className="row"><CheckCircle2 size={18} color="var(--ok)" />{L("Approved recently", "اتوافق عليها مؤخرًا")}</h2>
        <div className="card"><div className="list">{approved.map(i => <Link key={i.review_token} to={"/r/" + i.review_token} className="li">
          <Thumb v={asVersion(i)} kind={i.kind} />
          <span className="li__main"><span className="li__t">{i.title}</span><span className="li__s">{i.project}</span></span>
          {i.publish_date && <span className="faint small row" style={{ gap: 4 }}><CalendarDays size={14} />{date(i.publish_date, lang)}</span>}
        </Link>)}</div></div>
      </section>}

      <SharedThread load={() => api.portalMessages(token)} post={(n, b) => api.portalMessage(token, n, b)} />

      {picked.size > 0 && <div className="sel-bar">
        <span>{L(`${picked.size} selected`, `${picked.size} متختارين`)}</span>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="inp" style={{ maxWidth: 180, height: 34, background: "var(--bg)", color: "var(--text)" }} value={name} onChange={e => setName(e.target.value)} placeholder={L("Your name", "اسمك")} />
          <button className="btn btn--primary" disabled={busy} onClick={approveSelected}><Check />{L("Approve selected", "وافق على المختار")}</button>
        </div>
      </div>}
      <div className="powered"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />{L("Approvals by Vitals Approve", "الموافقات عبر Vitals Approve")}</div>
    </div>
  </div>;
}
