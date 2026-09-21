import type { JobApplication } from "../types";
import {
  formatShortDate,
  getFollowUpQueue,
} from "../utils/applications";

interface FollowUpPanelProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
}

export function FollowUpPanel({
  applications,
  onEdit,
}: FollowUpPanelProps) {
  const items = getFollowUpQueue(applications).slice(0, 5);

  return (
    <section className="followup-panel" aria-labelledby="followup-heading">
      <div className="section-heading">
        <div>
          <h2 id="followup-heading">Needs attention</h2>
          <p>Follow-ups due within the next seven days.</p>
        </div>
        <span className="section-count">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="followup-empty">
          No follow-ups are due in the next seven days.
        </div>
      ) : (
        <div className="followup-list">
          {items.map(({ application, dueState }) => (
            <button
              className="followup-item"
              type="button"
              key={application.id}
              onClick={() => onEdit(application)}
            >
              <span
                className={"due-marker due-" + dueState}
                aria-hidden="true"
              />
              <span className="followup-copy">
                <strong>
                  {application.nextStep?.trim() || "Follow up"} ·{" "}
                  {application.company}
                </strong>
                <small>
                  {application.role}
                  {application.contactName
                    ? " · " + application.contactName
                    : ""}
                </small>
              </span>
              <span className={"due-label due-" + dueState}>
                {dueState === "overdue"
                  ? "Overdue"
                  : dueState === "today"
                    ? "Today"
                    : formatShortDate(application.nextStepDate)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
