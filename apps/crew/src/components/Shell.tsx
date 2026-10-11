import { Briefcase, ClipboardCheck, FilePlus2, FileSearch, Home, LayoutGrid, Menu, Moon, RotateCcw, Send, ShieldCheck, Sun, UserCheck, Users, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, resetDemo, useDB } from "../lib/store";
import type { Role } from "../lib/types";
import { Avatar, useToast } from "./ui";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => { try { return JSON.parse(localStorage.getItem("hq-theme") || '"light"'); } catch { return "light"; } });
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem("hq-theme", JSON.stringify(theme)); } catch { /* ignore */ } }, [theme]);
  return [theme, setTheme] as const;
}

export const roleOf = (path: string): Role => path.startsWith("/talent") ? "talent" : path.startsWith("/ops") ? "ops" : "client";

export function Shell({ children }: { children: ReactNode }) {
  const { L, lang, setLang } = useI18n();
  const [theme, setTheme] = useTheme();
  const [side, setSide] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const db = useDB();
  const role = roleOf(loc.pathname);
  useEffect(() => setSide(false), [loc.pathname]);

  const mine = db.briefs.filter(b => b.client === ME.client.company);
  const shortlists = mine.filter(b => b.status === "shortlist").length;
  const toApprove = db.deliveries.filter(x => x.client === "waiting" && mine.some(b => b.id === x.brief_id)).length;
  const myProps = db.proposals.filter(p => p.talent_id === ME.talent.id);
  const myJobs = db.briefs.filter(b => b.status === "in_progress" && myProps.some(p => p.id === b.hired_proposal_id)).length;
  const opps = db.briefs.filter(b => b.status === "sourcing" && !myProps.some(p => p.brief_id === b.id)).length;
  const qApps = db.applications.filter(a => ["portfolio", "test", "interview"].includes(a.stage)).length;
  const qBriefs = db.briefs.filter(b => b.status === "review" || b.status === "sourcing").length;
  const qQA = db.deliveries.filter(x => x.qa === "pending").length;

  const A = ({ to, icon, label, count, end }: { to: string; icon: ReactNode; label: string; count?: number; end?: boolean }) =>
    <NavLink to={to} end={end} className={({ isActive }) => "nav-a" + (isActive ? " active" : "")}>{icon}<span>{label}</span>{!!count && <span className="count">{count}</span>}</NavLink>;
  const who = role === "client" ? { n: ME.client.name, s: ME.client.company } : role === "talent" ? { n: ME.talent.name, s: L("Motion designer · Pro", "مصممة موشن · محترفة") } : { n: ME.ops.name, s: L("Vitals Crew review team", "فريق مراجعة Vitals Crew") };

  return <div className="shell">
    <aside className={"side" + (side ? " open" : "")} aria-label={L("Main navigation", "التنقل الرئيسي")}>
      <div className="side__brand"><NavLink to="/"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Crew" /></NavLink></div>
      <div className="role-switch" role="tablist" aria-label={L("View as", "اعرض كـ")}>
        {([["client", L("Client", "عميل")], ["talent", L("Talent", "موهبة")], ["ops", L("Review", "المراجعة")]] as [Role, string][]).map(([r, label]) =>
          <button key={r} role="tab" aria-selected={role === r} className={role === r ? "on" : ""} onClick={() => nav("/" + r)}>{label}</button>)}
      </div>
      <div className="me-card"><Avatar name={who.n} /><span style={{ minWidth: 0 }}><b className="ellipsis" style={{ display: "block" }}>{who.n}</b><span className="faint small">{who.s}</span></span></div>

      {role === "client" && <>
        <button className="big-send" onClick={() => nav("/client/new")}><FilePlus2 />{L("Post a brief", "انشر بريف")}</button>
        <A to="/client" end icon={<Home />} label={L("Home", "الرئيسية")} count={shortlists + toApprove} />
        <A to="/client/talent" icon={<Users />} label={L("Vetted talent", "المواهب المعتمدة")} />
      </>}
      {role === "talent" && <>
        <A to="/talent" end icon={<Home />} label={L("Home", "الرئيسية")} />
        <A to="/talent/jobs" icon={<FileSearch />} label={L("Opportunities", "الفرص")} count={opps} />
        <A to="/talent/proposals" icon={<Send />} label={L("My proposals", "عروضي")} />
        <A to="/talent/work" icon={<Briefcase />} label={L("Active work", "الشغل الحالي")} count={myJobs} />
        <A to="/talent/earnings" icon={<Wallet />} label={L("Earnings", "الأرباح")} />
      </>}
      {role === "ops" && <>
        <A to="/ops" end icon={<LayoutGrid />} label={L("Overview", "نظرة عامة")} />
        <A to="/ops/applications" icon={<UserCheck />} label={L("Talent vetting", "اعتماد المواهب")} count={qApps} />
        <A to="/ops/briefs" icon={<Briefcase />} label={L("Briefs & shortlists", "البريفات والترشيحات")} count={qBriefs} />
        <A to="/ops/qa" icon={<ClipboardCheck />} label={L("Delivery QA", "مراجعة الجودة")} count={qQA} />
        <A to="/ops/talent" icon={<Users />} label={L("Talent network", "شبكة المواهب")} />
      </>}

      <div className="side__foot">
        <div className="demo-pill"><ShieldCheck /><span>{L("Demo: switch views above to see the same marketplace as a client, a freelancer and our review team.", "تجربة: بدّل من فوق عشان تشوف نفس المنصة كعميل وكفريلانسر وكفريق مراجعة.")}</span></div>
        <a className="nav-a" href="/crew.html"><span style={{ width: 17 }} />{L("About Vitals Crew", "عن Vitals Crew")}</a>
      </div>
    </aside>
    {side && <div className="overlay" style={{ zIndex: 80, background: "rgba(0,0,0,.3)" }} onClick={() => setSide(false)} />}
    <div className="main">
      <header className="top">
        <button className="icon-btn top__burger" onClick={() => setSide(true)} aria-label={L("Open menu", "فتح القائمة")}><Menu /></button>
        <span className="pill pill--plain role-pill">{role === "client" ? L("Client view", "عرض العميل") : role === "talent" ? L("Talent view", "عرض الموهبة") : L("Review team view", "عرض فريق المراجعة")}</span>
        <div className="top__r">
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
          <button className="icon-btn" onClick={() => { resetDemo(); toast(L("Demo data reset", "اتعمل ريست للبيانات التجريبية")); }} aria-label={L("Reset demo data", "إعادة ضبط البيانات")} title={L("Reset demo data", "إعادة ضبط البيانات")}><RotateCcw /></button>
        </div>
      </header>
      {children}
    </div>
  </div>;
}
