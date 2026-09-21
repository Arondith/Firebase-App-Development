import type { ChangeEvent, DragEvent } from "react";
import type { JobApplication } from "../types";
import {
  formatShortDate,
  getDueState,
} from "../utils/applications";

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onUpload: (application: JobApplication, file: File) => void;
  onDragStart: (event: DragEvent<HTMLElement>, applicationId: string) => void;
}

export function ApplicationCard({
  application,
  onEdit,
  onDelete,
  onUpload,
  onDragStart,
}: ApplicationCardProps) {
  const dueState = getDueState(application);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(application, file);
      event.target.value = "";
    }
  }

  return (
    <article
      className={
        "application-card" + (dueState ? " card-due-" + dueState : "")
      }
      draggable
      onDragStart={(event) => onDragStart(event, application.id)}
    >
      <div className="card-company">
        <div className="company-avatar">
          {application.company.slice(0, 2).toUpperCase()}
        </div>
        <div className="card-company-copy">
          <p>{application.company}</p>
          <h3>{application.role}</h3>
        </div>
        <button
          className="card-edit-button"
          type="button"
          onClick={() => onEdit(application)}
          aria-label={"Edit " + application.role + " at " + application.company}
        >
          Edit
        </button>
      </div>

      <div className="card-tags">
        <span className={"priority-pill priority-" + application.priority}>
          {application.priority}
        </span>
        {application.workMode &&
          application.workMode !== "unspecified" && (
            <span className="meta-pill">{application.workMode}</span>
          )}
        {application.source && (
          <span className="meta-pill source-label">{application.source}</span>
        )}
      </div>

      {(application.location || application.salary) && (
        <div className="card-meta">
          {application.location && <span>{application.location}</span>}
          {application.salary && <span>{application.salary}</span>}
        </div>
      )}

      {(application.nextStep || application.nextStepDate) && (
        <div className={"next-action " + (dueState ? "next-" + dueState : "")}>
          <div>
            <span>Next action</span>
            <strong>{application.nextStep || "Follow up"}</strong>
          </div>
          {application.nextStepDate && (
            <time dateTime={application.nextStepDate}>
              {dueState === "overdue"
                ? "Overdue"
                : dueState === "today"
                  ? "Today"
                  : formatShortDate(application.nextStepDate)}
            </time>
          )}
        </div>
      )}

      {(application.contactName || application.contactEmail) && (
        <div className="contact-line">
          <span>Contact</span>
          <strong>{application.contactName || application.contactEmail}</strong>
        </div>
      )}

      {application.attachmentUrl && (
        <a
          className="attachment-link"
          href={application.attachmentUrl}
          target="_blank"
          rel="noreferrer"
        >
          {application.attachmentName || "Open attachment"} ↗
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
