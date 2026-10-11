// "Send for approval": the one screen most people need.
// Pick the client, name the work, drop the file, send on WhatsApp.
// Projects and scope are picked automatically (and created if missing).
import { CalendarDays, FileText, Film, Globe, Image as ImageIcon, Link2, PenLine, Send, Upload, UserPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { quickSend, reviewWhatsApp, saveClient, saveProject } from "../lib/actions";
import { reviewUrl } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { DeliverableKind } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { Field, Modal, useAction } from "./ui";

const KINDS: [DeliverableKind, string, string, ReactElement][] = [
  ["post", "Social post", "بوست", <ImageIcon key="i" />], ["design", "Design", "تصميم", <PenLine key="p" />], ["video", "Video", "فيديو", <Film key="f" />],
  ["web", "Web page", "صفحة ويب", <Globe key="g" />], ["copy", "Copy", "نص", <FileText key="t" />], ["other", "Other", "أخرى", <FileText key="o" />]
];

export function SendFlow({ onClose, clientId, publishDate, planOnly }: { onClose: () => void; clientId?: string; publishDate?: string; planOnly?: boolean }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const nav = useNavigate();
  const { busy, run } = useAction();
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: scope } = useRows("scope_items", { workspace_id: ws.id });
  const [cid, setCid] = useState(clientId || "");
  const [newClient, setNewClient] = useState(false);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [pid, setPid] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DeliverableKind>("post");
  const [sid, setSid] = useState<string>("auto");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(publishDate || "");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const clientProjects = useMemo(() => projects.filter(p => p.client_id === cid && p.status !== "done"), [projects, cid]);
  useEffect(() => { setPid(clientProjects[0]?.id || ""); setSid("auto"); }, [cid, clientProjects]);
  const projScope = scope.filter(s => s.project_id === pid);
  const autoScope = projScope.find(s => s.kind === kind) || null;
  const scopeId = sid === "auto" ? autoScope?.id || null : sid || null;
  const hasWork = !!file || !!link.trim();
  const client = clients.find(c => c.id === cid);

  const submit = (send: boolean) => run(async () => {
    if (link && !/^https?:\/\//i.test(link.trim())) throw new Error(L("Links must start with https://", "الرابط لازم يبدأ بـ https://"));
    let c = client;
    if (newClient) {
      if (!cName.trim()) throw new Error(L("Write the client's name", "اكتب اسم العميل"));
      c = await saveClient(ws, me, { name: cName.trim(), phone: cPhone.replace(/[^\d+]/g, ""), lang: "ar" });
    }
    if (!c) throw new Error(L("Choose a client", "اختار العميل"));
    let projectId = newClient ? "" : pid;
    if (!projectId) projectId = (await saveProject(ws, me, { client_id: c.id, name: L("General", "عام") })).id;
    const d = await quickSend(ws, me, { project_id: projectId, title: title.trim(), kind, scope_item_id: newClient ? null : scopeId, publish_date: date || null, file, link, note, draftOnly: !send });
    if (send && hasWork) { if (c.phone) window.open(reviewWhatsApp(ws, c, d), "_blank", "noopener"); else await navigator.clipboard?.writeText(reviewUrl(d.review_token)).catch(() => {}); }
    onClose();
    if (!planOnly) nav("/deliverables/" + d.id);
  }, send && hasWork ? L("Sent for approval", "اتبعتت للموافقة") : L("Saved", "اتحفظت"));

  const ready = (cid || (newClient && cName.trim())) && title.trim();
  return <Modal wide title={planOnly ? L("Plan a post", "خطّط لبوست") : L("Send for approval", "ابعت للموافقة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn" disabled={busy || !ready} onClick={() => submit(false)}>{hasWork ? L("Save, send later", "احفظ وابعت بعدين") : L("Save to calendar", "احفظ في التقويم")}</button>
    {hasWork && <button className="btn btn--wa" disabled={busy || !ready} onClick={() => submit(true)}><Send />{client && !client.phone && !newClient ? L("Send (copy link)", "ابعت (نسخ اللينك)") : L("Send on WhatsApp", "ابعت على واتساب")}</button>}
  </>}>
    <div className="form" style={{ gap: 18 }}>
      <div className="stack" style={{ gap: 8 }}>
        <div className="row"><span className="step-n">1</span><b>{L("Who is it for?", "لمين؟")}</b></div>
        {!newClient ? <div className="chips">
          {clients.map(c => <button key={c.id} type="button" className={"chip-btn" + (cid === c.id ? " on" : "")} onClick={() => setCid(c.id)}>{c.name}</button>)}
          <button type="button" className="chip-btn" onClick={() => { setNewClient(true); setCid(""); }}><UserPlus />{L("New client", "عميل جديد")}</button>
        </div> : <div className="form-row">
          <Field label={L("Client name", "اسم العميل")}><input className="inp" value={cName} onChange={e => setCName(e.target.value)} autoFocus /></Field>
          <Field label={L("WhatsApp number", "رقم الواتساب")}><input className="inp" value={cPhone} onChange={e => setCPhone(e.target.value)} dir="ltr" placeholder="+20 10…" /></Field>
        </div>}
        {!newClient && clientProjects.length > 1 && <select className="sel" value={pid} onChange={e => setPid(e.target.value)} style={{ maxWidth: 320 }}>{clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <div className="row"><span className="step-n">2</span><b>{L("What is it?", "إيه هو؟")}</b></div>
        <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder={L("e.g. Ramadan offer post", "مثال: بوست عرض رمضان")} />
        <div className="chips">{KINDS.map(([k, en, ar, ic]) => <button key={k} type="button" className={"chip-btn" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>{ic}{L(en, ar)}</button>)}</div>
        {!newClient && projScope.length > 0 && <div className="row small muted">{L("Counts toward", "بيتحسب من")}:
          <select className="sel" style={{ width: "auto", height: 30 }} value={sid} onChange={e => setSid(e.target.value)}>
            <option value="auto">{autoScope ? autoScope.title + L(" (auto)", " (تلقائي)") : L("Nothing (extra)", "ولا حاجة (إضافي)")}</option>
            {projScope.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            <option value="">{L("Nothing (extra)", "ولا حاجة (إضافي)")}</option>
          </select></div>}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <div className="row"><span className="step-n">3</span><b>{L("The work", "الشغل")}</b><span className="faint small">{planOnly ? L("optional, add it later", "اختياري، ضيفه بعدين") : ""}</span></div>
        <div className={"drop" + (drag ? " on" : "")} role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={e => { if (e.key === "Enter") input.current?.click(); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}>
          <Upload />
          <b>{file ? file.name : L("Drop the file here, or click to choose", "اسحب الملف هنا أو اضغط للاختيار")}</b>
          <p className="faint small">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : L("Image, video or PDF", "صورة أو فيديو أو PDF")}</p>
          <input ref={input} type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="form-row">
          <div className="row" style={{ flexWrap: "nowrap" }}><Link2 size={16} className="faint" /><input className="inp" value={link} onChange={e => setLink(e.target.value)} dir="ltr" placeholder={L("…or paste a link (Figma, Drive)", "…أو حط رابط (فيجما، درايف)")} /></div>
          <div className="row" style={{ flexWrap: "nowrap" }}><CalendarDays size={16} className="faint" /><input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} title={L("Publish date", "تاريخ النشر")} /></div>
        </div>
        {hasWork && <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder={L("A note for the client (optional)", "ملاحظة للعميل (اختياري)")} />}
      </div>
    </div>
  </Modal>;
}
