// Create/edit forms shared across pages.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeliverable, saveClient, saveProject, saveScopeItem, saveTask } from "../lib/actions";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Client, DeliverableKind, Period, Priority, Project, ScopeItem, Task, TaskStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { Field, KIND_LABEL, Modal, useAction } from "./ui";

const KINDS = Object.keys(KIND_LABEL) as DeliverableKind[];
export const PROJECT_COLORS = ["#2EE6A6", "#7C8CFF", "#FFB547", "#FF6B78", "#00CFFF", "#B49BFF", "#5BD16E", "#F28C38"];

export function DeliverableForm({ onClose, projectId }: { onClose: () => void; projectId?: string }) {
  const { L } = useI18n();
  const { ws, me, members } = useWorkspace();
  const nav = useNavigate();
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const [pid, setPid] = useState(projectId || "");
  const { rows: scope } = useRows("scope_items", pid ? { project_id: pid } : null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DeliverableKind>("design");
  const [sid, setSid] = useState("");
  const [due, setDue] = useState("");
  const [who, setWho] = useState(me?.id || "");
  const { busy, run } = useAction();
  const active = projects.filter(p => p.status !== "done");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const d = await createDeliverable(ws, me, { project_id: pid, title: title.trim(), kind, scope_item_id: sid || null, due_date: due || null, assignee_id: who || null });
      onClose();
      nav("/deliverables/" + d.id);
    });
  };
  return <Modal title={L("New deliverable", "تسليمة جديدة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose} type="button">{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="dform" disabled={busy || !pid}>{L("Create", "إنشاء")}</button>
  </>}>
    {active.length === 0 ? <p className="muted">{L("Create a project first, then add deliverables to it.", "أنشئ مشروعًا أولًا ثم أضف التسليمات له.")}</p> :
    <form id="dform" className="form" onSubmit={submit}>
      <Field label={L("Title", "العنوان")}><input className="inp" value={title} onChange={e => setTitle(e.target.value)} required autoFocus placeholder={L("e.g. Ramadan offer post", "مثال: بوست عرض رمضان")} /></Field>
      <div className="form-row">
        <Field label={L("Project", "المشروع")}><select className="sel" value={pid} onChange={e => { setPid(e.target.value); setSid(""); }} required>
          <option value="">{L("Choose…", "اختر…")}</option>
          {active.map(p => <option key={p.id} value={p.id}>{clients.find(c => c.id === p.client_id)?.name} · {p.name}</option>)}
        </select></Field>
        <Field label={L("Type", "النوع")}><select className="sel" value={kind} onChange={e => setKind(e.target.value as DeliverableKind)}>{KINDS.map(k => <option key={k} value={k}>{L(...KIND_LABEL[k])}</option>)}</select></Field>
      </div>
      <Field label={L("Counts against scope item", "يُحتسب من بند النطاق")} hint={L("Links the deliverable to the contract so revisions and quantities are tracked.", "يربط التسليمة بالعقد لتتبع التعديلات والكميات.")}>
        <select className="sel" value={sid} onChange={e => { setSid(e.target.value); const s = scope.find(x => x.id === e.target.value); if (s) setKind(s.kind); }}>
          <option value="">{L("Not in scope / ad-hoc", "خارج النطاق / مؤقت")}</option>
          {scope.map(s => <option key={s.id} value={s.id}>{s.title} · {s.quantity}{s.period === "month" ? L("/month", "/شهر") : ""} · {L(`${s.revisions_included} revisions`, `${s.revisions_included} تعديلات`)}</option>)}
        </select>
      </Field>
      <div className="form-row">
        <Field label={L("Due date", "تاريخ التسليم")}><input className="inp" type="date" value={due} onChange={e => setDue(e.target.value)} /></Field>
        <Field label={L("Owner", "المسؤول")}><select className="sel" value={who} onChange={e => setWho(e.target.value)}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
      </div>
    </form>}
  </Modal>;
}

export function ClientForm({ onClose, client }: { onClose: () => void; client?: Client }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const nav = useNavigate();
  const [v, setV] = useState<Partial<Client>>(client || { lang: "ar" });
  const { busy, run } = useAction();
  const set = (k: keyof Client) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => { const c = await saveClient(ws, me, { ...v, name: (v.name || "").trim(), phone: (v.phone || "").replace(/[^\d+]/g, "") }); onClose(); if (!client) nav("/clients/" + c.id); }, client ? L("Saved", "تم الحفظ") : undefined);
  };
  return <Modal title={client ? L("Edit client", "تعديل العميل") : L("New client", "عميل جديد")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose} type="button">{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="cform" disabled={busy}>{L("Save", "حفظ")}</button>
  </>}>
    <form id="cform" className="form" onSubmit={submit}>
      <Field label={L("Company / brand", "الشركة / العلامة")}><input className="inp" value={v.name || ""} onChange={set("name")} required autoFocus /></Field>
      <div className="form-row">
        <Field label={L("Contact person", "مسؤول التواصل")}><input className="inp" value={v.contact_name || ""} onChange={set("contact_name")} /></Field>
        <Field label={L("WhatsApp number", "رقم الواتساب")} hint={L("With country code, e.g. 2010…, 9665…", "بكود الدولة، مثال 2010… أو 9665…")}><input className="inp" value={v.phone || ""} onChange={set("phone")} dir="ltr" inputMode="tel" placeholder="+20 10…" /></Field>
      </div>
      <div className="form-row">
        <Field label={L("Email", "البريد")}><input className="inp" type="email" value={v.email || ""} onChange={set("email")} dir="ltr" /></Field>
        <Field label={L("Client's language", "لغة العميل")}><select className="sel" value={v.lang} onChange={set("lang")}><option value="ar">العربية</option><option value="en">English</option></select></Field>
      </div>
      <Field label={L("Notes", "ملاحظات")}><textarea className="txt" value={v.notes || ""} onChange={set("notes")} /></Field>
    </form>
  </Modal>;
}

export function ProjectForm({ onClose, project, clientId }: { onClose: () => void; project?: Project; clientId?: string }) {
  const { L } = useI18n();
  const { ws, me } = useWorkspace();
  const nav = useNavigate();
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const [v, setV] = useState<Partial<Project>>(project || { client_id: clientId || "", color: PROJECT_COLORS[0] });
  const { busy, run } = useAction();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => { const p = await saveProject(ws, me, { ...v, budget: v.budget ? Number(v.budget) : null }); onClose(); if (!project) nav("/projects/" + p.id + "?tab=scope"); }, project ? L("Saved", "تم الحفظ") : undefined);
  };
  return <Modal title={project ? L("Edit project", "تعديل المشروع") : L("New project", "مشروع جديد")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose} type="button">{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="pform" disabled={busy}>{L("Save", "حفظ")}</button>
  </>}>
    {clients.length === 0 ? <p className="muted">{L("Add a client first.", "أضف عميلًا أولًا.")}</p> :
    <form id="pform" className="form" onSubmit={submit}>
      <Field label={L("Project name", "اسم المشروع")}><input className="inp" value={v.name || ""} onChange={e => setV({ ...v, name: e.target.value })} required autoFocus placeholder={L("e.g. Monthly social retainer", "مثال: باقة سوشيال شهرية")} /></Field>
      <Field label={L("Client", "العميل")}><select className="sel" value={v.client_id} onChange={e => setV({ ...v, client_id: e.target.value })} required><option value="">{L("Choose…", "اختر…")}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <div className="form-row">
        <Field label={L("Start", "البداية")}><input className="inp" type="date" value={v.start_date || ""} onChange={e => setV({ ...v, start_date: e.target.value || null })} /></Field>
        <Field label={L("Deadline", "الموعد النهائي")}><input className="inp" type="date" value={v.due_date || ""} onChange={e => setV({ ...v, due_date: e.target.value || null })} /></Field>
      </div>
      <div className="form-row">
        <Field label={L(`Budget (${ws.currency})`, `الميزانية (${ws.currency})`)}><input className="inp" type="number" min="0" value={v.budget ?? ""} onChange={e => setV({ ...v, budget: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
        {project && <Field label={L("Status", "الحالة")}><select className="sel" value={v.status} onChange={e => setV({ ...v, status: e.target.value as Project["status"] })}><option value="active">{L("Active", "نشط")}</option><option value="paused">{L("Paused", "متوقف")}</option><option value="done">{L("Done", "منتهي")}</option></select></Field>}
      </div>
      <Field label={L("Color", "اللون")}><div className="row">{PROJECT_COLORS.map(c => <button type="button" key={c} onClick={() => setV({ ...v, color: c })} aria-label={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, outline: v.color === c ? "2px solid var(--text)" : "none", outlineOffset: 2 }} />)}</div></Field>
    </form>}
  </Modal>;
}

export function ScopeForm({ onClose, projectId, item }: { onClose: () => void; projectId: string; item?: ScopeItem }) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const [v, setV] = useState<Partial<ScopeItem>>(item || { project_id: projectId, kind: "design", quantity: 4, period: "month", revisions_included: 2, extra_price: 0 });
  const { busy, run } = useAction();
  const submit = (e: React.FormEvent) => { e.preventDefault(); run(async () => { await saveScopeItem(ws, { ...v, project_id: projectId }); onClose(); }, L("Scope saved", "تم حفظ النطاق")); };
  return <Modal title={item ? L("Edit scope item", "تعديل بند النطاق") : L("Add scope item", "إضافة بند للنطاق")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose} type="button">{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="sform" disabled={busy}>{L("Save", "حفظ")}</button>
  </>}>
    <form id="sform" className="form" onSubmit={submit}>
      <p className="muted small">{L("Write the contract in a form HQ can enforce: what you deliver, how many, and how many revision rounds are included.", "اكتب العقد بشكل يقدر HQ يطبّقه: بتسلّم إيه، وكام، وكام جولة تعديل متضمنة.")}</p>
      <div className="form-row">
        <Field label={L("Deliverable", "التسليمة")}><input className="inp" value={v.title || ""} onChange={e => setV({ ...v, title: e.target.value })} required autoFocus placeholder={L("e.g. Social posts", "مثال: بوستات سوشيال")} /></Field>
        <Field label={L("Type", "النوع")}><select className="sel" value={v.kind} onChange={e => setV({ ...v, kind: e.target.value as DeliverableKind })}>{KINDS.map(k => <option key={k} value={k}>{L(...KIND_LABEL[k])}</option>)}</select></Field>
      </div>
      <div className="form-row">
        <Field label={L("Quantity", "الكمية")}><input className="inp" type="number" min="0" value={v.quantity ?? 0} onChange={e => setV({ ...v, quantity: Number(e.target.value) })} /></Field>
        <Field label={L("Per", "لكل")}><select className="sel" value={v.period} onChange={e => setV({ ...v, period: e.target.value as Period })}><option value="month">{L("Month", "شهر")}</option><option value="project">{L("Whole project", "المشروع كله")}</option></select></Field>
      </div>
      <div className="form-row">
        <Field label={L("Revision rounds included", "جولات التعديل المتضمنة")}><input className="inp" type="number" min="0" value={v.revisions_included ?? 0} onChange={e => setV({ ...v, revisions_included: Number(e.target.value) })} /></Field>
        <Field label={L(`Price of an extra one (${ws.currency})`, `سعر الإضافي (${ws.currency})`)}><input className="inp" type="number" min="0" value={v.extra_price ?? 0} onChange={e => setV({ ...v, extra_price: Number(e.target.value) })} /></Field>
      </div>
    </form>
  </Modal>;
}

export function TaskForm({ onClose, task, projectId, status, deliverableId }: { onClose: () => void; task?: Task; projectId?: string; status?: TaskStatus; deliverableId?: string }) {
  const { L } = useI18n();
  const { ws, me, members } = useWorkspace();
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const [v, setV] = useState<Partial<Task>>(task || { project_id: projectId || null, status: status || "todo", priority: "medium", assignee_id: me?.id || null, deliverable_id: deliverableId || null });
  const { busy, run } = useAction();
  const submit = (e: React.FormEvent) => { e.preventDefault(); run(async () => { await saveTask(ws, me, { ...v, title: (v.title || "").trim() }); onClose(); }, task ? L("Saved", "تم الحفظ") : L("Task created", "تم إنشاء المهمة")); };
  return <Modal title={task ? L("Edit task", "تعديل المهمة") : L("New task", "مهمة جديدة")} onClose={onClose} footer={<>
    <button className="btn" onClick={onClose} type="button">{L("Cancel", "إلغاء")}</button>
    <button className="btn btn--primary" form="tform" disabled={busy}>{L("Save", "حفظ")}</button>
  </>}>
    <form id="tform" className="form" onSubmit={submit}>
      <Field label={L("Task", "المهمة")}><input className="inp" value={v.title || ""} onChange={e => setV({ ...v, title: e.target.value })} required autoFocus /></Field>
      <Field label={L("Details", "التفاصيل")}><textarea className="txt" value={v.description || ""} onChange={e => setV({ ...v, description: e.target.value })} /></Field>
      <div className="form-row">
        <Field label={L("Project", "المشروع")}><select className="sel" value={v.project_id || ""} onChange={e => setV({ ...v, project_id: e.target.value || null })}><option value="">{L("No project", "بدون مشروع")}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label={L("Assignee", "المسؤول")}><select className="sel" value={v.assignee_id || ""} onChange={e => setV({ ...v, assignee_id: e.target.value || null })}><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
      </div>
      <div className="form-row">
        <Field label={L("Priority", "الأولوية")}><select className="sel" value={v.priority} onChange={e => setV({ ...v, priority: e.target.value as Priority })}><option value="low">{L("Low", "منخفضة")}</option><option value="medium">{L("Medium", "متوسطة")}</option><option value="high">{L("High", "عالية")}</option><option value="urgent">{L("Urgent", "عاجلة")}</option></select></Field>
        <Field label={L("Due", "الاستحقاق")}><input className="inp" type="date" value={v.due_date || ""} onChange={e => setV({ ...v, due_date: e.target.value || null })} /></Field>
      </div>
      <Field label={L("Status", "الحالة")}><select className="sel" value={v.status} onChange={e => setV({ ...v, status: e.target.value as TaskStatus })}><option value="todo">{L("To do", "للتنفيذ")}</option><option value="doing">{L("In progress", "جارٍ العمل")}</option><option value="review">{L("Internal review", "مراجعة داخلية")}</option><option value="done">{L("Done", "تم")}</option></select></Field>
    </form>
  </Modal>;
}
