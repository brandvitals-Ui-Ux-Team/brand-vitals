import { ArrowLeft, FileSignature, FolderKanban, Inbox, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Board } from "../components/Board";
import { Thread } from "../components/Thread";
import { DeliverableForm, ProjectForm, ScopeForm } from "../components/Forms";
import { Avatar, Confirm, COPill, Empty, KIND_LABEL, Popover, StatusPill, Thumb, useAction } from "../components/ui";
import { summary } from "../lib/activity";
import { api } from "../lib/api";
import { ago, date, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { scopeUsage } from "../lib/logic";
import type { Project, ScopeItem } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { ChangeOrderForm } from "./ChangeOrders";

export function Projects() {
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState<Project["status"] | "all">("active");
  const f = { workspace_id: ws.id };
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: cos } = useRows("change_orders", f);
  const list = projects.filter(p => status === "all" || p.status === status).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Projects", "المشاريع")}</h1><p className="muted">{L("Each project has an agreement: what you deliver, how many, and how many revision rounds are included.", "كل مشروع ليه اتفاق: بتسلّم إيه، وكام، وكام جولة تعديل متضمنة.")}</p></div>
      <button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("New project", "مشروع جديد")}</button>
    </div>
    <div className="seg" style={{ justifySelf: "start" }}>{(["active", "paused", "done", "all"] as const).map(k => <button key={k} className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{({ active: L("Active", "نشطة"), paused: L("Paused", "متوقفة"), done: L("Done", "منتهية"), all: L("All", "الكل") })[k]}</button>)}</div>
    {list.length === 0 ? <div className="card"><Empty icon={<FolderKanban />} title={L("No projects", "لا توجد مشاريع")} action={<button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("New project", "مشروع جديد")}</button>} /></div> :
      <div className="grid3">{list.map(p => {
        const ds = deliverables.filter(d => d.project_id === p.id);
        const approved = ds.filter(d => d.status === "approved").length;
        const waiting = ds.filter(d => d.status === "in_review").length;
        const rec = cos.filter(c => c.project_id === p.id && c.status === "approved").reduce((s, c) => s + Number(c.amount), 0);
        return <Link key={p.id} to={"/projects/" + p.id} className="card card--pad stack" style={{ borderTop: `3px solid ${p.color}` }}>
          <div className="row row--between"><span className="faint small">{clients.find(c => c.id === p.client_id)?.name}</span>{p.status !== "active" && <span className="pill">{p.status}</span>}</div>
          <h2>{p.name}</h2>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row row--between small"><span className="muted">{L("Approved", "معتمد")}</span><b>{approved}/{ds.length}</b></div>
            <div className="bar"><i style={{ width: (ds.length ? approved / ds.length * 100 : 0) + "%" }} /></div>
          </div>
          <div className="row small faint">{waiting > 0 && <span className="pill pill--info pill--plain">{waiting} {L("waiting", "منتظرة")}</span>}{rec > 0 && <span className="pill pill--ok pill--plain">+{money(rec, ws.currency, lang)}</span>}{p.due_date && <span>{L("Due ", "الموعد ")}{date(p.due_date, lang)}</span>}</div>
        </Link>;
      })}</div>}
    {sp.get("new") && <ProjectForm onClose={() => setSp({})} clientId={sp.get("client") || undefined} />}
  </div>;
}

type Tab = "deliverables" | "chat" | "board" | "scope" | "co" | "activity";

export function ProjectDetail() {
  const { id = "" } = useParams();
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const nav = useNavigate();
  const { run } = useAction();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") as Tab) || "deliverables";
  const setTab = (t: Tab) => setSp({ tab: t });
  const { rows: ps, loading } = useRows("projects", { id } as Partial<Project>);
  const p = ps[0];
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: deliverables } = useRows("deliverables", { project_id: id });
  const { rows: versions } = useRows("versions", { workspace_id: ws.id });
  const { rows: scope } = useRows("scope_items", { project_id: id });
  const { rows: tasks } = useRows("tasks", { project_id: id });
  const { rows: cos } = useRows("change_orders", { project_id: id });
  const { rows: activity } = useRows("activity", { project_id: id });
  const [edit, setEdit] = useState(false);
  const [newD, setNewD] = useState(false);
  const [scopeEdit, setScopeEdit] = useState<ScopeItem | "new" | null>(null);
  const [newCO, setNewCO] = useState(false);
  const [del, setDel] = useState(false);
  const [openTask, setOpenTask] = useState<string | null>(null);
  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!p) return <div className="page"><Empty icon={<FolderKanban />} title={L("Project not found", "المشروع غير موجود")} action={<Link className="btn" to="/projects">{L("All projects", "كل المشاريع")}</Link>} /></div>;
  const client = clients.find(c => c.id === p.client_id);
  const latest = (did: string) => versions.filter(v => v.deliverable_id === did).sort((a, b) => b.number - a.number)[0];
  const rec = cos.filter(c => c.status === "approved").reduce((s, c) => s + Number(c.amount), 0);
  const TABS: [Tab, string, string, number][] = [["deliverables", "Deliverables", "التسليمات", deliverables.length], ["chat", "Chat", "المحادثة", 0], ["board", "Tasks", "المهام", tasks.filter(t => t.status !== "done").length], ["scope", "What's included", "المتفق عليه", scope.length], ["co", "Extra work", "الشغل الإضافي", cos.length], ["activity", "Activity", "النشاط", 0]];

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t">
        <div className="crumbs"><Link to="/projects" className="row" style={{ gap: 4 }}><ArrowLeft size={14} className="flip-rtl" />{L("Projects", "المشاريع")}</Link><span>/</span>{client && <Link to={"/clients/" + client.id}>{client.name}</Link>}</div>
        <h1 className="row"><span className="dot-color" style={{ background: p.color, width: 14, height: 14 }} />{p.name}</h1>
        <div className="row small faint">{p.status !== "active" && <span className="pill">{p.status}</span>}{p.due_date && <span>{L("Deadline ", "الموعد النهائي ")}{date(p.due_date, lang)}</span>}{p.budget != null && <span>· {L("Budget ", "الميزانية ")}{money(p.budget, ws.currency, lang)}</span>}{rec > 0 && <span className="pill pill--ok pill--plain">+{money(rec, ws.currency, lang)} {L("recovered", "مُسترد")}</span>}</div>
      </div>
      <div className="row">
        <button className="btn btn--primary" onClick={() => setNewD(true)}><Plus />{L("Deliverable", "تسليمة")}</button>
        <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("More", "المزيد")}><MoreHorizontal /></button>}>{close => <>
          <button onClick={() => { close(); setEdit(true); }}><Pencil />{L("Edit project", "تعديل المشروع")}</button>
          <button onClick={() => { close(); setNewCO(true); }}><FileSignature />{L("Add extra work", "إضافة شغل إضافي")}</button>
          <hr /><button style={{ color: "var(--bad)" }} onClick={() => { close(); setDel(true); }}><Trash2 />{L("Delete project", "حذف المشروع")}</button>
        </>}</Popover>
      </div>
    </div>
    <div className="tabs">{TABS.map(([k, en, ar, n]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{L(en, ar)}{n > 0 && <span className="count">{n}</span>}</button>)}</div>

    {tab === "deliverables" && <div className="card">{deliverables.length === 0 ? <Empty icon={<Inbox />} title={L("No deliverables yet", "لا توجد تسليمات بعد")} action={<button className="btn btn--primary" onClick={() => setNewD(true)}><Plus />{L("New deliverable", "تسليمة جديدة")}</button>} /> :
      <div className="list">{[...deliverables].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(d => <Link key={d.id} to={"/deliverables/" + d.id} className="li">
        <Thumb v={latest(d.id)} kind={d.kind} />
        <span className="li__main"><span className="li__t">{d.title}</span><span className="li__s">{L(...KIND_LABEL[d.kind])} · v{d.current_version} · {scope.find(s => s.id === d.scope_item_id)?.title || L("Not in the agreement", "مش في الاتفاق")}</span></span>
        {d.out_of_scope && <span className="pill pill--violet pill--plain hide-sm">{L("Over limit", "فوق الحد")}</span>}
        <StatusPill s={d.status} />
      </Link>)}</div>}</div>}

    {tab === "chat" && <div className="card"><Thread type="project" threadId={p.id} client={client || null} projectId={p.id} height={480} /></div>}

    {tab === "board" && <Board tasks={tasks} projects={projects} projectId={p.id} openId={openTask} onOpen={setOpenTask} />}

    {tab === "scope" && <div className="stack">
      <div className="callout callout--info"><ShieldCheck /><div><b>{L("How tracking works", "إزاي بنتابع")}</b><p className="small muted">{L("Deliverables linked to these items are counted. When a client goes over the quantity or the included revision rounds, Approve flags it so you can bill it.", "التسليمات المربوطة بالبنود دي بتتعد. لما العميل يتخطى الكمية أو جولات التعديل، Approve بينبّهك عشان تحاسب عليها.")}</p></div></div>
      <div className="card">
        <div className="card__h"><h2>{L("What's included", "المتفق عليه")}</h2><button className="btn btn--sm" onClick={() => setScopeEdit("new")}><Plus />{L("Add item", "إضافة بند")}</button></div>
        {scope.length === 0 ? <Empty icon={<ShieldCheck />} title={L("Nothing agreed yet", "لسه مفيش اتفاق")} text={L("Add what the contract includes, e.g. 12 posts per month with 2 revision rounds.", "أضف محتوى العقد، مثلًا 12 بوست شهريًا مع جولتين تعديل.")} action={<button className="btn btn--primary" onClick={() => setScopeEdit("new")}><Plus />{L("Add to agreement", "إضافة للاتفاق")}</button>} /> :
          <div className="table-wrap"><table className="table">
            <thead><tr><th>{L("Item", "البند")}</th><th>{L("Used", "المستخدم")}</th><th className="hide-sm">{L("Revisions incl.", "التعديلات المتضمنة")}</th><th className="hide-sm">{L("Extra revisions", "تعديلات إضافية")}</th><th className="hide-sm">{L("Extra price", "سعر الإضافي")}</th><th /></tr></thead>
            <tbody>{scope.map(s => { const u = scopeUsage(s, deliverables); return <tr key={s.id}>
              <td><b>{s.title}</b><div className="faint small">{L(...KIND_LABEL[s.kind])} · {s.quantity} {s.period === "month" ? L("per month", "شهريًا") : L("for the project", "للمشروع")}</div></td>
              <td style={{ minWidth: 150 }}><div className="stack" style={{ gap: 4 }}><span className="small"><b style={{ color: u.over ? "var(--bad)" : undefined }}>{u.used}</b> / {u.total}</span><div className={"bar" + (u.over ? " bar--over" : "")}><i style={{ width: Math.min(100, u.total ? u.used / u.total * 100 : 0) + "%" }} /></div></div></td>
              <td className="hide-sm">{s.revisions_included}</td>
              <td className="hide-sm">{u.extraRevisions > 0 ? <span className="pill pill--violet pill--plain">{u.extraRevisions}</span> : "0"}</td>
              <td className="hide-sm">{money(s.extra_price, ws.currency, lang)}</td>
              <td><div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}><button className="icon-btn" onClick={() => setScopeEdit(s)} aria-label={L("Edit", "تعديل")}><Pencil /></button><button className="icon-btn" onClick={() => run(() => api.remove("scope_items", s.id))} aria-label={L("Delete", "حذف")}><Trash2 /></button></div></td>
            </tr>; })}</tbody>
          </table></div>}
      </div>
    </div>}

    {tab === "co" && <div className="card">
      <div className="card__h"><h2>{L("Extra work", "الشغل الإضافي")}</h2><button className="btn btn--sm" onClick={() => setNewCO(true)}><Plus />{L("New", "جديد")}</button></div>
      {cos.length === 0 ? <Empty icon={<FileSignature />} title={L("No extra work on this project", "مفيش شغل إضافي في المشروع ده")} /> :
        <div className="list">{cos.map(c => <div key={c.id} className="li"><span className="li__main"><span className="li__t">{c.title}</span><span className="li__s">{date(c.created_at, lang)}{c.decided_by ? " · " + c.decided_by : ""}</span></span><b>{money(c.amount, c.currency, lang)}</b><COPill s={c.status} /></div>)}</div>}
    </div>}

    {tab === "activity" && <div className="card"><div className="list">{[...activity].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(a => <div key={a.id} className="li"><Avatar name={a.actor} size="sm" /><span className="li__main"><span><b>{a.actor}</b> {summary(a.summary, lang)}</span><span className="li__s">{ago(a.created_at, lang)}</span></span></div>)}
      {activity.length === 0 && <p className="muted small" style={{ padding: 16 }}>{L("No activity yet.", "لا يوجد نشاط بعد.")}</p>}</div></div>}

    {edit && <ProjectForm project={p} onClose={() => setEdit(false)} />}
    {newD && <DeliverableForm projectId={p.id} onClose={() => setNewD(false)} />}
    {scopeEdit && <ScopeForm projectId={p.id} item={scopeEdit === "new" ? undefined : scopeEdit} onClose={() => setScopeEdit(null)} />}
    {newCO && <ChangeOrderForm preset={{ project_id: p.id }} onClose={() => setNewCO(false)} />}
    {del && <Confirm danger title={L("Delete this project?", "حذف هذا المشروع؟")} text={L("All its deliverables, versions, agreement, tasks and extra work will be deleted.", "هتتحذف كل التسليمات والنسخ والاتفاق والمهام والشغل الإضافي الخاص به.")} yes={L("Delete project", "حذف المشروع")} onClose={() => setDel(false)} onYes={() => run(async () => { await api.remove("projects", p.id); nav("/projects"); }, L("Project deleted", "تم حذف المشروع"))} />}
  </div>;
}
