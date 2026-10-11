import { CheckCircle2, MessageCircle, MessagesSquare, ScrollText, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { api, isDemo } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAction, Field } from "../components/ui";

export function Auth() {
  const { L, lang, setLang } = useI18n();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [note, setNote] = useState("");
  const { busy, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setNote("");
    if (mode === "reset") return run(() => api.resetPassword(email), L("Check your email for a reset link.", "راجع بريدك لرابط إعادة التعيين."));
    if (mode === "up") return run(async () => {
      if (pw.length < 8) throw new Error(L("Use at least 8 characters for the password.", "استخدم 8 أحرف على الأقل لكلمة المرور."));
      const r = await api.signUp(email.trim(), pw, name.trim());
      if (r === "confirm") setNote(L("Almost there: confirm your email, then sign in.", "خطوة أخيرة: أكّد بريدك الإلكتروني ثم سجّل الدخول."));
    });
    return run(() => api.signIn(email.trim(), pw));
  };
  const demo = () => run(() => api.signUp("owner@demo.agency", "demo", L("Demo Owner", "مدير الحساب")));

  return <div className="auth">
    <div className="auth__side">
      <img src={`${import.meta.env.BASE_URL}logo-light.svg`} alt="Vitals GO" style={{ height: 30, width: "auto" }} />
      <div style={{ display: "grid", gap: 26 }}>
        <h2>{L("Every client conversation, approved and billed.", "كل كلام مع العميل، متوافق عليه ومتحاسب.")}</h2>
        <ul>
          <li><MessageCircle />{L("Clients review, comment on the exact spot and approve from one link: by email, WhatsApp, Slack, Teams or SMS. No login.", "العميل يراجع ويعلّق على النقطة بالظبط ويوافق من لينك واحد: إيميل أو واتساب أو Slack أو Teams أو SMS. من غير تسجيل.")}</li>
          <li><MessagesSquare />{L("Team and client chat next to the work, with internal notes the client never sees.", "شات الفريق والعميل جنب الشغل، وملاحظات داخلية العميل عمره ما يشوفها.")}</li>
          <li><ShieldCheck />{L("Every request is checked against the contract: revisions counted, extra work flagged.", "كل طلب يتقارن بالعقد: التعديلات بتتعد، والشغل الإضافي بيتعلّم عليه.")}</li>
          <li><Sparkles />{L("Requests outside the agreement become priced extra work the client approves in one tap.", "الطلبات اللي برا الاتفاق بتتحوّل لشغل إضافي بسعر، والعميل يوافق بضغطة.")}</li>
          <li><ScrollText />{L("A history of who approved what, and when. No more “I never said that”.", "سجل بمين وافق على إيه وإمتى. خلاص مفيش «أنا ما قلتش كده».")}</li>
        </ul>
      </div>
      <p style={{ color: "#7F948C", fontSize: 12 }}>{L("A Brand Vitals company", "إحدى شركات Brand Vitals")}</p>
    </div>
    <div className="auth__main">
      <div className="auth__box">
        <div className="row row--between">
          <h1>{mode === "up" ? L("Create your workspace", "أنشئ مساحة عملك") : mode === "reset" ? L("Reset password", "إعادة تعيين كلمة المرور") : L("Welcome back", "أهلًا بعودتك")}</h1>
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
        </div>
        {isDemo && <div className="callout callout--info"><Sparkles /><div><b>{L("Try it instantly", "جرّبه فورًا")}</b><p className="small muted">{L("This deployment runs in demo mode: a full workspace with sample clients, saved in your browser.", "النسخة دي شغالة في الوضع التجريبي: مساحة عمل كاملة بعملاء تجريبيين، محفوظة في متصفحك.")}</p></div></div>}
        {isDemo && <button className="btn btn--primary btn--lg btn--block" onClick={demo} disabled={busy}>{L("Open the demo workspace", "افتح مساحة العمل التجريبية")}</button>}
        {isDemo && <div className="or">{L("or use your email", "أو استخدم بريدك")}</div>}
        {note && <div className="callout callout--ok"><CheckCircle2 /><span>{note}</span></div>}
        <form className="form" onSubmit={submit}>
          {mode === "up" && <Field label={L("Your name", "اسمك")}><input className="inp" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" /></Field>}
          <Field label={L("Work email", "بريد العمل")}><input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" dir="ltr" /></Field>
          {mode !== "reset" && <Field label={L("Password", "كلمة المرور")}><input className="inp" type="password" value={pw} onChange={e => setPw(e.target.value)} required={!isDemo} autoComplete={mode === "up" ? "new-password" : "current-password"} dir="ltr" /></Field>}
          <button className={"btn btn--lg btn--block " + (isDemo ? "" : "btn--primary")} disabled={busy}>
            {mode === "up" ? L("Create account", "إنشاء حساب") : mode === "reset" ? L("Send reset link", "أرسل رابط إعادة التعيين") : L("Sign in", "تسجيل الدخول")}
          </button>
        </form>
        <div className="row row--between small">
          {mode === "in" ? <button className="btn--ghost btn btn--sm" onClick={() => setMode("up")}>{L("New here? Create an account", "جديد؟ أنشئ حسابًا")}</button>
            : <button className="btn--ghost btn btn--sm" onClick={() => setMode("in")}>{L("Have an account? Sign in", "عندك حساب؟ سجّل الدخول")}</button>}
          {mode === "in" && !isDemo && <button className="btn--ghost btn btn--sm" onClick={() => setMode("reset")}>{L("Forgot password?", "نسيت كلمة المرور؟")}</button>}
        </div>
      </div>
    </div>
  </div>;
}
