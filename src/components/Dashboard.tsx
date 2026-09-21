import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  createApplication,
  deleteApplication,
  moveApplication,
  subscribeToApplications,
  updateApplication,
  uploadApplicationFile,
} from "../services/applications";
import {
  APPLICATION_STATUSES,
  type ApplicationInput,
  type ApplicationStatus,
  type DashboardView,
  type JobApplication,
} from "../types";
import {
  exportApplicationsCsv,
  getApplicationMetrics,
  getDueState,
} from "../utils/applications";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationsTable } from "./ApplicationsTable";
import { FollowUpPanel } from "./FollowUpPanel";

interface DashboardProps {
  user: User;
}

const statusLabels: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const statusDescriptions: Record<ApplicationStatus, string> = {
  wishlist: "Save for later",
  applied: "Waiting for response",
  interview: "In conversation",
  offer: "Offers received",
  rejected: "Closed",
};

export function Dashboard({ user }: DashboardProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [view, setView] = useState<DashboardView>(() => {
    const saved = window.localStorage.getItem("applyflow-view");
    return saved === "list" ? "list" : "board";
  });
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToApplications(
      user.uid,
      (nextApplications) => {
        setApplications(nextApplications);
        setLoading(false);
        setDataError("");
      },
      () => {
        setLoading(false);
        setDataError(
          "We could not sync your applications. Check your connection and Firebase configuration.",
        );
      },
    );

    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    window.localStorage.setItem("applyflow-view", view);
  }, [view]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = queryText.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          application.company,
          application.role,
          application.location,
          application.source ?? "",
          application.contactName ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesPriority =
        priorityFilter === "all" || application.priority === priorityFilter;

      const matchesAttention =
        !attentionOnly || getDueState(application) !== null;

      return matchesSearch && matchesPriority && matchesAttention;
    });
  }, [applications, attentionOnly, priorityFilter, queryText]);

  const metrics = useMemo(
    () => getApplicationMetrics(applications),
    [applications],
  );

  async function handleSave(input: ApplicationInput) {
    if (editing) {
      await updateApplication(editing, input);
    } else {
      await createApplication(user.uid, input);
    }

    setShowForm(false);
    setEditing(null);
  }

  function openEditor(application: JobApplication) {
    setEditing(application);
    setShowForm(true);
  }

  async function handleDelete(application: JobApplication) {
    const confirmed = window.confirm(
      "Delete " + application.role + " at " + application.company + "?",
    );

    if (!confirmed) return;

    setBusyMessage("Deleting application...");
    try {
      await deleteApplication(application);
    } finally {
      setBusyMessage("");
    }
  }

  async function handleUpload(application: JobApplication, file: File) {
    const maxBytes = 8 * 1024 * 1024;

    if (file.size > maxBytes) {
      window.alert("Please upload a file smaller than 8 MB.");
      return;
    }

    setBusyMessage("Uploading " + file.name + "...");
    try {
      await uploadApplicationFile(user.uid, application.id, file);
    } catch {
      window.alert("Upload failed. Please try again.");
    } finally {
      setBusyMessage("");
    }
  }

  async function seedDemoData() {
    setBusyMessage("Adding sample applications...");

    const samples: ApplicationInput[] = [
      {
        company: "Northstar Labs",
        role: "Junior Full Stack Developer",
        location: "Remote",
        salary: "$8–$12/hr",
        jobUrl: "",
        notes: "Tailor the portfolio around deployed React and Firebase work.",
        status: "wishlist",
        priority: "high",
        nextStepDate: "",
        nextStep: "Review role requirements",
        source: "Company website",
        contactName: "",
        contactEmail: "",
        appliedDate: "",
        workMode: "remote",
      },
      {
        company: "Cloudline Systems",
        role: "Software Engineer I",
        location: "APAC",
        salary: "$38k–$48k",
        jobUrl: "",
        notes: "Application submitted with portfolio and GitHub.",
        status: "applied",
        priority: "medium",
        nextStepDate: "",
        nextStep: "Follow up with recruiter",
        source: "LinkedIn",
        contactName: "Maya Chen",
        contactEmail: "maya@example.com",
        appliedDate: "",
        workMode: "remote",
      },
      {
        company: "PixelForge",
        role: "Frontend Developer",
        location: "Singapore",
        salary: "$10/hr",
        jobUrl: "",
        notes: "Review React state patterns and accessibility before the call.",
        status: "interview",
        priority: "high",
        nextStepDate: "",
        nextStep: "Prepare technical interview",
        source: "Referral",
        contactName: "Alex Morgan",
        contactEmail: "alex@example.com",
        appliedDate: "",
        workMode: "hybrid",
      },
    ];

    try {
      for (const sample of samples) {
        await createApplication(user.uid, sample);
      }
    } finally {
      setBusyMessage("");
    }
  }

  function handleDragStart(
    event: DragEvent<HTMLElement>,
    applicationId: string,
  ) {
    event.dataTransfer.setData("text/plain", applicationId);
    event.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(
    event: DragEvent<HTMLElement>,
    status: ApplicationStatus,
  ) {
    event.preventDefault();
    const applicationId = event.dataTransfer.getData("text/plain");
    const application = applications.find(
      (item) => item.id === applicationId,
    );

    if (!application) return;

    try {
      await moveApplication(application, status);
    } catch {
      window.alert("Could not move this application. Please try again.");
    }
  }

  const displayName =
    user.displayName?.trim() || user.email?.split("@")[0] || "Account";

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="brand" href="/" aria-label="ApplyFlow home">
          <span className="brand-mark">A</span>
          <span>ApplyFlow</span>
        </a>

        <div className="header-actions">
          <span className="sync-indicator">
            <span className="sync-dot" />
            Live
          </span>
          <div className="user-chip">
            <span className="user-avatar">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            <span className="user-copy">
              <strong>{displayName}</strong>
              <small>{user.email || "Signed in"}</small>
            </span>
          </div>
          <button
            className="button ghost-button compact-button"
            type="button"
            onClick={() => signOut(auth)}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <h1>Applications</h1>
            <p>
              Keep every opportunity, follow-up, contact and document in one
              place.
            </p>
          </div>
          <div className="page-actions">
            <button
              className="button secondary-button"
              type="button"
              onClick={() => exportApplicationsCsv(applications)}
              disabled={applications.length === 0}
            >
              Export CSV
            </button>
            <button
              className="button primary-button"
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              Add application
            </button>
          </div>
        </div>

        <section className="stats-grid" aria-label="Application statistics">
          <article className="stat-card">
            <span>Tracked</span>
            <strong>{metrics.total}</strong>
            <small>All opportunities</small>
          </article>
          <article className="stat-card">
            <span>Submitted</span>
            <strong>{metrics.submitted}</strong>
            <small>Applications sent</small>
          </article>
          <article className="stat-card">
            <span>Interview rate</span>
            <strong>{metrics.interviewRate}%</strong>
            <small>Reached interview or offer</small>
          </article>
          <article className="stat-card stat-attention">
            <span>Needs attention</span>
            <strong>{metrics.overdue + metrics.dueToday}</strong>
            <small>
              {metrics.overdue} overdue · {metrics.dueToday} today
            </small>
          </article>
          <article className="stat-card">
            <span>Offers</span>
            <strong>{metrics.offers}</strong>
            <small>Current offers</small>
          </article>
        </section>

        {applications.length > 0 && (
          <FollowUpPanel
            applications={applications}
            onEdit={openEditor}
          />
        )}

        <section className="workspace">
          <div className="workspace-toolbar">
            <div className="workspace-filters">
              <input
                className="search-input"
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search company, role, source or contact"
                aria-label="Search applications"
              />

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                aria-label="Filter by priority"
              >
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>

              <label className="attention-filter">
                <input
                  type="checkbox"
                  checked={attentionOnly}
                  onChange={(event) =>
                    setAttentionOnly(event.target.checked)
                  }
                />
                Needs attention
              </label>
            </div>

            <div className="toolbar-right">
              <span className="result-count">
                {filteredApplications.length} shown
              </span>
              <div className="view-switcher" aria-label="View">
                <button
                  className={view === "board" ? "active" : ""}
                  type="button"
                  onClick={() => setView("board")}
                >
                  Board
                </button>
                <button
                  className={view === "list" ? "active" : ""}
                  type="button"
                  onClick={() => setView("list")}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {dataError && <div className="data-error">{dataError}</div>}

          {loading ? (
            <div className="empty-state">
              <div className="loader" />
              <h2>Loading applications</h2>
              <p>Syncing your workspace.</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <h2>Start with your first application.</h2>
              <p>
                Add a real opportunity, or load sample records to explore the
                workflow before connecting your own job search.
              </p>
              <div className="empty-actions">
                <button
                  className="button primary-button"
                  type="button"
                  onClick={() => setShowForm(true)}
                >
                  Add application
                </button>
                <button
                  className="button secondary-button"
                  type="button"
                  onClick={seedDemoData}
                >
                  Load sample data
                </button>
              </div>
            </div>
          ) : view === "list" ? (
            <ApplicationsTable
              applications={filteredApplications}
              onEdit={openEditor}
            />
          ) : (
            <section className="board" aria-label="Application Kanban board">
              {APPLICATION_STATUSES.map((status) => {
                const statusApplications = filteredApplications.filter(
                  (application) => application.status === status,
                );

                return (
                  <section
                    className="board-column"
                    key={status}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, status)}
                  >
                    <header className="column-header">
                      <div>
                        <div className="column-title-row">
                          <h2>{statusLabels[status]}</h2>
                          <span className="column-count">
                            {statusApplications.length}
                          </span>
                        </div>
                        <p>{statusDescriptions[status]}</p>
                      </div>
                    </header>

                    <div className="column-cards">
                      {statusApplications.map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          onEdit={openEditor}
                          onDelete={handleDelete}
                          onUpload={handleUpload}
                          onDragStart={handleDragStart}
                        />
                      ))}

                      {statusApplications.length === 0 && (
                        <div className="column-empty">
                          Drop an application here
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </section>
          )}
        </section>
      </section>

      {busyMessage && <div className="toast">{busyMessage}</div>}

      {showForm && (
        <ApplicationForm
          application={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </main>
  );
}
