// A plain, familiar dashboard frame: light sidebar, one primary action per role, and a
// "viewing as" menu in the top bar for the demo (client / freelancer / reviewer).
import { Briefcase, ChevronDown, ClipboardCheck, FilePlus2, Home, LayoutGrid, ListChecks, Menu, Moon, RotateCcw, Search, Send, ShieldCheck, Sun, UserCheck, UserRound, Users, Wallet, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../../hq/src/lib/i18n";
import { ME, meTalentId, resetDemo, talentOf, useDB } from "../lib/store";
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
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const db = useDB();
  const role = roleOf(loc.pathname);
  useEffect(() => { setSide(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menu]);

  const meT = talentOf(db, meTalentId()) || talentOf(db, ME.talent.id)!;
  const mine = db.briefs.filter(b => b.client === ME.client.company);
  const toDecide = mine.filter(b => b.status === "shortlist").length + db.deliveries.filter(x => x.client === "waiting" && mine.some(b => b.id === x.brief_id)).length;
  const myProps = db.proposals.filter(p => p.talent_id === meT.id);
  const contracts = db.briefs.filter(b => b.status === "in_progress" && b.talent_id === meT.id).length;
  const openJobs = db.briefs.filter(b => b.status === "sourcing" && !myProps.some(p => p.brief_id === b.id)).length;
  const qApps = db.applications.filter(a => ["portfolio", "test", "interview"].includes(a.stage)).length;
  const qJobs = db.briefs.filter(b => b.status === "review").length + db.proposals.filter(p => p.status === "screening").length;
  const qQA = db.deliveries.filter(x => x.qa === "pending").length;

  const A = ({ to, icon, label, count, end }: { to: string; icon: ReactNode; label: string; count?: number; end?: boolean }) =>
    <NavLink to={to} end={end} className={({ isActive }) => "nav-a" + (isActive ? " active" : "")}>{icon}<span>{label}</span>{!!count && <span className="count">{count}</span>}</NavLink>;
  const roles: [Role, string, string, ReactNode][] = [
    ["client", L("Client", "عميل"), `${ME.client.name} · ${ME.client.company}`, <Briefcase />],
    ["talent", L("Freelancer", "فريلانسر"), `${meT.name} · ${L(meT.title, meT.title_ar)}`, <UserRound />],
    ["ops", L("Vitals reviewer", "مراجع Vitals"), `${ME.ops.name} · ${L("Review team", "فريق المراجعة")}`, <ShieldCheck />]
  ];
  const cur = roles.find(r => r[0] === role)!;

  return <div className="shell crew-shell">
    <aside className={"side" + (side ? " open" : "")} aria-label={L("Main navigation", "التنقل الرئيسي")}>
      <div className="side__brand"><NavLink to="/"><img src={`${import.meta.env.BASE_URL}${theme === "dark" ? "logo-light.svg" : "logo-dark.svg"}`} alt="Vitals Crew" /></NavLink></div>
      {role === "client" && <>
        <button className="big-send" onClick={() => nav("/client/post")}><FilePlus2 />{L("Post a job", "انشر شغلانة")}</button>
        <A to="/client" end icon={<Home />} label={L("Dashboard", "الرئيسية")} count={toDecide} />
        <A to="/client/jobs" icon={<ListChecks />} label={L("My jobs", "شغلاناتي")} />
        <A to="/client/talent" icon={<Users />} label={L("Find talent", "دوّر على مواهب")} />
      </>}
      {role === "talent" && <>
        <button className="big-send" onClick={() => nav("/talent/jobs")}><Search />{L("Find work", "دوّر على شغل")}</button>
        <A to="/talent" end icon={<Home />} label={L("Dashboard", "الرئيسية")} />
        <A to="/talent/jobs" icon={<Search />} label={L("Find work", "دوّر على شغل")} count={openJobs} />
        <A to="/talent/proposals" icon={<Send />} label={L("My proposals", "عروضي")} />
        <A to="/talent/work" icon={<Briefcase />} label={L("Contracts", "العقود الحالية")} count={contracts} />
        <A to="/talent/earnings" icon={<Wallet />} label={L("Earnings", "الأرباح")} />
        <A to={"/talent/profile"} icon={<UserRound />} label={L("My profile", "بروفايلي")} />
      </>}
      {role === "ops" && <>
        <A to="/ops" end icon={<LayoutGrid />} label={L("Overview", "نظرة عامة")} />
        <A to="/ops/applications" icon={<UserCheck />} label={L("Applicants", "المتقدمين")} count={qApps} />
        <A to="/ops/briefs" icon={<Briefcase />} label={L("Jobs & proposals", "الشغلانات والعروض")} count={qJobs} />
        <A to="/ops/qa" icon={<ClipboardCheck />} label={L("Delivery QA", "مراجعة الجودة")} count={qQA} />
        <A to="/ops/talent" icon={<Users />} label={L("Members", "الأعضاء")} />
      </>}
      <div className="side__foot">
        <div className="demo-pill"><ShieldAlert /><span>{L("Preview with sample data", "نسخة تجريبية ببيانات مثال")}</span></div>
        <div className="edge-note"><ShieldCheck /><span>{L("Every member, proposal and delivery is reviewed by Vitals.", "كل عضو وعرض وتسليم بيتراجع من Vitals.")}</span></div>
        <a className="nav-a" href="/crew.html"><span style={{ width: 17 }} />{L("About Vitals Crew", "عن Vitals Crew")}</a>
      </div>
    </aside>
    {side && <div className="overlay" style={{ zIndex: 80, background: "rgba(0,0,0,.3)" }} onClick={() => setSide(false)} />}
    <div className="main">
      <header className="top">
        <button className="icon-btn top__burger" onClick={() => setSide(true)} aria-label={L("Open menu", "فتح القائمة")}><Menu /></button>
        <div className="viewas" ref={menuRef}>
          <button className="viewas__btn" onClick={() => setMenu(m => !m)} aria-expanded={menu}>
            <span className="viewas__l">{L("Viewing as", "بتشوف كـ")}</span><b>{cur[1]}</b><ChevronDown size={15} />
          </button>
          {menu && <div className="menu viewas__menu">
            <p className="small faint" style={{ padding: "6px 10px" }}>{L("Demo: the same marketplace from each side.", "تجربة: نفس المنصة من كل جانب.")}</p>
            {roles.map(([r, label, who, icon]) => <button key={r} className={r === role ? "on" : ""} onClick={() => nav("/" + r)}>{icon}<span style={{ display: "grid", textAlign: "start" }}><b>{label}</b><span className="small faint">{who}</span></span></button>)}
          </div>}
        </div>
        <div className="top__r">
          <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={L("Toggle theme", "تبديل المظهر")}>{theme === "dark" ? <Sun /> : <Moon />}</button>
          <button className="icon-btn" onClick={() => { resetDemo(); toast(L("Demo data reset", "اتعمل ريست للبيانات التجريبية")); }} aria-label={L("Reset demo data", "إعادة ضبط البيانات")} title={L("Reset demo data", "إعادة ضبط البيانات")}><RotateCcw /></button>
          <Avatar name={cur[2].split(" · ")[0]} />
        </div>
      </header>
      <main id="content" className="main__in">{children}</main>
    </div>
  </div>;
}
