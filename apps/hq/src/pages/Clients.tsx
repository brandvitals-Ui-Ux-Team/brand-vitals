import { ArrowLeft, CalendarDays, Copy, ExternalLink, LayoutGrid, Mail, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Trash2, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ClientForm, ProjectForm } from "../components/Forms";
import { SendFlow } from "../components/SendFlow";
import { Thread } from "../components/Thread";
import { Avatar, Confirm, COPill, Empty, Popover, StatusPill, useAction, useToast } from "../components/ui";
import { ChannelButton } from "../components/ChannelButton";
import { reminderMsg } from "../lib/channels";
import { api } from "../lib/api";
import { date, money, portalUrl, waLink } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Client } from "../lib/types";
import { useWorkspace } from "../lib/ws";

export function Clients() {
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState("");
  const f = { workspace_id: ws.id };
  const { rows: clients } = useRows("clients", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: cos } = useRows("change_orders", f);
  const list = clients.filter(c => !q || (c.name + c.contact_name).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Clients", "العملاء")}</h1><p className="muted">{L("Clients never need an account. They review and approve from WhatsApp links.", "العملاء مش محتاجين حساب. بيراجعوا ويوافقوا من لينكات واتساب.")}</p></div>
      <button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("New client", "عميل جديد")}</button>
    </div>
    <input className="inp" style={{ maxWidth: 320 }} placeholder={L("Search clients…", "ابحث في العملاء…")} value={q} onChange={e => setQ(e.target.value)} />
    <div className="card">{list.length === 0 ? <Empty icon={<UsersRound />} title={L("No clients yet", "لا يوجد عملاء بعد")} action={<button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("Add your first client", "أضف أول عميل")}</button>} /> :
      <div className="table-wrap"><table className="table">
        <thead><tr><th>{L("Client", "العميل")}</th><th className="hide-sm">{L("Contact", "التواصل")}</th><th>{L("Projects", "المشاريع")}</th><th className="hide-sm">{L("Waiting on them", "منتظر ردهم")}</th><th className="hide-sm">{L("Recovered", "المُسترد")}</th></tr></thead>
        <tbody>{list.map(c => {
          const ps = projects.filter(p => p.client_id === c.id);
          const ids = new Set(ps.map(p => p.id));
          const waiting = deliverables.filter(d => ids.has(d.project_id) && d.status === "in_review").length;
          const rec = cos.filter(x => ids.has(x.project_id) && x.status === "approved").reduce((s, x) => s + Number(x.amount), 0);
          return <tr key={c.id} className="click" onClick={() => nav("/clients/" + c.id)}>
            <td><div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} /><div><b>{c.name}</b><div className="faint small">{c.lang === "ar" ? "العربية" : "English"}</div></div></div></td>
            <td className="hide-sm">{c.contact_name}<div className="faint small" dir="ltr" style={{ textAlign: "start" }}>{c.phone ? "+" + c.phone.replace(/^\+/, "") : ""}</div></td>
            <td>{ps.filter(p => p.status === "active").length}</td>
            <td className="hide-sm">{waiting > 0 ? <span className="pill pill--info">{waiting}</span> : "—"}</td>
            <td className="hide-sm">{rec ? money(rec, ws.currency, lang) : "—"}</td>
          </tr>;
        })}</tbody>
      </table></div>}</div>
    {sp.get("new") && <ClientForm onClose={() => setSp({})} />}
  </div>;
}

export function ClientDetail() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const nav = useNavigate();
  const { run } = useAction();
  const { rows: cs, loading } = useRows("clients", { id } as Partial<Client>);
  const c = cs[0];
  const { rows: projects } = useRows("projects", { client_id: id });
  const { rows: deliverables } = useRows("deliverables", { workspace_id: ws.id });
  const { rows: cos } = useRows("change_orders", { workspace_id: ws.id });
  const [edit, setEdit] = useState(false);
  const [newP, setNewP] = useState(false);
  const [del, setDel] = useState(false);
  const [send, setSend] = useState(false);
  const toast = useToast();
  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!c) return <div className="page"><Empty icon={<UsersRound />} title={L("Client not found", "العميل غير موجود")} action={<Link className="btn" to="/clients">{L("All clients", "كل العملاء")}</Link>} /></div>;
  const ids = new Set(projects.map(p => p.id));
  const ds = deliverables.filter(d => ids.has(d.project_id)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const myCos = cos.filter(x => ids.has(x.project_id));
  const approvedDs = ds.filter(d => d.approved_at && d.sent_at);
  const avg = approvedDs.length ? Math.round(approvedDs.reduce((s, d) => s + (new Date(d.approved_at!).getTime() - new Date(d.sent_at!).getTime()) / 86400000, 0) / approvedDs.length * 10) / 10 : null;
  const revisions = ds.reduce((s, d) => s + d.revision_count, 0);
  return <div className="page">
    <div className="page-head">
      <div className="page-head__t">
        <div className="crumbs"><Link to="/clients" className="row" style={{ gap: 4 }}><ArrowLeft size={14} className="flip-rtl" />{L("Clients", "العملاء")}</Link></div>
        <h1 className="row"><Avatar name={c.name} size="lg" />{c.name}</h1>
        <p className="muted">{c.contact_name}{c.notes ? " · " + c.notes : ""}</p>
      </div>
      <div className="row">
        <button className="btn btn--primary" onClick={() => setSend(true)}><Send />{L("Send for approval", "ابعت للموافقة")}</button>
        {c.phone && <a className="btn btn--wa" href={waLink(c.phone, "")} target="_blank" rel="noopener"><MessageCircle />WhatsApp</a>}
        {c.email && <a className="btn" href={"mailto:" + c.email}><Mail />{L("Email", "بريد")}</a>}
        <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("More", "المزيد")}><MoreHorizontal /></button>}>{close => <>
          <button onClick={() => { close(); setEdit(true); }}><Pencil />{L("Edit client", "تعديل العميل")}</button>
          <hr /><button style={{ color: "var(--bad)" }} onClick={() => { close(); setDel(true); }}><Trash2 />{L("Delete client", "حذف العميل")}</button>
        </>}</Popover>
      </div>
    </div>
    <div className="grid4">
      <div className="card kpi"><span className="kpi__l">{L("Avg. time to approve", "متوسط وقت الموافقة")}</span><span className="kpi__v">{avg == null ? "—" : L(`${avg}d`, `${avg} يوم`)}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Revision rounds", "جولات التعديل")}</span><span className="kpi__v">{revisions}</span><span className="kpi__s">{ds.length ? L(`${(revisions / ds.length).toFixed(1)} per deliverable`, `${(revisions / ds.length).toFixed(1)} لكل تسليمة`) : ""}</span></div>
      <div className="card kpi"><span className="kpi__l">{L("Waiting on them", "منتظر ردهم")}</span><span className="kpi__v">{ds.filter(d => d.status === "in_review").length}</span></div>
      <div className="card kpi kpi--accent"><span className="kpi__l">{L("Recovered", "المُسترد")}</span><span className="kpi__v">{money(myCos.filter(x => x.status === "approved").reduce((s, x) => s + Number(x.amount), 0), ws.currency, lang)}</span></div>
    </div>
    <div className="card">
      <div className="card__h"><h2>{L("Conversation", "المحادثة")}</h2><span className="faint small">{L("internal notes and messages with", "ملاحظات داخلية ورسايل مع")} {c.name}</span></div>
      <Thread type="client" threadId={c.id} client={c} height={380} />
    </div>
    <div className="split">
      <div className="card">
        <div className="card__h"><h2>{L("Deliverables", "التسليمات")}</h2></div>
        {ds.length === 0 ? <p className="muted small" style={{ padding: 16 }}>{L("No deliverables yet.", "لا توجد تسليمات بعد.")}</p> :
          <div className="list">{ds.slice(0, 20).map(d => <Link key={d.id} to={"/deliverables/" + d.id} className="li"><span className="li__main"><span className="li__t">{d.title}</span><span className="li__s">{projects.find(p => p.id === d.project_id)?.name} · v{d.current_version} · {date(d.created_at, lang)}</span></span><StatusPill s={d.status} /></Link>)}</div>}
      </div>
      <div className="stack" style={{ gap: 16 }}>
        <div className="card card--pad stack">
          <h3 className="row"><LayoutGrid size={17} />{L("Client portal", "بوابة العميل")}</h3>
          <p className="muted small">{L("One permanent link for this client: everything waiting for their approval, extra work to confirm, and recent approvals. Pin it in your WhatsApp chat with them.", "لينك واحد ثابت للعميل ده: كل اللي مستني موافقته، والشغل الإضافي، وآخر الموافقات. ثبّته في شات الواتساب معاه.")}</p>
          <div className="row" style={{ flexWrap: "nowrap" }}><input className="inp mono" readOnly dir="ltr" value={portalUrl(c.portal_token)} onFocus={e => e.target.select()} /><button className="icon-btn" onClick={() => navigator.clipboard?.writeText(portalUrl(c.portal_token)).then(() => toast(L("Portal link copied", "اتنسخ لينك البوابة")))} aria-label={L("Copy", "نسخ")}><Copy /></button></div>
          <div className="row">
            <ChannelButton small client={c} build={() => reminderMsg(ws, c, ds.filter(d => d.status === "in_review").length)} label={() => L("Send portal link", "ابعت لينك البوابة")} />
            <a className="btn btn--sm" href={portalUrl(c.portal_token)} target="_blank" rel="noopener"><ExternalLink />{L("Preview", "معاينة")}</a>
            <Link className="btn btn--sm btn--ghost" to="/calendar"><CalendarDays />{L("Calendar", "التقويم")}</Link>
          </div>
        </div>
        <div className="card">
          <div className="card__h"><h2>{L("Projects", "المشاريع")}</h2><button className="btn btn--sm" onClick={() => setNewP(true)}><Plus />{L("New", "جديد")}</button></div>
          <div className="list">{projects.map(p => <Link key={p.id} to={"/projects/" + p.id} className="li"><span className="dot-color" style={{ background: p.color }} /><span className="li__main"><span className="li__t">{p.name}</span></span>{p.status !== "active" && <span className="pill">{p.status}</span>}</Link>)}
            {projects.length === 0 && <p className="muted small" style={{ padding: 16 }}>{L("No projects yet.", "لا توجد مشاريع بعد.")}</p>}</div>
        </div>
        <div className="card">
          <div className="card__h"><h2>{L("Extra work", "الشغل الإضافي")}</h2></div>
          <div className="list">{myCos.map(x => <div key={x.id} className="li"><span className="li__main"><span className="li__t">{x.title}</span></span><b className="small">{money(x.amount, x.currency, lang)}</b><COPill s={x.status} /></div>)}
            {myCos.length === 0 && <p className="muted small" style={{ padding: 16 }}>{L("None yet.", "لا يوجد بعد.")}</p>}</div>
        </div>
      </div>
    </div>
    {edit && <ClientForm client={c} onClose={() => setEdit(false)} />}
    {send && <SendFlow clientId={c.id} onClose={() => setSend(false)} />}
    {newP && <ProjectForm clientId={c.id} onClose={() => setNewP(false)} />}
    {del && <Confirm danger title={L("Delete this client?", "حذف هذا العميل؟")} text={L("All their projects, deliverables and extra work will be deleted too.", "هتتحذف كل مشاريعه وتسليماته والشغل الإضافي كمان.")} yes={L("Delete client", "حذف العميل")} onClose={() => setDel(false)} onYes={() => run(async () => { await api.remove("clients", c.id); nav("/clients"); }, L("Client deleted", "تم حذف العميل"))} />}
  </div>;
}
