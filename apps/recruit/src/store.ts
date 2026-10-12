// Demo store for Vitals Recruit: one shared database in localStorage, so switching between
// the candidate, company and Brand Vitals screening views shows the same pipeline reacting live.
// Every piece of seeded content exists in English and Arabic; text people type is stored as written.
import { useSyncExternalStore } from "react";

export type Field = "design" | "content" | "media" | "social" | "brand" | "motion" | "performance" | "pr";
export type JobType = "full_time" | "part_time" | "contract";
export type WorkMode = "onsite" | "hybrid" | "remote";
export type Level = "junior" | "mid" | "senior" | "lead";
export type Edu = "any" | "bachelor" | "master";
export type Stage = "screening" | "not_matched" | "shortlisted" | "interview" | "offer" | "hired" | "not_selected";
export type Role = "candidate" | "company" | "screening";

export interface Company { id: string; name: string; name_ar: string; industry: string; industry_ar: string; city: string; city_ar: string; size: string; founded: string; about: string; about_ar: string; color: string }
export interface Job {
  id: string; company_id: string; title: string; title_ar: string; field: Field; type: JobType; mode: WorkMode; level: Level;
  city: string; city_ar: string; salary_min: number; salary_max: number; currency: string; exp_min: number; exp_max: number; education: Edu;
  skills: string[]; description: string; description_ar: string; requirements: string[]; requirements_ar: string[];
  posted_at: string; status: "open" | "closed"; views: number; openings: number; saudi?: boolean;
}
export interface Experience { title: string; title_ar?: string; company: string; company_ar?: string; from: string; to: string; summary: string; summary_ar?: string }
export interface Education { school: string; school_ar?: string; degree: string; degree_ar?: string; year: string }
export interface CV { name: string; size: number; data?: string }
export interface Interests { fields: Field[]; types: JobType[]; modes: WorkMode[]; salary: number; currency: string }
export interface Candidate {
  id: string; name: string; name_ar?: string; headline: string; headline_ar?: string; city: string; city_ar: string; email: string; phone: string;
  about: string; about_ar?: string; years: number; experience: Experience[]; education: Education[]; skills: string[]; languages: string[];
  cv: CV | null; link: string; interests: Interests;
}
export interface Event { stage: Stage; at: string; by: string; note: string; note_ar?: string }
export interface Application {
  id: string; job_id: string; candidate_id: string; cover: string; applied_at: string; stage: Stage;
  fit: number | null; screen_note: string; screen_note_ar?: string; viewed: boolean; history: Event[];
}
export interface Note { id: string; to: Role; at: string; text: string; text_ar: string; link: string; read: boolean }
export interface DB { companies: Company[]; jobs: Job[]; candidates: Candidate[]; applications: Application[]; saved: string[]; seen: string[]; notes: Note[] }

const KEY = "recruit-demo-v3";
const day = 86400000;
const ago = (d: number, h = 0) => new Date(Date.now() - d * day - h * 3600000).toISOString();
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// The people this demo browser plays (fictional).
export const ME = { candidate: "c-sara", company: "co-atlas", hr: "Rana Youssef", hr_ar: "رنا يوسف", screener: "Mostafa Ali", screener_ar: "مصطفى علي" };

function seed(): DB {
  const companies: Company[] = [
    { id: "co-atlas", name: "Atlas Residences", name_ar: "أطلس ريزيدنسز", industry: "Real estate developer", industry_ar: "تطوير عقاري", city: "New Cairo", city_ar: "القاهرة الجديدة", size: "200–500", founded: "2012", color: "#1E3A8A", about: "A residential developer with four compounds in East Cairo and an in-house marketing team of 14.", about_ar: "شركة تطوير سكني عندها ٤ كمبوندات في شرق القاهرة وفريق تسويق داخلي من ١٤ شخص." },
    { id: "co-nile", name: "Nile Roastery", name_ar: "نايل روستري", industry: "Coffee chain", industry_ar: "سلسلة كافيهات", city: "Cairo", city_ar: "القاهرة", size: "50–200", founded: "2016", color: "#8A4B1E", about: "Specialty coffee with 18 branches across Egypt.", about_ar: "قهوة مختصة بـ ١٨ فرع في مصر." },
    { id: "co-glow", name: "Glow Lab Skincare", name_ar: "جلو لاب للعناية بالبشرة", industry: "Beauty e-commerce", industry_ar: "تجارة إلكترونية للتجميل", city: "Riyadh", city_ar: "الرياض", size: "50–200", founded: "2019", color: "#9D2B6B", about: "Direct-to-consumer skincare selling across the Gulf.", about_ar: "منتجات عناية بالبشرة بتتباع أونلاين مباشرة في الخليج." },
    { id: "co-bv", name: "Brand Vitals", name_ar: "براند ڤايتلز", industry: "Growth agency", industry_ar: "وكالة نمو", city: "New Cairo", city_ar: "القاهرة الجديدة", size: "50–200", founded: "2018", color: "#0A1326", about: "The growth agency behind Vitals Studio, Web, Events, GO, Crew and Recruit.", about_ar: "وكالة النمو اللي ورا Vitals Studio وWeb وEvents وGO وCrew وRecruit." }
  ];
  const J = (o: Omit<Job, "posted_at" | "status" | "views"> & { d: number; views: number }): Job => { const { d, ...j } = o; return { ...j, posted_at: ago(d), status: "open" }; };
  const jobs: Job[] = [
    J({ id: "j1", company_id: "co-atlas", title: "Senior Social Media Specialist", title_ar: "أخصائي سوشيال ميديا أول", field: "social", type: "full_time", mode: "onsite", level: "senior", city: "New Cairo", city_ar: "القاهرة الجديدة", salary_min: 28000, salary_max: 38000, currency: "EGP", exp_min: 4, exp_max: 7, education: "bachelor", openings: 1, d: 2, views: 412,
      skills: ["Content strategy", "Community management", "Meta Business Suite", "Arabic copywriting", "Reporting"],
      description: "Own the content calendar and community for four residential compounds. You will plan monthly content, brief the design team, and report on reach and lead quality every week.",
      description_ar: "هتكون مسؤول عن خطة المحتوى وإدارة المجتمع لأربع كمبوندات سكنية. هتخطط المحتوى الشهري، وتبرّف فريق التصميم، وتقدّم تقرير أسبوعي عن الوصول وجودة الليدز.",
      requirements: ["4+ years managing brand social accounts", "Real estate or high-ticket experience", "Strong Arabic and English writing", "Comfortable with Meta Business Suite and reporting"],
      requirements_ar: ["خبرة ٤ سنين أو أكتر في إدارة حسابات براندات", "خبرة في العقارات أو المنتجات عالية القيمة", "كتابة قوية بالعربي والإنجليزي", "تمكّن من Meta Business Suite والتقارير"] }),
    J({ id: "j2", company_id: "co-atlas", title: "Graphic Designer", title_ar: "مصمم جرافيك", field: "design", type: "full_time", mode: "hybrid", level: "mid", city: "New Cairo", city_ar: "القاهرة الجديدة", salary_min: 18000, salary_max: 26000, currency: "EGP", exp_min: 2, exp_max: 4, education: "bachelor", openings: 2, d: 6, views: 288,
      skills: ["Arabic typography", "Illustrator", "Photoshop", "InDesign", "Brand systems"],
      description: "Design campaign visuals, brochures and social posts within an established brand system.",
      description_ar: "تصميم بصريات الحملات والبروشورات وبوستات السوشيال جوه هوية بصرية جاهزة.",
      requirements: ["2–4 years of agency or in-house design", "Arabic typography", "Adobe Illustrator, Photoshop and InDesign", "A portfolio link"],
      requirements_ar: ["خبرة من سنتين لـ ٤ سنين في وكالة أو فريق داخلي", "تمكّن من الخط العربي", "Illustrator وPhotoshop وInDesign", "لينك بورتفوليو"] }),
    J({ id: "j3", company_id: "co-nile", title: "Content Creator (Arabic)", title_ar: "صانع محتوى (عربي)", field: "content", type: "full_time", mode: "onsite", level: "mid", city: "Cairo", city_ar: "القاهرة", salary_min: 15000, salary_max: 22000, currency: "EGP", exp_min: 2, exp_max: 5, education: "any", openings: 1, d: 3, views: 534,
      skills: ["Reels", "Phone shooting", "CapCut", "Arabic copywriting", "On-camera"],
      description: "Write, shoot and edit short-form content for 18 branches. Reels first.",
      description_ar: "كتابة وتصوير ومونتاج محتوى قصير لـ ١٨ فرع. الريلز الأول.",
      requirements: ["2+ years creating content for a consumer brand", "Phone shooting and CapCut or Premiere", "Natural Egyptian Arabic voice"],
      requirements_ar: ["خبرة سنتين أو أكتر في صناعة محتوى لبراند استهلاكي", "تصوير بالموبايل وCapCut أو Premiere", "أسلوب مصري طبيعي في الكلام"] }),
    J({ id: "j4", company_id: "co-glow", title: "Performance Marketing Manager", title_ar: "مدير تسويق أداء", field: "performance", type: "full_time", mode: "remote", level: "senior", city: "Riyadh (remote)", city_ar: "الرياض (عن بُعد)", salary_min: 18000, salary_max: 24000, currency: "SAR", exp_min: 5, exp_max: 9, education: "bachelor", openings: 1, d: 1, views: 197,
      skills: ["Meta Ads", "TikTok Ads", "Snapchat Ads", "Creative testing", "GA4"],
      description: "Lead paid acquisition across Meta, TikTok and Snapchat for the Gulf. Own budgets, testing and reporting.",
      description_ar: "قيادة الإعلانات الممولة على Meta وTikTok وSnapchat في الخليج. مسؤول عن الميزانيات والاختبارات والتقارير.",
      requirements: ["5+ years running paid social for e-commerce", "Managed monthly budgets above SAR 200k", "Creative testing frameworks", "GA4 and MMP experience"],
      requirements_ar: ["خبرة ٥ سنين أو أكتر في الإعلانات الممولة للتجارة الإلكترونية", "إدارة ميزانيات شهرية فوق ٢٠٠ ألف ريال", "منهجية لاختبار الكرييتيف", "خبرة في GA4 وأدوات قياس التطبيقات"] }),
    J({ id: "j5", company_id: "co-bv", title: "Motion Designer", title_ar: "مصمم موشن", field: "motion", type: "full_time", mode: "hybrid", level: "mid", city: "New Cairo", city_ar: "القاهرة الجديدة", salary_min: 20000, salary_max: 30000, currency: "EGP", exp_min: 3, exp_max: 6, education: "any", openings: 1, d: 8, views: 361,
      skills: ["After Effects", "Cinema 4D", "Premiere Pro", "Ad creative"],
      description: "Animate ads, reels and launch films for agency clients with Vitals Studio.",
      description_ar: "تحريك الإعلانات والريلز وأفلام الإطلاق لعملاء الوكالة مع Vitals Studio.",
      requirements: ["3+ years in motion design", "After Effects; Cinema 4D is a plus", "A reel link"],
      requirements_ar: ["خبرة ٣ سنين أو أكتر في الموشن", "After Effects، وCinema 4D ميزة إضافية", "لينك ريل"] }),
    J({ id: "j6", company_id: "co-bv", title: "Brand Strategist", title_ar: "استراتيجي براند", field: "brand", type: "full_time", mode: "onsite", level: "senior", city: "New Cairo", city_ar: "القاهرة الجديدة", salary_min: 35000, salary_max: 50000, currency: "EGP", exp_min: 6, exp_max: 10, education: "bachelor", openings: 1, d: 12, views: 240,
      skills: ["Positioning", "Brand platforms", "Workshops", "Research"],
      description: "Lead positioning and brand platforms for clients across MENA.",
      description_ar: "قيادة التموضع وبناء منصات البراند لعملاء في الشرق الأوسط وشمال أفريقيا.",
      requirements: ["6+ years in brand strategy", "Agency background", "Workshops with founders and C-level"],
      requirements_ar: ["خبرة ٦ سنين أو أكتر في استراتيجية البراند", "خلفية في الوكالات", "إدارة ورش عمل مع المؤسسين والإدارة العليا"] }),
    J({ id: "j7", company_id: "co-nile", title: "Media Buyer", title_ar: "ميديا باير", field: "media", type: "contract", mode: "remote", level: "junior", city: "Egypt (remote)", city_ar: "مصر (عن بُعد)", salary_min: 12000, salary_max: 16000, currency: "EGP", exp_min: 1, exp_max: 3, education: "any", openings: 2, d: 5, views: 455,
      skills: ["Meta Ads", "Excel", "Reporting", "Local campaigns"],
      description: "Run and optimise local campaigns for new branch openings. 6-month contract.",
      description_ar: "إدارة وتحسين حملات محلية لافتتاح الفروع الجديدة. عقد ٦ شهور.",
      requirements: ["1+ year running Meta campaigns", "Basic Excel reporting"],
      requirements_ar: ["خبرة سنة أو أكتر في حملات Meta", "تقارير أساسية على Excel"] }),
    J({ id: "j8", saudi: true, company_id: "co-glow", title: "PR & Communications Lead", title_ar: "قائد العلاقات العامة والاتصال", field: "pr", type: "full_time", mode: "hybrid", level: "lead", city: "Riyadh", city_ar: "الرياض", salary_min: 26000, salary_max: 34000, currency: "SAR", exp_min: 7, exp_max: 12, education: "bachelor", openings: 1, d: 15, views: 129,
      skills: ["Media relations", "Influencer partnerships", "Launch comms", "Arabic writing"],
      description: "Own media relations, influencer partnerships and launch communications in KSA.",
      description_ar: "مسؤول عن العلاقات الإعلامية وشراكات المؤثرين واتصالات الإطلاق في السعودية.",
      requirements: ["7+ years in PR or communications", "Saudi media network", "Arabic and English"],
      requirements_ar: ["خبرة ٧ سنين أو أكتر في العلاقات العامة أو الاتصال", "شبكة علاقات في الإعلام السعودي", "عربي وإنجليزي"] }),
    J({ id: "j9", company_id: "co-atlas", title: "Social Media Coordinator", title_ar: "منسق سوشيال ميديا", field: "social", type: "full_time", mode: "onsite", level: "junior", city: "New Cairo", city_ar: "القاهرة الجديدة", salary_min: 12000, salary_max: 16000, currency: "EGP", exp_min: 0, exp_max: 2, education: "bachelor", openings: 1, d: 0, views: 63,
      skills: ["Scheduling", "Community management", "Canva", "Reporting"],
      description: "Schedule posts, answer comments and messages, and keep the weekly report up to date for four compounds.",
      description_ar: "جدولة البوستات، والرد على التعليقات والرسائل، وتحديث التقرير الأسبوعي لأربع كمبوندات.",
      requirements: ["Up to 2 years in social media", "Fast, polite replies in Arabic", "Canva basics"],
      requirements_ar: ["خبرة لحد سنتين في السوشيال ميديا", "رد سريع ومهذب بالعربي", "أساسيات Canva"] }),
    J({ id: "j10", company_id: "co-glow", title: "Arabic Copywriter", title_ar: "كاتب محتوى عربي", field: "content", type: "part_time", mode: "remote", level: "mid", city: "Remote · GCC", city_ar: "عن بُعد · الخليج", salary_min: 7000, salary_max: 10000, currency: "SAR", exp_min: 2, exp_max: 5, education: "any", openings: 1, d: 4, views: 302,
      skills: ["Arabic copywriting", "Saudi dialect", "Product pages", "Ad copy"],
      description: "Write product pages, ads and emails in Saudi Arabic, 20 hours a week.",
      description_ar: "كتابة صفحات المنتجات والإعلانات والإيميلات باللهجة السعودية، ٢٠ ساعة في الأسبوع.",
      requirements: ["2+ years writing for a beauty or retail brand", "Natural Saudi dialect", "Samples of ad copy"],
      requirements_ar: ["خبرة سنتين أو أكتر في الكتابة لبراند تجميل أو تجزئة", "لهجة سعودية طبيعية", "نماذج من كتابة إعلانات"] })
  ];
  const int = (fields: Field[], salary: number): Interests => ({ fields, types: ["full_time"], modes: ["onsite", "hybrid"], salary, currency: "EGP" });
  const candidates: Candidate[] = [
    { id: "c-sara", name: "Sara Hassan", name_ar: "سارة حسن", headline: "Social Media Specialist", headline_ar: "أخصائية سوشيال ميديا", city: "Cairo", city_ar: "القاهرة", email: "sara.hassan@example.com", phone: "+20 10 0000 0000", years: 5, link: "",
      about: "Social media specialist with five years across real estate and retail. I plan content around sales goals and report on what it brings in, not only reach.",
      about_ar: "أخصائية سوشيال ميديا بخبرة ٥ سنين في العقارات والتجزئة. بخطط المحتوى حوالين أهداف المبيعات وبقيس اللي بيجيبه، مش الوصول بس.",
      experience: [
        { title: "Social Media Specialist", title_ar: "أخصائية سوشيال ميديا", company: "Residential developer (agency side)", company_ar: "مطوّر عقاري (من جهة الوكالة)", from: "2022", to: "Present", summary: "Ran social for two residential launches; grew qualified leads from social by 38% in a year.", summary_ar: "أدرت السوشيال لإطلاقين سكنيين، وزوّدت الليدز المؤهلة من السوشيال ٣٨٪ في سنة." },
        { title: "Content Executive", title_ar: "منفّذة محتوى", company: "Digital agency, Cairo", company_ar: "وكالة ديجيتال، القاهرة", from: "2020", to: "2022", summary: "Wrote and scheduled content for six F&B and retail brands.", summary_ar: "كتبت وجدولت محتوى لست براندات أكل وتجزئة." }
      ],
      education: [{ school: "Cairo University", school_ar: "جامعة القاهرة", degree: "BA, Mass Communication", degree_ar: "بكالوريوس إعلام", year: "2019" }],
      skills: ["Content strategy", "Community management", "Meta Business Suite", "Arabic copywriting", "Reporting"], languages: ["Arabic", "English"],
      cv: { name: "Sara_Hassan_CV.pdf", size: 184000 }, interests: int(["social", "content"], 30000) },
    { id: "c-omar", name: "Omar Nabil", name_ar: "عمر نبيل", headline: "Senior Social Media Manager", headline_ar: "مدير سوشيال ميديا أول", city: "Giza", city_ar: "الجيزة", email: "omar.nabil@example.com", phone: "+20 10 0000 0001", years: 7, link: "",
      about: "Seven years leading social for large Egyptian brands, three of them in real estate.", about_ar: "سبع سنين بقود السوشيال لبراندات مصرية كبيرة، تلاتة منهم في العقارات.",
      experience: [
        { title: "Social Media Manager", title_ar: "مدير سوشيال ميديا", company: "Telecom brand", company_ar: "براند اتصالات", from: "2021", to: "Present", summary: "Led a team of 5; built the always-on content model.", summary_ar: "قدت فريق من ٥، وبنيت نموذج المحتوى المستمر." },
        { title: "Senior Specialist", title_ar: "أخصائي أول", company: "Real estate developer", company_ar: "مطوّر عقاري", from: "2018", to: "2021", summary: "Owned social for three compounds.", summary_ar: "مسؤول عن السوشيال لتلات كمبوندات." }
      ],
      education: [{ school: "AUC", school_ar: "الجامعة الأمريكية بالقاهرة", degree: "BA, Integrated Marketing Communication", degree_ar: "بكالوريوس اتصالات تسويقية متكاملة", year: "2017" }],
      skills: ["Content strategy", "Team leadership", "Paid social", "Crisis comms", "Reporting"], languages: ["Arabic", "English"], cv: { name: "Omar_Nabil_CV.pdf", size: 201000 }, interests: int(["social"], 40000) },
    { id: "c-mai", name: "Mai Fawzy", name_ar: "مي فوزي", headline: "Social Media Coordinator", headline_ar: "منسقة سوشيال ميديا", city: "Alexandria", city_ar: "الإسكندرية", email: "mai.fawzy@example.com", phone: "+20 10 0000 0002", years: 2, link: "",
      about: "Coordinator looking for a bigger brand to grow with.", about_ar: "منسقة بدوّر على براند أكبر أكبر معاه.",
      experience: [{ title: "Social Media Coordinator", title_ar: "منسقة سوشيال ميديا", company: "Clothing brand", company_ar: "براند ملابس", from: "2023", to: "Present", summary: "Scheduling and replies for a fashion brand.", summary_ar: "جدولة وردود لبراند أزياء." }],
      education: [{ school: "Alexandria University", school_ar: "جامعة الإسكندرية", degree: "BCom", degree_ar: "بكالوريوس تجارة", year: "2022" }],
      skills: ["Scheduling", "Canva", "Community management"], languages: ["Arabic", "English"], cv: { name: "Mai_Fawzy_CV.pdf", size: 120000 }, interests: int(["social"], 15000) },
    { id: "c-youssef", name: "Youssef Kamal", name_ar: "يوسف كمال", headline: "Graphic Designer", headline_ar: "مصمم جرافيك", city: "Cairo", city_ar: "القاهرة", email: "youssef.kamal@example.com", phone: "+20 10 0000 0003", years: 3, link: "",
      about: "Designer with a strong Arabic type sense and real estate campaign work.", about_ar: "مصمم عنده حس قوي في الخط العربي وشغل حملات عقارية.",
      experience: [{ title: "Designer", title_ar: "مصمم", company: "Branding studio", company_ar: "ستوديو هويات", from: "2021", to: "Present", summary: "Brochures, campaign key visuals and social for developers and hospitality.", summary_ar: "بروشورات وكي فيجوال للحملات وسوشيال لمطورين عقاريين وفنادق." }],
      education: [{ school: "Helwan University", school_ar: "جامعة حلوان", degree: "BFA, Graphic Design", degree_ar: "بكالوريوس فنون تطبيقية، جرافيك", year: "2020" }],
      skills: ["Arabic typography", "Illustrator", "InDesign", "Brand systems"], languages: ["Arabic", "English"], cv: { name: "Youssef_Kamal_CV.pdf", size: 156000 }, interests: int(["design"], 24000) },
    { id: "c-lina", name: "Lina Abdelrahman", name_ar: "لينا عبد الرحمن", headline: "Performance Marketing Lead", headline_ar: "قائدة تسويق أداء", city: "Riyadh", city_ar: "الرياض", email: "lina.a@example.com", phone: "+966 50 000 0000", years: 6, link: "",
      about: "Paid social for Gulf e-commerce, testing first.", about_ar: "إعلانات ممولة للتجارة الإلكترونية في الخليج، والاختبار الأول.",
      experience: [{ title: "Performance Lead", title_ar: "قائدة أداء", company: "Beauty e-commerce, KSA", company_ar: "تجارة إلكترونية للتجميل، السعودية", from: "2022", to: "Present", summary: "Scaled spend to SAR 350k a month at a 3.1 ROAS.", summary_ar: "كبّرت الصرف لـ ٣٥٠ ألف ريال شهريًا بعائد ٣.١." }],
      education: [{ school: "King Saud University", school_ar: "جامعة الملك سعود", degree: "BSc, Marketing", degree_ar: "بكالوريوس تسويق", year: "2018" }],
      skills: ["Meta Ads", "TikTok Ads", "Creative testing", "GA4", "AppsFlyer"], languages: ["Arabic", "English"], cv: { name: "Lina_Abdelrahman_CV.pdf", size: 176000 }, interests: { ...int(["performance"], 22000), currency: "SAR", modes: ["remote", "hybrid"] } },
    { id: "c-hany", name: "Hany Samir", name_ar: "هاني سمير", headline: "Social Media Specialist", headline_ar: "أخصائي سوشيال ميديا", city: "Cairo", city_ar: "القاهرة", email: "hany.samir@example.com", phone: "+20 10 0000 0004", years: 4, link: "",
      about: "Four years in real estate social media.", about_ar: "أربع سنين في سوشيال ميديا العقارات.",
      experience: [{ title: "Social Media Specialist", title_ar: "أخصائي سوشيال ميديا", company: "Developer, New Capital", company_ar: "مطوّر عقاري، العاصمة الإدارية", from: "2021", to: "Present", summary: "Content and community for a 600-unit compound.", summary_ar: "محتوى وإدارة مجتمع لكمبوند ٦٠٠ وحدة." }],
      education: [{ school: "Ain Shams University", school_ar: "جامعة عين شمس", degree: "BA, Commerce", degree_ar: "بكالوريوس تجارة", year: "2019" }],
      skills: ["Content strategy", "Community management", "Reporting"], languages: ["Arabic", "English"], cv: { name: "Hany_Samir_CV.pdf", size: 143000 }, interests: int(["social"], 30000) }
  ];
  const E = (stage: Stage, d: number, by: string, note: string, note_ar: string): Event => ({ stage, at: ago(d), by, note, note_ar });
  const A = (id: string, job_id: string, candidate_id: string, d: number, stage: Stage, fit: number | null, screen_note: string, screen_note_ar: string, history: Event[], viewed = false, cover = ""): Application =>
    ({ id, job_id, candidate_id, cover, applied_at: ago(d), stage, fit, screen_note, screen_note_ar, viewed, history });
  const S = ME.screener;
  const applications: Application[] = [
    A("ap1", "j1", "c-sara", 1, "screening", null, "", "", [], false, "Real estate social is exactly what I do now, and I report on leads every week."),
    A("ap2", "j1", "c-omar", 2, "shortlisted", 5, "Seven years, three compounds, has led a team. Strong match for the senior level; salary expectation within range.", "سبع سنين وتلات كمبوندات وقاد فريق. مناسب جدًا للمستوى الأول، وتوقعاته للمرتب في النطاق.", [E("shortlisted", 1, S, "Portfolio and references checked.", "البورتفوليو والمراجع اتراجعوا.")]),
    A("ap3", "j1", "c-hany", 2, "interview", 4, "Four years in real estate social, good reporting. Slightly junior for 'senior' but the closest domain match.", "أربع سنين في سوشيال العقارات وتقاريره كويسة. أقل شوية من مستوى «أول» لكنه الأقرب للمجال.", [E("shortlisted", 2, S, "Shortlisted.", "اترشّح."), E("interview", 1, ME.hr, "Interview booked for Thursday 11:00.", "المقابلة يوم الخميس الساعة ١١.")], true),
    A("ap4", "j1", "c-mai", 2, "not_matched", 2, "Two years and no real estate experience. Kindly told, and pointed to the Social Media Coordinator role.", "سنتين خبرة ومفيش خبرة عقارات. اتبلغت بلطف واترشّح لها وظيفة منسق السوشيال ميديا.", [E("not_matched", 1, S, "Below the experience bar for this role.", "أقل من الخبرة المطلوبة للوظيفة دي.")]),
    A("ap5", "j2", "c-youssef", 4, "shortlisted", 4, "Strong Arabic type, relevant brochure work. Portfolio checked.", "خط عربي قوي وشغل بروشورات مناسب. البورتفوليو اتراجع.", [E("shortlisted", 3, S, "Shortlisted.", "اترشّح.")]),
    A("ap6", "j4", "c-lina", 1, "screening", null, "", "", []),
    A("ap7", "j5", "c-sara", 9, "not_matched", 2, "Different discipline: this is a motion role. Suggested Social roles instead.", "تخصص مختلف: دي وظيفة موشن. اترشّحلها وظايف سوشيال بدلها.", [E("not_matched", 8, S, "Not a motion profile.", "البروفايل مش موشن.")]),
    A("ap8", "j3", "c-sara", 6, "interview", 4, "Good Arabic voice and on-camera comfort shown in her samples.", "أسلوب عربي كويس وراحة قدام الكاميرا باينة في النماذج.", [E("shortlisted", 5, S, "Shortlisted.", "اترشّحت."), E("interview", 3, "Nile Roastery HR", "Interview on Sunday.", "المقابلة يوم الأحد.")], true)
  ];
  const notes: Note[] = [
    { id: "n1", to: "candidate", at: ago(3), text: "Nile Roastery invited you to an interview for Content Creator (Arabic).", text_ar: "نايل روستري دعتك لمقابلة لوظيفة صانع محتوى (عربي).", link: "/applications", read: false },
    { id: "n2", to: "candidate", at: ago(0, 6), text: "New job that matches your profile: Social Media Coordinator at Atlas Residences.", text_ar: "وظيفة جديدة مناسبة لبروفايلك: منسق سوشيال ميديا في أطلس ريزيدنسز.", link: "/jobs/j9", read: false },
    { id: "n3", to: "company", at: ago(1), text: "Brand Vitals screened Omar Nabil for Senior Social Media Specialist: fit 5/5.", text_ar: "Brand Vitals فرزت عمر نبيل لوظيفة أخصائي سوشيال ميديا أول: توافق ٥/٥.", link: "/company/applicants/ap2", read: false },
    { id: "n4", to: "screening", at: ago(1), text: "New application to screen: Sara Hassan for Senior Social Media Specialist.", text_ar: "طلب جديد للفرز: سارة حسن لوظيفة أخصائي سوشيال ميديا أول.", link: "/screening/review/ap1", read: false },
    { id: "n5", to: "screening", at: ago(1), text: "New application to screen: Lina Abdelrahman for Performance Marketing Manager.", text_ar: "طلب جديد للفرز: لينا عبد الرحمن لوظيفة مدير تسويق أداء.", link: "/screening/review/ap6", read: false }
  ];
  return { companies, jobs, candidates, applications, saved: ["j4", "j9"], seen: [], notes };
}

// ---------- tiny reactive store ----------
let db: DB = load();
const subs = new Set<() => void>();
function load(): DB { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch { /* ignore */ } return seed(); }
function save(next: DB) {
  db = next;
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch { try { localStorage.setItem(KEY, JSON.stringify({ ...db, candidates: db.candidates.map(c => c.cv ? { ...c, cv: { name: c.cv.name, size: c.cv.size } } : c) })); } catch { /* ignore */ } }
  subs.forEach(f => f());
}
export function useDB() { return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb); }, () => db); }
export function resetDemo() { save(seed()); }
// another tab (or the other role in a second window) changed the demo: pick it up live
if (typeof window !== "undefined") window.addEventListener("storage", e => { if (e.key === KEY) { db = load(); subs.forEach(f => f()); } });

export const jobOf = (d: DB, id: string) => d.jobs.find(j => j.id === id);
export const companyOf = (d: DB, id: string) => d.companies.find(c => c.id === id)!;
export const candidateOf = (d: DB, id: string) => d.candidates.find(c => c.id === id);
export const appOf = (d: DB, id: string) => d.applications.find(a => a.id === id);
/** Companies only ever see applications that passed Brand Vitals screening. */
export const VISIBLE_TO_COMPANY: Stage[] = ["shortlisted", "interview", "offer", "hired", "not_selected"];
const norm = (s: string) => s.trim().toLowerCase();

/** Skills the candidate has and is missing for a job (LinkedIn-style "how you match"). */
export function skillMatch(c: Candidate, j: Job) {
  const mine = new Set(c.skills.map(norm));
  return { have: j.skills.filter(s => mine.has(norm(s))), missing: j.skills.filter(s => !mine.has(norm(s))) };
}
/** 0–100: skills carry most of it, then experience range and field interest. */
export function matchScore(c: Candidate, j: Job) {
  const { have } = skillMatch(c, j);
  const skills = j.skills.length ? have.length / j.skills.length : 0;
  const exp = c.years >= j.exp_min && c.years <= j.exp_max + 2 ? 1 : c.years >= j.exp_min - 1 ? 0.5 : 0;
  const field = c.interests.fields.includes(j.field) ? 1 : 0;
  return Math.round(skills * 60 + exp * 25 + field * 15);
}
/** Profile strength, LinkedIn-style, with what is still missing. */
export function strength(c: Candidate) {
  const checks: [boolean, string, string][] = [
    [!!c.headline.trim(), "Headline", "المسمى"], [c.about.trim().length > 40, "About (40+ characters)", "نبذة (٤٠ حرف أو أكتر)"],
    [c.experience.length > 0, "Experience", "الخبرات"], [c.education.length > 0, "Education", "التعليم"], [c.skills.length >= 5, "5+ skills", "٥ مهارات أو أكتر"],
    [!!c.cv, "CV uploaded", "رفع الـ CV"], [c.interests.fields.length > 0, "Career interests", "اهتماماتك المهنية"], [!!c.link.trim(), "Portfolio or LinkedIn link", "لينك بورتفوليو أو LinkedIn"]
  ];
  return { pct: Math.round(checks.filter(x => x[0]).length / checks.length * 100), missing: checks.filter(x => !x[0]) };
}
export const statsOf = (d: DB, jobId: string) => {
  const a = d.applications.filter(x => x.job_id === jobId);
  return { applied: a.length, screened: a.filter(x => x.stage !== "screening").length, considered: a.filter(x => VISIBLE_TO_COMPANY.includes(x.stage) && x.stage !== "not_selected").length, notSelected: a.filter(x => x.stage === "not_matched" || x.stage === "not_selected").length };
};

const note = (to: Role, text: string, text_ar: string, link: string): Note => ({ id: uid(), to, at: new Date().toISOString(), text, text_ar, link, read: false });

export const actions = {
  apply(job_id: string, cover: string) {
    if (db.applications.some(a => a.job_id === job_id && a.candidate_id === ME.candidate)) return;
    const j = jobOf(db, job_id)!; const c = candidateOf(db, ME.candidate)!;
    const id = uid();
    save({ ...db, applications: [{ id, job_id, candidate_id: ME.candidate, cover, applied_at: new Date().toISOString(), stage: "screening", fit: null, screen_note: "", viewed: false, history: [] }, ...db.applications],
      notes: [note("screening", `New application to screen: ${c.name} for ${j.title}.`, `طلب جديد للفرز: ${c.name_ar || c.name} لوظيفة ${j.title_ar}.`, "/screening/review/" + id), ...db.notes] });
  },
  withdraw(id: string) { save({ ...db, applications: db.applications.filter(a => a.id !== id) }); },
  toggleSave(job_id: string) { save({ ...db, saved: db.saved.includes(job_id) ? db.saved.filter(x => x !== job_id) : [job_id, ...db.saved] }); },
  seeJob(job_id: string) { if (db.seen.includes(job_id)) return; save({ ...db, seen: [...db.seen, job_id], jobs: db.jobs.map(j => j.id === job_id ? { ...j, views: j.views + 1 } : j) }); },
  updateProfile(c: Candidate) { save({ ...db, candidates: db.candidates.map(x => x.id === c.id ? c : x) }); },
  postJob(j: Omit<Job, "id" | "posted_at" | "status" | "company_id" | "views">) {
    const job: Job = { ...j, id: uid(), company_id: ME.company, posted_at: new Date().toISOString(), status: "open", views: 0 };
    const me = candidateOf(db, ME.candidate)!;
    const extra = me.interests.fields.includes(job.field) ? [note("candidate", `New job that matches your interests: ${job.title} at ${companyOf(db, ME.company).name}.`, `وظيفة جديدة مناسبة لاهتماماتك: ${job.title_ar} في ${companyOf(db, ME.company).name_ar}.`, "/jobs/" + job.id)] : [];
    save({ ...db, jobs: [job, ...db.jobs], notes: [...extra, ...db.notes] });
    return job.id;
  },
  closeJob(id: string) { save({ ...db, jobs: db.jobs.map(j => j.id === id ? { ...j, status: j.status === "open" ? "closed" : "open" } : j) }); },
  markViewed(id: string) {
    const a = appOf(db, id); if (!a || a.viewed) return;
    const j = jobOf(db, a.job_id)!; const co = companyOf(db, j.company_id);
    const extra = a.candidate_id === ME.candidate ? [note("candidate", `${co.name} viewed your application for ${j.title}.`, `${co.name_ar} شافت طلبك لوظيفة ${j.title_ar}.`, "/applications")] : [];
    save({ ...db, applications: db.applications.map(x => x.id === id ? { ...x, viewed: true } : x), notes: [...extra, ...db.notes] });
  },
  move(id: string, stage: Stage, by: string, note_en: string, fit?: number) {
    const a = appOf(db, id)!; const j = jobOf(db, a.job_id)!; const co = companyOf(db, j.company_id); const c = candidateOf(db, a.candidate_id)!;
    const screener = by === ME.screener;
    const msg: Partial<Record<Stage, [string, string]>> = {
      shortlisted: [`Brand Vitals sent your application for ${j.title} to ${co.name}.`, `Brand Vitals بعتت طلبك لوظيفة ${j.title_ar} لـ ${co.name_ar}.`],
      not_matched: [`Brand Vitals reviewed your application for ${j.title}. See the feedback.`, `Brand Vitals راجعت طلبك لوظيفة ${j.title_ar}. شوف الرأي.`],
      interview: [`${co.name} invited you to an interview for ${j.title}.`, `${co.name_ar} دعتك لمقابلة لوظيفة ${j.title_ar}.`],
      offer: [`${co.name} made you an offer for ${j.title}.`, `${co.name_ar} قدّمتلك عرض لوظيفة ${j.title_ar}.`],
      hired: [`You were hired as ${j.title} at ${co.name}. Congratulations!`, `اتعينت ${j.title_ar} في ${co.name_ar}. مبروك!`],
      not_selected: [`${co.name} moved forward with other candidates for ${j.title}.`, `${co.name_ar} كمّلت مع متقدمين تانيين لوظيفة ${j.title_ar}.`]
    };
    const extra: Note[] = [];
    if (a.candidate_id === ME.candidate && msg[stage]) extra.push(note("candidate", msg[stage]![0], msg[stage]![1], "/applications"));
    if (stage === "shortlisted" && j.company_id === ME.company) extra.push(note("company", `Brand Vitals screened ${c.name} for ${j.title}: fit ${fit}/5.`, `Brand Vitals فرزت ${c.name_ar || c.name} لوظيفة ${j.title_ar}: توافق ${fit}/٥.`, "/company/applicants/" + id));
    save({ ...db, notes: [...extra, ...db.notes], applications: db.applications.map(x => x.id !== id ? x : { ...x, stage, fit: fit ?? x.fit,
      screen_note: screener && note_en ? note_en : x.screen_note, screen_note_ar: screener && note_en ? note_en : x.screen_note_ar,
      history: [...x.history, { stage, at: new Date().toISOString(), by, note: note_en, note_ar: note_en }] }) });
  },
  readAll(role: Role) { save({ ...db, notes: db.notes.map(n => n.to === role ? { ...n, read: true } : n) }); },
  read(id: string) { save({ ...db, notes: db.notes.map(n => n.id === id ? { ...n, read: true } : n) }); }
};
