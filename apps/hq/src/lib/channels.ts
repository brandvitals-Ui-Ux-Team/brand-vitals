// How work reaches a client. WhatsApp is one channel among several; the client
// picks their favourite and every message (review, reminder, extra work, reply)
// goes out on it. Links work everywhere, so nothing depends on one app.
import { api } from "./api";
import { coUrl, fillTemplate, portalUrl, reviewUrl, waLink } from "./format";
import type { ChangeOrder, Channel, Client, Deliverable, Lang, Workspace } from "./types";

export const CHANNELS: Record<Channel, { en: string; ar: string; needs: "phone" | "email" | "webhook" | null }> = {
  email: { en: "Email", ar: "إيميل", needs: "email" },
  whatsapp: { en: "WhatsApp", ar: "واتساب", needs: "phone" },
  sms: { en: "SMS", ar: "رسالة SMS", needs: "phone" },
  slack: { en: "Slack", ar: "Slack", needs: "webhook" },
  teams: { en: "Microsoft Teams", ar: "Microsoft Teams", needs: "webhook" },
  link: { en: "Copy link", ar: "نسخ اللينك", needs: null }
};

export interface Outgoing { subject: string; text: string; link: string; linkLabel: string }
export const canUse = (c: Client, ch: Channel) => {
  const need = CHANNELS[ch].needs;
  return need === null || (need === "phone" ? !!c.phone : need === "email" ? !!c.email : !!c.chat_webhook);
};
// The client's preferred channel if usable, otherwise the first one that works.
export function bestChannel(c: Client): Channel {
  if (canUse(c, c.preferred_channel)) return c.preferred_channel;
  return (["whatsapp", "email", "slack", "teams", "sms"] as Channel[]).find(ch => canUse(c, ch)) || "link";
}

// ---------- messages, in the client's language ----------
const greet = (c: Client) => c.contact_name || c.name;
const isAr = (c: Client, lang?: Lang) => (lang || c.lang) === "ar";

export function reviewMsg(ws: Workspace, c: Client, d: Deliverable): Outgoing {
  const tpl = isAr(c) ? ws.wa_template_ar : ws.wa_template_en;
  const text = fillTemplate(tpl, { client: greet(c), item: d.title, link: "", agency: ws.name, version: String(d.current_version) }).replace(/[:：]\s*$/, "").trim();
  return { subject: isAr(c) ? `للمراجعة: ${d.title}` : `For your review: ${d.title}`, text, link: reviewUrl(d.review_token), linkLabel: isAr(c) ? "راجع ووافق" : "Review and approve" };
}
export function reminderMsg(ws: Workspace, c: Client, count: number): Outgoing {
  return isAr(c)
    ? { subject: `${count} حاجة مستنية موافقتك`, text: `أهلًا ${greet(c)}، عندك ${count} ${count === 1 ? "حاجة مستنية" : "حاجات مستنية"} موافقتك. تقدر تراجعهم كلهم من البوابة.\n— ${ws.name}`, link: portalUrl(c.portal_token), linkLabel: "افتح البوابة" }
    : { subject: `${count} item${count === 1 ? "" : "s"} waiting for your approval`, text: `Hi ${greet(c)}, you have ${count} item${count === 1 ? "" : "s"} waiting for your approval. You can review them all in your portal.\n— ${ws.name}`, link: portalUrl(c.portal_token), linkLabel: "Open portal" };
}
export function extraWorkMsg(ws: Workspace, c: Client, co: ChangeOrder, amount: string): Outgoing {
  return isAr(c)
    ? { subject: `شغل إضافي محتاج موافقتك: ${co.title}`, text: `أهلًا ${greet(c)}، ده طلب إضافي برا الاتفاق: ${co.title} (${amount}). تقدر توافق أو ترفض من اللينك.\n— ${ws.name}`, link: coUrl(co.token), linkLabel: "راجع الطلب" }
    : { subject: `Extra work to confirm: ${co.title}`, text: `Hi ${greet(c)}, here is a request outside our agreement: ${co.title} (${amount}). You can approve or decline from the link.\n— ${ws.name}`, link: coUrl(co.token), linkLabel: "Review request" };
}
export function replyMsg(ws: Workspace, c: Client, body: string, link: string): Outgoing {
  return isAr(c)
    ? { subject: `رسالة جديدة من ${ws.name}`, text: `${body}\n— ${ws.name}`, link, linkLabel: "رُد من هنا" }
    : { subject: `New message from ${ws.name}`, text: `${body}\n— ${ws.name}`, link, linkLabel: "Reply here" };
}
export const portalMsg = reminderMsg;

// ---------- delivery ----------
export type Delivered = { how: "opened" | "sent" | "copied"; channel: Channel };
async function authHeader(): Promise<Record<string, string>> {
  const sb = (api as unknown as { sb?: { auth: { getSession(): Promise<{ data: { session: { access_token: string } | null } }> } } }).sb;
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  return data.session ? { Authorization: "Bearer " + data.session.access_token } : {};
}
async function serverSend(body: Record<string, unknown>) {
  const r = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeader()) }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Could not send (" + r.status + ")");
}

let serverCaps: Promise<{ email: boolean }> | null = null;
export const caps = () => (serverCaps ||= fetch("/api/notify").then(r => (r.ok ? r.json() : { email: false })).catch(() => ({ email: false })));

export async function deliver(ws: Workspace, c: Client, msg: Outgoing, channel: Channel = bestChannel(c)): Promise<Delivered> {
  const full = msg.text + (msg.link ? "\n" + msg.link : "");
  switch (channel) {
    case "whatsapp": window.open(waLink(c.phone, full), "_blank", "noopener"); return { how: "opened", channel };
    case "sms": location.href = `sms:${c.phone.replace(/[^\d+]/g, "")}?body=${encodeURIComponent(full)}`; return { how: "opened", channel };
    case "email": {
      if ((await caps()).email) { await serverSend({ channel: "email", to: c.email, subject: msg.subject, text: msg.text, link: msg.link, linkLabel: msg.linkLabel, agency: ws.name }); return { how: "sent", channel }; }
      location.href = `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(full)}`;
      return { how: "opened", channel };
    }
    case "slack": case "teams":
      await serverSend({ channel, webhook: c.chat_webhook, text: msg.text, link: msg.link, linkLabel: msg.linkLabel });
      return { how: "sent", channel };
    default:
      await navigator.clipboard?.writeText(full).catch(() => {});
      return { how: "copied", channel: "link" };
  }
}
