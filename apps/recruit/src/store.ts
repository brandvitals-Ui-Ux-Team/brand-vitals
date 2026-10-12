// Demo store for Vitals Recruit: one shared database in localStorage, so switching between
// the candidate, company and Brand Vitals screening views shows the same pipeline reacting live.
import { useSyncExternalStore } from "react";

export type Field = "design" | "content" | "media" | "social" | "brand" | "motion" | "performance" | "pr";
export type JobType = "full_time" | "part_time" | "contract";
export type WorkMode = "onsite" | "hybrid" | "remote";
export type Level = "junior" | "mid" | "senior" | "lead";
export type Stage = "screening" | "not_matched" | "shortlisted" | "interview" | "offer" | "hired" | "not_selected";
export type Role = "candidate" | "company" | "screening";

export interface Company { id: string; name: string; industry: string; industry_ar: string; city: string; city_ar: string; size: string; about: string; about_ar: string }
export interface Job {
  id: string; company_id: string; title: string; field: Field; type: JobType; mode: WorkMode; level: Level;
  city: string; city_ar: string; salary_min: number; salary_max: number; currency: string;
  description: string; requirements: string[]; posted_at: string; status: "open" | "closed";
}
export interface Experience { title: string; company: string; from: string; to: string; summary: string }
export interface Education { school: string; degree: string; year: string }
export interface Candidate {
  id: string; name: string; headline: string; city: string; city_ar: string; email: string; phone: string;
  about: string; years: number; experience: Experience[]; education: Education[]; skills: string[]; languages: string[];
  cv: string; link: string;
}
export interface Event { stage: Stage; at: string; by: string; note: string }
export interface Application {
  id: string; job_id: string; candidate_id: string; cover: string; applied_at: string; stage: Stage;
  fit: number | null; screen_note: string; history: Event[];
}
export interface DB { companies: Company[]; jobs: Job[]; candidates: Candidate[]; applications: Application[] }

const KEY = "recruit-demo-v1";
const day = 86400000;
const ago = (d: number, h = 0) => new Date(Date.now() - d * day - h * 3600000).toISOString();
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// The people this demo browser plays (fictional).
export const ME = {
  candidate: "c-sara",
  company: "co-atlas",
  hr: "Rana Youssef",
  screener: "Mostafa Ali"
};

function seed(): DB {
  const companies: Company[] = [
    { id: "co-atlas", name: "Atlas Residences", industry: "Real estate developer", industry_ar: "تطوير عقاري", city: "New Cairo", city_ar: "القاهرة الجديدة", size: "200–500", about: "A residential developer with four compounds in East Cairo and an in-house marketing team of 14.", about_ar: "شركة تطوير سكني عندها ٤ كمبوندات في شرق القاهرة وفريق تسويق داخلي من ١٤ شخص." },
    { id: "co-nile", name: "Nile Roastery", industry: "Coffee chain", industry_ar: "سلسلة كافيهات", city: "Cairo", city_ar: "القاهرة", size: "50–200", about: "Specialty coffee with 18 branches across Egypt.", about_ar: "قهوة مختصة بـ ١٨ فرع في مصر." },
    { id: "co-glow", name: "Glow Lab Skincare", industry: "Beauty e-commerce", industry_ar: "تجارة إلكترونية للتجميل", city: "Riyadh", city_ar: "الرياض", size: "50–200", about: "Direct-to-consumer skincare selling across the Gulf.", about_ar: "منتجات عناية بالبشرة بتتباع أونلاين في الخليج." },
    { id: "co-bv", name: "Brand Vitals", industry: "Growth agency", industry_ar: "وكالة نمو", city: "New Cairo", city_ar: "القاهرة الجديدة", size: "50–200", about: "The growth agency behind Vitals Studio, Web, Events, GO, Crew and Recruit.", about_ar: "وكالة النمو اللي ورا Vitals Studio وWeb وEvents وGO وCrew وRecruit." }
  ];
  const J = (id: string, company_id: string, title: string, field: Field, type: JobType, mode: WorkMode, level: Level, city: string, city_ar: string, min: number, max: number, currency: string, d: number, description: string, requirements: string[]): Job =>
    ({ id, company_id, title, field, type, mode, level, city, city_ar, salary_min: min, salary_max: max, currency, description, requirements, posted_at: ago(d), status: "open" });
  const jobs: Job[] = [
    J("j1", "co-atlas", "Senior Social Media Specialist", "social", "full_time", "onsite", "senior", "New Cairo", "القاهرة الجديدة", 28000, 38000, "EGP", 2, "Own the content calendar and community for four residential compounds. You will plan monthly content, brief the design team, and report on reach and lead quality every week.", ["4+ years managing brand social accounts", "Real estate or high-ticket experience", "Strong Arabic and English writing", "Comfortable with Meta Business Suite and reporting"]),
    J("j2", "co-atlas", "Graphic Designer", "design", "full_time", "hybrid", "mid", "New Cairo", "القاهرة الجديدة", 18000, 26000, "EGP", 6, "Design campaign visuals, brochures and social posts within an established brand system.", ["2–4 years of agency or in-house design", "Arabic typography", "Adobe Illustrator, Photoshop and InDesign", "A portfolio link"]),
    J("j3", "co-nile", "Content Creator (Arabic)", "content", "full_time", "onsite", "mid", "Cairo", "القاهرة", 15000, 22000, "EGP", 3, "Write, shoot and edit short-form content for 18 branches. Reels first.", ["2+ years creating content for a consumer brand", "Phone shooting and CapCut or Premiere", "Natural Egyptian Arabic voice"]),
    J("j4", "co-glow", "Performance Marketing Manager", "performance", "full_time", "remote", "senior", "Riyadh (remote)", "الرياض (عن بُعد)", 18000, 24000, "SAR", 1, "Lead paid acquisition across Meta, TikTok and Snapchat for the Gulf. Own budgets, testing and reporting.", ["5+ years running paid social for e-commerce", "Managed monthly budgets above SAR 200k", "Creative testing frameworks", "GA4 and MMP experience"]),
    J("j5", "co-bv", "Motion Designer", "motion", "full_time", "hybrid", "mid", "New Cairo", "القاهرة الجديدة", 20000, 30000, "EGP", 8, "Animate ads, reels and launch films for agency clients with Vitals Studio.", ["3+ years in motion design", "After Effects; Cinema 4D is a plus", "A reel link"]),
    J("j6", "co-bv", "Brand Strategist", "brand", "full_time", "onsite", "senior", "New Cairo", "القاهرة الجديدة", 35000, 50000, "EGP", 12, "Lead positioning and brand platforms for clients across MENA.", ["6+ years in brand strategy", "Agency background", "Workshops with founders and C-level"]),
    J("j7", "co-nile", "Media Buyer", "media", "contract", "remote", "junior", "Egypt (remote)", "مصر (عن بُعد)", 12000, 16000, "EGP", 5, "Run and optimise local campaigns for new branch openings. 6-month contract.", ["1+ year running Meta campaigns", "Basic Excel reporting"]),
    J("j8", "co-glow", "PR & Communications Lead", "pr", "full_time", "hybrid", "lead", "Riyadh", "الرياض", 26000, 34000, "SAR", 15, "Own media relations, influencer partnerships and launch communications in KSA.", ["7+ years in PR or communications", "Saudi media network", "Arabic and English"])
  ];
  const C = (id: string, name: string, headline: string, city: string, city_ar: string, years: number, skills: string[], experience: Experience[], education: Education[], about: string): Candidate =>
    ({ id, name, headline, city, city_ar, email: name.toLowerCase().replace(/\s+/g, ".") + "@example.com", phone: "+20 10 0000 0000", about, years, experience, education, skills, languages: ["Arabic", "English"], cv: name.replace(/\s+/g, "_") + "_CV.pdf", link: "" });
  const candidates: Candidate[] = [
    C("c-sara", "Sara Hassan", "Social Media Specialist", "Cairo", "القاهرة", 5, ["Content strategy", "Community management", "Meta Business Suite", "Arabic copywriting", "Reporting"],
      [{ title: "Social Media Specialist", company: "Residential developer (agency side)", from: "2022", to: "Present", summary: "Ran social for two residential launches; grew qualified leads from social by 38% in a year." },
       { title: "Content Executive", company: "Digital agency, Cairo", from: "2020", to: "2022", summary: "Wrote and scheduled content for six F&B and retail brands." }],
      [{ school: "Cairo University", degree: "BA, Mass Communication", year: "2019" }],
      "Social media specialist with five years across real estate and retail. I plan content around sales goals and report on what it brings in, not only reach."),
    C("c-omar", "Omar Nabil", "Senior Social Media Manager", "Giza", "الجيزة", 7, ["Social strategy", "Team leadership", "Paid social", "Crisis comms"],
      [{ title: "Social Media Manager", company: "Telecom brand", from: "2021", to: "Present", summary: "Led a team of 5; built the always-on content model." },
       { title: "Senior Specialist", company: "Real estate developer", from: "2018", to: "2021", summary: "Owned social for three compounds." }],
      [{ school: "AUC", degree: "BA, Integrated Marketing Communication", year: "2017" }],
      "Seven years leading social for large Egyptian brands, three of them in real estate."),
    C("c-mai", "Mai Fawzy", "Social Media Coordinator", "Alexandria", "الإسكندرية", 2, ["Scheduling", "Canva", "Community"],
      [{ title: "Social Media Coordinator", company: "Clothing brand", from: "2023", to: "Present", summary: "Scheduling and replies for a fashion brand." }],
      [{ school: "Alexandria University", degree: "BCom", year: "2022" }],
      "Coordinator looking for a bigger brand to grow with."),
    C("c-youssef", "Youssef Kamal", "Graphic Designer", "Cairo", "القاهرة", 3, ["Arabic typography", "Illustrator", "InDesign", "Brand systems"],
      [{ title: "Designer", company: "Branding studio", from: "2021", to: "Present", summary: "Brochures, campaign key visuals and social for developers and hospitality." }],
      [{ school: "Helwan University", degree: "BFA, Graphic Design", year: "2020" }],
      "Designer with a strong Arabic type sense and real estate campaign work."),
    C("c-lina", "Lina Abdelrahman", "Performance Marketing Lead", "Riyadh", "الرياض", 6, ["Meta Ads", "TikTok Ads", "Creative testing", "GA4", "AppsFlyer"],
      [{ title: "Performance Lead", company: "Beauty e-commerce, KSA", from: "2022", to: "Present", summary: "Scaled spend to SAR 350k a month at a 3.1 ROAS." }],
      [{ school: "King Saud University", degree: "BSc, Marketing", year: "2018" }],
      "Paid social for Gulf e-commerce, testing first."),
    C("c-hany", "Hany Samir", "Social Media Specialist", "Cairo", "القاهرة", 4, ["Content calendars", "Real estate", "Reporting"],
      [{ title: "Social Media Specialist", company: "Developer, New Capital", from: "2021", to: "Present", summary: "Content and community for a 600-unit compound." }],
      [{ school: "Ain Shams University", degree: "BA, Commerce", year: "2019" }],
      "Four years in real estate social media.")
  ];
  const E = (stage: Stage, d: number, by: string, note: string): Event => ({ stage, at: ago(d), by, note });
  const A = (id: string, job_id: string, candidate_id: string, d: number, stage: Stage, fit: number | null, screen_note: string, history: Event[], cover = ""): Application =>
    ({ id, job_id, candidate_id, cover, applied_at: ago(d), stage, fit, screen_note, history });
  const applications: Application[] = [
    A("ap1", "j1", "c-sara", 1, "screening", null, "", [], "Real estate social is exactly what I do now, and I report on leads every week."),
    A("ap2", "j1", "c-omar", 2, "shortlisted", 5, "Seven years, three compounds, has led a team. Strong match for the senior level; salary expectation within range.", [E("shortlisted", 1, ME.screener, "Portfolio and references checked.")]),
    A("ap3", "j1", "c-hany", 2, "interview", 4, "Four years in real estate social, good reporting. Slightly junior for 'senior' but the closest domain match.", [E("shortlisted", 2, ME.screener, "Shortlisted."), E("interview", 1, ME.hr, "Interview booked for Thursday 11:00.")]),
    A("ap4", "j1", "c-mai", 2, "not_matched", 2, "Two years and no real estate experience. Kindly told and pointed to the Coordinator role when it opens.", [E("not_matched", 1, ME.screener, "Below the experience bar for this role.")]),
    A("ap5", "j2", "c-youssef", 4, "shortlisted", 4, "Strong Arabic type, relevant brochure work. Portfolio checked.", [E("shortlisted", 3, ME.screener, "Shortlisted.")]),
    A("ap6", "j4", "c-lina", 1, "screening", null, "", []),
    A("ap7", "j5", "c-sara", 9, "not_matched", 2, "Different discipline: this is a motion role. Suggested Social roles instead.", [E("not_matched", 8, ME.screener, "Not a motion profile.")]),
    A("ap8", "j3", "c-sara", 6, "interview", 4, "Good Arabic voice and on-camera comfort shown in her samples.", [E("shortlisted", 5, ME.screener, "Shortlisted."), E("interview", 3, "Nile Roastery HR", "Interview on Sunday.")])
  ];
  return { companies, jobs, candidates, applications };
}

// ---------- tiny reactive store ----------
let db: DB = load();
const subs = new Set<() => void>();
function load(): DB { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* ignore */ } return seed(); }
function save(next: DB) { db = next; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } subs.forEach(f => f()); }
export function useDB() { return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => db); }
export function resetDemo() { save(seed()); }

export const jobOf = (d: DB, id: string) => d.jobs.find(j => j.id === id);
export const companyOf = (d: DB, id: string) => d.companies.find(c => c.id === id)!;
export const candidateOf = (d: DB, id: string) => d.candidates.find(c => c.id === id);
export const appOf = (d: DB, id: string) => d.applications.find(a => a.id === id);
/** Companies only ever see applications that passed Brand Vitals screening. */
export const VISIBLE_TO_COMPANY: Stage[] = ["shortlisted", "interview", "offer", "hired", "not_selected"];

export const actions = {
  apply(job_id: string, cover: string) {
    if (db.applications.some(a => a.job_id === job_id && a.candidate_id === ME.candidate)) return;
    save({ ...db, applications: [{ id: uid(), job_id, candidate_id: ME.candidate, cover, applied_at: new Date().toISOString(), stage: "screening", fit: null, screen_note: "", history: [] }, ...db.applications] });
  },
  withdraw(id: string) { save({ ...db, applications: db.applications.filter(a => a.id !== id) }); },
  updateProfile(c: Candidate) { save({ ...db, candidates: db.candidates.map(x => x.id === c.id ? c : x) }); },
  postJob(j: Omit<Job, "id" | "posted_at" | "status" | "company_id">) {
    const job: Job = { ...j, id: uid(), company_id: ME.company, posted_at: new Date().toISOString(), status: "open" };
    save({ ...db, jobs: [job, ...db.jobs] });
    return job.id;
  },
  closeJob(id: string) { save({ ...db, jobs: db.jobs.map(j => j.id === id ? { ...j, status: j.status === "open" ? "closed" : "open" } : j) }); },
  move(id: string, stage: Stage, by: string, note: string, fit?: number) {
    save({ ...db, applications: db.applications.map(a => a.id !== id ? a : { ...a, stage, fit: fit ?? a.fit, screen_note: by === ME.screener && note ? note : a.screen_note, history: [...a.history, { stage, at: new Date().toISOString(), by, note }] }) });
  }
};
