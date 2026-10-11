import { CalendarDays, CheckSquare, FileSignature, FolderKanban, Image as ImageIcon, Inbox, LayoutDashboard, Plus, ScrollText, Search, Settings, Users, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useWorkspace } from "../lib/ws";

interface Item { group: string; label: string; sub?: string; icon: ReactNode; go: () => void }

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { L } = useI18n();
  const { ws } = useWorkspace();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: projects } = useRows("projects", { workspace_id: ws.id });
  const { rows: deliverables } = useRows("deliverables", { workspace_id: ws.id });
  const { rows: tasks } = useRows("tasks", { workspace_id: ws.id });
  useEffect(() => { input.current?.focus(); }, []);

  const go = (path: string) => () => { onClose(); nav(path); };
  const all: Item[] = useMemo(() => {
    const G = { nav: L("Go to", "انتقل إلى"), act: L("Create", "إنشاء"), p: L("Projects", "المشاريع"), c: L("Clients", "العملاء"), d: L("Deliverables", "التسليمات"), t: L("Tasks", "المهام") };
    const clientName = (id: string) => clients.find(c => c.id === id)?.name || "";
    const projectName = (id: string | null) => projects.find(p => p.id === id)?.name || "";
    return [
      { group: G.act, label: L("New task", "مهمة جديدة"), icon: <Plus />, go: go("/tasks?new=1") },
      { group: G.act, label: L("New deliverable", "تسليمة جديدة"), icon: <Plus />, go: go("/approvals?new=1") },
      { group: G.act, label: L("New project", "مشروع جديد"), icon: <Plus />, go: go("/projects?new=1") },
      { group: G.act, label: L("New client", "عميل جديد"), icon: <Plus />, go: go("/clients?new=1") },
      { group: G.nav, label: L("Home", "الرئيسية"), icon: <LayoutDashboard />, go: go("/") },
      { group: G.nav, label: L("Approvals", "الموافقات"), icon: <Inbox />, go: go("/approvals") },
      { group: G.nav, label: L("My tasks", "مهامي"), icon: <CheckSquare />, go: go("/tasks") },
      { group: G.nav, label: L("Calendar", "التقويم"), icon: <CalendarDays />, go: go("/calendar") },
      { group: G.nav, label: L("Inbox", "المحادثات"), icon: <Inbox />, go: go("/inbox") },
      { group: G.nav, label: L("Integrations", "الربط"), icon: <Settings />, go: go("/integrations") },
      { group: G.nav, label: L("Extra work", "الشغل الإضافي"), icon: <FileSignature />, go: go("/extra-work") },
      { group: G.nav, label: L("History", "السجل"), icon: <ScrollText />, go: go("/history") },
      { group: G.nav, label: L("Team", "الفريق"), icon: <Users />, go: go("/team") },
      { group: G.nav, label: L("Settings", "الإعدادات"), icon: <Settings />, go: go("/settings") },
      ...projects.map(p => ({ group: G.p, label: p.name, sub: clientName(p.client_id), icon: <FolderKanban />, go: go("/projects/" + p.id) })),
      ...clients.map(c => ({ group: G.c, label: c.name, sub: c.contact_name, icon: <UsersRound />, go: go("/clients/" + c.id) })),
      ...deliverables.map(d => ({ group: G.d, label: d.title, sub: projectName(d.project_id), icon: <ImageIcon />, go: go("/deliverables/" + d.id) })),
      ...tasks.map(t => ({ group: G.t, label: t.title, sub: projectName(t.project_id), icon: <CheckSquare />, go: go("/tasks?open=" + t.id) }))
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, projects, deliverables, tasks, L]);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = s ? all.filter(x => (x.label + " " + (x.sub || "")).toLowerCase().includes(s)) : all.filter(x => x.group === L("Create", "إنشاء") || x.group === L("Go to", "انتقل إلى"));
    return r.slice(0, 40);
  }, [q, all, L]);
  useEffect(() => setI(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI(x => Math.min(items.length - 1, x + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI(x => Math.max(0, x - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); items[i]?.go(); }
    else if (e.key === "Escape") onClose();
  };
  let last = "";
  return createPortal(<div className="overlay palette" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={L("Command palette", "لوحة الأوامر")}>
      <div className="palette__in"><Search /><input ref={input} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={L("Search projects, clients, deliverables, tasks…", "ابحث في المشاريع والعملاء والتسليمات والمهام…")} /></div>
      <div className="palette__list" role="listbox">
        {items.length === 0 && <p className="muted small" style={{ padding: 14 }}>{L("No results", "لا توجد نتائج")}</p>}
        {items.map((x, n) => {
          const head = x.group !== last ? <div className="palette__g">{x.group}</div> : null;
          last = x.group;
          return <div key={n}>{head}<button className={"palette__i" + (n === i ? " on" : "")} role="option" aria-selected={n === i} onMouseEnter={() => setI(n)} onClick={x.go}>{x.icon}<span className="ellipsis">{x.label}</span>{x.sub && <span className="faint small ellipsis" style={{ marginInlineStart: "auto" }}>{x.sub}</span>}</button></div>;
        })}
      </div>
    </div>
  </div>, document.body);
}
