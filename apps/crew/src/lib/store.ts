// Demo store for Vitals Crew: one shared database in localStorage, so switching between
// the client, talent and review-team views shows the same marketplace reacting live.
import { useSyncExternalStore } from "react";
import type { Activity, Application, Brief, Category, DB, Delivery, Level, Piece, Proposal, Scores, Talent, TalentKind } from "./types";

const KEY = "crew-demo-v4";
const day = 86400000;
const ago = (d: number, h = 0) => new Date(Date.now() - d * day - h * 3600000).toISOString();
const ahead = (d: number) => new Date(Date.now() + d * day).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// The people this demo browser plays (fictional).
export const ME = {
  client: { name: "Hana Mostafa", company: "Nile Roastery" },
  talent: { id: "t-mariam", name: "Mariam Adel" },
  ops: { name: "Omar Khaled" }
};
export const FEE = 0.2; // client-side service fee, shown at hire time (see PRICING-NOTES.md)
// Quality rules. A job moves to another vetted member, at our cost, when either limit is hit;
// the client keeps the same price and the same deadline.
export const MAX_QA_ROUNDS = 3;   // the 3rd delivery our QA returns ends the assignment
export const CLIENT_CHANCES = 2;  // the 2nd "doesn't match the brief" from the client ends it
export const BUFFER_DAYS = 3;     // talent is due this many days before the client deadline

// The freelancer this browser plays: the demo member, or someone who just got accepted.
export function meTalentId() { try { return localStorage.getItem("crew-talent-id") || ME.talent.id; } catch { return ME.talent.id; } }

const S = (craft: number, brief: number, communication: number, reliability: number): Scores => ({ craft, brief, communication, reliability });
const T = (id: string, name: string, title: string, title_ar: string, kind: TalentKind, members: number, city: string, city_ar: string, category: Category, level: Level, rate: number, scores: Scores, jobs: number, on_time: number, rating: number, portfolio: string[], skills: string[], bio: string, bio_ar: string, joinedDays: number): Talent =>
  ({ id, name, title, title_ar, kind, members, city, city_ar, category, level, rate, currency: "EGP", scores, jobs, on_time, rating, portfolio, skills, bio, bio_ar, joined: ago(joinedDays), available: true });

function seed(): DB {
  const talents: Talent[] = [
    T("t-mariam", "Mariam Adel", "Motion designer", "مصممة موشن", "solo", 1, "Cairo", "القاهرة", "motion", "pro", 8000, S(4.7, 4.6, 4.5, 4.8), 23, 96, 4.9, ["Latte art reel", "Launch film · rough cut"], ["After Effects", "Reels", "2D animation"], "Short-form motion for F&B and beauty brands. Reels that stop the scroll in the first second.", "موشن قصير لبراندات الأكل والتجميل. ريلز بتوقف السكرول من أول ثانية.", 210),
    T("t-youssef", "Youssef Hamdy", "Brand & social designer", "مصمم هوية وسوشيال", "solo", 1, "Alexandria", "الإسكندرية", "design", "elite", 12000, S(4.9, 4.8, 4.7, 4.9), 41, 98, 5, ["New seasonal menu post", "Weekend offer story", "Cold brew launch carousel"], ["Branding", "Packaging", "Social"], "Brand systems and packaging with a strong Arabic type sense.", "هويات بصرية وتغليف بحس قوي في الخط العربي.", 400),
    T("t-nour", "Nour Content Studio", "Content production team", "فريق إنتاج محتوى", "team", 3, "Cairo", "القاهرة", "video", "pro", 15000, S(4.6, 4.7, 4.6, 4.5), 18, 94, 4.8, ["Vitamin C serum ad · UGC", "Barista story post"], ["UGC", "Shooting", "Editing"], "A three-person crew: director, shooter and editor. UGC and product films in one week.", "فريق من ٣: مخرجة ومصور ومونتير. إعلانات UGC وأفلام منتجات في أسبوع.", 150),
    T("t-layla", "Layla Farouk", "Arabic & English copywriter", "كاتبة محتوى عربي وإنجليزي", "solo", 1, "Riyadh", "الرياض", "copy", "elite", 9000, S(4.9, 4.9, 4.8, 4.7), 37, 97, 4.9, ["Ramadan bundle static"], ["Saudi dialect", "Brand voice", "UX writing"], "Brand voice in Gulf, Egyptian and formal Arabic, plus English.", "صوت البراند بالخليجي والمصري والفصحى، والإنجليزي.", 320),
    T("t-karim", "Karim Saad", "Performance ads specialist", "متخصص إعلانات أداء", "solo", 1, "Dubai", "دبي", "ads", "pro", 10000, S(4.5, 4.6, 4.4, 4.7), 29, 95, 4.7, ["Cold brew launch carousel"], ["Meta Ads", "Google Ads", "Creative testing"], "Paid social for e-commerce in the Gulf. Creative testing first.", "إعلانات ممولة للتجارة الإلكترونية في الخليج، والتجريب الإبداعي أولًا.", 180),
    T("t-pine", "Pixel & Pine", "Web design & build team", "فريق تصميم وتطوير مواقع", "team", 4, "Cairo", "القاهرة", "web", "vetted", 30000, S(4.3, 4.4, 4.5, 4.2), 9, 90, 4.6, ["Key visual · Family courtyard"], ["Webflow", "Next.js", "CRO"], "Landing pages and company sites, bilingual from day one.", "صفحات هبوط ومواقع شركات، عربي وإنجليزي من أول يوم.", 90),
    T("t-salma", "Salma Nabil", "Social media manager", "مديرة سوشيال ميديا", "solo", 1, "Jeddah", "جدة", "social", "vetted", 7000, S(4.2, 4.5, 4.6, 4.4), 12, 93, 4.6, ["Ramadan bundle static"], ["Content calendars", "Community", "TikTok"], "Monthly content and community for beauty and retail brands.", "محتوى شهري وإدارة مجتمع لبراندات التجميل والتجزئة.", 75),
    T("t-bv", "Brand Vitals Frames", "Brand Vitals in-house team", "فريق براند ڤايتلز الداخلي", "in_house", 12, "Cairo", "القاهرة", "design", "elite", 25000, S(4.8, 4.9, 4.8, 4.9), 64, 99, 4.9, ["Key visual · Sunset terrace", "Latte art reel", "New seasonal menu post"], ["Campaigns", "Production", "Strategy"], "The Brand Vitals agency team. Held to the same review as every member.", "فريق وكالة براند ڤايتلز. بيتراجع شغله بنفس المعايير زي أي عضو.", 900),
    T("t-ahmed", "Ahmed Tarek", "Product & people photographer", "مصور منتجات وأشخاص", "solo", 1, "Cairo", "القاهرة", "photo", "pro", 9000, S(4.6, 4.5, 4.6, 4.8), 26, 97, 4.8, ["Barista story post", "Key visual · Sunset terrace"], ["Studio", "Lifestyle", "Events"], "Studio and lifestyle photography for F&B and real estate.", "تصوير ستوديو ولايف ستايل للأكل والعقارات.", 260),
    T("t-hagar", "Hagar Ali", "Motion & 3D artist", "فنانة موشن وثري دي", "solo", 1, "Giza", "الجيزة", "motion", "vetted", 11000, S(4.4, 4.2, 4.3, 4.5), 6, 92, 4.7, ["Launch film · rough cut"], ["Cinema 4D", "Blender", "Product 3D"], "Product 3D and motion for launches.", "ثري دي وموشن للمنتجات والإطلاقات.", 45)
  ];

  const ev = (stage: Application["stage"], d: number, by: string, note: string) => ({ stage, at: ago(d), by, note });
  const applications: Application[] = [
    { id: "a1", name: "Omar Fathy", email: "omar.fathy@example.com", title: "Brand designer", category: "design", kind: "solo", members: 1, city: "Cairo", links: "behance.net/omarfathy", portfolio: ["Weekend offer story", "New seasonal menu post"], pieces: ["Weekend offer story", "New seasonal menu post"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(0, 5), stage: "portfolio", scores: null, history: [], level: null },
    { id: "a2", name: "Reem Hassan", email: "reem.hassan@example.com", title: "Video editor", category: "video", kind: "solo", members: 1, city: "Mansoura", links: "vimeo.com/reemedits", portfolio: ["Launch film · rough cut"], pieces: ["Launch film · rough cut"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(1, 2), stage: "portfolio", scores: null, history: [], level: null },
    { id: "a3", name: "Frame Lab", email: "frame.lab@example.com", title: "Motion team", category: "motion", kind: "team", members: 2, city: "Cairo", links: "framelab.studio", portfolio: ["Latte art reel", "Vitamin C serum ad · UGC"], pieces: ["Latte art reel", "Vitamin C serum ad · UGC"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(4), stage: "test", scores: S(4.3, 0, 4, 0), history: [ev("test", 3, "Omar Khaled", "Strong reel. Test: 15-second teaser for a coffee brand, 48 hours.")], level: null },
    { id: "a4", name: "Dina Samir", email: "dina.samir@example.com", title: "Arabic copywriter", category: "copy", kind: "solo", members: 1, city: "Amman", links: "dinasamir.com", portfolio: ["Ramadan bundle static"], pieces: ["Ramadan bundle static"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(6), stage: "test", scores: S(4.5, 0, 4.2, 0), history: [ev("test", 5, "Omar Khaled", "Good range. Test: rewrite a skincare landing page in Gulf dialect.")], level: null },
    { id: "a5", name: "Tamer Ezz", email: "tamer.ezz@example.com", title: "Performance marketer", category: "ads", kind: "solo", members: 1, city: "Riyadh", links: "linkedin.com/in/tamerezz", portfolio: ["Cold brew launch carousel"], pieces: ["Cold brew launch carousel"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(9), stage: "interview", scores: S(4.4, 4.5, 4.1, 0), history: [ev("test", 8, "Omar Khaled", "Account audit test passed with a clear plan."), ev("interview", 4, "Omar Khaled", "Test score 4.5. Interview to check reporting and reliability.")], level: null },
    { id: "a6", name: "Ali Mahmoud", email: "ali.mahmoud@example.com", title: "Social designer", category: "design", kind: "solo", members: 1, city: "Tanta", links: "behance.net/alimahmoud", portfolio: ["Weekend offer story"], pieces: ["Weekend offer story"].map(t => ({ title: t, src: t, role: "Lead" })), submitted_at: ago(12), stage: "rejected", scores: S(3.1, 0, 3.8, 0), history: [ev("rejected", 10, "Omar Khaled", "Portfolio below our craft bar for now: inconsistent type and layout. Welcome to reapply in 3 months.")], level: null }
  ];

  const briefs = [
    { id: "b1", client: "Nile Roastery", title: "Ramadan reels series (4 reels)", category: "motion", description: "Four 20-second reels for Ramadan: suhoor coffee rituals, family gatherings, the new date latte and an Eid teaser. Arabic first, bilingual captions.", budget: 40000, currency: "EGP", deadline: ahead(21), mode: "shortlist", status: "shortlist", created_at: ago(5), reviewer_note: "Clarified: 4 reels, 9:16, Arabic VO optional. Budget fits Pro-level motion talent.", preferred_talent: null, hired_proposal_id: null },
    { id: "b2", client: "Nile Roastery", title: "Cold brew can packaging refresh", category: "design", description: "Refresh the cold brew can for the summer relaunch. Keep the logo, new flavour colour system, Arabic and English.", budget: 25000, currency: "EGP", deadline: ahead(6), mode: "shortlist", status: "in_progress", created_at: ago(18), reviewer_note: "Scope confirmed: 3 flavours, print-ready files.", preferred_talent: null, hired_proposal_id: "p-b2-y" },
    { id: "b3", client: "Nile Roastery", title: "Arabic website copy (8 pages)", category: "copy", description: "Rewrite our website in warm Egyptian Arabic with an English version. 8 pages including menu and franchise page.", budget: 12000, currency: "EGP", deadline: ahead(14), mode: "shortlist", status: "review", created_at: ago(0, 3), reviewer_note: "", preferred_talent: null, hired_proposal_id: null },
    { id: "b7", client: "Nile Roastery", title: "Barista portraits shoot", category: "photo", description: "Half-day shoot of 6 baristas for the 'Meet the barista' series.", budget: 9000, currency: "EGP", deadline: ahead(-20), mode: "shortlist", status: "delivered", created_at: ago(40), reviewer_note: "", preferred_talent: null, hired_proposal_id: "p-b7-a" },
    { id: "b4", client: "Glow Lab Skincare", title: "UGC ads for the vitamin C serum", category: "video", description: "6 UGC-style vertical ads with 3 creators, hooks tested for Meta. Saudi and Egyptian dialects.", budget: 30000, currency: "EGP", deadline: ahead(18), mode: "shortlist", status: "sourcing", created_at: ago(3), reviewer_note: "Approved. Needs creators who can do Saudi dialect.", preferred_talent: null, hired_proposal_id: null },
    { id: "b5", client: "Atlas Residences", title: "Sales center 3D walkthrough", category: "motion", description: "A 90-second 3D walkthrough of the sunset terrace units for the sales center screens.", budget: 90000, currency: "EGP", deadline: ahead(35), mode: "managed", status: "sourcing", created_at: ago(1), reviewer_note: "Managed: we coordinate 3D, motion and sound.", preferred_talent: null, hired_proposal_id: null },
    { id: "b8", client: "Glow Lab Skincare", title: "Product launch motion teaser", category: "motion", description: "A 15-second teaser for the new SPF range launch.", budget: 14000, currency: "EGP", deadline: ahead(4), mode: "shortlist", status: "in_progress", created_at: ago(12), reviewer_note: "", preferred_talent: null, hired_proposal_id: "p-b8-m" },
    { id: "b9", client: "Atlas Residences", title: "Launch film edit", category: "video", description: "Edit the launch film from existing footage, two cuts.", budget: 22000, currency: "EGP", deadline: ahead(-30), mode: "shortlist", status: "delivered", created_at: ago(55), reviewer_note: "", preferred_talent: null, hired_proposal_id: "p-b9-m" }
  ] as Brief[];

  briefs.push({ id: "b10", client: "Nile Roastery", title: "Ramadan ad set (10 statics)", category: "design", description: "Ten static ads for Ramadan offers, Arabic first, matching the seasonal menu look.", budget: 18000, currency: "EGP", deadline: ahead(5), mode: "shortlist", status: "in_progress", created_at: ago(16), reviewer_note: "Scope: 10 statics, 3 sizes each.", preferred_talent: null, hired_proposal_id: "p-b10-s", talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [] } as unknown as Brief);

  briefs.push({ id: "b11", client: "Sahel Juice Bar", title: "Summer menu launch: 6 reels", category: "motion", description: "Six 15-second reels for our summer menu. Bright, fast, Arabic captions. Two flavors per reel.", budget: 30000, currency: "EGP", deadline: ahead(20), mode: "shortlist", status: "sourcing", created_at: ago(2, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "medium", duration: "2–4 weeks", level: "pro", skills: ["Reels","After Effects","Arabic captions"] } as unknown as Brief);
  briefs.push({ id: "b12", client: "Mazaya Furniture", title: "Product photos for 40 pieces", category: "photo", description: "Studio shots of 40 furniture pieces on white plus 10 lifestyle shots in our showroom in New Cairo.", budget: 22000, currency: "EGP", deadline: ahead(16), mode: "shortlist", status: "sourcing", created_at: ago(1, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "medium", duration: "1–2 weeks", level: "pro", skills: ["Product","Lifestyle","Retouching"] } as unknown as Brief);
  briefs.push({ id: "b13", client: "Qamar Fashion", title: "Ramadan lookbook copy, Arabic and English", category: "copy", description: "Captions and a short lookbook story for 24 looks. Gulf dialect for KSA, English for UAE.", budget: 9000, currency: "EGP", deadline: ahead(12), mode: "shortlist", status: "sourcing", created_at: ago(0, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "small", duration: "Under a week", level: "pro", skills: ["Arabic copywriting","Gulf dialect","English copywriting"] } as unknown as Brief);
  briefs.push({ id: "b14", client: "Rawda Clinics", title: "Meta ads for 3 clinic branches", category: "ads", description: "Set up and run lead-gen campaigns for 3 branches. Creative testing plan included. Budget managed by us.", budget: 18000, currency: "EGP", deadline: ahead(25), mode: "shortlist", status: "sourcing", created_at: ago(3, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "medium", duration: "1–2 months", level: "pro", skills: ["Meta Ads","Creative testing","Analytics"] } as unknown as Brief);
  briefs.push({ id: "b15", client: "Nile Roastery", title: "Brand refresh for the franchise kit", category: "design", description: "Refresh our brand guidelines for franchise partners: logo usage, colors, menus, storefront signage.", budget: 45000, currency: "EGP", deadline: ahead(30), mode: "shortlist", status: "sourcing", created_at: ago(4, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "large", duration: "1–2 months", level: "elite", skills: ["Branding","Arabic typography","Packaging"] } as unknown as Brief);
  briefs.push({ id: "b16", client: "Tawasol App", title: "Landing page for app launch", category: "web", description: "One bilingual landing page with waitlist, built in Webflow. Copy provided.", budget: 16000, currency: "EGP", deadline: ahead(18), mode: "shortlist", status: "sourcing", created_at: ago(1, 6), reviewer_note: "", preferred_talent: null, hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], size: "small", duration: "1–2 weeks", level: "vetted", skills: ["Webflow","Landing pages","CRO"] } as unknown as Brief);

  const P = (id: string, brief_id: string, talent_id: string, price: number, days: number, status: Proposal["status"], score: number | null, why: string, pitch: string, d: number, feedback = ""): Proposal =>
    ({ id, brief_id, talent_id, price, days, status, score, why, pitch, created_at: ago(d), feedback });
  const proposals: Proposal[] = [
    P("p-b1-m", "b1", "t-mariam", 36000, 14, "shortlisted", 4.7, "Best F&B reels in the network; her latte reel hit the exact tone you described. Fastest timeline.", "I'll storyboard all four before shooting so you approve the idea first. Two rounds included.", 4),
    P("p-b1-n", "b1", "t-nour", 39500, 16, "shortlisted", 4.5, "A full crew: they can shoot real suhoor scenes, not only animate. Strongest if you want people on camera.", "We shoot and animate. Real families, real cafes, one shoot day for all four reels.", 4),
    P("p-b1-bv", "b1", "t-bv", 40000, 12, "shortlisted", 4.8, "Brand Vitals in-house team, reviewed by the same scorecard. Best if you want strategy and production together.", "Campaign idea, scripts and production under one team, with a weekly check-in.", 3),
    P("p-b1-h", "b1", "t-hagar", 30000, 20, "declined", 3.6, "", "3D-led reels with product renders.", 4, "Strong 3D, but the brief asks for warm lifestyle storytelling. We'll match you with product launches."),
    P("p-b1-x", "b1", "t-salma", 18000, 10, "declined", 3.2, "", "Template-based reels.", 4, "Motion craft below what this brief needs."),
    P("p-b2-y", "b2", "t-youssef", 24000, 12, "hired", 4.9, "Packaging specialist with strong Arabic type.", "Colour system first, then the 3 cans.", 16),
    P("p-b4-n", "b4", "t-nour", 29000, 14, "screening", null, "", "Three creators from our network, one Saudi. Hooks scripted and tested in pairs.", 1),
    P("p-b4-m", "b4", "t-mariam", 26000, 12, "screening", null, "", "I'll direct and edit; creators sourced through Vitals Crew. Motion captions in both dialects.", 0, ""),
    P("p-b4-h", "b4", "t-hagar", 22000, 10, "screening", null, "", "Animated product UGC hybrid.", 0),
    P("p-b7-a", "b7", "t-ahmed", 8500, 2, "hired", 4.7, "", "Half-day shoot, 30 edited portraits.", 38),
    P("p-b8-m", "b8", "t-mariam", 13000, 7, "hired", 4.6, "", "Three style frames first, then animation.", 10),
    P("p-b9-m", "b9", "t-mariam", 21000, 10, "hired", 4.7, "", "Two cuts: 90s and 30s.", 52),
    P("p-b10-s", "b10", "t-salma", 16000, 8, "hired", 4.2, "", "Ten statics in the seasonal menu style.", 15),
    P("p-b10-y", "b10", "t-youssef", 17500, 8, "not_selected", 4.8, "Strongest designer for this look.", "Ten statics, Arabic type first.", 15)
  ];
  for (const b of briefs) {
    const hp = proposals.find(p => p.id === b.hired_proposal_id);
    Object.assign(b, { talent_id: hp?.talent_id || null, kickoff_at: hp ? new Date(new Date(b.created_at).getTime() + 2 * day).toISOString() : null, qa_returns: 0, client_strikes: 0, switches: [] });
  }
  const bq = (id: string) => briefs.find(b => b.id === id)!;
  const job: Record<string, [string[], Brief["size"], string, Level]> = {
    b1: [["Reels", "After Effects", "Arabic captions"], "medium", "2–4 weeks", "pro"], b2: [["Packaging", "Arabic type", "Print"], "medium", "1–2 weeks", "elite"],
    b3: [["Arabic copywriting", "Egyptian dialect", "Web copy"], "small", "1–2 weeks", "pro"], b4: [["UGC", "Saudi dialect", "Meta ads"], "medium", "2–4 weeks", "pro"],
    b5: [["3D", "Architectural viz", "Sound design"], "large", "1–2 months", "elite"], b7: [["Portraits", "Studio lighting"], "small", "Under a week", "pro"],
    b8: [["Motion", "Product teaser"], "small", "Under a week", "pro"], b9: [["Editing", "Color grading"], "medium", "1–2 weeks", "pro"], b10: [["Social statics", "Arabic type"], "small", "1–2 weeks", "pro"]
  };
  for (const [id, [skills, size, duration, level]] of Object.entries(job)) { const b = briefs.find(x => x.id === id); if (b) Object.assign(b, { skills, size, duration, level }); }
  bq("b2").qa_returns = 1;
  bq("b8").client_strikes = 1;
  Object.assign(bq("b10"), { talent_id: "t-youssef", switches: [{ from: "t-salma", to: "t-youssef", at: ago(4), reason: "qa", note: "Three QA rounds returned: type hierarchy and Arabic copy errors. Moved to Youssef at our cost; deadline unchanged." }] });

  const D = (id: string, brief_id: string, talent_id: string, title: string, art: string, version: number, qa: Delivery["qa"], client: Delivery["client"], d: number, note: string, qa_note = "", client_note = ""): Delivery =>
    ({ id, brief_id, talent_id, title, art, version, qa, client, submitted_at: ago(d, 4), note, qa_note, qa_checks: qa === "passed" ? ["brief", "brand", "specs", "language", "files"] : [], qa_by: qa === "pending" ? "" : "Omar Khaled", client_note });
  const deliveries: Delivery[] = [
    D("d1", "b2", "t-youssef", "Can design · 3 flavours", "Cold brew launch carousel", 1, "returned", null, 5, "First round: colour system and the 3 cans.", "Logo lockup too small on the can mockup; Arabic headline needs kerning. Fix before the client sees it."),
    D("d2", "b2", "t-youssef", "Can design · 3 flavours", "Cold brew launch carousel", 2, "passed", "waiting", 1, "Logo bigger, Arabic kerning fixed, added print specs.", "Passed. Matches the brief and print specs."),
    D("d3a", "b8", "t-mariam", "SPF teaser · style frames", "Vitamin C serum ad · UGC", 1, "passed", "changes", 3, "Three style frames.", "Passed.", "The colours don't follow the SPF palette in our reference deck."),
    D("d3", "b8", "t-mariam", "SPF teaser · style frames", "Vitamin C serum ad · UGC", 2, "pending", null, 0, "Palette rebuilt from the reference deck; first 5 seconds animated."),
    D("d10a", "b10", "t-salma", "Ramadan statics", "Ramadan bundle static", 1, "returned", null, 9, "First 4 statics.", "Hierarchy unclear; the offer is lost under the product."),
    D("d10b", "b10", "t-salma", "Ramadan statics", "Ramadan bundle static", 2, "returned", null, 7, "Fixed hierarchy.", "Arabic copy has two spelling errors; story sizes wrong."),
    D("d10c", "b10", "t-salma", "Ramadan statics", "Ramadan bundle static", 3, "returned", null, 5, "Fixed copy and sizes.", "Third return: still off the seasonal menu look. Switching talent."),
    D("d10d", "b10", "t-youssef", "Ramadan statics · new designer", "Weekend offer story", 4, "passed", "waiting", 1, "Rebuilt all 10 in the seasonal menu style.", "Passed. Matches the menu look; all sizes checked."),
    D("d4", "b7", "t-ahmed", "Barista portraits · final selects", "Barista story post", 1, "passed", "approved", 25, "30 edited portraits.", "Passed.", "Beautiful, thank you!"),
    D("d5", "b9", "t-mariam", "Launch film · final cuts", "Launch film · rough cut", 2, "passed", "approved", 33, "90s and 30s cuts with sound mix.", "Passed.")
  ];

  deliveries.find(x => x.id === "d3a")!.client_kind = "off_brief";

  const A = (d: number, who: string, en: string, ar: string, brief_id?: string): Activity => ({ id: uid(), at: ago(d, Math.round(Math.random() * 5)), who, en, ar, brief_id });
  const activity: Activity[] = [
    A(0, "Hana Mostafa", "posted a brief: Arabic website copy", "نشرت بريف: محتوى الموقع بالعربي", "b3"),
    A(4, "Omar Khaled", "switched the Ramadan ad set to Youssef Hamdy after 3 QA rounds; deadline unchanged", "حوّل إعلانات رمضان ليوسف حمدي بعد ٣ جولات مراجعة؛ الميعاد زي ما هو", "b10"),
    A(1, "Omar Khaled", "passed QA on the can design v2", "اعتمد مراجعة الجودة لتصميم العلب النسخة ٢", "b2"),
    A(3, "Omar Khaled", "sent a shortlist of 3 for the Ramadan reels", "بعت قائمة مختصرة من ٣ لريلز رمضان", "b1"),
    A(5, "Omar Khaled", "returned the can design v1 with notes", "رجّع تصميم العلب النسخة ١ بملاحظات", "b2")
  ];

  return { talents, applications, briefs, proposals, deliveries, activity, stats: { applied_90d: 214, accepted_90d: 29, review_hours: 5.2 } };
}

// ---------- store ----------
let db: DB = load();
const listeners = new Set<() => void>();
function load(): DB {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}
function commit(fn: (d: DB) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
  listeners.forEach(l => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export function useDB(): DB { return useSyncExternalStore(subscribe, () => db); }
export function resetDemo() { db = seed(); try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } listeners.forEach(l => l()); }
window.addEventListener("storage", e => { if (e.key === KEY && e.newValue) { db = JSON.parse(e.newValue); listeners.forEach(l => l()); } });

const log = (d: DB, who: string, en: string, ar: string, brief_id?: string) => d.activity.unshift({ id: uid(), at: new Date().toISOString(), who, en, ar, brief_id });
const now = () => new Date().toISOString();

// ---------- helpers ----------
export const avg = (s: Scores | null) => { if (!s) return 0; const v = [s.craft, s.brief, s.communication, s.reliability].filter(x => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
export const talentOf = (d: DB, id: string | null | undefined) => d.talents.find(t => t.id === id);
export const hiredTalent = (d: DB, b: Brief) => { const p = d.proposals.find(x => x.id === b.hired_proposal_id); return p ? { p, t: talentOf(d, b.talent_id || p.talent_id) } : null; };

/** The client's protected timeline: kickoff, talent due (buffer before the deadline), deadline, and progress today. */
export function timeline(b: Brief) {
  const start = new Date(b.kickoff_at || b.created_at).getTime();
  const end = new Date(b.deadline + "T18:00:00").getTime();
  const talentDue = new Date(end - BUFFER_DAYS * day);
  const pct = Math.max(0, Math.min(100, ((Date.now() - start) / Math.max(1, end - start)) * 100));
  return { start: new Date(start), talentDue, end: new Date(end), pct, daysLeft: Math.ceil((end - Date.now()) / day) };
}

// Pick the replacement: someone already screened for this brief first, then the best free member in the same skill.
function pickBackup(d: DB, b: Brief): string | null {
  const used = new Set([b.talent_id, ...b.switches.map(s => s.from)]);
  const screened = d.proposals.filter(p => p.brief_id === b.id && (p.status === "not_selected" || p.status === "shortlisted") && !used.has(p.talent_id)).sort((x, y) => (y.score || 0) - (x.score || 0));
  if (screened[0]) return screened[0].talent_id;
  const rank = { elite: 3, pro: 2, vetted: 1 };
  const pool = d.talents.filter(t => t.category === b.category && t.available && !used.has(t.id) && t.kind !== "in_house").sort((x, y) => rank[y.level] - rank[x.level] || avg(y.scores) - avg(x.scores));
  return pool[0]?.id || d.talents.find(t => t.kind === "in_house")?.id || null;
}
function reassign(d: DB, b: Brief, reason: "qa" | "client") {
  const from = b.talent_id!; const to = pickBackup(d, b);
  if (!to) return;
  const note = reason === "qa" ? `${MAX_QA_ROUNDS} QA rounds returned. Moved at our cost; deadline unchanged.` : `${CLIENT_CHANCES} deliveries didn't match the brief. Moved at our cost; deadline unchanged.`;
  b.switches.push({ from, to, at: now(), reason, note });
  b.talent_id = to; b.qa_returns = 0; b.client_strikes = 0;
  const ft = talentOf(d, from), tt = talentOf(d, to);
  if (ft) ft.scores = { ...ft.scores, reliability: Math.max(1, +(ft.scores.reliability - 0.3).toFixed(1)) };
  log(d, ME.ops.name, `switched ${b.title} from ${ft?.name} to ${tt?.name}; the client's deadline stays the same`, `حوّل ${b.title} من ${ft?.name} لـ ${tt?.name}؛ ميعاد العميل زي ما هو`, b.id);
}

// ---------- actions ----------
export const actions = {
  setTalent(id: string | null) { try { if (id) localStorage.setItem("crew-talent-id", id); else localStorage.removeItem("crew-talent-id"); } catch { /* ignore */ } commit(() => {}); },
  postBrief(input: Pick<Brief, "title" | "category" | "description" | "budget" | "deadline" | "mode" | "preferred_talent" | "skills" | "size" | "duration" | "level">) {
    const id = uid();
    commit(d => {
      d.briefs.unshift({ id, client: ME.client.company, currency: "EGP", status: "review", created_at: now(), reviewer_note: "", hired_proposal_id: null, talent_id: null, kickoff_at: null, qa_returns: 0, client_strikes: 0, switches: [], ...input });
      log(d, ME.client.name, "posted a brief: " + input.title, "نشرت بريف: " + input.title, id);
    });
    return id;
  },
  approveBrief(id: string, note: string) {
    commit(d => { const b = d.briefs.find(x => x.id === id)!; b.status = "sourcing"; b.reviewer_note = note; log(d, ME.ops.name, "approved the brief and opened it to vetted talent: " + b.title, "اعتمد البريف وفتحه للمواهب المعتمدة: " + b.title, id); });
  },
  propose(brief_id: string, talent_id: string, price: number, days: number, pitch: string, samples: string[] = []) {
    commit(d => {
      d.proposals.unshift({ id: uid(), brief_id, talent_id, price, days, pitch, samples, status: "screening", score: null, why: "", feedback: "", created_at: now() });
      const t = talentOf(d, talent_id); const b = d.briefs.find(x => x.id === brief_id)!;
      log(d, t?.name || "", "sent a proposal for " + b.title, "قدّم عرض على " + b.title, brief_id);
    });
  },
  screen(id: string, decision: "shortlist" | "decline", score: number, text: string) {
    commit(d => {
      const p = d.proposals.find(x => x.id === id)!;
      p.score = score;
      if (decision === "shortlist") { p.status = "shortlisted"; p.why = text; } else { p.status = "declined"; p.feedback = text; }
    });
  },
  sendShortlist(brief_id: string) {
    commit(d => {
      const b = d.briefs.find(x => x.id === brief_id)!; b.status = "shortlist";
      d.proposals.filter(p => p.brief_id === brief_id && p.status === "screening").forEach(p => { p.status = "declined"; p.feedback = p.feedback || "Not selected for this shortlist."; });
      const n = d.proposals.filter(p => p.brief_id === brief_id && p.status === "shortlisted").length;
      log(d, ME.ops.name, `sent a vetted shortlist of ${n} for ${b.title}`, `بعت قائمة مختصرة من ${n} لـ ${b.title}`, brief_id);
    });
  },
  hire(brief_id: string, proposal_id: string) {
    commit(d => {
      const b = d.briefs.find(x => x.id === brief_id)!; b.status = "in_progress"; b.hired_proposal_id = proposal_id;
      Object.assign(b, { talent_id: d.proposals.find(p => p.id === proposal_id)!.talent_id, kickoff_at: now(), qa_returns: 0, client_strikes: 0, switches: [] });
      d.proposals.filter(p => p.brief_id === brief_id).forEach(p => { p.status = p.id === proposal_id ? "hired" : p.status === "shortlisted" ? "not_selected" : p.status; });
      const t = talentOf(d, d.proposals.find(p => p.id === proposal_id)!.talent_id);
      log(d, ME.client.name, `hired ${t?.name} for ${b.title}; payment held in escrow`, `اختارت ${t?.name} لـ ${b.title} والمبلغ محجوز بأمان`, brief_id);
    });
  },
  deliver(brief_id: string, talent_id: string, title: string, art: string, note: string) {
    commit(d => {
      const v = d.deliveries.filter(x => x.brief_id === brief_id).length + 1;
      d.deliveries.unshift({ id: uid(), brief_id, talent_id, title, art, version: v, note, submitted_at: now(), qa: "pending", qa_note: "", qa_checks: [], qa_by: "", client: null, client_note: "" });
      const t = talentOf(d, talent_id);
      log(d, t?.name || "", `submitted v${v} for quality review`, `سلّم النسخة ${v} لمراجعة الجودة`, brief_id);
    });
  },
  qa(id: string, pass: boolean, note: string, checks: string[]) {
    commit(d => {
      const x = d.deliveries.find(y => y.id === id)!;
      x.qa = pass ? "passed" : "returned"; x.qa_note = note; x.qa_checks = checks; x.qa_by = ME.ops.name; x.client = pass ? "waiting" : null;
      log(d, ME.ops.name, pass ? `passed QA on v${x.version}; sent to the client` : `returned v${x.version} to the talent with notes`, pass ? `اعتمد جودة النسخة ${x.version} وبعتها للعميل` : `رجّع النسخة ${x.version} بملاحظات`, x.brief_id);
      if (!pass) { const b = d.briefs.find(y => y.id === x.brief_id)!; b.qa_returns += 1; if (b.qa_returns >= MAX_QA_ROUNDS) reassign(d, b, "qa"); }
    });
  },
  clientDecide(id: string, approve: boolean, note: string, kind: "revision" | "off_brief" = "revision") {
    commit(d => {
      const x = d.deliveries.find(y => y.id === id)!; x.client = approve ? "approved" : "changes"; x.client_note = note; if (!approve) x.client_kind = kind;
      const b = d.briefs.find(y => y.id === x.brief_id)!;
      if (!approve && kind === "off_brief") { b.client_strikes += 1; if (b.client_strikes >= CLIENT_CHANCES) reassign(d, b, "client"); }
      if (approve) { b.status = "delivered"; const t = talentOf(d, x.talent_id); if (t) t.jobs += 1; }
      log(d, ME.client.name, approve ? `approved the delivery and released payment for ${b.title}` : `asked for changes on v${x.version}`, approve ? `وافقت على التسليم وصرفت المبلغ لـ ${b.title}` : `طلبت تعديل على النسخة ${x.version}`, b.id);
    });
  },
  apply(input: Pick<Application, "name" | "email" | "title" | "category" | "kind" | "members" | "city" | "links" | "portfolio" | "pieces">) {
    const id = uid();
    commit(d => { d.applications.unshift({ id, submitted_at: now(), stage: "portfolio", scores: null, history: [], level: null, ...input }); d.stats.applied_90d += 1; });
    return id;
  },
  review(id: string, scores: Scores, decision: "advance" | "approve" | "reject", note: string, level: Level = "vetted") {
    commit(d => {
      const a = d.applications.find(x => x.id === id)!;
      a.scores = scores;
      const next = decision === "reject" ? "rejected" : decision === "approve" ? "approved" : a.stage === "portfolio" ? "test" : "interview";
      a.stage = next; a.history.push({ stage: next, at: now(), by: ME.ops.name, note });
      if (decision === "approve") {
        a.level = level; d.stats.accepted_90d += 1;
        d.talents.push({ id: "t-" + id, name: a.name, title: a.title, title_ar: a.title, kind: a.kind, members: a.members, city: a.city, city_ar: a.city, category: a.category, level, rate: 8000, currency: "EGP", scores, jobs: 0, on_time: 100, rating: 0, joined: now(), portfolio: a.pieces.length ? a.pieces.map((p: Piece) => p.src) : a.portfolio, skills: [], bio: note, bio_ar: note, available: true });
        log(d, ME.ops.name, `accepted ${a.name} into Vitals Crew (${level})`, `قبل ${a.name} في Vitals Crew (${level})`);
      }
    });
  }
};

export interface Pack { key: "basic" | "standard" | "premium"; price: number; days: number; revisions: number; en: string; ar: string }
const PACK_TEXT: Record<string, [string, string][]> = {
  design: [["2 social designs", "تصميمين سوشيال"], ["6 designs + 1 story set", "٦ تصميمات + ستوري"], ["Full campaign kit (15 assets)", "كيت حملة كامل (١٥ تصميم)"]],
  motion: [["1 reel up to 15s", "ريل واحد لحد ١٥ ثانية"], ["3 reels up to 30s", "٣ ريلز لحد ٣٠ ثانية"], ["Campaign: 6 reels + teaser", "حملة: ٦ ريلز + تيزر"]],
  video: [["2 UGC videos", "٢ فيديو UGC"], ["6 UGC videos, 2 creators", "٦ فيديو، ٢ كريتورز"], ["Shoot day + 10 edits", "يوم تصوير + ١٠ مونتاج"]],
  copy: [["1 landing page", "صفحة هبوط واحدة"], ["Website up to 6 pages", "موقع لحد ٦ صفحات"], ["Brand voice + 12 pages", "صوت البراند + ١٢ صفحة"]],
  social: [["2 weeks of content", "محتوى أسبوعين"], ["1 month, 12 posts", "شهر، ١٢ بوست"], ["1 month + community", "شهر + إدارة المجتمع"]],
  web: [["1 landing page", "صفحة هبوط"], ["Site up to 5 pages", "موقع لحد ٥ صفحات"], ["Site + CMS + CRO", "موقع + لوحة تحكم + تحسين تحويل"]],
  ads: [["Account audit", "مراجعة الحساب"], ["Setup + 2 weeks", "إعداد + أسبوعين"], ["Full month management", "إدارة شهر كامل"]],
  photo: [["Half-day, 15 photos", "نص يوم، ١٥ صورة"], ["Full day, 40 photos", "يوم كامل، ٤٠ صورة"], ["2 days + retouching", "يومين + ريتاتش"]]
};
export function packagesOf(t: Talent): Pack[] {
  const tx = PACK_TEXT[t.category] || PACK_TEXT.design;
  const r = (x: number) => Math.round(x / 500) * 500;
  return [
    { key: "basic", price: r(t.rate), days: 4, revisions: 1, en: tx[0][0], ar: tx[0][1] },
    { key: "standard", price: r(t.rate * 1.9), days: 8, revisions: 2, en: tx[1][0], ar: tx[1][1] },
    { key: "premium", price: r(t.rate * 3.2), days: 14, revisions: 3, en: tx[2][0], ar: tx[2][1] }
  ];
}
