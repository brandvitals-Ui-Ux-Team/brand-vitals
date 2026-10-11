// Native connections: OAuth apps (ClickUp, Asana, Meta, Google Ads) and payment
// providers (Stripe, Paymob, Tap). Tokens and keys stay on the server, encrypted.
import { CheckCircle2, Info, Link2, Plug, Unplug } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isDemo } from "../lib/api";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { capabilities, liveOnlyReason, server, type Capabilities } from "../lib/server";
import type { Provider } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { Field, Modal, useAction, useToast } from "./ui";

const APPS: { p: Provider; name: string; color: string; letter: string; en: string; ar: string; kind: "oauth" | "key" }[] = [
  { p: "clickup", name: "ClickUp", color: "#7B68EE", letter: "C", en: "Each deliverable becomes a ClickUp task in the project's list; client approvals and change requests land as comments.", ar: "كل تسليمة بتبقى تاسك في ClickUp في ليستة المشروع، وموافقات العميل وطلباته بتنزل كتعليقات.", kind: "oauth" },
  { p: "asana", name: "Asana", color: "#F06A6A", letter: "A", en: "Same for Asana: a task per deliverable, client decisions as comments, completed on approval.", ar: "نفس الكلام في Asana: تاسك لكل تسليمة، وقرارات العميل كتعليقات، وبتتقفل لما يوافق.", kind: "oauth" },
  { p: "meta", name: "Meta (Facebook & Instagram)", color: "#1877F2", letter: "M", en: "Live ad results next to the approved creative, and approved posts published from the calendar.", ar: "نتايج الإعلان جنب التصميم المتوافق عليه، والبوستات المتوافق عليها بتتنشر من التقويم.", kind: "oauth" },
  { p: "google_ads", name: "Google Ads", color: "#34A853", letter: "G", en: "Ad performance (spend, clicks, conversions, ROAS) next to the approved ad.", ar: "أداء الإعلان (الصرف، النقرات، التحويلات، العائد) جنب الإعلان المتوافق عليه.", kind: "oauth" },
  { p: "paymob", name: "Paymob", color: "#00A3E0", letter: "P", en: "Payment links for invoices in Egypt: cards, wallets, Fawry.", ar: "لينكات دفع للفواتير في مصر: كروت ومحافظ وفوري.", kind: "key" },
  { p: "tap", name: "Tap Payments", color: "#2ACE7E", letter: "T", en: "Payment links for the Gulf: mada, Apple Pay, KNET, cards.", ar: "لينكات دفع للخليج: مدى وApple Pay وKNET والكروت.", kind: "key" },
  { p: "stripe", name: "Stripe", color: "#635BFF", letter: "S", en: "Card payment links for international clients.", ar: "لينكات دفع بالكارت للعملاء الدوليين.", kind: "key" }
];

export function Connections() {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const toast = useToast();
  const { run, busy } = useAction();
  const [sp, setSp] = useSearchParams();
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [keyFor, setKeyFor] = useState<Provider | null>(null);
  const { rows: conns } = useRows("connections", { workspace_id: ws.id });
  const isAdmin = me?.role === "owner" || me?.role === "admin";
  useEffect(() => { capabilities().then(setCaps); }, []);
  useEffect(() => {
    if (sp.get("connected")) { toast(L("Connected", "اتربط") + ": " + sp.get("connected")); setSp({}); }
    else if (sp.get("error")) { toast(sp.get("error")!, "err"); setSp({}); }
  }, [sp, setSp, toast, L]);

  const connect = (p: Provider) => run(async () => {
    const { url } = await server<{ url: string }>("/api/connect?action=start", { workspace_id: ws.id, provider: p });
    location.href = url;
  });
  const disconnect = (p: Provider) => run(() => server("/api/connect?action=disconnect", { workspace_id: ws.id, provider: p }), L("Disconnected", "اتفصل"));

  return <div className="card">
    <div className="card__h"><h2 className="row"><Plug size={18} />{L("Connected apps", "التطبيقات المربوطة")}</h2><span className="faint small">{L("tokens are encrypted on the server", "الـ tokens متشفّرة على السيرفر")}</span></div>
    {isDemo && <div className="callout callout--info" style={{ margin: 16 }}><Info /><span className="small">{L(liveOnlyReason(true), liveOnlyReason(false))}</span></div>}
    <div className="int-grid" style={{ padding: 16 }}>{APPS.map(a => {
      const c = conns.find(x => x.provider === a.p);
      const ready = a.kind === "key" ? !!caps?.server : !!(caps?.server && caps.oauth[a.p] && (a.p !== "google_ads" || caps.google_ads_dev_token));
      return <div key={a.p} className="card int" style={{ boxShadow: "none" }}>
        <div className="int__top"><span className="int__logo" style={{ background: a.color }}>{a.letter}</span><b style={{ flex: 1 }}>{a.name}</b>
          {c ? (c.status === "active" ? <span className="pill pill--ok">{L("Connected", "مربوط")}</span> : <span className="pill pill--bad">{L("Reconnect", "أعد الربط")}</span>) : null}</div>
        <p className="muted small">{L(a.en, a.ar)}</p>
        {c && <p className="small row" style={{ gap: 6 }}><CheckCircle2 size={14} color="var(--ok)" />{c.account_label}{c.last_error && <span className="faint">· {c.last_error}</span>}</p>}
        {isAdmin && !isDemo && <div className="row">
          {(!c || c.status !== "active") && <button className="btn btn--sm btn--primary" disabled={busy || !ready} onClick={() => (a.kind === "oauth" ? connect(a.p) : setKeyFor(a.p))}><Link2 />{L("Connect", "ربط")}</button>}
          {c && <button className="btn btn--sm" onClick={() => disconnect(a.p)}><Unplug />{L("Disconnect", "فصل")}</button>}
        </div>}
        {!isDemo && !ready && !c && <p className="faint small">{a.kind === "oauth" ? L("Needs the app's client ID/secret in Vercel (see README → Integrations).", "محتاج الـ client ID والـ secret في Vercel (شوف README ← Integrations).") : L("Needs SUPABASE_SERVICE_ROLE_KEY and TOKEN_ENC_KEY on the server.", "محتاج SUPABASE_SERVICE_ROLE_KEY و TOKEN_ENC_KEY على السيرفر.")}</p>}
      </div>;
    })}</div>
    {keyFor && <KeyForm provider={keyFor} onClose={() => setKeyFor(null)} />}
  </div>;
}

function KeyForm({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const { run, busy } = useAction();
  const [k, setK] = useState<Record<string, string>>({});
  const fields: [string, string][] = provider === "paymob"
    ? [["secret_key", "Secret key"], ["public_key", "Public key"], ["integration_ids", "Integration ID(s), comma separated"], ["hmac_secret", "HMAC secret"]]
    : [["secret_key", provider === "stripe" ? "Secret or restricted key (sk_… / rk_…)" : "Secret key (sk_…)"]];
  const webhook = `${location.origin}/api/pay?action=webhook&provider=${provider}&ws=${ws.id}`;
  return <Modal title={L(`Connect ${provider}`, `ربط ${provider}`)} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" disabled={busy || fields.some(([f]) => !k[f]?.trim())} onClick={() => run(async () => { await server("/api/connect?action=save_key", { workspace_id: ws.id, provider, keys: k }); onClose(); }, L("Connected", "اتربط"))}>{L("Save", "حفظ")}</button>
  </>}>
    <div className="form">
      {fields.map(([f, label]) => <Field key={f} label={label}><input className="inp mono" type={f.includes("secret") ? "password" : "text"} autoComplete="off" dir="ltr" value={k[f] || ""} onChange={e => setK({ ...k, [f]: e.target.value.trim() })} /></Field>)}
      <Field label={L("Webhook URL to add in your provider dashboard", "لينك الـ webhook اللي تحطه في لوحة مزوّد الدفع")} hint={provider === "stripe" ? L("Event: checkout.session.completed", "الحدث: checkout.session.completed") : provider === "paymob" ? L("Paste it as the Transaction processed callback.", "حطه كـ Transaction processed callback.") : L("Tap sends it per charge automatically.", "Tap بيبعته مع كل عملية تلقائيًا.")}>
        <input className="inp mono" readOnly dir="ltr" value={webhook} onFocus={e => e.target.select()} />
      </Field>
      <p className="faint small">{L("Keys are sent once over HTTPS, encrypted on the server, and never shown again or sent to the browser.", "المفاتيح بتتبعت مرة واحدة على HTTPS، وبتتشفّر على السيرفر، وعمرها ما بتتعرض تاني أو تتبعت للمتصفح.")}</p>
    </div>
  </Modal>;
}
