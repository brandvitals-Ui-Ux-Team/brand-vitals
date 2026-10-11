import { CheckSquare, Columns3, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Board, COLUMNS } from "../components/Board";
import { TaskForm } from "../components/Forms";
import { Empty, MemberChip, Prio, useAction } from "../components/ui";
import { moveTask } from "../lib/actions";
import { date, isOverdue } from "../lib/format";
import { useLocalState, useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useWorkspace } from "../lib/ws";

export function Tasks() {
  const { L, lang } = useI18n();
  const { ws, me, members } = useWorkspace();
  const [sp, setSp] = useSearchParams();
  const [view, setView] = useLocalState<"board" | "list">("hq-task-view", "board");
  const [who, setWho] = useState<string>("me");
  const [proj, setProj] = useState("");
  const { run } = useAction();
  const { rows: tasks } = useRows("tasks", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const shown = useMemo(() => tasks
    .filter(t => who === "all" || (who === "me" ? t.assignee_id === me?.id : who === "none" ? !t.assignee_id : t.assignee_id === who))
    .filter(t => !proj || t.project_id === proj), [tasks, who, proj, me]);
  const open = sp.get("open");
  const setOpen = (id: string | null) => setSp(id ? { open: id } : {});

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{who === "me" ? L("My tasks", "مهامي") : L("Tasks", "المهام")}</h1><p className="muted">{L("Drag cards between columns. Done tasks are logged in the activity feed.", "اسحب الكروت بين الأعمدة. المهام المنجزة بتتسجل في النشاط.")}</p></div>
      <button className="btn btn--primary" onClick={() => setSp({ new: "1" })}><Plus />{L("New task", "مهمة جديدة")}</button>
    </div>
    <div className="row row--between">
      <div className="row">
        <select className="sel" style={{ width: "auto" }} value={who} onChange={e => setWho(e.target.value)}>
          <option value="me">{L("Assigned to me", "المسندة لي")}</option><option value="all">{L("Everyone", "الكل")}</option><option value="none">{L("Unassigned", "غير مسندة")}</option>
          {members.filter(m => m.id !== me?.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="sel" style={{ width: "auto" }} value={proj} onChange={e => setProj(e.target.value)}><option value="">{L("All projects", "كل المشاريع")}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="seg"><button className={view === "board" ? "on" : ""} onClick={() => setView("board")}><Columns3 />{L("Board", "لوحة")}</button><button className={view === "list" ? "on" : ""} onClick={() => setView("list")}><List />{L("List", "قائمة")}</button></div>
    </div>

    {view === "board" ? <Board tasks={shown} projects={projects} openId={open} onOpen={setOpen} /> :
      <div className="card">{shown.length === 0 ? <Empty icon={<CheckSquare />} title={L("No tasks", "لا توجد مهام")} /> :
        <div className="table-wrap"><table className="table">
          <thead><tr><th style={{ width: 36 }} /><th>{L("Task", "المهمة")}</th><th className="hide-sm">{L("Project", "المشروع")}</th><th>{L("Priority", "الأولوية")}</th><th className="hide-sm">{L("Assignee", "المسؤول")}</th><th>{L("Due", "الموعد")}</th><th className="hide-sm">{L("Status", "الحالة")}</th></tr></thead>
          <tbody>{[...shown].sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || (a.due_date || "9").localeCompare(b.due_date || "9")).map(t => <tr key={t.id} className="click" onClick={() => setOpen(t.id)}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" className="check" checked={t.status === "done"} onChange={e => run(() => moveTask(ws, me, t, e.target.checked ? "done" : "todo"))} aria-label={L("Done", "تم")} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} /></td>
            <td style={{ textDecoration: t.status === "done" ? "line-through" : undefined }}><b>{t.title}</b></td>
            <td className="hide-sm">{projects.find(p => p.id === t.project_id)?.name || "—"}</td>
            <td><Prio p={t.priority} /></td>
            <td className="hide-sm"><MemberChip m={members.find(m => m.id === t.assignee_id)} /></td>
            <td><span className={"due" + (t.status !== "done" && isOverdue(t.due_date) ? " due--over" : "")}>{date(t.due_date, lang) || "—"}</span></td>
            <td className="hide-sm">{L(...(COLUMNS.find(c => c[0] === t.status)!.slice(1, 3) as [string, string]))}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>}
    {sp.get("new") && <TaskForm onClose={() => setSp({})} />}
    {open && tasks.find(t => t.id === open) && (view === "list" || !shown.some(t => t.id === open)) && <TaskForm task={tasks.find(t => t.id === open)} onClose={() => setOpen(null)} />}
  </div>;
}
