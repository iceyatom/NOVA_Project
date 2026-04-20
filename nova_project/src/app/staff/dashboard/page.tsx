"use client";

import { useEffect, useState } from "react";
import TaskWidget from "@/app/components/TaskWidget";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";
import { useLoginStatus } from "../../LoginStatusContext";

const ALERT_DESCRIPTION_MAX_LENGTH = 500;
type AudienceRole = "ADMIN" | "STAFF";

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
          <div className="staffCardValue">0</div>
          <div className="staffCardHint">Placeholder notifications widget.</div>
        </div>

        <div className="staffCard col8">
          <div className="staffCardLabel">Inventory Activity</div>
          <div className="staffCardHint">
            Placeholder panel for charts / trends / recent updates.
          </div>
        </div>

        <TaskWidget accountId={accountId} />

        <div className="staffCard col12">
          <div className="staffCardLabel">Inventory Tracker</div>
          <div className="staffCardHint">
            Placeholder area for category cards / donut charts / breakdowns.
          </div>
        </div>
      </div>

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
                <span className="item-category-form__label">
                  Announcement Title
                </span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={createAnnouncementTitle}
                  onChange={(event) =>
                    setCreateAnnouncementTitle(event.target.value)
                  }
                  placeholder="Enter announcement title"
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
