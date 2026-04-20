"use client";

import { useCallback, useEffect, useState } from "react";
import TaskWidget from "@/app/components/TaskWidget";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";
import { useLoginStatus } from "../../LoginStatusContext";

const ALERT_TITLE_MAX_LENGTH = 120;
const ALERT_DESCRIPTION_MAX_LENGTH = 500;
const ALERT_PREVIEW_LIMIT = 100;
const ALERT_TITLE_PREVIEW_MAX = 60;
const ALERT_DESCRIPTION_PREVIEW_MAX = 120;
type AudienceRole = "ADMIN" | "STAFF";
type AlertPreview = {
  id: number;
  title: string;
  description: string;
  type: string;
  creationTime: string;
};

function truncateWithEllipsis(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function toAlertTypeLabel(type: string): string {
  if (type === "ANNOUNCEMENT") return "Announcement";
  if (type === "LOW_STOCK") return "Low Stock";
  if (type === "PERMISSION_CHANGE") return "Permission Change";
  if (type === "TASK_COMPLETE") return "Task Complete";
  if (type === "TICKET_CREATED") return "Ticket Created";
  return type.replaceAll("_", " ");
}

function toAlertTypeClass(type: string): string {
  if (type === "LOW_STOCK") return "staffAlertTypeBadge--lowStock";
  if (type === "PERMISSION_CHANGE")
    return "staffAlertTypeBadge--permissionChange";
  if (type === "TASK_COMPLETE") return "staffAlertTypeBadge--taskComplete";
  if (type === "TICKET_CREATED") return "staffAlertTypeBadge--ticketCreated";
  return "staffAlertTypeBadge--announcement";
}

function formatAlertDate(creationTime: string): string {
  const parsedDate = new Date(creationTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown time";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function StaffDashboardHome() {
  const { account, accountId, userRole } = useLoginStatus();
  const isAdmin = userRole.trim().toLowerCase() === "admin";
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] =
    useState(false);
  const [createAnnouncementTitle, setCreateAnnouncementTitle] = useState("");
  const [createAnnouncementDescription, setCreateAnnouncementDescription] =
    useState("");
  const [createAnnouncementError, setCreateAnnouncementError] = useState<
    string | null
  >(null);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [sendToStaff, setSendToStaff] = useState(true);
  const [audienceCounts, setAudienceCounts] = useState({ admin: 0, staff: 0 });
  const [isAudienceCountsLoading, setIsAudienceCountsLoading] = useState(false);
  const [audienceCountsError, setAudienceCountsError] = useState<string | null>(
    null,
  );
  const [alerts, setAlerts] = useState<AlertPreview[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [alertsLoadError, setAlertsLoadError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertPreview | null>(null);
  const [isAlertDetailsOpen, setIsAlertDetailsOpen] = useState(false);
  const [dismissAlertError, setDismissAlertError] = useState<string | null>(
    null,
  );
  const [isDismissingAlert, setIsDismissingAlert] = useState(false);

  const loadAlerts = useCallback(
    async (signal?: AbortSignal) => {
      if (!Number.isInteger(accountId) || accountId <= 0) {
        setAlerts([]);
        setNotificationCount(0);
        setAlertsLoadError(null);
        return;
      }

      setIsAlertsLoading(true);
      setAlertsLoadError(null);

      try {
        const response = await fetch(
          `/api/alerts/staff?limit=${ALERT_PREVIEW_LIMIT}`,
          {
            cache: "no-store",
            signal,
          },
        );
        const payload = (await response.json()) as {
          success?: boolean;
          count?: unknown;
          alerts?: unknown;
        };

        if (!response.ok || payload.success === false) {
          throw new Error("Failed to load notifications.");
        }

        if (typeof payload.count !== "number") {
          throw new Error("Malformed notification count response.");
        }

        if (!Array.isArray(payload.alerts)) {
          throw new Error("Malformed notifications list response.");
        }

        const mappedAlerts = payload.alerts
          .filter(
            (
              entry,
            ): entry is {
              id: unknown;
              title: unknown;
              description: unknown;
              type: unknown;
              creationTime: unknown;
            } => {
              return typeof entry === "object" && entry !== null;
            },
          )
          .map((entry) => ({
            id:
              typeof entry.id === "number"
                ? entry.id
                : Number.parseInt(String(entry.id ?? ""), 10),
            title: typeof entry.title === "string" ? entry.title : "",
            description:
              typeof entry.description === "string" ? entry.description : "",
            type: typeof entry.type === "string" ? entry.type : "",
            creationTime:
              typeof entry.creationTime === "string" ? entry.creationTime : "",
          }))
          .filter(
            (entry) =>
              Number.isInteger(entry.id) &&
              entry.id > 0 &&
              entry.type.length > 0 &&
              entry.creationTime.length > 0,
          );

        setAlerts(mappedAlerts);
        setNotificationCount(payload.count);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAlerts([]);
        setNotificationCount(0);
        setAlertsLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
        );
      } finally {
        setIsAlertsLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    const abortController = new AbortController();
    void loadAlerts(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadAlerts]);

  useEffect(() => {
    if (!isCreateAnnouncementOpen || !isAdmin) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    async function fetchRoleCount(role: AudienceRole): Promise<number> {
      const response = await fetch(
        `/api/accounts/staff?role=${role}&pageSize=1&offset=0`,
        {
          cache: "no-store",
          signal: abortController.signal,
        },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        totalCount?: unknown;
      };

      if (!response.ok || payload.success === false) {
        throw new Error(`Failed to load ${role.toLowerCase()} count.`);
      }

      if (typeof payload.totalCount !== "number") {
        throw new Error(`Malformed ${role.toLowerCase()} count response.`);
      }

      return payload.totalCount;
    }

    async function loadAudienceCounts() {
      setIsAudienceCountsLoading(true);
      setAudienceCountsError(null);

      try {
        const [adminCount, staffCount] = await Promise.all([
          fetchRoleCount("ADMIN"),
          fetchRoleCount("STAFF"),
        ]);

        if (cancelled) return;
        setAudienceCounts({ admin: adminCount, staff: staffCount });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAudienceCountsError(
          error instanceof Error
            ? error.message
            : "Failed to load recipient counts.",
        );
      } finally {
        if (!cancelled) {
          setIsAudienceCountsLoading(false);
        }
      }
    }

    void loadAudienceCounts();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [isCreateAnnouncementOpen, isAdmin]);

  function openCreateAnnouncementModal() {
    setCreateAnnouncementError(null);
    setSendToAdmin(true);
    setSendToStaff(true);
    setAudienceCountsError(null);
    setIsCreateAnnouncementOpen(true);
  }

  function closeCreateAnnouncementModal() {
    if (isCreatingAnnouncement) {
      return;
    }

    setIsCreateAnnouncementOpen(false);
    setCreateAnnouncementTitle("");
    setCreateAnnouncementDescription("");
    setCreateAnnouncementError(null);
  }

  const createAnnouncementModalBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeCreateAnnouncementModal);

  function openAlertDetails(alert: AlertPreview) {
    setDismissAlertError(null);
    setSelectedAlert(alert);
    setIsAlertDetailsOpen(true);
  }

  function closeAlertDetails() {
    if (isDismissingAlert) {
      return;
    }

    setIsAlertDetailsOpen(false);
    setSelectedAlert(null);
    setDismissAlertError(null);
  }

  const alertDetailsModalBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeAlertDetails);

  async function handleCreateAnnouncement(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title = createAnnouncementTitle.trim();
    const description = createAnnouncementDescription.trim();

    if (!title) {
      setCreateAnnouncementError("Announcement title is required.");
      return;
    }

    if (title.length > ALERT_TITLE_MAX_LENGTH) {
      setCreateAnnouncementError(
        `Announcement title must be ${ALERT_TITLE_MAX_LENGTH} characters or fewer.`,
      );
      return;
    }

    if (!description) {
      setCreateAnnouncementError("Announcement description is required.");
      return;
    }

    if (!sendToAdmin && !sendToStaff) {
      setCreateAnnouncementError("Select at least one recipient type.");
      return;
    }

    setCreateAnnouncementError(null);
    setIsCreatingAnnouncement(true);

    try {
      const response = await fetch("/api/alerts/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          sendToAdmin,
          sendToStaff,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: unknown;
      };

      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to create announcement (HTTP ${response.status}).`;
        throw new Error(message);
      }

      await loadAlerts();
      setIsCreateAnnouncementOpen(false);
      setCreateAnnouncementTitle("");
      setCreateAnnouncementDescription("");
      setCreateAnnouncementError(null);
    } catch (error) {
      setCreateAnnouncementError(
        error instanceof Error
          ? error.message
          : "Failed to create announcement.",
      );
    } finally {
      setIsCreatingAnnouncement(false);
    }
  }

  async function handleDismissAlert() {
    if (!selectedAlert) {
      return;
    }

    setDismissAlertError(null);
    setIsDismissingAlert(true);

    try {
      const response = await fetch("/api/alerts/staff", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId: selectedAlert.id,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: unknown;
      };

      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to dismiss alert (HTTP ${response.status}).`;
        throw new Error(message);
      }

      await loadAlerts();
      setIsAlertDetailsOpen(false);
      setSelectedAlert(null);
      setDismissAlertError(null);
    } catch (error) {
      setDismissAlertError(
        error instanceof Error ? error.message : "Failed to dismiss alert.",
      );
    } finally {
      setIsDismissingAlert(false);
    }
  }

  return (
    <div>
      <div className="staffTitle">Welcome, {account || "Employee"}</div>
      <div className="staffSubtitle">
        This is the staff dashboard foundation. Panels below are placeholders
        for inventory summaries and future widgets.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <div className="staffCardHeaderRow">
            <div className="staffCardLabel">Notifications</div>
            {isAdmin ? (
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={openCreateAnnouncementModal}
              >
                Create Announcement
              </button>
            ) : null}
          </div>
          <div className="staffCardValue">
            {isAlertsLoading ? "..." : notificationCount}
          </div>
          {isAlertsLoading ? (
            <div className="staffCardHint">Loading notifications...</div>
          ) : alertsLoadError ? (
            <div className="staffCardHint">{alertsLoadError}</div>
          ) : alerts.length === 0 ? (
            <div className="staffCardHint">No notifications found.</div>
          ) : (
            <div className="staffNotificationPreviewList">
              {alerts.map((alert) => (
                <button
                  type="button"
                  key={alert.id}
                  className="staffNotificationPreviewItem staffNotificationPreviewItemButton"
                  onClick={() => openAlertDetails(alert)}
                >
                  <div className="staffNotificationPreviewTopRow">
                    <div className="staffNotificationPreviewTitle">
                      {truncateWithEllipsis(
                        alert.title,
                        ALERT_TITLE_PREVIEW_MAX,
                      )}
                    </div>
                    <div className="staffNotificationPreviewTime">
                      <span>{formatAlertDate(alert.creationTime)}</span>
                      <span
                        className={`staffAlertTypeBadge ${toAlertTypeClass(alert.type)}`}
                      >
                        {toAlertTypeLabel(alert.type)}
                      </span>
                    </div>
                  </div>
                  <div className="staffNotificationPreviewDescription">
                    {truncateWithEllipsis(
                      alert.description,
                      ALERT_DESCRIPTION_PREVIEW_MAX,
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <TaskWidget accountId={accountId} />
      </div>

      {isAlertDetailsOpen && selectedAlert ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notification Details"
          className="item-category-modal"
          onPointerDown={alertDetailsModalBackdropHandlers.onPointerDown}
          onClick={alertDetailsModalBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal staffAlertDetailModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="staffAlertDetailHeader">
              <div className="item-category-modal__title staffAlertDetailTitle">
                {selectedAlert.title}
              </div>
              <div className="staffNotificationPreviewTime">
                <span>{formatAlertDate(selectedAlert.creationTime)}</span>
                <span
                  className={`staffAlertTypeBadge ${toAlertTypeClass(selectedAlert.type)}`}
                >
                  {toAlertTypeLabel(selectedAlert.type)}
                </span>
              </div>
            </div>

            <div className="staffAlertDetailDescription">
              {selectedAlert.description}
            </div>

            {dismissAlertError ? (
              <div className="item-category-form__status item-category-form__status--error">
                {dismissAlertError}
              </div>
            ) : null}

            <div className="item-category-form__actions category-mgmt-edit-modal__actions">
              <button
                type="button"
                onClick={closeAlertDetails}
                className="staff-dev-pill"
                disabled={isDismissingAlert}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleDismissAlert()}
                className="staff-dev-pill staff-dev-pill--danger"
                disabled={isDismissingAlert}
              >
                {isDismissingAlert ? "Dismissing..." : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAdmin && isCreateAnnouncementOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create Announcement"
          className="item-category-modal"
          onPointerDown={createAnnouncementModalBackdropHandlers.onPointerDown}
          onClick={createAnnouncementModalBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">
              Create Announcement
            </div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleCreateAnnouncement(event)}
              noValidate
            >
              <label className="item-category-form__field">
                <div className="account-management__notes-label-row">
                  <span className="item-category-form__label">
                    Announcement Title
                  </span>
                  <span className="item-category-form__label account-management__notes-count">
                    {createAnnouncementTitle.length}/{ALERT_TITLE_MAX_LENGTH}
                  </span>
                </div>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={createAnnouncementTitle}
                  onChange={(event) =>
                    setCreateAnnouncementTitle(event.target.value)
                  }
                  placeholder="Enter announcement title"
                  maxLength={ALERT_TITLE_MAX_LENGTH}
                  disabled={isCreatingAnnouncement}
                />
              </label>

              <label className="item-category-form__field">
                <span className="item-category-form__label">Alert Type</span>
                <div className="staffReadonlyFieldValue">Announcement</div>
              </label>

              <div className="item-category-form__field">
                <span className="item-category-form__label">Send To</span>
                <div className="staffAudienceMultiSelect" role="group">
                  <button
                    type="button"
                    className={`staffAudienceOption ${
                      sendToAdmin ? "isSelected" : ""
                    }`}
                    aria-pressed={sendToAdmin}
                    onClick={() =>
                      setSendToAdmin((currentValue) => !currentValue)
                    }
                    disabled={isCreatingAnnouncement}
                  >
                    <span className="staffAudienceOptionTitle">Admin</span>
                    <span className="staffAudienceOptionCount">
                      {isAudienceCountsLoading
                        ? "Loading..."
                        : `${audienceCounts.admin} account${
                            audienceCounts.admin === 1 ? "" : "s"
                          }`}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`staffAudienceOption ${
                      sendToStaff ? "isSelected" : ""
                    }`}
                    aria-pressed={sendToStaff}
                    onClick={() =>
                      setSendToStaff((currentValue) => !currentValue)
                    }
                    disabled={isCreatingAnnouncement}
                  >
                    <span className="staffAudienceOptionTitle">Staff</span>
                    <span className="staffAudienceOptionCount">
                      {isAudienceCountsLoading
                        ? "Loading..."
                        : `${audienceCounts.staff} account${
                            audienceCounts.staff === 1 ? "" : "s"
                          }`}
                    </span>
                  </button>
                </div>
                {audienceCountsError ? (
                  <div className="staffAudienceError">
                    {audienceCountsError}
                  </div>
                ) : null}
              </div>

              <label className="item-category-form__field">
                <div className="account-management__notes-label-row">
                  <span className="item-category-form__label">Description</span>
                  <span className="item-category-form__label account-management__notes-count">
                    {createAnnouncementDescription.length}/
                    {ALERT_DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  className="item-search-page__search-input staffTaskCreateForm__textarea"
                  value={createAnnouncementDescription}
                  onChange={(event) =>
                    setCreateAnnouncementDescription(event.target.value)
                  }
                  placeholder="Add announcement details"
                  maxLength={ALERT_DESCRIPTION_MAX_LENGTH}
                  disabled={isCreatingAnnouncement}
                />
              </label>

              {createAnnouncementError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {createAnnouncementError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeCreateAnnouncementModal}
                  className="staff-dev-pill"
                  disabled={isCreatingAnnouncement}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-dev-pill staff-dev-pill--ready"
                  disabled={isCreatingAnnouncement}
                >
                  {isCreatingAnnouncement
                    ? "Creating..."
                    : "Create Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
