import { Bell, CalendarDays, CheckSquare, ChevronsUpDown, FileSignature, Home, Inbox, LogOut, Menu, Moon, Plus, RotateCcw, ScrollText, Search, Send, Settings, ShieldAlert, Sun, Users, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api, isDemo } from "../lib/api";
import { ago } from "../lib/format";
import { useLocalState, useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useWorkspace } from "../lib/ws";
import { Avatar, Popover } from "./ui";
import { CommandPalette } from "./CommandPalette";
import { SendFlow } from "./SendFlow";

export function useTheme() {
  const [theme, setTheme] = useLocalState<"light" | "dark">("hq-theme", "light");
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return [theme, setTheme] as const;
}

export function Shell({ children }: { children: ReactNode }) {
  const { L, lang, setLang } = useI18n();
  const { ws, me, workspaces, select, user } = useWorkspace();
  const [theme, setTheme] = useTheme();
  const [side, setSide] = useState(false);
  const [palette, setPalette] = useState(false);
  const [send, setSend] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => setSide(false), [loc.pathname]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(p => !p); } };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  const { rows: deliverables } = useRows("deliverables", { workspace_id: ws.id });
  const { rows: cos } = useRows("change_orders", { workspace_id: ws.id });
  const { rows: tasks } = useRows("tasks", { workspace_id: ws.id });
  const waiting = deliverables.filter(d => d.status === "in_review").length;
  const changes = deliverables.filter(d => d.status === "changes").length;
  const myOpen = tasks.filter(t => t.assignee_id === me?.id && t.status !== "done").length;
  const coOpen = cos.filter(c => c.status === "sent").length;

  const A = ({ to, icon, label, count, warn, end }: { to: string; icon: ReactNode; label: string; count?: number; warn?: boolean; end?: boolean }) =>
    <NavLink to={to} end={end} className={({ isActive }) => "nav-a" + (isActive ? " active" : "")}>{icon}<span>{label}</span>{!!count && <span className={"count" + (warn ? " count--warn" : "")}>{count}</span>}</NavLink>;

  return <div className="shell">
    <aside className={"side" + (side ? " open" : "")} aria-label={L("Main navigation", "التنقل الرئيسي")}>
      <div className="side__brand"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Approve" /></div>
      <Popover align="start" trigger={open => <button className="ws-switch" onClick={open}>
        <span className="ws-switch__logo">{ws.name.slice(0, 1).toUpperCase()}</span>
        <span style={{ minWidth: 0, flex: 1 }}><span className="ws-switch__name ellipsis" style={{ display: "block" }}>{ws.name}</span><span className="faint small">{me ? L(me.role === "owner" ? "Owner" : me.role === "admin" ? "Admin" : "Member", me.role === "owner" ? "مالك" : me.role === "admin" ? "مسؤول" : "عضو") : ""}</span></span>
        <ChevronsUpDown size={16} className="faint" />
      </button>}>{close => <>
        {workspaces.map(w => <button key={w.id} onClick={() => { select(w.id); close(); nav("/"); }}><span className="ws-switch__logo" style={{ width: 22, height: 22, fontSize: 11 }}>{w.name[0]}</span>{w.name}</button>)}
        <hr />
        <button onClick={() => { close(); nav("/new-workspace"); }}><Plus />{L("New workspace", "مساحة عمل جديدة")}</button>
      </>}</Popover>

      <button className="big-send" onClick={() => setSend(true)}><Send />{L("Send for approval", "ابعت للموافقة")}</button>
      <A to="/" end icon={<Home />} label={L("Home", "الرئيسية")} />
      <A to="/approvals" icon={<Inbox />} label={L("Approvals", "الموافقات")} count={waiting + changes} />
      <A to="/calendar" icon={<CalendarDays />} label={L("Calendar", "التقويم")} />
      <A to="/clients" icon={<UsersRound />} label={L("Clients", "العملاء")} />
      <A to="/tasks" icon={<CheckSquare />} label={L("Tasks", "المهام")} count={myOpen} />
      <div className="nav-sec">{L("More", "المزيد")}</div>
      <A to="/extra-work" icon={<FileSignature />} label={L("Extra work", "الشغل الإضافي")} count={coOpen} warn />
      <A to="/history" icon={<ScrollText />} label={L("History", "السجل")} />
      <A to="/team" icon={<Users />} label={L("Team", "الفريق")} />
      <A to="/settings" icon={<Settings />} label={L("Settings", "الإعدادات")} />

      <div className="side__foot">
        {isDemo && <div className="demo-pill"><ShieldAlert /><span>{L("Demo mode: data stays in this browser. Connect Supabase in Settings to go live.", "وضع تجريبي: البيانات في هذا المتصفح فقط. اربط Supabase من الإعدادات للتشغيل الفعلي.")}</span></div>}
        <a className="nav-a" href="/approve.html"><span style={{ width: 17 }} />{L("About Vitals Approve", "عن Vitals Approve")}</a>
      </div>
    </aside>
    {side && <div className="overlay" style={{ zIndex: 80, background: "rgba(0,0,0,.3)" }} onClick={() => setSide(false)} />}

    <div className="main">
      <header className="top">
        <button className="icon-btn top__burger" onClick={() => setSide(true)} aria-label={L("Open menu", "فتح القائمة")}><Menu /></button>
        <button className="search-btn" onClick={() => setPalette(true)}><Search /><span>{L("Search or jump to…", "ابحث أو انتقل إلى…")}</span><kbd>Ctrl K</kbd></button>
        <div className="top__r">
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
          <Notifications />
          <Popover trigger={open => <button className="icon-btn" onClick={open} aria-label={L("Account", "الحساب")}><Avatar name={me?.name || user?.name || "?"} /></button>}>{close => <>
            <div style={{ padding: "8px 10px" }}><b>{me?.name}</b><div className="faint small">{user?.email}</div></div>
            <hr />
            <button onClick={() => { close(); nav("/settings"); }}><Settings />{L("Settings", "الإعدادات")}</button>
            {isDemo && api.resetDemo && <button onClick={() => { close(); api.resetDemo!(); }}><RotateCcw />{L("Reset demo data", "إعادة ضبط البيانات التجريبية")}</button>}
            <button onClick={() => { close(); api.signOut(); }}><LogOut />{L("Sign out", "تسجيل الخروج")}</button>
          </>}</Popover>
        </div>
      </header>
      {children}
    </div>
    {palette && <CommandPalette onClose={() => setPalette(false)} />}
    {send && <SendFlow onClose={() => setSend(false)} />}
  </div>;
}

function Notifications() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const nav = useNavigate();
  const { rows } = useRows("activity", { workspace_id: ws.id });
  const [seen, setSeen] = useLocalState<string>("hq-seen-" + ws.id, "");
  // Notify about what clients did (and teammates), not your own actions.
  const items = useMemo(() => rows.filter(a => a.actor !== me?.name).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 30), [rows, me]);
  const unread = items.filter(a => a.created_at > seen).length;
  const go = (a: typeof items[number]) => {
    if (a.type.startsWith("approval") || a.type.startsWith("review") || a.type.startsWith("version") || a.type.startsWith("deliverable")) nav("/deliverables/" + a.entity_id);
    else if (a.type.startsWith("change_order")) nav("/extra-work");
    else if (a.project_id) nav("/projects/" + a.project_id);
  };
  return <Popover className="bell" trigger={(open, isOpen) => <button className="icon-btn" onClick={() => { open(); if (!isOpen && items[0]) setSeen(items[0].created_at); }} aria-label={L("Notifications", "الإشعارات")}><Bell />{unread > 0 && <span className="dot" />}</button>}>{close => <>
    <div className="bell__h"><span>{L("Notifications", "الإشعارات")}</span>{unread > 0 && <span className="pill pill--info pill--plain">{unread} {L("new", "جديد")}</span>}</div>
    <div className="bell__l">
      {items.length === 0 && <p className="muted small" style={{ padding: 16 }}>{L("Nothing yet.", "لا شيء بعد.")}</p>}
      {items.map(a => <button key={a.id} className="li" style={{ width: "100%", textAlign: "start" }} onClick={() => { close(); go(a); }}>
        <Avatar name={a.actor} size="sm" />
        <span className="li__main"><span style={{ whiteSpace: "normal" }}><b>{a.actor}</b> {a.summary}</span><span className="li__s">{ago(a.created_at, lang)}</span></span>
        {a.created_at > seen && <span className="dot-color" style={{ background: "var(--accent)", width: 8, height: 8, borderRadius: 4 }} />}
      </button>)}
    </div>
  </>}</Popover>;
}
