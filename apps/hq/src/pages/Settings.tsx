import { Database, ExternalLink, MessageCircle, RotateCcw, ShieldCheck, Unplug } from "lucide-react";
import { useState } from "react";
import { Field, useAction } from "../components/ui";
import { api, isDemo, setSupabaseOverride, supabaseConfig } from "../lib/api";
import { fillTemplate } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { useWorkspace } from "../lib/ws";
import { CURRENCIES } from "./Onboarding";

export function Settings() {
  const { L, lang, setLang } = useI18n();
  const { ws, me } = useWorkspace();
  const { run, busy } = useAction();
  const [name, setName] = useState(ws.name);
  const [currency, setCurrency] = useState(ws.currency);
  const [tEn, setTEn] = useState(ws.wa_template_en);
  const [tAr, setTAr] = useState(ws.wa_template_ar);
  const [remind, setRemind] = useState(ws.remind_after_days || 2);
  const cfg = supabaseConfig();
  const [url, setUrl] = useState(cfg?.url || "");
  const [key, setKey] = useState(cfg?.source === "local" ? cfg.key : "");
  const isAdmin = me?.role === "owner" || me?.role === "admin";
  const sample = { client: "Omar", item: "Ramadan offer post", link: "https://…/app/r/abc123", agency: ws.name, version: "2" };

  return <div className="page" style={{ maxWidth: 860 }}>
    <div className="page-head"><div className="page-head__t"><h1>{L("Settings", "الإعدادات")}</h1></div></div>

    <div className="card">
      <div className="card__h"><h2>{L("Workspace", "مساحة العمل")}</h2></div>
      <div className="card__b form">
        <div className="form-row">
          <Field label={L("Agency name", "اسم الوكالة")}><input className="inp" value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} /></Field>
          <Field label={L("Currency", "العملة")}><select className="sel" value={currency} onChange={e => setCurrency(e.target.value)} disabled={!isAdmin}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label={L("Suggest a reminder when a client hasn't replied after", "اقترح تذكير لو العميل ما ردّش بعد")}><select className="sel" style={{ maxWidth: 200 }} value={remind} onChange={e => setRemind(Number(e.target.value))} disabled={!isAdmin}>{[1, 2, 3, 4, 5, 7].map(n => <option key={n} value={n}>{L(`${n} day${n > 1 ? "s" : ""}`, `${n} يوم`)}</option>)}</select></Field>
        <Field label={L("Interface language", "لغة الواجهة")}><div className="seg" style={{ justifySelf: "start" }}><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button><button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>العربية</button></div></Field>
      </div>
    </div>

    <div className="card">
      <div className="card__h"><h2 className="row"><MessageCircle size={18} />{L("WhatsApp messages", "رسائل واتساب")}</h2></div>
      <div className="card__b form">
        <p className="muted small">{L("Sent when you share a deliverable. Variables: {client} {item} {link} {agency} {version}. Each client gets the message in their language.", "تُرسل عند مشاركة تسليمة. المتغيرات: {client} {item} {link} {agency} {version}. كل عميل بتوصله الرسالة بلغته.")}</p>
        <Field label="English"><textarea className="txt" value={tEn} onChange={e => setTEn(e.target.value)} dir="ltr" disabled={!isAdmin} /></Field>
        <div className="quote small" dir="ltr">{fillTemplate(tEn, sample)}</div>
        <Field label="العربية"><textarea className="txt" value={tAr} onChange={e => setTAr(e.target.value)} dir="rtl" disabled={!isAdmin} /></Field>
        <div className="quote small" dir="rtl">{fillTemplate(tAr, { ...sample, client: "عمر", item: "بوست عرض رمضان" })}</div>
        {!tEn.includes("{link}") || !tAr.includes("{link}") ? <p className="small" style={{ color: "var(--bad)" }}>{L("Keep {link} in both messages, or clients won't get the review link.", "خلّي {link} في الرسالتين، وإلا العميل مش هيوصله اللينك.")}</p> : null}
        {isAdmin && <button className="btn btn--primary" style={{ justifySelf: "start" }} disabled={busy || !name.trim()} onClick={() => run(() => api.update("workspaces", ws.id, { name: name.trim(), currency, wa_template_en: tEn, wa_template_ar: tAr, remind_after_days: remind }), L("Settings saved", "تم حفظ الإعدادات"))}>{L("Save changes", "حفظ التغييرات")}</button>}
      </div>
    </div>

    <div className="card">
      <div className="card__h"><h2 className="row"><Database size={18} />{L("Backend", "قاعدة البيانات")}</h2>{isDemo ? <span className="pill pill--warn">{L("Demo mode", "وضع تجريبي")}</span> : <span className="pill pill--ok">Supabase{cfg?.source === "local" ? " · " + L("this browser", "هذا المتصفح") : ""}</span>}</div>
      <div className="card__b form">
        {isDemo ? <>
          <p className="muted small">{L("Right now everything is saved in this browser only, so it's perfect for trying Vitals GO but not for a team. To go live:", "حاليًا كل حاجة محفوظة في المتصفح ده بس: ممتاز للتجربة لكن مش للفريق. عشان تشغّله فعليًا:")}</p>
          <ol className="stack small" style={{ listStyle: "decimal", paddingInlineStart: 20, gap: 6 }}>
            <li>{L("Create a free project at supabase.com.", "أنشئ مشروع مجاني على supabase.com.")}</li>
            <li>{L("Open SQL Editor and run supabase/migrations/…_vitals_hq.sql from the repo.", "افتح SQL Editor وشغّل ملف supabase/migrations/…_vitals_hq.sql من الريبو.")}</li>
            <li>{L("In Vercel → Settings → Environment Variables add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.", "في Vercel ← Settings ← Environment Variables أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY ثم أعد النشر.")}</li>
          </ol>
          <p className="muted small">{L("Or test a project in this browser first:", "أو جرّب المشروع في المتصفح ده الأول:")}</p>
        </> : <p className="muted small">{cfg?.source === "env" ? L("Connected through the deployment's environment variables. Every user and every client link uses this database.", "متصل عبر متغيرات البيئة في النشر. كل المستخدمين ولينكات العملاء بتستخدم القاعدة دي.") : L("Connected for this browser only (override). Clients opening review links won't see this data until the deployment has the environment variables.", "متصل للمتصفح ده بس. العملاء اللي بيفتحوا لينكات المراجعة مش هيشوفوا البيانات لحد ما النشر ياخد متغيرات البيئة.")}</p>}
        {(isDemo || cfg?.source === "local") && <>
          <div className="form-row">
            <Field label="Project URL"><input className="inp mono" value={url} onChange={e => setUrl(e.target.value)} dir="ltr" placeholder="https://xxxx.supabase.co" /></Field>
            <Field label={L("Anon / publishable key", "المفتاح العام (anon)")} hint={L("Never paste the service_role key here.", "لا تلصق مفتاح service_role هنا أبدًا.")}><input className="inp mono" value={key} onChange={e => setKey(e.target.value)} dir="ltr" /></Field>
          </div>
          <div className="row">
            <button className="btn btn--primary" disabled={!/^https:\/\/.+\.supabase\.(co|in)\/?$/.test(url.trim()) || key.trim().length < 20} onClick={() => setSupabaseOverride({ url: url.trim().replace(/\/$/, ""), key: key.trim() })}><ShieldCheck />{L("Connect in this browser", "اتصل في هذا المتصفح")}</button>
            {cfg?.source === "local" && <button className="btn" onClick={() => setSupabaseOverride(null)}><Unplug />{L("Disconnect", "قطع الاتصال")}</button>}
            <a className="btn btn--ghost" href="https://supabase.com/dashboard" target="_blank" rel="noopener"><ExternalLink />Supabase</a>
          </div>
        </>}
        {isDemo && api.resetDemo && <button className="btn btn--danger" style={{ justifySelf: "start" }} onClick={() => run(() => api.resetDemo!(), L("Demo data reset", "تمت إعادة ضبط البيانات"))}><RotateCcw />{L("Reset demo data", "إعادة ضبط البيانات التجريبية")}</button>}
      </div>
    </div>
  </div>;
}
