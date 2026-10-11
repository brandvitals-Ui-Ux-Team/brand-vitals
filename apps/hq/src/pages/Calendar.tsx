// Content calendar: what goes live when, for every client. Drag to reschedule,
// "+" to plan a post, and send a whole month to a client in one message.
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SendFlow } from "../components/SendFlow";
import { useAction } from "../components/ui";
import { sendBatch } from "../lib/actions";
import { ChannelButton } from "../components/ChannelButton";
import { reminderMsg } from "../lib/channels";
import { api } from "../lib/api";
import { useRows } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { DeliverableStatus } from "../lib/types";
import { useWorkspace } from "../lib/ws";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const STATUS_COLOR: Record<DeliverableStatus, string> = { draft: "var(--text-3)", in_review: "var(--info)", changes: "var(--warn)", approved: "var(--ok)" };

export function Calendar() {
  const { L, lang } = useI18n();
  const { ws, me } = useWorkspace();
  const nav = useNavigate();
  const { run } = useAction();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [client, setClient] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const f = { workspace_id: ws.id };
  const { rows: deliverables } = useRows("deliverables", f);
  const { rows: projects } = useRows("projects", f);
  const { rows: clients } = useRows("clients", f);
  const proj = (id: string) => projects.find(p => p.id === id);

  // Weeks start on Saturday (Egypt and most of the Gulf).
  const days = useMemo(() => {
    const start = new Date(month); start.setDate(1 - ((month.getDay() + 1) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);
  const items = deliverables.filter(d => d.publish_date && (!client || proj(d.project_id)?.client_id === client));
  const byDay = (k: string) => items.filter(d => d.publish_date === k);
  const monthKey = iso(month).slice(0, 7);
  const inMonth = items.filter(d => d.publish_date!.startsWith(monthKey));
  const ready = inMonth.filter(d => d.current_version > 0 && (d.status === "draft" || d.status === "changes"));
  const planned = inMonth.filter(d => d.current_version === 0).length;
  const c = clients.find(x => x.id === client);
  const todayKey = iso(new Date());
  const dow = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 3 + i).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "short" }));

  const waitingAfter = deliverables.filter(d => proj(d.project_id)?.client_id === client && (d.status === "in_review" || ready.some(r => r.id === d.id))).length;

  return <div className="page">
    <div className="page-head">
      <div className="page-head__t"><h1>{L("Calendar", "التقويم")}</h1><p className="muted">{L("Plan posts by publish date, drag to move them, and send a month for approval in one message.", "خطّط البوستات بتاريخ النشر، اسحبها لتغيّر يومها، وابعت الشهر كله للموافقة في رسالة واحدة.")}</p></div>
      <button className="btn btn--primary" onClick={() => setPlan(todayKey)}><Plus />{L("Plan a post", "خطّط لبوست")}</button>
    </div>
    <div className="row row--between">
      <div className="row">
        <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label={L("Previous month", "الشهر السابق")}><ChevronLeft className="flip-rtl" /></button>
        <h2 style={{ minWidth: 150, textAlign: "center" }}>{month.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" })}</h2>
        <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label={L("Next month", "الشهر التالي")}><ChevronRight className="flip-rtl" /></button>
        <button className="btn btn--sm" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>{L("Today", "النهارده")}</button>
      </div>
      <select className="sel" style={{ width: "auto" }} value={client} onChange={e => setClient(e.target.value)}><option value="">{L("All clients", "كل العملاء")}</option>{clients.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
    </div>

    {client && <div className="callout callout--info"><CalendarDays /><div style={{ flex: 1 }}>
      <b>{c?.name}: {L(`${inMonth.length} items this month`, `${inMonth.length} حاجة الشهر ده`)}</b>
      <p className="small muted">{L(`${ready.length} ready to send · ${planned} still need the file`, `${ready.length} جاهزين للإرسال · ${planned} لسه محتاجين الملف`)}</p>
    </div>{ready.length > 0 && c && <ChannelButton client={c} before={() => sendBatch(ws, me, ready)} build={() => reminderMsg(ws, c, waitingAfter)} label={() => L(`Send ${ready.length} for approval`, `ابعت ${ready.length} للموافقة`)} />}</div>}

    <div className="legend">
      <span><i style={{ background: STATUS_COLOR.draft }} />{L("Planned / draft", "متخطط / مسودة")}</span>
      <span><i style={{ background: STATUS_COLOR.in_review }} />{L("Waiting on client", "عند العميل")}</span>
      <span><i style={{ background: STATUS_COLOR.changes }} />{L("Changes requested", "مطلوب تعديل")}</span>
      <span><i style={{ background: STATUS_COLOR.approved }} />{L("Approved", "معتمد")}</span>
    </div>

    <div className="cal" role="grid">
      {dow.map(d => <div key={d} className="cal__dow">{d}</div>)}
      {days.map(day => {
        const k = iso(day);
        const list = byDay(k);
        return <div key={k} className={"cal__d" + (day.getMonth() !== month.getMonth() ? " out" : "") + (k === todayKey ? " today" : "") + (over === k ? " drop" : "")}
          onDragOver={e => { e.preventDefault(); setOver(k); }} onDragLeave={() => setOver(o => (o === k ? null : o))}
          onDrop={e => { e.preventDefault(); setOver(null); const id = drag; setDrag(null); if (id) run(() => api.update("deliverables", id, { publish_date: k })); }}>
          <div className="cal__top"><span className="cal__n">{day.getDate()}</span><button className="cal__add" onClick={() => setPlan(k)} aria-label={L("Plan a post on this day", "خطّط لبوست في اليوم ده")}><Plus /></button></div>
          {list.slice(0, 4).map(d => <button key={d.id} className="ev" draggable onDragStart={() => setDrag(d.id)} onClick={() => nav("/deliverables/" + d.id)}
            style={{ ["--c" as string]: proj(d.project_id)?.color, ["--s" as string]: STATUS_COLOR[d.status] }} title={d.title}><i /><span>{d.title}</span></button>)}
          {list.length > 4 && <span className="faint small">+{list.length - 4}</span>}
        </div>;
      })}
    </div>
    {plan && <SendFlow planOnly publishDate={plan} clientId={client || undefined} onClose={() => setPlan(null)} />}
  </div>;
}
