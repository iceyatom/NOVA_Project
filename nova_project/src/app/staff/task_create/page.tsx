"use client";

import { useEffect, useState } from "react";

type CreateTaskApiResponse = {
  success?: boolean;
  taskId?: number;
  error?: string;
};

type EmployeeAccount = {
  id: number;
  displayName: string | null;
  email: string;
  role: string;
};

type AccountsApiResponse = {
  success?: boolean;
  accounts?: EmployeeAccount[];
  error?: string;
};

function getEndOfDayExpiry(): string {
  const now = new Date();
  const eod = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  return eod.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StaffTaskCreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [accounts, setAccounts] = useState<EmployeeAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    assignee?: string;
  }>();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const expiryLabel = getEndOfDayExpiry();

  useEffect(() => {
    async function fetchAccounts() {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        const res = await fetch("/api/accounts");
        const payload = (await res.json()) as AccountsApiResponse;
        if (!res.ok || !payload.success) {
          setAccountsError(payload.error ?? "Failed to load accounts.");
          return;
        }
        setAccounts(payload.accounts ?? []);
      } catch {
        setAccountsError("Network error loading accounts.");
      } finally {
        setLoadingAccounts(false);
      }
    }

    fetchAccounts();
  }, []);

  function validate(): boolean {
    const errors: { title?: string; assignee?: string } = {};
    if (!title.trim()) {
      errors.title = "Task title is required.";
    }
    if (!assigneeId) {
      errors.assignee = "Please select an employee to assign this task to.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          assignedToAccountId: Number(assigneeId),
        }),
      });
      const payload = (await res.json()) as CreateTaskApiResponse;
      if (!res.ok || !payload.success) {
        setSubmitError(payload.error ?? "Failed to create task.");
        return;
      }
      setSubmitSuccess(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setFieldErrors({});
    setSubmitSuccess(false);
    setSubmitError(null);
  }

  if (submitSuccess) {
    return (
      <div>
        <div className="staffTitle">Create Task</div>
        <div className="task-create-success-banner">
          <div className="task-create-success-icon">✓</div>
          <div>
            <div className="task-create-success-heading">Task Created</div>
            <div className="task-create-success-body">
              The task has been assigned and will expire at{" "}
              <strong>{expiryLabel}</strong>.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="staff-dev-pill"
          onClick={handleReset}
          style={{ marginTop: "1.25rem" }}
        >
          Create Another Task
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="staffTitle">Create Task</div>
      <div className="staffSubtitle">
        Assign a daily task to an employee. Tasks automatically expire at the
        end of today&apos;s calendar day.
      </div>

      <form className="task-create-form" onSubmit={handleSubmit} noValidate>
        <div className="task-create-card">
          <div className="task-create-section-label">Task Details</div>

          <div className="task-create-field">
            <label className="ticket-create-label" htmlFor="task-title">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              className={`ticket-create-input${fieldErrors?.title ? " task-create-input--error" : ""}`}
              placeholder="Enter a short title for this task…"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors?.title) {
                  setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
            />
            {fieldErrors?.title && (
              <span className="task-create-error">{fieldErrors.title}</span>
            )}
          </div>

          <div className="task-create-field">
            <label className="ticket-create-label" htmlFor="task-description">
              Description{" "}
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  color: "#94a3b8",
                }}
              >
                (optional)
              </span>
            </label>
            <textarea
              id="task-description"
              className="ticket-create-textarea task-create-textarea"
              placeholder="Add any additional details…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="task-create-field">
            <label className="ticket-create-label" htmlFor="task-assignee">
              Assign To
            </label>
            {loadingAccounts ? (
              <div className="task-create-loading">Loading employees…</div>
            ) : accountsError ? (
              <div className="task-create-error">{accountsError}</div>
            ) : (
              <select
                id="task-assignee"
                className={`ticket-create-input task-create-select${fieldErrors?.assignee ? " task-create-input--error" : ""}`}
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  if (fieldErrors?.assignee) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      assignee: undefined,
                    }));
                  }
                }}
              >
                <option value="">— Select an employee —</option>
                {accounts.map((acct) => (
                  <option key={acct.id} value={String(acct.id)}>
                    {acct.displayName
                      ? `${acct.displayName} (${acct.email})`
                      : acct.email}{" "}
                    — {acct.role}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors?.assignee && (
              <span className="task-create-error">{fieldErrors.assignee}</span>
            )}
          </div>

          <div className="task-create-expiry-row">
            <span className="task-create-expiry-label">Expires</span>
            <span className="task-create-expiry-value">{expiryLabel}</span>
            <span className="task-create-expiry-hint">(end of today)</span>
          </div>
        </div>

        <div className="task-create-actions">
          {submitError && (
            <span className="task-create-error" style={{ marginRight: "1rem" }}>
              {submitError}
            </span>
          )}
          <button
            type="submit"
            className="staff-dev-pill task-create-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
