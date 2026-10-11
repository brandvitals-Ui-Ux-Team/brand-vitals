// Integrations: what Vitals Approve connects to today, and what's next.
// Webhooks are live now and reach Zapier / Make / n8n (thousands of apps),
// Slack and Microsoft Teams channels.
import { Check, Copy, Plus, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Empty, Field, Modal, useAction, useToast } from "../components/ui";
import { api } from "../lib/api";
import { caps } from "../lib/channels";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { WebhookKind } from "../lib/types";
import { useWorkspace } from "../lib/ws";

export const EVENTS: [string, string, string][] = [
  ["approval.approved", "Client approved", "العميل وافق"],
  ["approval.changes", "Client asked for changes", "العميل طلب تعديل"],
  ["change_order.approved", "Extra work approved", "الشغل الإضافي اتوافق عليه"],
  ["change_order.declined", "Extra work declined", "الشغل الإضافي اترفض"],
  ["message.client", "Client sent a message", "العميل بعت رسالة"],
  ["review.sent", "Sent for review", "اتبعت للمراجعة"],
  ["task.done", "Task completed", "مهمة خلصت"]
];

type Status = "live" | "setup" | "next";
interface Card { name: string; color: string; letter: string; en: string; ar: string; status: Status; cat: string }
const CATALOG: Card[] = [
  { cat: "comms", name: "Email", color: "#0E8A5F", letter: "@", en: "Branded emails to clients for reviews, reminders and replies.", ar: "إيميلات بشكل وكالتك للمراجعات والتذكيرات والردود.", status: "live" },
  { cat: "comms", name: "WhatsApp", color: "#25D366", letter: "W", en: "Send review links from your WhatsApp. Cloud API automation is next.", ar: "ابعت لينكات المراجعة من واتساب بتاعك. الأتمتة عبر Cloud API جاية.", status: "live" },
  { cat: "comms", name: "Slack", color: "#4A154B", letter: "S", en: "Client updates in a shared Slack channel, and team alerts in yours.", ar: "تحديثات العميل في قناة Slack مشتركة، وتنبيهات للفريق في قناتكم.", status: "live" },
  { cat: "comms", name: "Microsoft Teams", color: "#5059C9", letter: "T", en: "Same as Slack, for corporate clients on Teams.", ar: "زي Slack بالظبط، للعملاء الشركات اللي على Teams.", status: "live" },
  { cat: "comms", name: "SMS", color: "#2F5FD0", letter: "✉", en: "Text the review link from your phone.", ar: "ابعت لينك المراجعة SMS من موبايلك.", status: "live" },
  { cat: "auto", name: "Zapier · Make · n8n", color: "#FF4F00", letter: "Z", en: "Use a webhook to trigger any of thousands of apps when a client approves, asks for changes or writes.", ar: "استخدم webhook يشغّل آلاف التطبيقات لما العميل يوافق أو يطلب تعديل أو يكتب.", status: "live" },
  { cat: "files", name: "Figma", color: "#A259FF", letter: "F", en: "Paste a Figma link as a version: it previews live inside the review page.", ar: "حط لينك Figma كنسخة: بيظهر مباشرة جوه صفحة المراجعة.", status: "live" },
  { cat: "files", name: "Google Drive", color: "#1FA463", letter: "G", en: "Drive files and Docs preview inside the review page.", ar: "ملفات Drive والـ Docs بتتعرض جوه صفحة المراجعة.", status: "live" },
  { cat: "files", name: "YouTube · Vimeo · Loom", color: "#FF0000", letter: "▶", en: "Video links play inside the review page.", ar: "لينكات الفيديو بتشتغل جوه صفحة المراجعة.", status: "live" },
  { cat: "pm", name: "ClickUp · Asana · Monday · Jira", color: "#7B68EE", letter: "C", en: "Two-way status sync. Today: via Zapier/Make webhooks.", ar: "مزامنة الحالة في الاتجاهين. حاليًا: عبر webhooks مع Zapier أو Make.", status: "next" },
  { cat: "ads", name: "Meta · Google · TikTok Ads", color: "#1877F2", letter: "M", en: "Live ad results next to the approved creative.", ar: "نتايج الإعلان جنب التصميم اللي اتوافق عليه.", status: "next" },
  { cat: "ads", name: "Social publishing", color: "#E1306C", letter: "P", en: "Approved posts publish from the calendar.", ar: "البوستات المتوافق عليها تتنشر من التقويم.", status: "next" },
  { cat: "money", name: "Paymob · Tap · Stripe", color: "#635BFF", letter: "$", en: "Approved extra work becomes an invoice and a payment link.", ar: "الشغل الإضافي المتوافق عليه يتحوّل لفاتورة ولينك دفع.", status: "next" },
  { cat: "money", name: "E-invoicing (ETA · ZATCA)", color: "#097A53", letter: "E", en: "Compliant invoices for Egypt and Saudi Arabia.", ar: "فواتير إلكترونية متوافقة لمصر والسعودية.", status: "next" }
];

export function Integrations() {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const toast = useToast();
  const { run } = useAction();
  const { rows: hooks } = useRows("webhooks", { workspace_id: ws.id });
  const [add, setAdd] = useState<WebhookKind | null>(null);
  const [emailLive, setEmailLive] = useState<boolean | null>(null);
  useEffect(() => { caps().then(c => setEmailLive(!!c.email)); }, []);
  const isAdmin = me?.role === "owner" || me?.role === "admin";
  const statusPill = (c: Card) => {
    if (c.name === "Email" && emailLive === false) return <span className="pill pill--warn">{L("Opens your mail app", "بيفتح برنامج الإيميل")}</span>;
    return c.status === "live" ? <span className="pill pill--ok">{L("Live", "شغال")}</span> : <span className="pill">{L("Coming next", "قريبًا")}</span>;
  };
  const test = (h: typeof hooks[number]) => run(async () => {
    const body = h.kind === "generic" ? { event: "test", actor: me.name, summary: "Test event from Vitals Approve", secret: h.secret } : { text: `Test from Vitals Approve (${ws.name}) ✅` };
    if (h.kind === "generic") await fetch(h.url, { method: "POST", mode: "no-cors", body: JSON.stringify(body) });
    else await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: h.kind, webhook: h.url, text: body.text }) }).then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "HTTP " + r.status); });
  }, L("Test sent", "اتبعت اختبار"));

  return <div className="page">
    <div className="page-head"><div className="page-head__t"><h1>{L("Integrations", "الربط")}</h1><p className="muted">{L("Vitals Approve works with the tools your team and clients already use. No single app is required.", "Vitals Approve بيشتغل مع الأدوات اللي فريقك وعملاءك بيستخدموها. مفيش تطبيق واحد إجباري.")}</p></div></div>

    <div className="card">
      <div className="card__h"><h2 className="row"><WebhookIcon size={18} />{L("Webhooks & team alerts", "Webhooks وتنبيهات الفريق")}</h2>
        {isAdmin && <div className="row"><button className="btn btn--sm" onClick={() => setAdd("slack")}><Plus />Slack</button><button className="btn btn--sm" onClick={() => setAdd("teams")}><Plus />Teams</button><button className="btn btn--sm btn--primary" onClick={() => setAdd("generic")}><Plus />Webhook</button></div>}</div>
      {hooks.length === 0 ? <Empty icon={<WebhookIcon />} title={L("No webhooks yet", "مفيش webhooks لسه")} text={L("Post client decisions to your team's Slack or Teams channel, or send them to Zapier, Make or n8n to update any other tool.", "ابعت قرارات العملاء لقناة الفريق على Slack أو Teams، أو لـ Zapier أو Make أو n8n عشان تحدّث أي أداة تانية.")} /> :
        <div className="list">{hooks.map(h => <div key={h.id} className="li">
          <span className="int__logo" style={{ background: h.kind === "slack" ? "#4A154B" : h.kind === "teams" ? "#5059C9" : "#FF4F00", width: 32, height: 32, fontSize: 12 }}>{h.kind === "slack" ? "S" : h.kind === "teams" ? "T" : "{}"}</span>
          <span className="li__main"><span className="li__t">{h.name || h.url.replace(/^https:\/\//, "").slice(0, 40)}</span><span className="li__s">{h.events.map(e => L(...(EVENTS.find(x => x[0] === e)?.slice(1, 3) as [string, string] || [e, e]))).join(" · ")}</span></span>
          <label className="check small"><input type="checkbox" checked={h.active} disabled={!isAdmin} onChange={e => run(() => api.update("webhooks", h.id, { active: e.target.checked }))} />{L("On", "شغال")}</label>
          <button className="btn btn--sm" onClick={() => test(h)}><Send />{L("Test", "اختبار")}</button>
          {h.kind === "generic" && <button className="icon-btn" onClick={() => navigator.clipboard?.writeText(h.secret).then(() => toast(L("Signing secret copied", "اتنسخ الـ secret")))} aria-label={L("Copy secret", "نسخ الـ secret")}><Copy /></button>}
          {isAdmin && <button className="icon-btn" onClick={() => run(() => api.remove("webhooks", h.id))} aria-label={L("Delete", "حذف")}><Trash2 /></button>}
        </div>)}</div>}
    </div>

    {([["comms", "Client & team channels", "قنوات العميل والفريق"], ["auto", "Automation", "الأتمتة"], ["files", "Files & previews", "الملفات والمعاينة"], ["pm", "Project tools", "أدوات المشاريع"], ["ads", "Ads & publishing", "الإعلانات والنشر"], ["money", "Billing", "الفواتير"]] as const).map(([cat, en, ar]) =>
      <section key={cat} className="stack"><h2>{L(en, ar)}</h2>
        <div className="int-grid">{CATALOG.filter(c => c.cat === cat).map(c => <div key={c.name} className="card int">
          <div className="int__top"><span className="int__logo" style={{ background: c.color }}>{c.letter}</span><b style={{ flex: 1 }}>{c.name}</b>{statusPill(c)}</div>
          <p className="muted small">{L(c.en, c.ar)}</p>
        </div>)}</div>
      </section>)}
    {add && <WebhookForm kind={add} onClose={() => setAdd(null)} />}
  </div>;
}

function WebhookForm({ kind, onClose }: { kind: WebhookKind; onClose: () => void }) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const { busy, run } = useAction();
  const [name, setName] = useState(kind === "slack" ? "Slack #approvals" : kind === "teams" ? "Teams channel" : "Zapier");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(EVENTS.slice(0, 5).map(e => e[0]));
  const hint = kind === "slack" ? L("Slack → Apps → Incoming Webhooks → Add to channel → copy the URL.", "Slack ← Apps ← Incoming Webhooks ← اختار القناة ← انسخ اللينك.")
    : kind === "teams" ? L("Teams channel → Workflows → “Post to a channel when a webhook request is received” → copy the URL.", "قناة Teams ← Workflows ← «Post to a channel when a webhook request is received» ← انسخ اللينك.")
    : L("Zapier: “Webhooks by Zapier → Catch Hook”. Make: “Custom webhook”. n8n: “Webhook” node. Paste the URL here.", "Zapier: «Webhooks by Zapier ← Catch Hook». Make: «Custom webhook». n8n: «Webhook». حط اللينك هنا.");
  const valid = /^https:\/\/\S+\.\S+/.test(url.trim()) && events.length > 0 && (kind !== "slack" || /hooks\.slack\.com/.test(url)) && (kind !== "teams" || /(webhook\.office\.com|logic\.azure\.com)/.test(url));
  return <Modal title={kind === "slack" ? L("Post to Slack", "إرسال لـ Slack") : kind === "teams" ? L("Post to Microsoft Teams", "إرسال لـ Teams") : L("Add a webhook", "إضافة webhook")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" disabled={busy || !valid} onClick={() => run(async () => { await api.insert("webhooks", { workspace_id: ws.id, name: name.trim(), kind, url: url.trim(), events, active: true, secret: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }); onClose(); }, L("Connected", "اتربط"))}><Check />{L("Connect", "ربط")}</button>
  </>}>
    <div className="form">
      <Field label={L("Name", "الاسم")}><input className="inp" value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label={L("Webhook URL", "لينك الـ webhook")} hint={hint}><input className="inp mono" value={url} onChange={e => setUrl(e.target.value)} dir="ltr" placeholder="https://…" autoFocus /></Field>
      <Field label={L("Send these events", "ابعت الأحداث دي")}><div className="chips">{EVENTS.map(([k, en, ar]) => <button type="button" key={k} className={"chip-btn" + (events.includes(k) ? " on" : "")} onClick={() => setEvents(x => x.includes(k) ? x.filter(y => y !== k) : [...x, k])}>{L(en, ar)}</button>)}</div></Field>
    </div>
  </Modal>;
}
