import { AlarmClock, BadgeDollarSign, CheckCircle2, Clock3, MessageCircle, PencilRuler, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { reminderWhatsApp } from "../lib/actions";
import { summary } from "../lib/activity";
import { ago, date, isOverdue, money } from "../lib/format";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { daysBetween, scopeUsage } from "../lib/logic";
import { useWorkspace } from "../lib/ws";
import { Avatar, Empty, Prio, StatusPill, Thumb } from "../components/ui";

export function Dashboard() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const f = { workspace_id: ws.id };
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: versions } = useRows("versions", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const { rows: cos } = useRows("change_orders", f);
  const { rows: feedback } = useRows("feedback", f);
  const { rows: tasks } = useRows("tasks", f);
  const { rows: scope } = useRows("scope_items", f);
  const { rows: activity } = useRows("activity", f);

  const proj = (id: string) => projects.find(p => p.id === id);
  const clientOf = (pid: string) => clients.find(c => c.id === proj(pid)?.client_id);
  const latest = (did: string) => versions.filter(v => v.deliverable_id === did).sort((a, b) => b.number - a.number)[0];

  const waiting = deliverables.filter(d => d.status === "in_review").sort((a, b) => (a.sent_at || "").localeCompare(b.sent_at || ""));
  const changes = deliverables.filter(d => d.status === "changes");
  const month = new Date().toISOString().slice(0, 7);
  const approvedMonth = deliverables.filter(d => d.status === "approved" && (d.approved_at || "").startsWith(month)).length;
  const recovered = cos.filter(c => c.status === "approved" && (c.decided_at || "").startsWith(month)).reduce((s, c) => s + Number(c.amount), 0);
  const pendingCO = cos.filter(c => c.status === "sent").reduce((s, c) => s + Number(c.amount), 0);
  const avgWait = waiting.length ? Math.round(waiting.reduce((s, d) => s + daysBetween(d.sent_at || d.created_at), 0) / waiting.length * 10) / 10 : 0;
  const approvedTimes = deliverables.filter(d => d.approved_at && d.sent_at).map(d => (new Date(d.approved_at!).getTime() - new Date(d.sent_at!).getTime()) / 86400000).filter(x => x >= 0);
  const avgApproval = approvedTimes.length ? Math.round(approvedTimes.reduce((a, b) => a + b, 0) / approvedTimes.length * 10) / 10 : null;

  const newRequests = feedback.filter(x => x.kind === "changes" && !x.resolved && x.classification === "new_request");
  const overLimit = deliverables.filter(d => d.out_of_scope && d.status !== "approved");
  const scopeAlerts = useMemo(() => scope.map(s => ({ s, u: scopeUsage(s, deliverables) })).filter(x => x.u.over > 0 || (x.s.period === "month" && x.u.used >= x.u.total)), [scope, deliverables]);
  const myTasks = tasks.filter(t => t.assignee_id === me?.id && t.status !== "done").sort((a, b) => (a.due_date || "9").localeCompare(b.due_date || "9")).slice(0, 6);
  const recent = [...activity].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);
  const hello = new Date().getHours() < 12 ? L("Good morning", "صباح الخير") : L("Good evening", "مساء الخير");

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t">
        <h1>{hello}, {me?.name?.split(" ")[0]}</h1>
        <p className="muted">{waiting.length + changes.length > 0
          ? L(`${waiting.length} waiting on clients, ${changes.length} need your team.`, `${waiting.length} عند العملاء، و${changes.length} محتاجين فريقك.`)
          : L("Everything is approved. Nice.", "كل حاجة متوافق عليها. ممتاز.")}</p>
      </div>
      <div className="row"><Link className="btn" to="/tasks?new=1">{L("New task", "مهمة جديدة")}</Link><Link className="btn btn--primary" to="/approvals?new=1">{L("New deliverable", "تسليمة جديدة")}</Link></div>
    </div>

    <div className="grid4">
      <div className="card kpi"><span className="kpi__l"><Clock3 />{L("Waiting on clients", "عند العملاء")}</span><span className="kpi__v">{waiting.length}</span><span className="kpi__s">{L(`avg ${avgWait} days waiting`, `متوسط الانتظار ${avgWait} يوم`)}</span></div>
      <div className="card kpi"><span className="kpi__l"><PencilRuler />{L("Changes requested", "مطلوب تعديل")}</span><span className="kpi__v">{changes.length}</span><span className="kpi__s">{L(`${newRequests.length} look like new requests`, `${newRequests.length} شكلهم طلبات جديدة`)}</span></div>
      <div className="card kpi"><span className="kpi__l"><CheckCircle2 />{L("Approved this month", "اتوافق عليها الشهر ده")}</span><span className="kpi__v">{approvedMonth}</span><span className="kpi__s">{avgApproval == null ? "—" : L(`avg ${avgApproval} days to approve`, `متوسط ${avgApproval} يوم للموافقة`)}</span></div>
      <div className="card kpi kpi--accent"><span className="kpi__l"><BadgeDollarSign />{L("Recovered this month", "اتحصّل الشهر ده")}</span><span className="kpi__v">{money(recovered, ws.currency, lang)}</span><span className="kpi__s">{L(`${money(pendingCO, ws.currency, lang)} awaiting approval`, `${money(pendingCO, ws.currency, lang)} بانتظار الموافقة`)}</span></div>
    </div>

    {(newRequests.length > 0 || overLimit.length > 0 || scopeAlerts.length > 0) && <div className="card">
      <div className="card__h"><h2 className="row"><ShieldAlert size={18} color="var(--violet)" />{L("Scope guard", "حارس النطاق")}</h2><span className="faint small">{L("Work that may be billable", "شغل ممكن يتحاسب عليه")}</span></div>
      <div className="list">
        {newRequests.map(fb => { const d = deliverables.find(x => x.id === fb.deliverable_id); if (!d) return null; return <Link key={fb.id} to={"/deliverables/" + d.id} className="li">
          <span className="tl__ico tl__ico--violet"><Sparkles /></span>
          <span className="li__main"><span className="li__t">{L("Looks like a new request", "شكله طلب جديد")}: “{fb.comment}”</span><span className="li__s">{fb.author_name} · {d.title} · {clientOf(d.project_id)?.name}</span></span>
          <span className="btn btn--sm">{L("Create change order", "إنشاء أمر تغيير")}</span>
        </Link>; })}
        {overLimit.map(d => <Link key={d.id} to={"/deliverables/" + d.id} className="li">
          <span className="tl__ico tl__ico--warn"><AlarmClock /></span>
          <span className="li__main"><span className="li__t">{d.title}: {L(`${d.revision_count} revision rounds, over the included limit`, `${d.revision_count} جولات تعديل، أكتر من المتفق عليه`)}</span><span className="li__s">{clientOf(d.project_id)?.name} · {proj(d.project_id)?.name}</span></span>
          <StatusPill s={d.status} />
        </Link>)}
        {scopeAlerts.map(({ s, u }) => <Link key={s.id} to={"/projects/" + s.project_id + "?tab=scope"} className="li">
          <span className={"tl__ico " + (u.over ? "tl__ico--bad" : "tl__ico--warn")}><ShieldAlert /></span>
          <span className="li__main"><span className="li__t">{s.title}: {u.used}/{u.total} {s.period === "month" ? L("this month", "الشهر ده") : L("used", "مستخدم")}</span><span className="li__s">{clientOf(s.project_id)?.name} · {proj(s.project_id)?.name}</span></span>
          <span className={"pill " + (u.over ? "pill--bad" : "pill--warn")}>{u.over ? L(`${u.over} over`, `${u.over} زيادة`) : L("At limit", "وصل للحد")}</span>
        </Link>)}
      </div>
    </div>}

    <div className="split">
      <div className="stack" style={{ gap: 20 }}>
        <div className="card">
          <div className="card__h"><h2>{L("Waiting on clients", "مستني العملاء")}</h2><Link className="btn btn--ghost btn--sm" to="/approvals">{L("View all", "عرض الكل")}</Link></div>
          {waiting.length === 0 ? <Empty icon={<CheckCircle2 />} title={L("Nothing waiting", "مفيش حاجة مستنية")} text={L("Send a deliverable for review and it shows up here.", "ابعت تسليمة للمراجعة وهتظهر هنا.")} /> :
            <div className="list">{waiting.slice(0, 7).map(d => { const c = clientOf(d.project_id); const days = daysBetween(d.sent_at || d.created_at); return <div key={d.id} className="li">
              <Thumb v={latest(d.id)} kind={d.kind} />
              <Link to={"/deliverables/" + d.id} className="li__main"><span className="li__t">{d.title} <span className="faint small">v{d.current_version}</span></span><span className="li__s">{c?.name} · {proj(d.project_id)?.name}</span></Link>
              <span className={"pill pill--plain " + (days >= 3 ? "pill--bad" : days >= 2 ? "pill--warn" : "")}>{days === 0 ? L("today", "النهارده") : L(`${days}d`, `${days} يوم`)}</span>
              {c?.phone && <a className="btn btn--sm btn--wa hide-sm" href={reminderWhatsApp(ws, c, d)} target="_blank" rel="noopener"><MessageCircle />{L("Remind", "فكّره")}</a>}
            </div>; })}</div>}
        </div>

        <div className="card">
          <div className="card__h"><h2>{L("Needs your team", "محتاج فريقك")}</h2></div>
          {changes.length === 0 ? <Empty icon={<CheckCircle2 />} title={L("No open change requests", "مفيش طلبات تعديل مفتوحة")} /> :
            <div className="list">{changes.map(d => { const fb = feedback.filter(x => x.deliverable_id === d.id && x.kind === "changes").sort((a, b) => b.created_at.localeCompare(a.created_at))[0]; return <Link key={d.id} to={"/deliverables/" + d.id} className="li">
              <Thumb v={latest(d.id)} kind={d.kind} />
              <span className="li__main"><span className="li__t">{d.title}</span><span className="li__s">“{fb?.comment}” · {fb?.author_name}</span></span>
              {fb?.classification === "new_request" && <span className="pill pill--violet hide-sm">{L("New request?", "طلب جديد؟")}</span>}
              <StatusPill s={d.status} />
            </Link>; })}</div>}
        </div>
      </div>

      <div className="stack" style={{ gap: 20 }}>
        <div className="card">
          <div className="card__h"><h2>{L("My tasks", "مهامي")}</h2><Link className="btn btn--ghost btn--sm" to="/tasks">{L("Board", "اللوحة")}</Link></div>
          {myTasks.length === 0 ? <Empty icon={<CheckCircle2 />} title={L("You're clear", "مفيش مهام")} /> :
            <div className="list">{myTasks.map(t => <Link key={t.id} to={"/tasks?open=" + t.id} className="li">
              <span className="li__main"><span className="li__t">{t.title}</span><span className="li__s">{t.project_id ? proj(t.project_id)?.name : L("No project", "بدون مشروع")}</span></span>
              <span className="stack" style={{ gap: 2, justifyItems: "end" }}><Prio p={t.priority} />{t.due_date && <span className={"due" + (isOverdue(t.due_date) ? " due--over" : "")}>{date(t.due_date, lang)}</span>}</span>
            </Link>)}</div>}
        </div>
        <div className="card">
          <div className="card__h"><h2>{L("Recent activity", "آخر النشاط")}</h2><Link className="btn btn--ghost btn--sm" to="/ledger">{L("Ledger", "السجل")}</Link></div>
          <div className="list">{recent.map(a => <div key={a.id} className="li"><Avatar name={a.actor} size="sm" /><span className="li__main"><span style={{ fontSize: 13 }}><b>{a.actor}</b> {summary(a.summary, lang)}</span><span className="li__s">{ago(a.created_at, lang)}</span></span></div>)}</div>
        </div>
      </div>
    </div>
  </div>;
}
