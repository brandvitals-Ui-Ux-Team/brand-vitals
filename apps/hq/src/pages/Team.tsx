import { Copy, Mail, MessageCircle, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, Confirm, Empty, Field, Modal, useAction, useToast } from "../components/ui";
import { inviteMember } from "../lib/actions";
import { api } from "../lib/api";
import { ago, inviteUrl } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Invite, Member, Role } from "../lib/types";
import { useWorkspace } from "../lib/ws";

export function Team() {
  const { L, lang } = useI18n();
  const { ws, me, members } = useWorkspace();
  const toast = useToast();
  const { run, busy } = useAction();
  const { rows: invites } = useRows("invites", { workspace_id: ws.id });
  const { rows: tasks } = useRows("tasks", { workspace_id: ws.id });
  const { rows: deliverables } = useRows("deliverables", { workspace_id: ws.id });
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [created, setCreated] = useState<Invite | null>(null);
  const [remove, setRemove] = useState<Member | null>(null);
  const isAdmin = me?.role === "owner" || me?.role === "admin";
  const pending = invites.filter(i => !i.accepted_at);
  const roleLabel = (r: Role) => r === "owner" ? L("Owner", "مالك") : r === "admin" ? L("Admin", "مسؤول") : L("Member", "عضو");
  const msg = (i: Invite) => L(`Join ${ws.name} on Vitals HQ: ${inviteUrl(i.token)}`, `انضم لـ ${ws.name} على Vitals HQ: ${inviteUrl(i.token)}`);

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Team", "الفريق")}</h1><p className="muted">{L("Pricing is per client workspace, so add your whole team.", "التسعير لكل عميل، فأضف فريقك كله.")}</p></div>
      {isAdmin && <button className="btn btn--primary" onClick={() => { setOpen(true); setCreated(null); setEmail(""); }}><Plus />{L("Invite teammate", "ادعُ زميلًا")}</button>}
    </div>
    <div className="card">
      <div className="table-wrap"><table className="table">
        <thead><tr><th>{L("Member", "العضو")}</th><th>{L("Role", "الدور")}</th><th className="hide-sm">{L("Open tasks", "مهام مفتوحة")}</th><th className="hide-sm">{L("Deliverables", "تسليمات")}</th><th /></tr></thead>
        <tbody>{members.map(m => <tr key={m.id}>
          <td><div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={m.name} /><div><b>{m.name}</b>{m.id === me?.id && <span className="faint small"> ({L("you", "أنت")})</span>}<div className="faint small">{m.email}</div></div></div></td>
          <td>{isAdmin && m.role !== "owner" && m.id !== me?.id ? <select className="sel" style={{ width: "auto", height: 30 }} value={m.role} onChange={e => run(() => api.update("members", m.id, { role: e.target.value as Role }), L("Role updated", "تم تحديث الدور"))}><option value="admin">{roleLabel("admin")}</option><option value="member">{roleLabel("member")}</option></select> : <span className="pill pill--plain">{roleLabel(m.role)}</span>}</td>
          <td className="hide-sm">{tasks.filter(t => t.assignee_id === m.id && t.status !== "done").length}</td>
          <td className="hide-sm">{deliverables.filter(d => d.assignee_id === m.id && d.status !== "approved").length}</td>
          <td>{isAdmin && m.role !== "owner" && m.id !== me?.id && <button className="icon-btn" onClick={() => setRemove(m)} aria-label={L("Remove", "إزالة")}><Trash2 /></button>}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
    {isAdmin && <div className="card">
      <div className="card__h"><h2>{L("Pending invites", "دعوات معلّقة")}</h2></div>
      {pending.length === 0 ? <Empty icon={<Users />} title={L("No pending invites", "لا توجد دعوات معلّقة")} /> :
        <div className="list">{pending.map(i => <div key={i.id} className="li"><Mail size={18} className="faint" /><span className="li__main"><span className="li__t">{i.email}</span><span className="li__s">{roleLabel(i.role)} · {ago(i.created_at, lang)}</span></span>
          <button className="btn btn--sm" onClick={() => navigator.clipboard?.writeText(inviteUrl(i.token)).then(() => toast(L("Invite link copied", "تم نسخ لينك الدعوة")))}><Copy />{L("Copy link", "نسخ الرابط")}</button>
          <button className="icon-btn" onClick={() => run(() => api.remove("invites", i.id))} aria-label={L("Revoke", "إلغاء")}><Trash2 /></button></div>)}</div>}
    </div>}

    {open && <Modal title={L("Invite a teammate", "ادعُ زميلًا")} onClose={() => setOpen(false)} footer={created ? <button className="btn btn--primary" onClick={() => setOpen(false)}>{L("Done", "تم")}</button> : <>
      <button className="btn" onClick={() => setOpen(false)}>{L("Cancel", "إلغاء")}</button>
      <button className="btn btn--primary" disabled={busy || !/^\S+@\S+\.\S+$/.test(email)} onClick={() => run(async () => setCreated(await inviteMember(ws, me, email, role)))}>{L("Create invite", "إنشاء دعوة")}</button>
    </>}>
      {created ? <div className="form">
        <p className="muted">{L("Send this link to your teammate. They sign up with any email and join your workspace.", "ابعت اللينك ده لزميلك. هيسجّل بأي إيميل وينضم لمساحة عملك.")}</p>
        <div className="row" style={{ flexWrap: "nowrap" }}><input className="inp mono" readOnly value={inviteUrl(created.token)} dir="ltr" onFocus={e => e.target.select()} /><button className="icon-btn" onClick={() => navigator.clipboard?.writeText(inviteUrl(created.token)).then(() => toast(L("Copied", "تم النسخ")))}><Copy /></button></div>
        <div className="row"><a className="btn btn--wa" href={"https://wa.me/?text=" + encodeURIComponent(msg(created))} target="_blank" rel="noopener"><MessageCircle />WhatsApp</a><a className="btn" href={`mailto:${created.email}?subject=${encodeURIComponent("Vitals HQ")}&body=${encodeURIComponent(msg(created))}`}><Mail />{L("Email", "بريد")}</a></div>
      </div> : <div className="form">
        <Field label={L("Email", "البريد")}><input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" autoFocus /></Field>
        <Field label={L("Role", "الدور")}><select className="sel" value={role} onChange={e => setRole(e.target.value as "admin" | "member")}><option value="member">{L("Member: works on projects", "عضو: يشتغل على المشاريع")}</option><option value="admin">{L("Admin: also manages team and settings", "مسؤول: يدير الفريق والإعدادات كمان")}</option></select></Field>
      </div>}
    </Modal>}
    {remove && <Confirm danger title={L("Remove from workspace?", "إزالة من مساحة العمل؟")} text={remove.name} yes={L("Remove", "إزالة")} onClose={() => setRemove(null)} onYes={() => run(() => api.remove("members", remove.id), L("Removed", "تمت الإزالة"))} />}
  </div>;
}
