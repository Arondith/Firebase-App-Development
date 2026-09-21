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
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentPath?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type ApplicationInput = Omit<
  JobApplication,
  | "id"
  | "userId"
  | "createdAt"
  | "updatedAt"
  | "attachmentUrl"
  | "attachmentName"
  | "attachmentPath"
>;
