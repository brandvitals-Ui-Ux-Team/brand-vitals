import { Check, CheckCircle2, Clock3, Info, LayoutGrid, MousePointerClick, PencilRuler } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isImage, PinImage } from "../components/Pins";
import { SharedThread } from "../components/Thread";
import { Preview, Spinner, useToast } from "../components/ui";
import { api } from "../lib/api";
import { onChange } from "../lib/bus";
import { ago } from "../lib/format";
import { I18nProvider, useI18n } from "../lib/i18n";
import type { Dialect, Lang, Pin, ReviewPayload } from "../lib/types";

// What the client sees when they open the WhatsApp link. No account needed.
export function Review() {
  const { token = "" } = useParams();
  const [data, setData] = useState<ReviewPayload | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang | undefined>();
  const [dialect, setDialect] = useState<Dialect | undefined>();
  const load = useCallback(() => api.reviewGet(token).then(d => { setData(d); setLang(l => l || d?.client.lang); setDialect(d?.client.dialect); }).catch(() => setData(null)), [token]);
  useEffect(() => { load(); return onChange(load); }, [load]);
  return <I18nProvider force={lang} dialect={dialect}><ReviewBody data={data} token={token} setLang={setLang} reload={load} /></I18nProvider>;
}

export const nameKey = "hq-client-name";

function ReviewBody({ data, token, setLang, reload }: { data: ReviewPayload | null | undefined; token: string; setLang: (l: Lang) => void; reload: () => void }) {
  const { L, lang } = useI18n();
  const toast = useToast();
  const [pick, setPick] = useState<number | null>(null);
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [name, setName] = useState(() => localStorage.getItem(nameKey) || "");
  const [comment, setComment] = useState("");
  const [pins, setPins] = useState<Pin[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = data ? `${data.deliverable.title} · ${data.workspace.name}` : "Vitals GO"; }, [data]);
  if (data === undefined) return <Spinner />;
  if (data === null) return <div className="center" style={{ minHeight: "100vh", padding: 20 }}><div className="card card--pad stack" style={{ maxWidth: 420, textAlign: "center" }}><Info style={{ margin: "0 auto" }} /><h2>{L("This link isn't valid", "اللينك ده مش صالح")}</h2><p className="muted">{L("It may have been removed. Ask the agency for a new link.", "ممكن يكون اتشال. اطلب لينك جديد من الوكالة.")}</p></div></div>;

  const d = data.deliverable;
  const versions = data.versions;
  const shown = versions.find(v => v.number === (pick ?? d.current_version)) || versions[0];
  const isCurrent = shown && shown.number === d.current_version;
  const lastIncluded = data.revisions_included != null && d.revision_count >= data.revisions_included;
  const respond = async (action: "approved" | "changes") => {
    if (!name.trim()) { toast(L("Please write your name first", "اكتب اسمك الأول من فضلك"), "err"); return; }
    if (action === "changes" && !comment.trim() && !pins.length) { toast(L("Please describe what to change", "اكتب التعديلات المطلوبة"), "err"); return; }
    setBusy(true);
    try {
      localStorage.setItem(nameKey, name.trim());
      await api.reviewRespond(token, { action, name: name.trim(), comment: comment.trim(), pins: action === "changes" ? pins : [] });
      setComment(""); setPins([]); setMode("idle");
      toast(action === "approved" ? L("GO! Approved. Thank you.", "GO! اتوافق عليه. شكرًا.") : L("Sent to the team", "اتبعتت للفريق"));
      reload();
    } catch (e) { toast(String((e as Error).message), "err"); }
    finally { setBusy(false); }
  };

  return <div className="public">
    <div className="public__top">
      <div><b>{data.workspace.name}</b><div className="faint small">{data.project.name} · {data.client.name}</div></div>
      <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
    </div>
    <div className="public__body">
      <div className="stack" style={{ gap: 6 }}>
        <span className="faint small">{L("For your review", "للمراجعة")}</span>
        <h1>{d.title}</h1>
        <div className="row">
          {d.status === "approved" ? <span className="pill pill--ok light">{L("GO · approved", "GO · اتوافق")}</span> : d.status === "changes" ? <span className="pill pill--bad light">{L("Changes requested · team is working on it", "اتطلب تعديل · الفريق شغال عليه")}</span> : d.status === "in_review" ? <span className="pill pill--warn light">{L("Waiting for your GO", "مستني الـ GO بتاعك")}</span> : <span className="pill">{L("In progress", "قيد التنفيذ")}</span>}
          <span className="faint small">v{d.current_version}</span>
        </div>
      </div>

      {versions.length > 1 && <div className="tabs">{versions.map(v => <button key={v.id} className={shown?.number === v.number ? "on" : ""} onClick={() => setPick(v.number)}>v{v.number}{v.number === d.current_version && <span className="count">{L("latest", "الأحدث")}</span>}</button>)}</div>}
      {shown ? <>
        {isImage(shown) ? <PinImage v={shown} editable={mode === "changes" && isCurrent && d.status === "in_review"}
          pins={mode === "changes" && isCurrent ? pins : data.feedback.filter(f => f.version_number === shown.number && f.pins && f.pins.length).flatMap(f => f.pins)}
          onAdd={p => setPins(x => [...x, p])} onChange={setPins} color={mode === "changes" ? "var(--warn)" : "var(--info)"} /> : <Preview v={shown} kind={d.kind} />}
        {mode === "changes" && isImage(shown) && isCurrent && <div className="hint"><MousePointerClick />{L("Tip: tap anywhere on the image to leave a note on that exact spot.", "نصيحة: اضغط على أي مكان في الصورة عشان تسيب ملاحظة على النقطة دي بالظبط.")}</div>}
        {shown.note && <div className="callout callout--info"><Info /><div><b>{L("What changed", "إيه اللي اتغيّر")}</b><p>{shown.note}</p></div></div>}
      </> : <div className="card card--pad"><p className="muted">{L("Nothing to review yet.", "لا يوجد شيء للمراجعة بعد.")}</p></div>}

      {data.feedback.length > 0 && <div className="card">
        <div className="card__h"><h3>{L("History", "السجل")}</h3></div>
        <div className="card__b tl">{data.feedback.map((f, i) => <div className="tl__i" key={i}>
          <span className={"tl__ico " + (f.kind === "approved" ? "tl__ico--ok" : "tl__ico--warn")}>{f.kind === "approved" ? <Check /> : <PencilRuler />}</span>
          <div><b>{f.author_name}</b> <span className="faint small">{f.kind === "approved" ? L(`approved v${f.version_number}`, `وافق على v${f.version_number}`) : L(`asked for changes on v${f.version_number}`, `طلب تعديل على v${f.version_number}`)} · {ago(f.created_at, lang)}</span>{f.comment && <div className="quote">{f.comment}</div>}{f.pins && f.pins.length > 0 && <ol className="pinlist" style={{ marginTop: 6 }}>{f.pins.map((p, j) => <li key={j}><span className="pin pin--static" style={{ background: "var(--info)" }}>{j + 1}</span><span>{p.text}</span></li>)}</ol>}</div>
        </div>)}</div>
      </div>}

      {d.status === "in_review" && isCurrent && <div className="decision">
        {mode === "idle" ? <>
          <label className="field"><span>{L("Your name", "اسمك")}</span><input className="inp" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          <div className="grid2">
            <button className="btn btn--primary btn--lg btn--go" disabled={busy} onClick={() => respond("approved")}><CheckCircle2 /><b>GO</b><span>{L("Approve", "موافق")}</span></button>
            <button className="btn btn--lg" disabled={busy} onClick={() => setMode("changes")}><PencilRuler />{L("Request changes", "عايز تعديل")}</button>
          </div>
          <p className="faint small" style={{ textAlign: "center" }}>{L("Your approval is recorded with your name and the time.", "موافقتك بتتسجل باسمك والوقت.")}</p>
        </> : <>
          {lastIncluded && <div className="callout callout--warn"><Clock3 /><span className="small">{L(`You've used ${d.revision_count} of ${data.revisions_included} included revision rounds. Further rounds may be quoted separately.`, `استخدمت ${d.revision_count} من ${data.revisions_included} جولات تعديل متضمنة. الجولات الإضافية ممكن يتعملها عرض سعر منفصل.`)}</span></div>}
          <label className="field"><span>{pins.length ? L(`${pins.length} note(s) on the image. Anything else?`, `${pins.length} ملاحظة على الصورة. فيه حاجة تانية؟`) : L("What should change?", "إيه اللي محتاج يتغيّر؟")}</span><textarea className="txt" value={comment} onChange={e => setComment(e.target.value)} autoFocus placeholder={L("Be as specific as you can: colors, text, sizes…", "اكتب بالتفصيل: الألوان، الكلام، الأحجام…")} /></label>
          <label className="field"><span>{L("Your name", "اسمك")}</span><input className="inp" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setMode("idle")}>{L("Back", "رجوع")}</button><button className="btn btn--primary" disabled={busy} onClick={() => respond("changes")}>{L("Send to the team", "ابعت للفريق")}</button></div>
        </>}
      </div>}
      {d.status === "approved" && <div className="callout callout--ok"><CheckCircle2 /><span>{L("This version is approved. Thank you!", "النسخة دي متوافق عليها. شكرًا!")}</span></div>}
      <SharedThread load={() => api.reviewMessages(token)} post={(n, b) => api.reviewMessage(token, n, b)} />
      {data.client.portal_token && <Link className="btn btn--ghost" style={{ justifySelf: "center" }} to={"/c/" + data.client.portal_token}><LayoutGrid />{L("See everything waiting for you", "شوف كل اللي مستني موافقتك")}</Link>}
      <div className="powered"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />{L("Approvals by Vitals GO", "الموافقات عبر Vitals GO")}</div>
    </div>
  </div>;
}
