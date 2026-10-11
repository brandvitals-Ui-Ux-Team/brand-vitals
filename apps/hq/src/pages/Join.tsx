import { useNavigate, useParams } from "react-router-dom";
import { Spinner, useAction } from "../components/ui";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useWs } from "../lib/ws";
import { Auth } from "./Auth";

export function Join() {
  const { token = "" } = useParams();
  const { L } = useI18n();
  const { ready, user, select, refresh } = useWs();
  const nav = useNavigate();
  const { busy, run } = useAction();
  if (!ready) return <Spinner />;
  if (!user) return <Auth />;
  const join = () => run(async () => {
    const wsId = await api.acceptInvite(token, user.name);
    select(wsId);
    await refresh();
    nav("/");
  }, L("Welcome to the team", "أهلًا بيك في الفريق"));
  return <div className="center" style={{ minHeight: "100vh", padding: 16 }}>
    <div className="card card--pad stack" style={{ width: "min(420px, 100%)", textAlign: "center" }}>
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" style={{ width: 48, margin: "0 auto" }} />
      <h1>{L("You're invited", "عندك دعوة")}</h1>
      <p className="muted">{L(`Join the workspace as ${user.email}.`, `انضم لمساحة العمل باسم ${user.email}.`)}</p>
      <button className="btn btn--primary btn--lg" onClick={join} disabled={busy}>{L("Accept invite", "قبول الدعوة")}</button>
      <button className="btn btn--ghost" onClick={() => api.signOut()}>{L("Use a different account", "استخدم حسابًا آخر")}</button>
    </div>
  </div>;
}
