import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useWs } from "../lib/ws";
import { Field, useAction } from "../components/ui";

export const CURRENCIES = ["EGP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD", "USD", "EUR"];

export function Onboarding({ inline }: { inline?: boolean }) {
  const { L } = useI18n();
  const { user, refresh, select } = useWs();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState(user?.name || "");
  const [currency, setCurrency] = useState("EGP");
  const { busy, run } = useAction();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const w = await api.createWorkspace(name.trim(), currency, owner.trim());
      select(w.id);
      await refresh();
      nav("/");
    });
  };
  const body = <form className="form card card--pad" onSubmit={submit} style={{ width: "min(480px, 100%)" }}>
    <div className="stack" style={{ gap: 4 }}>
      <h1>{L("Set up your agency workspace", "جهّز مساحة عمل وكالتك")}</h1>
      <p className="muted">{L("One workspace per agency. You can invite your team next.", "مساحة عمل واحدة لكل وكالة. تقدر تدعو فريقك بعدها.")}</p>
    </div>
    <Field label={L("Agency name", "اسم الوكالة")}><input className="inp" value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoFocus /></Field>
    <Field label={L("Your name", "اسمك")}><input className="inp" value={owner} onChange={e => setOwner(e.target.value)} required /></Field>
    <Field label={L("Billing currency for change orders", "عملة أوامر التغيير")}>
      <select className="sel" value={currency} onChange={e => setCurrency(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select>
    </Field>
    <button className="btn btn--primary btn--lg" disabled={busy}>{L("Create workspace", "إنشاء مساحة العمل")}</button>
  </form>;
  if (inline) return <div className="page" style={{ justifyItems: "center" }}>{body}</div>;
  return <div className="center" style={{ minHeight: "100vh", padding: 16 }}>{body}</div>;
}
