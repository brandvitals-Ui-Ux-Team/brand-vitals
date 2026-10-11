// Inbox: every conversation (team and client) in one place, newest first.
import { ArrowLeft, ExternalLink, MessagesSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { readKey, Thread } from "../components/Thread";
import { Avatar, Empty } from "../components/ui";
import { ago } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Message, ThreadType } from "../lib/types";
import { useWorkspace } from "../lib/ws";

interface ThreadRow { id: string; type: ThreadType; title: string; sub: string; last: Message; unread: boolean; clientWaiting: boolean; mentionsMe: boolean; clientId: string | null; projectId: string | null }

export function useThreads() {
  const { ws, me } = useWorkspace();
  const f = { workspace_id: ws.id };
  const { rows: messages } = useRows("messages", f);
  const { rows: clients } = useRows("clients", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: deliverables } = useRows("deliverables", f);
  return useMemo(() => {
    const by = new Map<string, Message[]>();
    for (const m of messages) { if (!by.has(m.thread_id)) by.set(m.thread_id, []); by.get(m.thread_id)!.push(m); }
    const out: ThreadRow[] = [];
    for (const [id, list] of by) {
      list.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = list[list.length - 1];
      const type = last.thread_type;
      let title = "", sub = "", clientId: string | null = last.client_id, projectId: string | null = null;
      if (type === "client") { const c = clients.find(x => x.id === id); title = c?.name || "—"; sub = "Client"; clientId = c?.id || clientId; }
      if (type === "project") { const p = projects.find(x => x.id === id); title = p?.name || "—"; projectId = p?.id || null; sub = clients.find(x => x.id === p?.client_id)?.name || ""; clientId = p?.client_id || clientId; }
      if (type === "deliverable") { const d = deliverables.find(x => x.id === id); title = d?.title || "—"; projectId = d?.project_id || null; const p = projects.find(x => x.id === d?.project_id); sub = clients.find(x => x.id === p?.client_id)?.name || ""; clientId = p?.client_id || clientId; }
      let seen = ""; try { seen = localStorage.getItem(readKey(id)) || ""; } catch { /* ignore */ }
      const lastClientIdx = list.map(m => m.author_type).lastIndexOf("client");
      const clientWaiting = lastClientIdx >= 0 && !list.slice(lastClientIdx + 1).some(m => m.author_type === "member" && m.visibility === "client");
      out.push({ id, type, title, sub, last, unread: last.created_at > seen && last.author_member_id !== me?.id, clientWaiting, mentionsMe: list.some(m => me && m.mentions?.includes(me.id) && m.created_at > seen), clientId, projectId });
    }
    return out.sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  }, [messages, clients, projects, deliverables, me]);
}

export function Inbox() {
  const { L, lang } = useI18n();
  const { ws } = useWorkspace();
  const [sp, setSp] = useSearchParams();
  const [filter, setFilter] = useState<"all" | "unread" | "client" | "mentions">("all");
  const threads = useThreads();
  const { rows: clients } = useRows("clients", { workspace_id: ws.id });
  const { rows: deliverables } = useRows("deliverables", { workspace_id: ws.id });
  const open = sp.get("t");
  const shown = threads.filter(t => filter === "all" || (filter === "unread" ? t.unread : filter === "client" ? t.clientWaiting : t.mentionsMe));
  const cur = threads.find(t => t.id === open) || null;
  const typeLabel = (t: ThreadType) => t === "client" ? L("Client chat", "شات العميل") : t === "project" ? L("Project", "مشروع") : L("Deliverable", "تسليمة");
  const href = (t: ThreadRow) => t.type === "client" ? "/clients/" + t.id : t.type === "project" ? "/projects/" + t.id + "?tab=chat" : "/deliverables/" + t.id;

  return <div className="page" style={{ maxWidth: 1360 }}>
    <div className="page-head"><div className="page-head__t"><h1>{L("Inbox", "المحادثات")}</h1><p className="muted">{L("Team talk and client messages, each next to the work it's about.", "كلام الفريق ورسايل العملاء، كل كلام جنب الشغل اللي بيتكلم عنه.")}</p></div></div>
    <div className="seg" style={{ justifySelf: "start" }}>{(["all", "unread", "client", "mentions"] as const).map(k => <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{({ all: L("All", "الكل"), unread: L("Unread", "غير مقروء"), client: L("Client is waiting", "العميل مستني رد"), mentions: L("Mentions me", "إشارات ليا") })[k]}</button>)}</div>
    <div className={"card inbox" + (cur ? " has-open" : "")} style={{ overflow: "hidden" }}>
      <div className="inbox__list">
        {shown.length === 0 && <Empty icon={<MessagesSquare />} title={L("No conversations here", "مفيش محادثات هنا")} text={L("Open any client, project or deliverable and write the first message.", "افتح أي عميل أو مشروع أو تسليمة واكتب أول رسالة.")} />}
        {shown.map(t => <button key={t.id} className={"inbox__item" + (open === t.id ? " on" : "")} onClick={() => setSp({ t: t.id })}>
          <Avatar name={t.last.author_name} size="sm" />
          <span className="li__main"><span className="row" style={{ gap: 6, flexWrap: "nowrap" }}><b className="ellipsis">{t.title}</b>{t.clientWaiting && <span className="pill pill--info pill--plain" style={{ height: 20 }}>{L("Client", "العميل")}</span>}</span>
            <span className="li__s">{typeLabel(t.type)}{t.sub && t.type !== "client" ? " · " + t.sub : ""} · {ago(t.last.created_at, lang)}</span>
            <span className="li__s" style={{ color: "var(--text-2)" }}>{t.last.visibility === "internal" ? "🔒 " : ""}{t.last.author_name}: {t.last.body || L("sent a file", "بعت ملف")}</span></span>
          {t.unread && <span className="unread" />}
        </button>)}
      </div>
      <div className="inbox__pane">
        {cur ? <>
          <div className="inbox__head">
            <div className="row"><button className="icon-btn top__burger" onClick={() => setSp({})} aria-label={L("Back", "رجوع")}><ArrowLeft className="flip-rtl" /></button><div><b>{cur.title}</b><div className="faint small">{typeLabel(cur.type)}{cur.sub && cur.type !== "client" ? " · " + cur.sub : ""}</div></div></div>
            <Link className="btn btn--sm" to={href(cur)}><ExternalLink />{L("Open", "فتح")}</Link>
          </div>
          <Thread key={cur.id} type={cur.type} threadId={cur.id} client={clients.find(c => c.id === cur.clientId) || null} projectId={cur.projectId} deliverable={cur.type === "deliverable" ? deliverables.find(d => d.id === cur.id) || null : null} height={520} />
        </> : <Empty icon={<MessagesSquare />} title={L("Pick a conversation", "اختار محادثة")} />}
      </div>
    </div>
  </div>;
}
