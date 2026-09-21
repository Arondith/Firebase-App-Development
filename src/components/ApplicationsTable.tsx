import type { JobApplication } from "../types";
import { formatShortDate, getDueState } from "../utils/applications";

interface ApplicationsTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
}

export function ApplicationsTable({
  applications,
  onEdit,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return <div className="list-empty">No applications match these filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="applications-table">
        <thead>
          <tr>
            <th>Company / role</th>
            <th>Status</th>
            <th>Source</th>
            <th>Next action</th>
            <th>Applied</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const dueState = getDueState(application);

            return (
              <tr key={application.id}>
                <td>
                  <strong>{application.company}</strong>
                  <span>{application.role}</span>
                </td>
                <td>
                  <span className={"status-badge status-badge-" + application.status}>
                    {application.status}
                  </span>
                </td>
                <td>{application.source || "—"}</td>
                <td>
                  <span className={dueState ? "table-due " + dueState : ""}>
                    {application.nextStep || "—"}
                  </span>
                  {application.nextStepDate && (
                    <small>{formatShortDate(application.nextStepDate)}</small>
                  )}
                </td>
                <td>{formatShortDate(application.appliedDate)}</td>
                <td className="table-actions-cell">
                  <button
                    className="table-action"
                    type="button"
                    onClick={() => onEdit(application)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
