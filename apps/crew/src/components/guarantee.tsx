// The delivery guarantee, made visible: the client's protected timeline, the quality-rule
// meters (QA rounds, client chances) and the record of every switch we made.
import { ArrowRightLeft, CalendarCheck2, Flag, Repeat2, ShieldCheck } from "lucide-react";
import { date } from "../../../hq/src/lib/format";
import { useI18n } from "../../../hq/src/lib/i18n";
import { CLIENT_CHANCES, MAX_QA_ROUNDS, talentOf, timeline, useDB } from "../lib/store";
import type { Brief } from "../lib/types";

export function Timeline({ b, who = "client" }: { b: Brief; who?: "client" | "talent" | "ops" }) {
  const { L, lang } = useI18n();
  const t = timeline(b);
  const done = b.status === "delivered";
  const d = (x: Date) => date(x.toISOString(), lang, { day: "numeric", month: "short" });
  const late = !done && t.daysLeft < 0;
  return <div className="tline">
    <div className="tline__h">
      <span className="tline__badge"><ShieldCheck size={16} />{done ? L("Delivered on time", "اتسلّم في ميعاده") : who === "talent" ? L("Your due date", "ميعادك") : L("Deadline protected", "الميعاد مضمون")}</span>
      <b className="tline__big">{who === "talent" ? d(t.talentDue) : d(t.end)}</b>
      {!done && <span className="small muted">{late ? L("Overdue", "متأخر") : L(`${Math.max(0, t.daysLeft)} days left`, `فاضل ${Math.max(0, t.daysLeft)} يوم`)}</span>}
    </div>
    <div className="tline__bar" aria-hidden><i style={{ width: `${done ? 100 : t.pct}%` }} />
      <span className="tline__mark" style={{ insetInlineStart: `${Math.max(0, Math.min(100, ((t.talentDue.getTime() - t.start.getTime()) / Math.max(1, t.end.getTime() - t.start.getTime())) * 100))}%` }} />
    </div>
    <div className="tline__legend small">
      <span><Flag size={13} />{L("Kickoff", "البداية")} · {d(t.start)}</span>
      <span><Repeat2 size={13} />{L("Talent due + our QA", "تسليم الموهبة + مراجعتنا")} · {d(t.talentDue)}</span>
      <span><CalendarCheck2 size={13} />{L("Final to client", "التسليم النهائي")} · {d(t.end)}</span>
    </div>
    {who === "client" && <p className="small muted">{L("If a talent needs replacing, we do it inside this buffer, at our cost. Your price and your date don't move.", "لو احتجنا نغيّر الموهبة، بنعمل ده جوه الوقت ده وعلى حسابنا. السعر والميعاد مابيتغيروش.")}</p>}
  </div>;
}

export function RuleMeters({ b }: { b: Brief }) {
  const { L } = useI18n();
  const Dots = ({ n, max, warn }: { n: number; max: number; warn: boolean }) => <span className="dots">{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? (warn ? "on warn" : "on") : ""} />)}</span>;
  return <div className="meters">
    <div className="meter"><span className="small"><b>{L("QA rounds", "جولات المراجعة")}</b> {b.qa_returns}/{MAX_QA_ROUNDS}</span><Dots n={b.qa_returns} max={MAX_QA_ROUNDS} warn={b.qa_returns >= MAX_QA_ROUNDS - 1} /></div>
    <div className="meter"><span className="small"><b>{L("Client chances", "فرص العميل")}</b> {b.client_strikes}/{CLIENT_CHANCES}</span><Dots n={b.client_strikes} max={CLIENT_CHANCES} warn={b.client_strikes >= CLIENT_CHANCES - 1} /></div>
  </div>;
}

export function Switches({ b }: { b: Brief }) {
  const { L, lang } = useI18n();
  const db = useDB();
  if (!b.switches.length) return null;
  return <div className="switches">{b.switches.map((s, i) => <div key={i} className="switch">
    <ArrowRightLeft size={18} />
    <div><b>{L("We switched the talent", "غيّرنا الموهبة")}</b> · <span className="small muted">{date(s.at, lang, { day: "numeric", month: "short" })}</span>
      <p className="small">{talentOf(db, s.from)?.name} → {talentOf(db, s.to)?.name}. {s.reason === "qa" ? L(`${MAX_QA_ROUNDS} quality rounds returned.`, `${MAX_QA_ROUNDS} جولات مراجعة اترجعت.`) : L(`${CLIENT_CHANCES} deliveries didn't match the brief.`, `${CLIENT_CHANCES} تسليمات ماكانتش زي البريف.`)} {L("At our cost. Price and deadline unchanged.", "على حسابنا. السعر والميعاد زي ما هم.")}</p></div>
  </div>)}</div>;
}

export function TheRules({ compact }: { compact?: boolean }) {
  const { L } = useI18n();
  const rules: [string, string, string, string][] = [
    ["01", L("Portfolio first", "البورتفوليو الأول"), L("Nobody works before a reviewer approves their portfolio, test and interview.", "محدش بيشتغل قبل ما مراجع يوافق على البورتفوليو والاختبار والمقابلة."), "lime"],
    ["02", L(`${MAX_QA_ROUNDS} QA rounds, then switch`, `${MAX_QA_ROUNDS} جولات مراجعة، وبعدين تبديل`), L(`If our QA returns the work ${MAX_QA_ROUNDS} times, the job moves to another vetted member.`, `لو المراجعة رجّعت الشغل ${MAX_QA_ROUNDS} مرات، الشغلانة بتتحول لعضو معتمد تاني.`), "pink"],
    ["03", L(`${CLIENT_CHANCES} chances with the client`, `فرصتين مع العميل`), L("Normal revisions are fine. If the work doesn't match the brief or reference twice, the third try goes to someone else.", "التعديلات العادية مفيش مشكلة. لو الشغل ماطلعش زي البريف أو الريفرنس مرتين، المحاولة التالتة بتروح لحد تاني."), "violet"],
    ["04", L("Your deadline is ours", "ميعادك مسؤوليتنا"), L("Every switch happens inside our buffer and at our cost. The client's price and date never move.", "أي تبديل بيحصل جوه وقتنا وعلى حسابنا. سعر العميل وميعاده مابيتغيروش."), "sky"]
  ];
  return <div className={"rules" + (compact ? " rules--compact" : "")}>{rules.map(([n, t, d, c]) => <div key={n} className={"rule rule--" + c}><span className="rule__n">{n}</span><b>{t}</b><span className="small">{d}</span></div>)}</div>;
}
