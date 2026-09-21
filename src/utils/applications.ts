import type {
  ApplicationStatus,
  JobApplication,
} from "../types";

const closedStatuses = new Set<ApplicationStatus>(["rejected"]);

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export type DueState = "overdue" | "today" | "upcoming" | null;

export function getDueState(
  application: JobApplication,
  today = startOfToday(),
): DueState {
  if (!application.nextStepDate || closedStatuses.has(application.status)) {
    return null;
  }

  const due = new Date(application.nextStepDate + "T00:00:00");
  const delta = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (delta < 0) return "overdue";
  if (delta === 0) return "today";
  if (delta <= 7) return "upcoming";
  return null;
}

export function formatShortDate(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value + "T00:00:00"));
}

export function getFollowUpQueue(applications: JobApplication[]) {
  const weight: Record<Exclude<DueState, null>, number> = {
    overdue: 0,
    today: 1,
    upcoming: 2,
  };

  return applications
    .map((application) => ({
      application,
      dueState: getDueState(application),
    }))
    .filter(
      (
        item,
      ): item is {
        application: JobApplication;
        dueState: Exclude<DueState, null>;
      } => item.dueState !== null,
    )
    .sort((a, b) => {
      const stateDifference = weight[a.dueState] - weight[b.dueState];
      if (stateDifference !== 0) return stateDifference;
      return a.application.nextStepDate.localeCompare(b.application.nextStepDate);
    });
}

export function getApplicationMetrics(applications: JobApplication[]) {
  const submitted = applications.filter(
    (application) => application.status !== "wishlist",
  );

  const reachedInterview = submitted.filter((application) => {
    const highest =
      application.highestStageReached ?? application.status;
    return highest === "interview" || highest === "offer";
  }).length;

  const offers = applications.filter(
    (application) => application.status === "offer",
  ).length;

  const followUps = getFollowUpQueue(applications);
  const overdue = followUps.filter(
    (item) => item.dueState === "overdue",
  ).length;
  const dueToday = followUps.filter(
    (item) => item.dueState === "today",
  ).length;

  return {
    total: applications.length,
    submitted: submitted.length,
    offers,
    overdue,
    dueToday,
    interviewRate:
      submitted.length === 0
        ? 0
        : Math.round((reachedInterview / submitted.length) * 100),
  };
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return '"' + text.replace(/"/g, '""') + '"';
}

export function exportApplicationsCsv(applications: JobApplication[]) {
  const headers = [
    "Company",
    "Role",
    "Status",
    "Priority",
    "Applied date",
    "Next action",
    "Next action date",
    "Source",
    "Contact",
    "Contact email",
    "Work setup",
    "Location",
    "Salary",
    "Job URL",
    "Notes",
  ];

  const rows = applications.map((application) => [
    application.company,
    application.role,
    application.status,
    application.priority,
    application.appliedDate ?? "",
    application.nextStep ?? "",
    application.nextStepDate,
    application.source ?? "",
    application.contactName ?? "",
    application.contactEmail ?? "",
    application.workMode ?? "",
    application.location,
    application.salary,
    application.jobUrl,
    application.notes,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "applyflow-applications.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
