// POST /api/notify  — sends a message to a client or team over a server-side channel.
//   { channel: "email",  to: "client@x.com", subject, text, link, linkLabel, agency }
//   { channel: "slack" | "teams", webhook: "https://hooks.slack.com/…", text, link, linkLabel }
// GET  /api/notify  — reports which channels this deployment can send on.
//
// Email uses Resend (RESEND_API_KEY, EMAIL_FROM). Slack/Teams use incoming
// webhooks (only Slack/Microsoft hosts are allowed, so this can't be used to
// call arbitrary URLs). When Supabase is configured, a signed-in user's token
// is required, so the endpoint can't be used as an open relay.
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const RESEND = process.env.RESEND_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "Vitals GO <approvals@brandvitals.io>";

const json = (res, code, body) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body)); };
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const okHook = u => { try { const x = new URL(u); return x.protocol === "https:" && (/^hooks\.slack\.com$/.test(x.hostname) || /(^|\.)webhook\.office\.com$/.test(x.hostname) || /(^|\.)logic\.azure\.com$/.test(x.hostname)); } catch { return false; } };
const okLink = u => { try { return new URL(u).protocol === "https:" || /^http:\/\/localhost(:\d+)?\//.test(u); } catch { return false; } };

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 20000) throw new Error("Too large"); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function authorized(req) {
  if (!SB_URL || !SB_KEY) return true; // demo deployments: no accounts to check
  const auth = req.headers.authorization || "";
  if (!/^Bearer\s+\S+/.test(auth)) return false;
  const r = await fetch(SB_URL.replace(/\/$/, "") + "/auth/v1/user", { headers: { apikey: SB_KEY, Authorization: auth } });
  return r.ok;
}

function emailHtml({ text, link, linkLabel, agency }) {
  const paras = esc(text).split(/\n+/).map(p => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#0E1512">${p}</p>`).join("");
  const btn = link ? `<p style="margin:22px 0"><a href="${esc(link)}" style="background:#097A53;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block">${esc(linkLabel || "Open")}</a></p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#F6F7F5;font-family:Inter,Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px"><div style="background:#fff;border:1px solid #E3E8E4;border-radius:16px;padding:26px">
  <p style="margin:0 0 18px;font-size:13px;color:#5E6B66;font-weight:600">${esc(agency || "")}</p>${paras}${btn}</div>
  <p style="text-align:center;font-size:12px;color:#8A9690;margin-top:16px">Sent with Vitals GO</p></div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method === "GET") return json(res, 200, { email: !!RESEND, slack: true, teams: true, auth: !!(SB_URL && SB_KEY) });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  let b;
  try { b = await readBody(req); } catch { return json(res, 400, { error: "Bad request" }); }
  try {
    if (!(await authorized(req))) return json(res, 401, { error: "Sign in required" });
    const text = String(b.text || "").slice(0, 3000);
    const link = b.link && okLink(b.link) ? String(b.link) : "";
    if (!text) return json(res, 400, { error: "Missing text" });

    if (b.channel === "email") {
      if (!RESEND) return json(res, 501, { error: "Email sending is not configured (RESEND_API_KEY)" });
      const to = String(b.to || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json(res, 400, { error: "Invalid email" });
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [to], subject: String(b.subject || "").slice(0, 200) || "Update from your agency", html: emailHtml({ text, link, linkLabel: b.linkLabel, agency: b.agency }), text: text + (link ? "\n\n" + link : "") })
      });
      if (!r.ok) return json(res, 502, { error: "Email provider error " + r.status });
      return json(res, 200, { sent: true });
    }
    if (b.channel === "slack" || b.channel === "teams") {
      if (!okHook(b.webhook)) return json(res, 400, { error: "Webhook must be a Slack or Microsoft Teams incoming webhook URL" });
      const msg = text + (link ? `\n${link}` : "");
      const payload = b.channel === "slack" ? { text: msg } : { text: msg.replace(/\n/g, "\n\n") };
      const r = await fetch(b.webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) return json(res, 502, { error: "Webhook responded " + r.status });
      return json(res, 200, { sent: true });
    }
    return json(res, 400, { error: "Unknown channel" });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
}
