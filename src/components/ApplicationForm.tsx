import { useEffect, useState, type FormEvent } from "react";
import type {
  ApplicationInput,
  ApplicationStatus,
  JobApplication,
  Priority,
  WorkMode,
} from "../types";

interface ApplicationFormProps {
  application?: JobApplication | null;
  onCancel: () => void;
  onSubmit: (input: ApplicationInput) => Promise<void>;
}

const emptyForm: ApplicationInput = {
  company: "",
  role: "",
  location: "",
  salary: "",
  jobUrl: "",
  notes: "",
  status: "wishlist",
  priority: "medium",
  nextStepDate: "",
  nextStep: "",
  source: "",
  contactName: "",
  contactEmail: "",
  appliedDate: "",
  workMode: "unspecified",
};

export function ApplicationForm({
  application,
  onCancel,
  onSubmit,
}: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!application) {
      setForm(emptyForm);
      return;
    }

    setForm({
      company: application.company,
      role: application.role,
      location: application.location,
      salary: application.salary,
      jobUrl: application.jobUrl,
      notes: application.notes,
      status: application.status,
      priority: application.priority,
      nextStepDate: application.nextStepDate,
      nextStep: application.nextStep ?? "",
      source: application.source ?? "",
      contactName: application.contactName ?? "",
      contactEmail: application.contactEmail ?? "",
      appliedDate: application.appliedDate ?? "",
      workMode: application.workMode ?? "unspecified",
    });
  }, [application]);

  function patch<K extends keyof ApplicationInput>(
    key: K,
    value: ApplicationInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required.");
      return;
    }

    setBusy(true);

    try {
      await onSubmit({
        ...form,
        company: form.company.trim(),
        role: form.role.trim(),
        location: form.location.trim(),
        salary: form.salary.trim(),
        jobUrl: form.jobUrl.trim(),
        notes: form.notes.trim(),
        nextStep: form.nextStep.trim(),
        source: form.source.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
      });
    } catch {
      setError("Could not save the application. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-kicker">
              {application ? "Edit application" : "New application"}
            </span>
            <h2 id="application-form-title">
              {application ? application.company : "Add an opportunity"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <legend>Role details</legend>
            <div className="form-grid">
              <label>
                Company
                <input
                  value={form.company}
                  onChange={(event) => patch("company", event.target.value)}
                  placeholder="Company name"
                  required
                />
              </label>

              <label>
                Role
                <input
                  value={form.role}
                  onChange={(event) => patch("role", event.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </label>

              <label>
                Location
                <input
                  value={form.location}
                  onChange={(event) => patch("location", event.target.value)}
                  placeholder="Singapore, Remote, etc."
                />
              </label>

              <label>
                Work setup
                <select
                  value={form.workMode}
                  onChange={(event) =>
                    patch("workMode", event.target.value as WorkMode)
                  }
                >
                  <option value="unspecified">Not specified</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </label>

              <label>
                Salary / rate
                <input
                  value={form.salary}
                  onChange={(event) => patch("salary", event.target.value)}
                  placeholder="$10/hr or $45k/year"
                />
              </label>

              <label>
                Job source
                <input
                  list="source-options"
                  value={form.source}
                  onChange={(event) => patch("source", event.target.value)}
                  placeholder="LinkedIn, referral, company site..."
                />
                <datalist id="source-options">
                  <option value="Company website" />
                  <option value="LinkedIn" />
                  <option value="Indeed" />
                  <option value="Referral" />
                  <option value="Wellfound" />
                  <option value="Remote job board" />
                </datalist>
              </label>

              <label className="span-two">
                Job posting URL
                <input
                  type="url"
                  value={form.jobUrl}
                  onChange={(event) => patch("jobUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Pipeline</legend>
            <div className="form-grid">
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    patch("status", event.target.value as ApplicationStatus)
                  }
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    patch("priority", event.target.value as Priority)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label>
                Applied date
                <input
                  type="date"
                  value={form.appliedDate}
                  onChange={(event) => patch("appliedDate", event.target.value)}
                />
              </label>

              <label>
                Next action date
                <input
                  type="date"
                  value={form.nextStepDate}
                  onChange={(event) =>
                    patch("nextStepDate", event.target.value)
                  }
                />
              </label>

              <label className="span-two">
                Next action
                <input
                  value={form.nextStep}
                  onChange={(event) => patch("nextStep", event.target.value)}
                  placeholder="Follow up with recruiter, prepare coding interview..."
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Contact</legend>
            <div className="form-grid">
              <label>
                Recruiter / contact
                <input
                  value={form.contactName}
                  onChange={(event) => patch("contactName", event.target.value)}
                  placeholder="Name"
                />
              </label>

              <label>
                Contact email
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => patch("contactEmail", event.target.value)}
                  placeholder="recruiter@company.com"
                />
              </label>
            </div>
          </fieldset>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => patch("notes", event.target.value)}
              placeholder="Interview notes, requirements, questions to ask, compensation details..."
              rows={5}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              className="button secondary-button"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button className="button primary-button" disabled={busy}>
              {busy
                ? "Saving..."
                : application
                  ? "Save changes"
                  : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
