import { ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, FileSignature, Link2, MessageCircle, MoreHorizontal, PencilRuler, Plus, Send, ShieldAlert, Sparkles, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TaskForm } from "../components/Forms";
import { isImage, PinImage } from "../components/Pins";
import { Avatar, Confirm, Empty, Field, KIND_LABEL, MemberChip, Modal, Popover, Preview, Prio, StatusPill, useAction, useToast } from "../components/ui";
import { addVersion, log, recordApproval, reminderWhatsApp, reviewWhatsApp, sendForReview, setFeedbackClass } from "../lib/actions";
import { api } from "../lib/api";
import { ago, date, reviewUrl } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { daysBetween, fbText, overRevisionLimit } from "../lib/logic";
import type { Deliverable, Feedback } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { ChangeOrderForm } from "./ChangeOrders";

export function DeliverableDetail() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const { ws, me, members } = useWorkspace();
  const nav = useNavigate();
  const toast = useToast();
  const { run, busy } = useAction();
  const { rows: ds, loading } = useRows("deliverables", { id } as Partial<Deliverable>);
  const d = ds[0];
  const { rows: versions } = useRows("versions", { deliverable_id: id });
  const { rows: feedback } = useRows("feedback", { deliverable_id: id });
  const { rows: comments } = useRows("comments", { entity_id: id });
  const { rows: tasks } = useRows("tasks", { deliverable_id: id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: scope } = useRows("scope_items", d ? { project_id: d.project_id } : null);
  const [pick, setPick] = useState<number | null>(null);
  const [upload, setUpload] = useState(false);
  const [coFrom, setCoFrom] = useState<Feedback | "manual" | null>(null);
  const [record, setRecord] = useState(false);
  const [del, setDel] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [note, setNote] = useState("");

  const sorted = useMemo(() => [...versions].sort((a, b) => b.number - a.number), [versions]);
  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!d) return <div className="page"><Empty icon={<ShieldAlert />} title={L("Deliverable not found", "التسليمة غير موجودة")} action={<Link className="btn" to="/approvals">{L("Back to approvals", "رجوع للموافقات")}</Link>} /></div>;

  const project = projects.find(p => p.id === d.project_id);
  const client = clients.find(c => c.id === project?.client_id);
  const item = scope.find(s => s.id === d.scope_item_id) || null;
  const shown = sorted.find(v => v.number === (pick ?? d.current_version)) || sorted[0];
  const fbSorted = [...feedback].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const openNewRequests = feedback.filter(f => f.kind === "changes" && !f.resolved && f.classification === "new_request");
  const over = overRevisionLimit(d, item);
  const link = reviewUrl(d.review_token);

  const send = () => run(async () => {
    const upd = await sendForReview(ws, me, d);
    if (client?.phone) window.open(reviewWhatsApp(ws, client, upd), "_blank", "noopener");
    else { await navigator.clipboard?.writeText(link).catch(() => {}); toast(L("Review link copied. Add the client's WhatsApp number to send it in one tap.", "تم نسخ لينك المراجعة. أضف رقم واتساب العميل للإرسال بضغطة.")); }
  }, L("Marked as sent for review", "اتعلّمت إنها اتبعتت للمراجعة"));
  const copy = () => navigator.clipboard?.writeText(link).then(() => toast(L("Review link copied", "تم نسخ لينك المراجعة")));
  const addComment = (e: React.FormEvent) => { e.preventDefault(); if (!note.trim()) return; run(async () => { await api.insert("comments", { workspace_id: ws.id, entity_type: "deliverable", entity_id: d.id, author_name: me.name, body: note.trim() }); setNote(""); }); };

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t">
        <div className="crumbs"><Link to="/approvals" className="row" style={{ gap: 4 }}><ArrowLeft size={14} className="flip-rtl" />{L("Approvals", "الموافقات")}</Link><span>/</span><Link to={"/projects/" + d.project_id}>{project?.name}</Link></div>
        <h1>{d.title}</h1>
        <div className="row"><StatusPill s={d.status} /><span className="tag">{L(...KIND_LABEL[d.kind])}</span><span className="faint small">{client?.name} · v{d.current_version}{d.due_date ? " · " + L("due ", "موعد ") + date(d.due_date, lang) : ""}</span></div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => setUpload(true)}><Upload />{L("Upload new version", "رفع نسخة جديدة")}</button>
        {(d.status === "draft" || d.status === "changes") && <button className="btn btn--wa" onClick={send} disabled={busy || d.current_version < 1}><Send />{L("Send to client on WhatsApp", "ابعت للعميل على واتساب")}</button>}
        {d.status === "in_review" && client?.phone && <a className="btn btn--wa" href={reminderWhatsApp(ws, client, d)} target="_blank" rel="noopener"><MessageCircle />{L("Send reminder", "ابعت تذكير")}</a>}
        <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("More", "المزيد")}><MoreHorizontal /></button>}>{close => <>
          <button onClick={() => { close(); copy(); }}><Copy />{L("Copy review link", "نسخ لينك المراجعة")}</button>
          <a href={link} target="_blank" rel="noopener" onClick={close}><ExternalLink />{L("Open client view", "افتح صفحة العميل")}</a>
          {d.status !== "approved" && d.current_version > 0 && <button onClick={() => { close(); setRecord(true); }}><CheckCircle2 />{L("Record approval received elsewhere", "سجّل موافقة اتاخدت برا")}</button>}
          <button onClick={() => { close(); setCoFrom("manual"); }}><FileSignature />{L("Bill as extra work", "احسبها شغل إضافي")}</button>
          <hr />
          <button onClick={() => { close(); setDel(true); }} style={{ color: "var(--bad)" }}><Trash2 />{L("Delete deliverable", "حذف التسليمة")}</button>
        </>}</Popover>
      </div>
    </div>

    {d.current_version === 0 && <div className="callout callout--info"><Upload /><div><b>{L("Upload the first version", "ارفع أول نسخة")}</b><p className="small muted">{L("Add a file (image, video, PDF) or a link (Figma, Drive, staging site). Then send it to the client on WhatsApp.", "أضف ملفًا (صورة، فيديو، PDF) أو رابطًا (فيجما، درايف، موقع تجريبي). بعدها ابعته للعميل على واتساب.")}</p><button className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={() => setUpload(true)}><Upload />{L("Upload", "رفع")}</button></div></div>}
    {openNewRequests.length > 0 && <div className="callout callout--violet"><Sparkles /><div style={{ flex: 1 }}><b>{L("This looks like new work, not a revision", "ده شكله شغل جديد، مش تعديل")}</b><p className="small">“{fbText(openNewRequests[openNewRequests.length - 1])}”</p><div className="row" style={{ marginTop: 8 }}><button className="btn btn--primary btn--sm" onClick={() => setCoFrom(openNewRequests[openNewRequests.length - 1])}><FileSignature />{L("Bill it as extra work", "احسبها شغل إضافي")}</button><button className="btn btn--sm" onClick={() => run(() => setFeedbackClass(openNewRequests[openNewRequests.length - 1], "revision"))}>{L("It's a normal revision", "ده تعديل عادي")}</button></div></div></div>}
    {over && d.status !== "approved" && <div className="callout callout--warn"><ShieldAlert /><div style={{ flex: 1 }}><b>{L(`Revision ${d.revision_count} of ${item!.revisions_included} included`, `التعديل رقم ${d.revision_count} من ${item!.revisions_included} متضمنة`)}</b><p className="small muted">{L("The client has used all included revision rounds. Further rounds can be billed.", "العميل استخدم كل جولات التعديل المتضمنة. الجولات الإضافية ممكن تتحاسب.")}</p><button className="btn btn--sm" style={{ marginTop: 8 }} onClick={() => setCoFrom("manual")}><FileSignature />{L("Bill extra revision", "احسب تعديل إضافي")}</button></div></div>}

    <div className="split">
      <div className="stack" style={{ gap: 16 }}>
        {sorted.length > 0 && <div className="tabs">{sorted.map(v => <button key={v.id} className={(shown?.number === v.number) ? "on" : ""} onClick={() => setPick(v.number)}>v{v.number}{v.number === d.current_version && <span className="count">{L("latest", "الأحدث")}</span>}</button>)}</div>}
        {shown ? <>
          {isImage(shown) ? <PinImage v={shown} pins={feedback.filter(f => f.version_number === shown.number && f.pins && f.pins.length).flatMap(f => f.pins)} color="var(--warn)" /> : <Preview v={shown} kind={d.kind} />}
          <div className="row row--between small faint"><span>{shown.created_by} · {ago(shown.created_at, lang)}{shown.note ? " · " + shown.note : ""}</span>{shown.link_url && <a className="row" style={{ gap: 4, color: "var(--accent)" }} href={shown.link_url} target="_blank" rel="noopener noreferrer"><Link2 size={14} />{shown.link_url.replace(/^https?:\/\//, "").slice(0, 40)}</a>}</div>
        </> : <div className="card"><Empty icon={<Upload />} title={L("No versions yet", "لا توجد نسخ بعد")} /></div>}

        <div className="card">
          <div className="card__h"><h2>{L("Client feedback", "ملاحظات العميل")}</h2><span className="faint small">{L("from the review link", "من لينك المراجعة")}</span></div>
          <div className="card__b">{fbSorted.length === 0 ? <p className="muted small">{L("No feedback yet. When the client approves or asks for changes, it appears here.", "لا ملاحظات بعد. لما العميل يوافق أو يطلب تعديل، هيظهر هنا.")}</p> :
            <div className="tl">{fbSorted.map(f => <div key={f.id} className="tl__i">
              <span className={"tl__ico " + (f.kind === "approved" ? "tl__ico--ok" : f.classification === "new_request" ? "tl__ico--violet" : "tl__ico--warn")}>{f.kind === "approved" ? <Check /> : f.classification === "new_request" ? <Sparkles /> : <PencilRuler />}</span>
              <div>
                <div className="row" style={{ gap: 6 }}><b>{f.author_name}</b><span className="faint small">{f.kind === "approved" ? L(`approved v${f.version_number}`, `وافق على v${f.version_number}`) : L(`requested changes on v${f.version_number}`, `طلب تعديل على v${f.version_number}`)} · {ago(f.created_at, lang)}</span>
                  {f.kind === "changes" && <span className={"pill pill--plain " + (f.classification === "new_request" ? "pill--violet" : "")}>{f.classification === "new_request" ? L("New request", "طلب جديد") : L("Revision", "تعديل")}</span>}
                  {f.kind === "changes" && f.resolved && <span className="pill pill--plain pill--ok">{L("Addressed", "اتنفّذ")}</span>}
                </div>
                {f.comment && <div className="quote">{f.comment}</div>}
                {f.pins && f.pins.length > 0 && <ol className="pinlist" style={{ marginTop: 6 }}>{f.pins.map((p, i) => <li key={i}><span className="pin pin--static" style={{ background: "var(--warn)" }}>{i + 1}</span><span>{p.text}</span></li>)}</ol>}
                {f.kind === "changes" && !f.resolved && <div className="row" style={{ marginTop: 6 }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => run(() => setFeedbackClass(f, f.classification === "new_request" ? "revision" : "new_request"))}>{f.classification === "new_request" ? L("Mark as revision", "اعتبره تعديل") : L("Mark as new request", "اعتبره طلب جديد")}</button>
                  {f.classification === "new_request" && <button className="btn btn--sm" onClick={() => setCoFrom(f)}><FileSignature />{L("Extra work", "شغل إضافي")}</button>}
                  <button className="btn btn--ghost btn--sm" onClick={() => setNewTask(true)}><Plus />{L("Task", "مهمة")}</button>
                </div>}
              </div>
            </div>)}</div>}
          </div>
        </div>
      </div>

      <div className="stack" style={{ gap: 16 }}>
        <div className="card card--pad stack">
          <h3>{L("Details", "التفاصيل")}</h3>
          <div className="row row--between small"><span className="muted">{L("Client", "العميل")}</span>{client ? <Link to={"/clients/" + client.id}><b>{client.name}</b></Link> : "—"}</div>
          <div className="row row--between small"><span className="muted">{L("Owner", "المسؤول")}</span>
            <select className="sel" style={{ width: "auto", height: 30 }} value={d.assignee_id || ""} onChange={e => run(() => api.update("deliverables", d.id, { assignee_id: e.target.value || null }))}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="row row--between small"><span className="muted">{L("Publish date", "تاريخ النشر")}</span><input className="inp" type="date" style={{ width: "auto", height: 30 }} value={d.publish_date || ""} onChange={e => run(() => api.update("deliverables", d.id, { publish_date: e.target.value || null }))} /></div>
          <div className="row row--between small"><span className="muted">{L("Due date", "الموعد")}</span><input className="inp" type="date" style={{ width: "auto", height: 30 }} value={d.due_date || ""} onChange={e => run(() => api.update("deliverables", d.id, { due_date: e.target.value || null }))} /></div>
          {d.sent_at && <div className="row row--between small"><span className="muted">{L("Sent", "اتبعتت")}</span><span>{ago(d.sent_at, lang)}{d.status === "in_review" ? L(` · ${daysBetween(d.sent_at)}d waiting`, ` · منتظر ${daysBetween(d.sent_at)} يوم`) : ""}</span></div>}
          {d.approved_at && <div className="row row--between small"><span className="muted">{L("Approved", "اتوافق")}</span><span>{date(d.approved_at, lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>}
          <div className="stack" style={{ gap: 6 }}>
            <span className="muted small">{L("Client review link", "لينك مراجعة العميل")}</span>
            <div className="row" style={{ flexWrap: "nowrap" }}><input className="inp mono" readOnly value={link} dir="ltr" onFocus={e => e.target.select()} /><button className="icon-btn" onClick={copy} aria-label={L("Copy", "نسخ")}><Copy /></button></div>
          </div>
        </div>

        <div className="card card--pad stack">
          <h3>{L("What's included", "المتفق عليه")}</h3>
          {item ? <>
            <div className="row row--between"><span>{item.title}</span><span className="faint small">{item.quantity}{item.period === "month" ? L("/month", "/شهر") : ""}</span></div>
            <div className="stack" style={{ gap: 6 }}>
              <div className="row row--between small"><span className="muted">{L("Revision rounds used", "جولات التعديل المستخدمة")}</span><b style={{ color: over ? "var(--bad)" : undefined }}>{d.revision_count} / {item.revisions_included}</b></div>
              <div className={"bar" + (over ? " bar--over" : "")}><i style={{ width: Math.min(100, item.revisions_included ? (d.revision_count / item.revisions_included) * 100 : d.revision_count ? 100 : 0) + "%" }} /></div>
            </div>
          </> : <>
            <p className="muted small">{L("Not linked to the agreement, so revisions aren't counted.", "مش مربوطة بالاتفاق، فالتعديلات مش بتتعد.")}</p>
            {scope.length > 0 && <select className="sel" value="" onChange={e => e.target.value && run(() => api.update("deliverables", d.id, { scope_item_id: e.target.value }), L("Linked to the agreement", "اتربطت بالاتفاق"))}><option value="">{L("Link to the agreement…", "اربطها بالاتفاق…")}</option>{scope.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>}
          </>}
        </div>

        <div className="card">
          <div className="card__h"><h3>{L("Tasks", "المهام")}</h3><button className="btn btn--ghost btn--sm" onClick={() => setNewTask(true)}><Plus />{L("Add", "إضافة")}</button></div>
          {tasks.length === 0 ? <p className="muted small" style={{ padding: 16 }}>{L("No tasks linked.", "لا توجد مهام مرتبطة.")}</p> :
            <div className="list">{tasks.map(t => <Link key={t.id} to={"/tasks?open=" + t.id} className="li"><span className="li__main"><span className="li__t" style={{ textDecoration: t.status === "done" ? "line-through" : undefined }}>{t.title}</span><span className="li__s"><MemberChip m={members.find(m => m.id === t.assignee_id)} /></span></span><Prio p={t.priority} /></Link>)}</div>}
        </div>

        <div className="card">
          <div className="card__h"><h3>{L("Internal notes", "ملاحظات داخلية")}</h3><span className="faint small">{L("team only", "للفريق فقط")}</span></div>
          <div className="card__b stack">
            {comments.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(c => <div key={c.id} className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}><Avatar name={c.author_name} size="sm" /><div><b className="small">{c.author_name}</b> <span className="faint small">{ago(c.created_at, lang)}</span><p style={{ whiteSpace: "pre-wrap" }}>{c.body}</p></div></div>)}
            <form onSubmit={addComment} className="row" style={{ flexWrap: "nowrap" }}><input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder={L("Write a note for the team…", "اكتب ملاحظة للفريق…")} /><button className="btn" disabled={!note.trim()}>{L("Post", "نشر")}</button></form>
          </div>
        </div>
      </div>
    </div>

    {upload && <UploadVersion d={d} onClose={() => setUpload(false)} />}
    {coFrom && project && <ChangeOrderForm onClose={() => setCoFrom(null)} preset={{ project_id: project.id, deliverable_id: d.id, feedback_id: coFrom === "manual" ? null : coFrom.id,
      title: coFrom === "manual" ? (over ? L(`Extra revision: ${d.title}`, `تعديل إضافي: ${d.title}`) : "") : fbText(coFrom).slice(0, 80),
      description: coFrom === "manual" ? "" : L(`Requested by ${coFrom.author_name} on ${d.title}: “${fbText(coFrom)}”`, `طلب ${coFrom.author_name} على ${d.title}: «${fbText(coFrom)}»`),
      amount: item?.extra_price || 0 }} />}
    {record && <RecordApproval d={d} defaultName={client?.contact_name || ""} onClose={() => setRecord(false)} />}
    {newTask && <TaskForm onClose={() => setNewTask(false)} projectId={d.project_id} deliverableId={d.id} />}
    {del && <Confirm danger title={L("Delete this deliverable?", "حذف هذه التسليمة؟")} text={L("Its versions, feedback and review link will be deleted. This can't be undone.", "هتتحذف النسخ والملاحظات ولينك المراجعة. لا يمكن التراجع.")} yes={L("Delete", "حذف")} onClose={() => setDel(false)} onYes={() => run(async () => { await api.remove("deliverables", d.id); await log(ws, me.name, "deliverable.deleted", `deleted “${d.title}”`, d.project_id); nav("/approvals"); })} />}
  </div>;
}

function UploadVersion({ d, onClose }: { d: Deliverable; onClose: () => void }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const { busy, run } = useAction();
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (!file && !link.trim()) throw new Error(L("Add a file or a link", "أضف ملفًا أو رابطًا"));
      if (link && !/^https?:\/\//i.test(link.trim())) throw new Error(L("Links must start with https://", "الرابط لازم يبدأ بـ https://"));
      await addVersion(ws, me, d, { file, link, note });
      onClose();
    }, L(`Version ${d.current_version + 1} uploaded`, `تم رفع النسخة ${d.current_version + 1}`));
  };
  return <Modal title={L(`Upload version ${d.current_version + 1}`, `رفع النسخة ${d.current_version + 1}`)} onClose={onClose} footer={<>
    <button className="btn" type="button" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="vform" disabled={busy}>{busy ? <span className="spinner" /> : <Upload />}{L("Upload", "رفع")}</button>
  </>}>
    <form id="vform" className="form" onSubmit={submit}>
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
        onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") input.current?.click(); }}
        style={{ border: "2px dashed " + (drag ? "var(--accent)" : "var(--line-2)"), borderRadius: 14, padding: 28, textAlign: "center", cursor: "pointer", background: drag ? "var(--accent-soft)" : "var(--sunken)" }}>
        <Upload style={{ margin: "0 auto 8px" }} />
        <b>{file ? file.name : L("Drop a file here, or click to choose", "اسحب ملفًا هنا، أو اضغط للاختيار")}</b>
        <p className="faint small">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : L("Images, video, PDF or any file", "صور أو فيديو أو PDF أو أي ملف")}</p>
        <input ref={input} type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>
      <Field label={L("Or a link (Figma, Google Drive, staging site…)", "أو رابط (فيجما، جوجل درايف، موقع تجريبي…)")}><input className="inp" value={link} onChange={e => setLink(e.target.value)} dir="ltr" placeholder="https://" /></Field>
      <Field label={L("What changed? (the client sees this)", "إيه اللي اتغيّر؟ (العميل هيشوفها)")}><input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder={L("e.g. Logo bigger, darker background", "مثال: كبّرنا اللوجو وغمّقنا الخلفية")} /></Field>
    </form>
  </Modal>;
}

function RecordApproval({ d, defaultName, onClose }: { d: Deliverable; defaultName: string; onClose: () => void }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const { busy, run } = useAction();
  const [who, setWho] = useState(defaultName);
  const [note, setNote] = useState("");
  return <Modal title={L("Record an approval", "تسجيل موافقة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose}>{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" disabled={busy || !who.trim()} onClick={() => run(async () => { await recordApproval(ws, me, d, who.trim(), note.trim()); onClose(); }, L("Approval recorded in the history", "اتسجلت الموافقة في السجل"))}>{L("Record approval", "تسجيل الموافقة")}</button>
  </>}>
    <div className="form">
      <p className="muted small">{L("For approvals given on a call, in a meeting or by email. It is logged in the history with your name.", "للموافقات اللي اتاخدت في مكالمة أو اجتماع أو إيميل. هتتسجل في السجل باسمك.")}</p>
      <Field label={L("Approved by", "وافق عليها")}><input className="inp" value={who} onChange={e => setWho(e.target.value)} autoFocus /></Field>
      <Field label={L("How / note", "إزاي / ملاحظة")}><input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder={L("e.g. Approved on a call, 3 pm", "مثال: وافق في مكالمة الساعة 3")} /></Field>
    </div>
  </Modal>;
}
