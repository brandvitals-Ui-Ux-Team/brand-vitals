// Home: one question answered — "what needs me today?"
import { BellRing, CalendarDays, CheckCircle2, Clock3, MessageCircle, PencilRuler, Plus, Send, Sparkles, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SendFlow } from "../components/SendFlow";
import { Empty, Prio, StatusPill, Thumb, useAction } from "../components/ui";
import { markReminded, portalWhatsApp } from "../lib/actions";
import { ago, date, isOverdue, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { daysBetween } from "../lib/logic";
import type { Client, Deliverable } from "../lib/types";
import { useWorkspace } from "../lib/ws";
import { STATUS_COLOR } from "./Calendar";

export function Dashboard() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const { run } = useAction();
  const [send, setSend] = useState(false);
  const f = { workspace_id: ws.id };
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: versions } = useRows("versions", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const { rows: cos } = useRows("change_orders", f);
  const { rows: feedback } = useRows("feedback", f);
  const { rows: tasks } = useRows("tasks", f);

  const proj = (id: string) => projects.find(p => p.id === id);
  const clientOf = (pid: string) => clients.find(c => c.id === proj(pid)?.client_id);
  const latest = (did: string) => versions.filter(v => v.deliverable_id === did).sort((a, b) => b.number - a.number)[0];
  const remindAfter = ws.remind_after_days || 2;

  const waiting = deliverables.filter(d => d.status === "in_review");
  const changes = deliverables.filter(d => d.status === "changes");
  const month = new Date().toISOString().slice(0, 7);
  const earned = cos.filter(c => c.status === "approved" && (c.decided_at || "").startsWith(month)).reduce((s, c) => s + Number(c.amount), 0);
  const extraSpotted = feedback.filter(x => x.kind === "changes" && !x.resolved && x.classification === "new_request");
  const coWaiting = cos.filter(c => c.status === "sent");

  // waiting items grouped by client → one reminder per client
  const groups = useMemo(() => {
    const m = new Map<string, { client: Client; items: Deliverable[] }>();
    for (const d of waiting) { const c = clientOf(d.project_id); if (!c) continue; if (!m.has(c.id)) m.set(c.id, { client: c, items: [] }); m.get(c.id)!.items.push(d); }
    return [...m.values()].map(g => {
      const oldest = Math.max(...g.items.map(d => daysBetween(d.sent_at || d.created_at)));
      const lastReminded = g.items.map(d => d.reminded_at).filter(Boolean).sort().pop() || null;
      const due = oldest >= remindAfter && (!lastReminded || daysBetween(lastReminded) >= remindAfter);
      return { ...g, oldest, lastReminded, due };
    }).sort((a, b) => Number(b.due) - Number(a.due) || b.oldest - a.oldest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, clients, projects, remindAfter]);
  const dueGroups = groups.filter(g => g.due);

  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const comingUp = deliverables.filter(d => d.publish_date && d.publish_date >= today && d.publish_date <= in7).sort((a, b) => a.publish_date!.localeCompare(b.publish_date!));
  const notApproved = comingUp.filter(d => d.status !== "approved").length;
  const myTasks = tasks.filter(t => t.assignee_id === me?.id && t.status !== "done").sort((a, b) => (a.due_date || "9").localeCompare(b.due_date || "9")).slice(0, 5);
  const hello = new Date().getHours() < 12 ? L("Good morning", "صباح الخير") : L("Good evening", "مساء الخير");

  const summary: string[] = [];
  if (dueGroups.length) summary.push(L(`${dueGroups.length} client(s) to nudge`, `${dueGroups.length} عميل محتاج تذكير`));
  if (changes.length) summary.push(L(`${changes.length} change request(s) for the team`, `${changes.length} طلب تعديل للفريق`));
  if (notApproved) summary.push(L(`${notApproved} post(s) going live this week not approved yet`, `${notApproved} بوست هينزل الأسبوع ده ولسه ما اتوافقش عليه`));
  if (extraSpotted.length) summary.push(L(`${extraSpotted.length} request(s) that look like extra work`, `${extraSpotted.length} طلب شكله شغل إضافي`));

  const remind = (g: typeof groups[number]) => {
    if (!g.client.phone) return;
    window.open(portalWhatsApp(ws, g.client, g.items.length), "_blank", "noopener");
    run(() => markReminded(g.items), L("Reminder sent", "اتبعت التذكير"));
  };

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t">
        <h1>{hello}, {me?.name?.split(" ")[0]}</h1>
        <p className="muted">{summary.length ? summary.join(" · ") : L("All clear. Nothing is waiting on you.", "كله تمام. مفيش حاجة مستنياك.")}</p>
      </div>
      <div className="row"><Link className="btn" to="/calendar"><CalendarDays />{L("Calendar", "التقويم")}</Link><button className="btn btn--primary btn--lg" onClick={() => setSend(true)}><Send />{L("Send for approval", "ابعت للموافقة")}</button></div>
    </div>

    <div className="grid3">
      <Link to="/approvals" className="today-card"><span className="kpi__l"><Clock3 size={15} />{L("Waiting on clients", "عند العملاء")}</span><span className="big-stat"><b>{waiting.length}</b>{groups[0] && <span className="faint small">{L(`oldest ${groups[0].oldest}d`, `أقدم واحدة ${groups[0].oldest} يوم`)}</span>}</span></Link>
      <Link to="/approvals" className="today-card"><span className="kpi__l"><PencilRuler size={15} />{L("Changes to make", "تعديلات مطلوبة")}</span><span className="big-stat"><b>{changes.length}</b></span></Link>
      <Link to="/extra-work" className="today-card" style={{ background: "var(--accent-soft)", borderColor: "transparent" }}><span className="kpi__l"><Wallet size={15} />{L("Extra work earned this month", "شغل إضافي اتحصّل الشهر ده")}</span><span className="big-stat"><b style={{ color: "var(--accent)" }}>{money(earned, ws.currency, lang)}</b>{coWaiting.length > 0 && <span className="faint small">{L(`+${coWaiting.length} awaiting`, `+${coWaiting.length} منتظرة`)}</span>}</span></Link>
    </div>

    <div className="split">
      <div className="stack" style={{ gap: 20 }}>
        <div className="card">
          <div className="card__h"><h2 className="row"><BellRing size={18} />{L("Waiting on clients", "مستني العملاء")}</h2><span className="faint small">{L(`reminder after ${remindAfter} days`, `تذكير بعد ${remindAfter} يوم`)}</span></div>
          {groups.length === 0 ? <Empty icon={<CheckCircle2 />} title={L("Nothing waiting on clients", "مفيش حاجة مستنية العملاء")} action={<button className="btn btn--primary" onClick={() => setSend(true)}><Send />{L("Send for approval", "ابعت للموافقة")}</button>} /> :
            groups.map(g => <div key={g.client.id} className="client-group">
              <div className="client-group__h">
                <div className="li__main"><Link to={"/clients/" + g.client.id} className="li__t">{g.client.name}</Link><span className="li__s">{L(`${g.items.length} waiting · oldest ${g.oldest}d`, `${g.items.length} مستنية · أقدم واحدة ${g.oldest} يوم`)}{g.lastReminded ? " · " + L("reminded ", "اتفكّر ") + ago(g.lastReminded, lang) : ""}</span></div>
                {g.client.phone && <button className={"btn btn--sm " + (g.due ? "btn--wa" : "")} onClick={() => remind(g)}><MessageCircle />{g.due ? L("Remind now", "فكّره دلوقتي") : L("Remind", "فكّره")}</button>}
              </div>
              <div className="client-group__items">{g.items.map(d => <Link key={d.id} to={"/deliverables/" + d.id} className="mini"><Thumb v={latest(d.id)} kind={d.kind} /><b>{d.title}</b><span className="faint">{L(`${daysBetween(d.sent_at || d.created_at)}d`, `${daysBetween(d.sent_at || d.created_at)} يوم`)}</span></Link>)}</div>
            </div>)}
        </div>

        <div className="card">
          <div className="card__h"><h2 className="row"><PencilRuler size={18} />{L("Changes to make", "تعديلات مطلوبة")}</h2></div>
          {changes.length === 0 ? <Empty icon={<CheckCircle2 />} title={L("No open change requests", "مفيش طلبات تعديل")} /> :
            <div className="list">{changes.map(d => { const fb = feedback.filter(x => x.deliverable_id === d.id && x.kind === "changes").sort((a, b) => b.created_at.localeCompare(a.created_at))[0]; return <Link key={d.id} to={"/deliverables/" + d.id} className="li">
              <Thumb v={latest(d.id)} kind={d.kind} />
              <span className="li__main"><span className="li__t">{d.title}</span><span className="li__s">{clientOf(d.project_id)?.name} · “{fb?.comment || (fb?.pins?.length ? L(`${fb.pins.length} notes on the image`, `${fb.pins.length} ملاحظات على الصورة`) : "")}”</span></span>
              {fb?.classification === "new_request" && <span className="pill pill--violet hide-sm"><Sparkles size={12} />{L("Extra work?", "شغل إضافي؟")}</span>}
            </Link>; })}</div>}
        </div>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <div className="card">
          <div className="card__h"><h2 className="row"><CalendarDays size={18} />{L("Going live this week", "نازل الأسبوع ده")}</h2><Link className="btn btn--ghost btn--sm" to="/calendar">{L("Calendar", "التقويم")}</Link></div>
          {comingUp.length === 0 ? <p className="muted small" style={{ padding: 16 }}>{L("Nothing scheduled in the next 7 days.", "مفيش حاجة متجدولة في الأيام الجاية.")}</p> :
            <div className="list">{comingUp.map(d => <Link key={d.id} to={"/deliverables/" + d.id} className="li">
              <span className="dot-color" style={{ background: STATUS_COLOR[d.status], borderRadius: 99 }} />
              <span className="li__main"><span className="li__t">{d.title}</span><span className="li__s">{clientOf(d.project_id)?.name} · {date(d.publish_date, lang, { weekday: "short", day: "numeric", month: "short" })}</span></span>
              {d.status !== "approved" && <StatusPill s={d.status} />}
            </Link>)}</div>}
        </div>
        <div className="card">
          <div className="card__h"><h2>{L("My tasks", "مهامي")}</h2><Link className="btn btn--ghost btn--sm" to="/tasks?new=1"><Plus />{L("Add", "إضافة")}</Link></div>
          {myTasks.length === 0 ? <p className="muted small" style={{ padding: 16 }}>{L("No open tasks.", "مفيش مهام مفتوحة.")}</p> :
            <div className="list">{myTasks.map(t => <Link key={t.id} to={"/tasks?open=" + t.id} className="li"><span className="li__main"><span className="li__t">{t.title}</span>{t.due_date && <span className={"li__s" + (isOverdue(t.due_date) ? " due--over" : "")}>{date(t.due_date, lang)}</span>}</span><Prio p={t.priority} /></Link>)}</div>}
        </div>
      </div>
    </div>
    {send && <SendFlow onClose={() => setSend(false)} />}
  </div>;
}
