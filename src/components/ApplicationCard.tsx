import type { ChangeEvent, DragEvent } from "react";
import type { JobApplication } from "../types";

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onUpload: (application: JobApplication, file: File) => void;
  onDragStart: (event: DragEvent<HTMLElement>, applicationId: string) => void;
}

function formatDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(date + "T00:00:00"));
}

export function ApplicationCard({
  application,
  onEdit,
  onDelete,
  onUpload,
  onDragStart,
}: ApplicationCardProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(application, file);
      event.target.value = "";
    }
  }

  return (
    <article
      className="application-card"
      draggable
      onDragStart={(event) => onDragStart(event, application.id)}
    >
      <div className="card-topline">
        <span className={"priority-pill priority-" + application.priority}>
          {application.priority}
        </span>
        <button
          className="card-menu-button"
          type="button"
          onClick={() => onEdit(application)}
          aria-label={"Edit " + application.company}
        >
          Edit
        </button>
      </div>

      <div className="card-company">
        <div className="company-avatar">
          {application.company.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3>{application.role}</h3>
          <p>{application.company}</p>
        </div>
      </div>

      {(application.location || application.salary) && (
        <div className="card-meta">
          {application.location && <span>⌖ {application.location}</span>}
          {application.salary && <span>◈ {application.salary}</span>}
        </div>
      )}

      {application.notes && <p className="card-notes">{application.notes}</p>}

      {application.nextStepDate && (
        <div className="next-action">
          <span>Next action</span>
          <strong>{formatDate(application.nextStepDate)}</strong>
        </div>
      )}

      {application.attachmentUrl && (
        <a
          className="attachment-link"
          href={application.attachmentUrl}
          target="_blank"
          rel="noreferrer"
        >
          ↗ {application.attachmentName || "Open attachment"}
        </a>
      )}

      <div className="card-actions">
        {application.jobUrl && (
          <a
            className="card-action"
            href={application.jobUrl}
            target="_blank"
            rel="noreferrer"
          >
            Job post ↗
          </a>
        )}

        <label className="card-action file-action">
          {application.attachmentUrl ? "Replace file" : "Attach file"}
          <input type="file" onChange={handleFileChange} />
        </label>

        <button
          className="card-action danger-action"
          type="button"
          onClick={() => onDelete(application)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
