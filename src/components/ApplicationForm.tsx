import { useEffect, useState, type FormEvent } from "react";
import type {
  ApplicationInput,
  ApplicationStatus,
  JobApplication,
  Priority,
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
            <p className="eyebrow">{application ? "Edit application" : "New application"}</p>
            <h2 id="application-form-title">
              {application ? "Update opportunity" : "Add an opportunity"}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Company
              <input
                value={form.company}
                onChange={(event) => patch("company", event.target.value)}
                placeholder="OpenAI"
                required
              />
            </label>

            <label>
              Role
              <input
                value={form.role}
                onChange={(event) => patch("role", event.target.value)}
                placeholder="Junior Software Engineer"
                required
              />
            </label>

            <label>
              Location
              <input
                value={form.location}
                onChange={(event) => patch("location", event.target.value)}
                placeholder="Remote"
              />
            </label>

            <label>
              Salary / rate
              <input
                value={form.salary}
                onChange={(event) => patch("salary", event.target.value)}
                placeholder="$8/hr or $45k/year"
              />
            </label>

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
              Next action date
              <input
                type="date"
                value={form.nextStepDate}
                onChange={(event) => patch("nextStepDate", event.target.value)}
              />
            </label>

            <label>
              Job posting URL
              <input
                type="url"
                value={form.jobUrl}
                onChange={(event) => patch("jobUrl", event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => patch("notes", event.target.value)}
              placeholder="Interview notes, recruiter details, technical requirements..."
              rows={5}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button className="button secondary-button" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="button primary-button" disabled={busy}>
              {busy ? "Saving..." : application ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
