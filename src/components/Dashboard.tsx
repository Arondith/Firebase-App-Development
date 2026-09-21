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
  type JobApplication,
} from "../types";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationForm } from "./ApplicationForm";

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
  wishlist: "Roles worth exploring",
  applied: "Applications submitted",
  interview: "Active conversations",
  offer: "Offers received",
  rejected: "Closed opportunities",
};

export function Dashboard({ user }: DashboardProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToApplications(user.uid, (nextApplications) => {
      setApplications(nextApplications);
      setLoading(false);
    });

    return unsubscribe;
  }, [user.uid]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = queryText.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !normalizedQuery ||
        [application.company, application.role, application.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesPriority =
        priorityFilter === "all" || application.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [applications, priorityFilter, queryText]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      interviews: applications.filter((item) => item.status === "interview").length,
      offers: applications.filter((item) => item.status === "offer").length,
      active: applications.filter(
        (item) => !["offer", "rejected"].includes(item.status),
      ).length,
    }),
    [applications],
  );

  async function handleSave(input: ApplicationInput) {
    if (editing) {
      await updateApplication(editing.id, input);
    } else {
      await createApplication(user.uid, input);
    }

    setShowForm(false);
    setEditing(null);
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
      window.alert("Upload failed. Check Firebase Storage and its security rules.");
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
        notes: "React + API integration. Tailor portfolio around deployed projects.",
        status: "wishlist",
        priority: "high",
        nextStepDate: "",
      },
      {
        company: "Cloudline Systems",
        role: "Software Engineer I",
        location: "Remote · APAC",
        salary: "$38k–$48k",
        jobUrl: "",
        notes: "Application submitted. Prepare Firebase architecture walkthrough.",
        status: "applied",
        priority: "medium",
        nextStepDate: "",
      },
      {
        company: "PixelForge",
        role: "Frontend Developer",
        location: "Remote",
        salary: "$10/hr",
        jobUrl: "",
        notes: "Technical screen scheduled. Review React state patterns and accessibility.",
        status: "interview",
        priority: "high",
        nextStepDate: "",
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
    if (!applicationId) return;
    await moveApplication(applicationId, status);
  }

  const displayName =
    user.displayName?.trim() || user.email?.split("@")[0] || "there";

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a className="brand" href="/" aria-label="ApplyFlow home">
          <span className="brand-mark">AF</span>
          <span>ApplyFlow</span>
        </a>

        <div className="header-actions">
          <span className="sync-indicator">
            <span className="sync-dot" />
            Firebase live sync
          </span>
          <div className="user-chip">
            <span className="user-avatar">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            <span className="user-copy">
              <strong>{displayName}</strong>
              <small>{user.email || "Authenticated user"}</small>
            </span>
          </div>
          <button
            className="button secondary-button compact-button"
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
            <p className="eyebrow">Application pipeline</p>
            <h1>Good morning, {displayName}.</h1>
            <p>
              Track opportunities, move applications through your pipeline, and
              keep the documents you need in one cloud workspace.
            </p>
          </div>
          <button
            className="button primary-button"
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            + Add application
          </button>
        </div>

        <section className="stats-grid" aria-label="Application statistics">
          <article className="stat-card">
            <span>Total tracked</span>
            <strong>{stats.total}</strong>
            <small>All opportunities</small>
          </article>
          <article className="stat-card">
            <span>Active pipeline</span>
            <strong>{stats.active}</strong>
            <small>Still in motion</small>
          </article>
          <article className="stat-card">
            <span>Interviews</span>
            <strong>{stats.interviews}</strong>
            <small>Conversations open</small>
          </article>
          <article className="stat-card">
            <span>Offers</span>
            <strong>{stats.offers}</strong>
            <small>Positive outcomes</small>
          </article>
        </section>

        <section className="toolbar">
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="Search company, role or location"
              aria-label="Search applications"
            />
          </div>

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

          <span className="result-count">
            {filteredApplications.length} shown
          </span>
        </section>

        {loading ? (
          <div className="empty-state">
            <div className="loader" />
            <h2>Loading your pipeline</h2>
            <p>Listening for Firestore updates...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">↗</span>
            <h2>Your application pipeline is ready.</h2>
            <p>
              Add your first opportunity or load sample data to explore the
              Firebase-powered workflow.
            </p>
            <div className="empty-actions">
              <button
                className="button primary-button"
                type="button"
                onClick={() => setShowForm(true)}
              >
                Add first application
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
                        <span className={"status-dot status-" + status} />
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
                        onEdit={(item) => {
                          setEditing(item);
                          setShowForm(true);
                        }}
                        onDelete={handleDelete}
                        onUpload={handleUpload}
                        onDragStart={handleDragStart}
                      />
                    ))}

                    {statusApplications.length === 0 && (
                      <div className="column-empty">Drop an application here</div>
                    )}
                  </div>
                </section>
              );
            })}
          </section>
        )}
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
