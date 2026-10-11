// Vitals Crew data model. Three sides: clients post briefs, vetted talent proposes and
// delivers, and the Vitals Crew review team gates every step (talent, proposal, delivery).

export type Category = "design" | "motion" | "video" | "copy" | "social" | "web" | "ads" | "photo";
export type Level = "vetted" | "pro" | "elite";
export type TalentKind = "solo" | "team" | "in_house";
export type Role = "client" | "talent" | "ops";

export interface Scores { craft: number; brief: number; communication: number; reliability: number }

export interface Talent {
  id: string; name: string; title: string; title_ar: string; kind: TalentKind; members: number;
  city: string; city_ar: string; category: Category; skills: string[]; level: Level;
  rate: number; currency: string; scores: Scores; jobs: number; on_time: number; rating: number;
  joined: string; portfolio: string[]; bio: string; bio_ar: string; available: boolean;
}

export type AppStage = "portfolio" | "test" | "interview" | "approved" | "rejected";
export interface StageEvent { stage: AppStage; at: string; by: string; note: string }
export interface Application {
  id: string; name: string; title: string; category: Category; kind: TalentKind; members: number; city: string;
  links: string; portfolio: string[]; submitted_at: string; stage: AppStage; scores: Scores | null;
  history: StageEvent[]; level: Level | null;
}

export type BriefStatus = "review" | "sourcing" | "shortlist" | "in_progress" | "delivered";
export interface Brief {
  id: string; client: string; title: string; category: Category; description: string;
  budget: number; currency: string; deadline: string; mode: "shortlist" | "managed";
  status: BriefStatus; created_at: string; reviewer_note: string; preferred_talent: string | null;
  hired_proposal_id: string | null;
}

export type ProposalStatus = "screening" | "shortlisted" | "declined" | "hired" | "not_selected";
export interface Proposal {
  id: string; brief_id: string; talent_id: string; price: number; days: number; pitch: string;
  status: ProposalStatus; score: number | null; why: string; feedback: string; created_at: string;
}

export type QA = "pending" | "passed" | "returned";
export interface Delivery {
  id: string; brief_id: string; talent_id: string; title: string; art: string; version: number; note: string;
  submitted_at: string; qa: QA; qa_note: string; qa_checks: string[]; qa_by: string;
  client: "waiting" | "approved" | "changes" | null; client_note: string;
}

export interface Activity { id: string; at: string; who: string; en: string; ar: string; brief_id?: string }

export interface DB {
  talents: Talent[]; applications: Application[]; briefs: Brief[]; proposals: Proposal[];
  deliveries: Delivery[]; activity: Activity[];
  stats: { applied_90d: number; accepted_90d: number; review_hours: number };
}
