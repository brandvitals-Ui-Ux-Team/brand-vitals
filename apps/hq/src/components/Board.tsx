import { CalendarDays, Link2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { moveTask } from "../lib/actions";
import { api } from "../lib/api";
import { date, isOverdue } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Project, Task, TaskStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { TaskForm } from "./Forms";
import { Avatar, Popover, Prio, useAction } from "./ui";

export const COLUMNS: [TaskStatus, string, string, string][] = [
  ["todo", "To do", "للتنفيذ", "var(--text-3)"], ["doing", "In progress", "جارٍ العمل", "var(--info)"],
  ["review", "Internal review", "مراجعة داخلية", "var(--violet)"], ["done", "Done", "تم", "var(--ok)"]
];

export function Board({ tasks, projects, projectId, openId, onOpen }: { tasks: Task[]; projects: Project[]; projectId?: string; openId?: string | null; onOpen?: (id: string | null) => void }) {
  const { L, lang } = useI18n();
  const { ws, me, members } = useWorkspace();
  const { run } = useAction();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [create, setCreate] = useState<TaskStatus | null>(null);
  const editing = openId ? tasks.find(t => t.id === openId) : null;

  const drop = (status: TaskStatus) => {
    const t = tasks.find(x => x.id === drag);
    setDrag(null); setOver(null);
    if (t) run(() => moveTask(ws, me, t, status));
  };

  return <>
    <div className="board">{COLUMNS.map(([key, en, ar, color]) => {
      const col = tasks.filter(t => t.status === key).sort((a, b) => a.position - b.position);
      return <section key={key} className={"col" + (over === key ? " drop" : "")} aria-label={L(en, ar)}
        onDragOver={e => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver(o => (o === key ? null : o))} onDrop={e => { e.preventDefault(); drop(key); }}>
        <div className="col__h"><span className="dot-color" style={{ background: color, borderRadius: 99 }} />{L(en, ar)}<span className="n">{col.length}</span>
          <button className="icon-btn add" style={{ width: 28, height: 28 }} onClick={() => setCreate(key)} aria-label={L("Add task", "إضافة مهمة")}><Plus /></button></div>
        {col.map(t => {
          const p = projects.find(x => x.id === t.project_id);
          const m = members.find(x => x.id === t.assignee_id);
          return <div key={t.id} className={"tcard" + (drag === t.id ? " dragging" : "")} draggable onDragStart={() => setDrag(t.id)} onDragEnd={() => { setDrag(null); setOver(null); }}
            onClick={() => onOpen?.(t.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onOpen?.(t.id); }}>
            <div className="row row--between" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <span className="tcard__t" style={{ textDecoration: t.status === "done" ? "line-through" : undefined, opacity: t.status === "done" ? 0.7 : 1 }}>{t.title}</span>
              <span onClick={e => e.stopPropagation()}><Popover trigger={open => <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={open} aria-label={L("Move", "نقل")}><MoreHorizontal /></button>}>{close => <>
                {COLUMNS.filter(c => c[0] !== t.status).map(c => <button key={c[0]} onClick={() => { close(); run(() => moveTask(ws, me, t, c[0])); }}><span className="dot-color" style={{ background: c[3], borderRadius: 99 }} />{L("Move to ", "انقل إلى ") + L(c[1], c[2])}</button>)}
                <hr /><button style={{ color: "var(--bad)" }} onClick={() => { close(); run(() => api.remove("tasks", t.id)); }}><Trash2 />{L("Delete", "حذف")}</button>
              </>}</Popover></span>
            </div>
            {!projectId && p && <span className="tcard__m"><span className="dot-color" style={{ background: p.color }} />{p.name}</span>}
            {t.deliverable_id && <Link to={"/deliverables/" + t.deliverable_id} className="tcard__m" style={{ color: "var(--accent)" }} onClick={e => e.stopPropagation()}><Link2 size={13} />{L("Deliverable", "تسليمة")}</Link>}
            <div className="tcard__f"><Prio p={t.priority} /><span className="row" style={{ gap: 6 }}>{t.due_date && <span className={"due" + (t.status !== "done" && isOverdue(t.due_date) ? " due--over" : "")}><CalendarDays />{date(t.due_date, lang)}</span>}{m && <Avatar name={m.name} size="sm" />}</span></div>
          </div>;
        })}
      </section>;
    })}</div>
    {create && <TaskForm onClose={() => setCreate(null)} status={create} projectId={projectId} />}
    {editing && <TaskForm task={editing} onClose={() => onOpen?.(null)} />}
  </>;
}
