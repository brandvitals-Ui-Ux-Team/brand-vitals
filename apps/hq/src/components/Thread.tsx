// A conversation attached to a client, project or deliverable.
// Every message is either Internal (team only) or Shared (the client sees it in
// their portal / review page). Client messages are checked by the scope guard.
import { Eye, EyeOff, FileSignature, Mic, Paperclip, PenLine, Send, Sparkles, Square, Wand2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { log } from "../lib/actions";
import { api } from "../lib/api";
import { bestChannel, CHANNELS, deliver, replyMsg } from "../lib/channels";
import { ago, portalUrl, reviewUrl } from "../lib/format";
import { isDemo } from "../lib/api";
import { capabilities, server } from "../lib/server";
import { useFileUrl, useLocalState, useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Attachment, Client, Deliverable, Message, ThreadType } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { ChangeOrderForm } from "../pages/ChangeOrders";
import { Avatar, useAction, useToast } from "./ui";

export const readKey = (threadId: string) => "hq-read-" + threadId;

function AttachmentView({ a, onTranscribe }: { a: Attachment; onTranscribe?: (blobUrl: string) => void }) {
  const url = useFileUrl(a.url);
  if (!url) return null;
  if (a.type.startsWith("audio/")) return <span className="row" style={{ gap: 6 }}><audio controls src={url} style={{ maxWidth: 260, height: 36 }} />{onTranscribe && <button className="btn btn--sm btn--ghost" onClick={() => onTranscribe(url)}><PenLine />Aa</button>}</span>;
  if (a.type.startsWith("image/")) return <a href={url} target="_blank" rel="noopener"><img src={url} alt={a.name} style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, border: "1px solid var(--line)" }} /></a>;
  return <a className="tag" href={url} target="_blank" rel="noopener" download={a.name}><Paperclip size={12} />{a.name}</a>;
}

export function Thread({ type, threadId, client, projectId, deliverable, height = 420 }: {
  type: ThreadType; threadId: string; client: Client | null; projectId?: string | null; deliverable?: Deliverable | null; height?: number;
}) {
  const { L, lang } = useI18n();
  const { ws, me, members } = useWorkspace();
  const toast = useToast();
  const { busy, run } = useAction();
  const { rows } = useRows("messages", { thread_id: threadId });
  const msgs = useMemo(() => [...rows].filter(m => m.thread_type === type).sort((a, b) => a.created_at.localeCompare(b.created_at)), [rows, type]);
  const [vis, setVis] = useLocalState<"internal" | "client">("hq-thread-vis", "internal");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [notify, setNotify] = useState(true);
  const [mention, setMention] = useState<string | null>(null);
  const [mentioned, setMentioned] = useState<string[]>([]);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [billFrom, setBillFrom] = useState<Message | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const fileIn = useRef<HTMLInputElement>(null);
  const canShare = !!client;
  const [ai, setAi] = useState<{ ai: boolean; transcribe: boolean }>({ ai: false, transcribe: false });
  const [summary, setSummary] = useState<{ summary: string; open_items: string[]; extra_work: string[] } | null>(null);
  useEffect(() => { if (!isDemo) capabilities().then(c => setAi({ ai: c.ai, transcribe: c.transcribe })); }, []);
  const convo = () => msgs.map(m => ({ author: m.author_name, body: m.body, visibility: m.visibility }));
  const summarize = () => run(async () => setSummary(await server("/api/ai", { action: "summarize", workspace_id: ws.id, lang, messages: convo() })));
  const draft = () => run(async () => { const r = await server<{ reply: string }>("/api/ai", { action: "draft", workspace_id: ws.id, lang: client?.lang || lang, messages: convo() }); setVis("client"); setBody(r.reply); });
  const transcribe = (m: Message) => async (blobUrl: string) => run(async () => {
    const blob = await (await fetch(blobUrl)).blob();
    if (blob.size > 4_000_000) throw new Error(L("Voice note is too long to transcribe (max ~4 MB)", "الفويس طويل جدًا (الحد حوالي 4 ميجا)"));
    const b64 = await new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1] || ""); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
    const t = await server<{ text: string }>("/api/ai", { action: "transcribe", workspace_id: ws.id, audio_base64: b64, mime: blob.type });
    await api.update("messages", m.id, { body: (m.body ? m.body + "\n\n" : "") + "🎙 " + t.text });
  }, L("Transcribed", "اتحوّل لكلام مكتوب"));
  const visibility = canShare ? vis : "internal";

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); if (msgs.length) try { localStorage.setItem(readKey(threadId), msgs[msgs.length - 1].created_at); } catch { /* ignore */ } }, [msgs, threadId]);

  const onType = (v: string) => {
    setBody(v);
    const m = v.match(/@([\p{L}\w]*)$/u);
    setMention(m ? m[1].toLowerCase() : null);
  };
  const pickMention = (id: string, name: string) => {
    setBody(b => b.replace(/@([\p{L}\w]*)$/u, "@" + name.split(" ")[0] + " "));
    setMentioned(x => [...new Set([...x, id])]);
    setMention(null);
  };
  const suggestions = mention == null ? [] : members.filter(m => m.id !== me?.id && m.name.toLowerCase().includes(mention)).slice(0, 5);

  const record = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = e => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const type = r.mimeType || "audio/webm";
        setFiles(f => [...f, new File([new Blob(chunks, { type })], `voice-note-${Date.now()}.${type.includes("mp4") ? "m4a" : "webm"}`, { type })]);
        setRec(null);
      };
      r.start(); setRec(r);
    } catch { toast(L("Microphone not available", "المايك مش متاح"), "err"); }
  };

  const send = () => run(async () => {
    const text = body.trim();
    if (!text && !files.length) return;
    const attachments: Attachment[] = [];
    for (const f of files) { const u = await api.upload(ws.id, f); attachments.push({ url: u.url, name: f.name, type: f.type || "application/octet-stream" }); }
    await api.insert("messages", { workspace_id: ws.id, thread_type: type, thread_id: threadId, client_id: client?.id || null, visibility, author_type: "member",
      author_member_id: me.id, author_name: me.name, body: text, attachments, mentions: mentioned, classification: null });
    if (mentioned.length) await log(ws, me.name, "message.mention", `mentioned ${members.filter(m => mentioned.includes(m.id)).map(m => m.name).join(", ")}: “${text.slice(0, 100)}”`, projectId || null, threadId);
    if (visibility === "client" && notify && client) {
      const link = deliverable ? reviewUrl(deliverable.review_token) : portalUrl(client.portal_token);
      await deliver(ws, client, replyMsg(ws, client, text || L("Sent you a file.", "بعتلك ملف."), link)).catch(e => toast(String(e.message || e), "err"));
    }
    setBody(""); setFiles([]); setMentioned([]);
  });

  return <div className="thread">
    {ai.ai && msgs.length > 0 && <div className="row" style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", gap: 6 }}>
      <button className="btn btn--sm btn--ghost" disabled={busy} onClick={summarize}><Sparkles />{L("Summarize", "لخّص")}</button>
      {client && <button className="btn btn--sm btn--ghost" disabled={busy} onClick={draft}><Wand2 />{L("Draft a reply", "اكتب رد")}</button>}
    </div>}
    {summary && <div className="callout callout--violet" style={{ margin: 12 }}><Sparkles /><div style={{ flex: 1 }} className="stack">
      <p>{summary.summary}</p>
      {summary.open_items.length > 0 && <div><b className="small">{L("Waiting on", "مستني")}</b><ul style={{ listStyle: "disc", paddingInlineStart: 18 }}>{summary.open_items.map((x, i) => <li key={i} className="small">{x}</li>)}</ul></div>}
      {summary.extra_work.length > 0 && <div><b className="small">{L("Possible extra work", "شغل إضافي محتمل")}</b><ul style={{ listStyle: "disc", paddingInlineStart: 18 }}>{summary.extra_work.map((x, i) => <li key={i} className="small">{x}</li>)}</ul></div>}
      <button className="btn btn--sm btn--ghost" style={{ justifySelf: "start" }} onClick={() => setSummary(null)}>{L("Close", "إغلاق")}</button>
    </div></div>}
    <div className="thread__list" ref={list} style={{ maxHeight: height }}>
      {msgs.length === 0 && <p className="muted small" style={{ padding: 12, textAlign: "center" }}>{L("No messages yet. Start the conversation: internal notes stay with your team, shared messages reach the client.", "لسه مفيش رسايل. ابدأ الكلام: الملاحظات الداخلية بتفضل للفريق، والرسايل المشتركة بتوصل للعميل.")}</p>}
      {msgs.map(m => {
        const mine = m.author_type === "member" && m.author_member_id === me?.id;
        return <div key={m.id} className={"msg" + (mine ? " msg--mine" : "") + (m.author_type === "client" ? " msg--client" : "") + (m.visibility === "internal" ? " msg--internal" : "")}>
          {!mine && <Avatar name={m.author_name} size="sm" />}
          <div className="msg__b">
            <div className="msg__h"><b>{m.author_name}</b>{m.author_type === "client" && <span className="tag">{L("Client", "العميل")}</span>}
              <span className="faint">{ago(m.created_at, lang)}</span>
              {m.author_type === "member" && <span className={"msg__vis"} title={m.visibility === "internal" ? L("Team only", "للفريق بس") : L("Client can see this", "العميل بيشوفها")}>{m.visibility === "internal" ? <EyeOff size={12} /> : <Eye size={12} />}</span>}
            </div>
            {m.body && <p className="msg__t">{m.body.split(/(@[\p{L}\w]+)/u).map((part, i) => part.startsWith("@") ? <b key={i} className="mention">{part}</b> : part)}</p>}
            {m.attachments?.length > 0 && <div className="row">{m.attachments.map((a, i) => <AttachmentView key={i} a={a} onTranscribe={ai.transcribe && a.type.startsWith("audio/") ? transcribe(m) : undefined} />)}</div>}
            {m.classification === "new_request" && <div className="msg__flag"><Sparkles size={14} />{L("Looks like extra work", "شكله شغل إضافي")}<button className="btn btn--sm" onClick={() => setBillFrom(m)}><FileSignature />{L("Bill it", "احسبها")}</button></div>}
          </div>
        </div>;
      })}
    </div>

    <div className={"composer" + (visibility === "client" ? " composer--client" : "")}>
      {canShare && <div className="seg composer__seg">
        <button className={visibility === "internal" ? "on" : ""} onClick={() => setVis("internal")}><EyeOff />{L("Internal", "داخلي")}</button>
        <button className={visibility === "client" ? "on" : ""} onClick={() => setVis("client")}><Eye />{L(`To ${client!.name}`, `لـ ${client!.name}`)}</button>
      </div>}
      {suggestions.length > 0 && <div className="mention-pop">{suggestions.map(m => <button key={m.id} onMouseDown={e => { e.preventDefault(); pickMention(m.id, m.name); }}><Avatar name={m.name} size="sm" />{m.name}</button>)}</div>}
      <textarea className="txt composer__in" rows={2} value={body} onChange={e => onType(e.target.value)}
        placeholder={visibility === "client" ? L("Write to the client…", "اكتب للعميل…") : L("Write to your team… use @ to mention", "اكتب لفريقك… استخدم @ للإشارة")}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !suggestions.length) { e.preventDefault(); send(); } }} />
      {files.length > 0 && <div className="row">{files.map((f, i) => <span key={i} className="tag">{f.type.startsWith("audio/") ? <Mic size={12} /> : <Paperclip size={12} />}{f.name.slice(0, 28)}<button onClick={() => setFiles(x => x.filter((_, j) => j !== i))} aria-label={L("Remove", "حذف")}><X size={12} /></button></span>)}</div>}
      <div className="row row--between">
        <div className="row" style={{ gap: 4 }}>
          <button className="icon-btn" onClick={() => fileIn.current?.click()} aria-label={L("Attach a file", "إرفاق ملف")}><Paperclip /></button>
          <input ref={fileIn} type="file" hidden multiple onChange={e => { setFiles(f => [...f, ...Array.from(e.target.files || [])]); e.target.value = ""; }} />
          <button className={"icon-btn" + (rec ? " rec" : "")} onClick={record} aria-label={rec ? L("Stop recording", "وقف التسجيل") : L("Record a voice note", "سجّل فويس نوت")}>{rec ? <Square /> : <Mic />}</button>
          {visibility === "client" && client && <label className="check small muted"><input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />{L(`Also notify on ${CHANNELS[bestChannel(client)].en}`, `وبلّغه على ${CHANNELS[bestChannel(client)].ar}`)}</label>}
        </div>
        <button className="btn btn--primary btn--sm" disabled={busy || (!body.trim() && !files.length)} onClick={send}><Send />{L("Send", "إرسال")}</button>
      </div>
    </div>
    {billFrom && <ChangeOrderForm onClose={() => setBillFrom(null)} preset={{ project_id: projectId || undefined, deliverable_id: deliverable?.id || null, title: billFrom.body.slice(0, 80), description: L(`Requested by ${billFrom.author_name}: “${billFrom.body}”`, `طلب ${billFrom.author_name}: «${billFrom.body}»`) }} />}
  </div>;
}

// Client side: shared messages only, by token (review page or portal).
export function SharedThread({ load, post }: { load: () => Promise<import("../lib/types").SharedMessage[]>; post: (name: string, body: string) => Promise<void> }) {
  const { L, lang } = useI18n();
  const toast = useToast();
  const [msgs, setMsgs] = useState<import("../lib/types").SharedMessage[]>([]);
  const [name, setName] = useState(() => localStorage.getItem("hq-client-name") || "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { load().then(setMsgs).catch(() => {}); }, [load]);
  const send = async () => {
    if (!body.trim()) return;
    if (!name.trim()) { toast(L("Please write your name first", "اكتب اسمك الأول من فضلك"), "err"); return; }
    setBusy(true);
    try { localStorage.setItem("hq-client-name", name.trim()); await post(name.trim(), body.trim()); setBody(""); setMsgs(await load()); }
    catch (e) { toast(String((e as Error).message), "err"); } finally { setBusy(false); }
  };
  return <div className="card">
    <div className="card__h"><h3>{L("Messages", "الرسايل")}</h3><span className="faint small">{L("with the team", "مع الفريق")}</span></div>
    <div className="thread__list" style={{ maxHeight: 360 }}>
      {msgs.length === 0 && <p className="muted small" style={{ padding: 12 }}>{L("Questions or comments? Write to the team here.", "عندك سؤال أو تعليق؟ اكتب للفريق هنا.")}</p>}
      {msgs.map((m, i) => <div key={i} className={"msg" + (m.author_type === "client" ? " msg--mine" : "")}>
        {m.author_type !== "client" && <Avatar name={m.author_name} size="sm" />}
        <div className="msg__b"><div className="msg__h"><b>{m.author_name}</b><span className="faint">{ago(m.created_at, lang)}</span></div><p className="msg__t">{m.body}</p>
          {m.attachments?.length > 0 && <div className="row">{m.attachments.map((a, j) => <AttachmentView key={j} a={a} />)}</div>}</div>
      </div>)}
    </div>
    <div className="composer">
      <textarea className="txt composer__in" rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder={L("Write a message…", "اكتب رسالة…")} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
      <div className="row row--between"><input className="inp" style={{ maxWidth: 200, height: 32 }} value={name} onChange={e => setName(e.target.value)} placeholder={L("Your name", "اسمك")} /><button className="btn btn--primary btn--sm" disabled={busy || !body.trim()} onClick={send}><Send />{L("Send", "إرسال")}</button></div>
    </div>
  </div>;
}
