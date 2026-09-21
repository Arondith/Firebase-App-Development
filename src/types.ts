import type { Timestamp } from "firebase/firestore";

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type Priority = "low" | "medium" | "high";
export type WorkMode = "remote" | "hybrid" | "onsite" | "unspecified";
export type DashboardView = "board" | "list";

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  role: string;
  location: string;
  salary: string;
  jobUrl: string;
  notes: string;
  status: ApplicationStatus;
  priority: Priority;
  nextStepDate: string;

  // Optional for backwards compatibility with records created before v2.
  nextStep?: string;
  source?: string;
  contactName?: string;
  contactEmail?: string;
  appliedDate?: string;
  workMode?: WorkMode;
  highestStageReached?: ApplicationStatus;

  attachmentUrl?: string;
  attachmentName?: string;
  attachmentPath?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  statusChangedAt?: Timestamp | null;
}

export interface ApplicationInput {
  company: string;
  role: string;
  location: string;
  salary: string;
  jobUrl: string;
  notes: string;
  status: ApplicationStatus;
  priority: Priority;
  nextStepDate: string;
  nextStep: string;
  source: string;
  contactName: string;
  contactEmail: string;
  appliedDate: string;
  workMode: WorkMode;
}
