"use client";

import { useEffect, useMemo, useState } from "react";

type StaffAccountListItem = {
  id: number;
  displayName: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
};

type StaffAccountListResponse = {
  success?: boolean;
  data?: unknown;
  totalCount?: unknown;
  error?: unknown;
};

type StaffAccountMutationResponse = {
  success?: boolean;
  error?: unknown;
  message?: unknown;
};

type SortColumn = "displayName" | "email" | "role" | "createdAt" | "lastLogin";

type SortOrder = "asc" | "desc";

type EditableRole = "ADMIN" | "STAFF" | "CUSTOMER";

type EditAccountInitial = {
  displayName: string;
  email: string;
  phone: string;
  role: EditableRole;
};

type SessionResponse = {
  ok?: boolean;
  account?: {
    role?: unknown;
  };
};

const PAGE_SIZE = 20;
const ACCOUNT_ROLE_OPTIONS: EditableRole[] = ["ADMIN", "STAFF", "CUSTOMER"];

function parseAccountList(payload: unknown): StaffAccountListItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const account = entry as Record<string, unknown>;
      const id = Number(account.id);
      if (!Number.isFinite(id)) {
        return null;
      }

      return {
        id,
        displayName:
          typeof account.displayName === "string" ? account.displayName : null,
        email: typeof account.email === "string" ? account.email : "",
        phone: typeof account.phone === "string" ? account.phone : null,
        role: typeof account.role === "string" ? account.role : "",
        createdAt:
          typeof account.createdAt === "string" ? account.createdAt : "",
        lastLoginAt:
          typeof account.lastLoginAt === "string" ? account.lastLoginAt : null,
      } satisfies StaffAccountListItem;
    })
    .filter((account): account is StaffAccountListItem => account !== null);
}

function formatDateTime(value: string | null, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

function getPhoneDigitsLength(value: string): number {
  return value.replace(/\D/g, "").length;
}

function normalizeRole(value: string): string {
  return value.trim().toUpperCase();
}

function parseEditableRole(value: string): EditableRole | null {
  if (value === "ADMIN" || value === "STAFF" || value === "CUSTOMER") {
    return value;
  }
  return null;
}

export default function StaffAccountManagementPage() {
  const [accounts, setAccounts] = useState<StaffAccountListItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [editAccount, setEditAccount] = useState<StaffAccountListItem | null>(
    null,
  );
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<EditableRole>("CUSTOMER");
  const [editInitial, setEditInitial] = useState<EditAccountInitial | null>(
    null,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [viewerRole, setViewerRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchViewerRole = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) {
            setViewerRole(null);
          }
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        const nextRole =
          typeof payload.account?.role === "string" ? payload.account.role : "";

        if (!isMounted) return;
        setViewerRole(nextRole);
      } catch {
        if (isMounted) {
          setViewerRole(null);
        }
      }
    };

    fetchViewerRole();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchAccounts = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams({
          pageSize: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (sortBy) {
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
        }

        const response = await fetch(
          `/api/accounts/staff?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        let payload: StaffAccountListResponse | null = null;
        try {
          payload = (await response.json()) as StaffAccountListResponse;
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const apiError =
            typeof payload?.error === "string"
              ? payload.error
              : `Unable to load accounts (HTTP ${response.status}).`;
          throw new Error(apiError);
        }

        const parsedAccounts = parseAccountList(payload?.data);
        const parsedTotalCount = Number(payload?.totalCount);

        if (!isMounted) return;

        setAccounts(parsedAccounts);
        setTotalAccounts(
          Number.isFinite(parsedTotalCount)
            ? parsedTotalCount
            : parsedAccounts.length,
        );
      } catch (error) {
        if (!isMounted) return;
        setAccounts([]);
        setTotalAccounts(0);
        setLoadError(
          error instanceof Error ? error.message : "Unable to load accounts.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, [offset, sortBy, sortOrder, refreshNonce]);

  const totalPages = useMemo(() => {
    if (totalAccounts <= 0) return 1;
    return Math.max(1, Math.ceil(totalAccounts / PAGE_SIZE));
  }, [totalAccounts]);

  const currentPage = useMemo(
    () => Math.floor(offset / PAGE_SIZE) + 1,
    [offset],
  );
  const maxOffset = useMemo(
    () => Math.max(0, (totalPages - 1) * PAGE_SIZE),
    [totalPages],
  );

  const normalizedDisplayNameInput = editDisplayName.trim();
  const normalizedEmailInput = editEmail.trim().toLowerCase();
  const normalizedPhoneInput = editPhone.trim();
  const normalizedRoleInput = normalizeRole(editRole);
  const isDisplayNameDirty =
    editInitial !== null &&
    normalizedDisplayNameInput !== editInitial.displayName;
  const isEmailDirty =
    editInitial !== null && normalizedEmailInput !== editInitial.email;
  const isPhoneDirty =
    editInitial !== null && normalizedPhoneInput !== editInitial.phone;
  const isRoleDirty =
    editInitial !== null && normalizedRoleInput !== editInitial.role;
  const isAnyEditDirty =
    isDisplayNameDirty || isEmailDirty || isPhoneDirty || isRoleDirty;
  const isModalBusy = isSavingEdit || isDeletingAccount;
  const isViewerStaff = normalizeRole(viewerRole ?? "STAFF") === "STAFF";

  function handlePageChange(nextOffset: number) {
    const clampedOffset = Math.max(0, Math.min(nextOffset, maxOffset));
    setOffset(clampedOffset);
  }

  function handleJumpByPages(pageDelta: number) {
    handlePageChange(offset + pageDelta * PAGE_SIZE);
  }

  function handleSortChange(column: SortColumn) {
    if (sortBy !== column) {
      setSortBy(column);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortBy(null);
      setSortOrder("asc");
    }

    setOffset(0);
  }

  function getSortIndicator(column: SortColumn) {
    if (sortBy !== column) {
      return "";
    }

    return sortOrder === "asc" ? " \u2191" : " \u2193";
  }

  function resetEditModalState() {
    setEditAccount(null);
    setEditDisplayName("");
    setEditEmail("");
    setEditPhone("");
    setEditRole("CUSTOMER");
    setEditInitial(null);
    setEditError(null);
    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  function openEditModal(account: StaffAccountListItem) {
    if (isViewerStaff) {
      return;
    }

    const normalizedAccountRole =
      parseEditableRole(normalizeRole(account.role)) ?? "CUSTOMER";
    const normalizedAccountDisplayName = account.displayName?.trim() ?? "";
    const normalizedAccountEmail = account.email.trim().toLowerCase();
    const normalizedAccountPhone = account.phone?.trim() ?? "";

    setEditAccount(account);
    setEditDisplayName(normalizedAccountDisplayName);
    setEditEmail(normalizedAccountEmail);
    setEditPhone(normalizedAccountPhone);
    setEditRole(normalizedAccountRole);
    setEditInitial({
      displayName: normalizedAccountDisplayName,
      email: normalizedAccountEmail,
      phone: normalizedAccountPhone,
      role: normalizedAccountRole,
    });
    setEditError(null);
    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  function closeEditModal() {
    if (isModalBusy) {
      return;
    }

    resetEditModalState();
  }

  function openDeleteConfirmation() {
    if (isModalBusy) {
      return;
    }

    setIsDeleteConfirmationOpen(true);
    setDeleteConfirmChecked(false);
    setEditError(null);
  }

  function closeDeleteConfirmation() {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editAccount || !editInitial || !isAnyEditDirty) {
      return;
    }

    if (!normalizedEmailInput || !isValidEmail(normalizedEmailInput)) {
      setEditError("A valid email address is required.");
      return;
    }

    if (normalizedPhoneInput && !isValidPhone(normalizedPhoneInput)) {
      const phoneDigitsLength = getPhoneDigitsLength(normalizedPhoneInput);
      setEditError(
        phoneDigitsLength > 10
          ? "Phone number is too long. Use exactly 10 digits."
          : "Phone number is too short. Use exactly 10 digits.",
      );
      return;
    }

    const nextRole = parseEditableRole(normalizedRoleInput);
    if (!nextRole) {
      setEditError("Role must be ADMIN, STAFF, or CUSTOMER.");
      return;
    }

    setEditError(null);
    setIsSavingEdit(true);

    try {
      const response = await fetch("/api/accounts/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: editAccount.id,
          displayName: normalizedDisplayNameInput,
          email: normalizedEmailInput,
          phone: normalizedPhoneInput,
          role: nextRole,
        }),
      });

      let payload: StaffAccountMutationResponse | null = null;
      try {
        payload = (await response.json()) as StaffAccountMutationResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : `Account update failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      resetEditModalState();
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Unable to update account.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteAccount() {
    if (!editAccount) {
      return;
    }

    if (!deleteConfirmChecked) {
      setEditError("Please confirm the deletion warning first.");
      return;
    }

    setEditError(null);
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/accounts/staff", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: editAccount.id,
        }),
      });

      let payload: StaffAccountMutationResponse | null = null;
      try {
        payload = (await response.json()) as StaffAccountMutationResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : `Account deletion failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const shouldMoveToPreviousPage = accounts.length === 1 && offset > 0;
      resetEditModalState();

      if (shouldMoveToPreviousPage) {
        setOffset((currentOffset) => Math.max(0, currentOffset - PAGE_SIZE));
      } else {
        setRefreshNonce((current) => current + 1);
      }
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Unable to delete account.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <div>
      <div className="staffTitle">Account Management</div>
      <div className="staffSubtitle">
        View staff and customer accounts. Filtering controls are intentionally
        omitted for this first pass.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <div className="staffCardLabel">Account Directory</div>

          <div className="item-search-page__table-wrap">
            <div className="item-search-page__table-scroll">
              <div className="item-search-page__table-content">
                <table className="item-search-page__table">
                  <thead className="item-search-page__thead">
                    <tr>
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "displayName"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("displayName")}
                        >
                          Display Name
                          {getSortIndicator("displayName")}
                        </button>
                      </th>
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "email"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("email")}
                        >
                          Email
                          {getSortIndicator("email")}
                        </button>
                      </th>
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "role"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("role")}
                        >
                          Role
                          {getSortIndicator("role")}
                        </button>
                      </th>
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "createdAt"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("createdAt")}
                        >
                          Creation Date
                          {getSortIndicator("createdAt")}
                        </button>
                      </th>
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "lastLogin"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("lastLogin")}
                        >
                          Last Login
                          {getSortIndicator("lastLogin")}
                        </button>
                      </th>
                      <th className="item-search-page__th">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="item-search-page__tbody">
                    {isLoading && accounts.length === 0 ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={6}>
                          Loading accounts...
                        </td>
                      </tr>
                    ) : loadError ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={6}>
                          {loadError}
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={6}>
                          No accounts found.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {accounts.map((account) => (
                          <tr key={account.id} className="item-search-page__tr">
                            <td className="item-search-page__td">
                              {account.displayName?.trim() || "No display name"}
                            </td>
                            <td className="item-search-page__td">
                              {account.email}
                            </td>
                            <td className="item-search-page__td">
                              {account.role}
                            </td>
                            <td className="item-search-page__td">
                              {formatDateTime(account.createdAt, "Unavailable")}
                            </td>
                            <td className="item-search-page__td">
                              {formatDateTime(account.lastLoginAt, "Never")}
                            </td>
                            <td className="item-search-page__td">
                              {isViewerStaff ? (
                                <span className="account-management__action-disabled">
                                  Edit
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="item-search-page__edit-link account-management__action-link"
                                  onClick={() => openEditModal(account)}
                                  aria-label={`Edit account ${account.email}`}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div
                    className="item-search-page__pagination-controls"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <button
                      className="pagination__nav"
                      onClick={() => handlePageChange(0)}
                      disabled={isLoading || offset === 0}
                    >
                      &lt;&lt;&lt;
                    </button>
                    <button
                      className="pagination__nav"
                      onClick={() => handleJumpByPages(-5)}
                      disabled={isLoading || offset === 0}
                    >
                      &lt;&lt;
                    </button>
                    <button
                      className="pagination__nav"
                      onClick={() => handlePageChange(offset - PAGE_SIZE)}
                      disabled={isLoading || offset === 0}
                    >
                      &lt;
                    </button>
                    <span className="item-search-page__page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="pagination__nav"
                      onClick={() => handlePageChange(offset + PAGE_SIZE)}
                      disabled={isLoading || currentPage === totalPages}
                    >
                      &gt;
                    </button>
                    <button
                      className="pagination__nav"
                      onClick={() => handleJumpByPages(5)}
                      disabled={isLoading || currentPage === totalPages}
                    >
                      &gt;&gt;
                    </button>
                    <button
                      className="pagination__nav"
                      onClick={() => handlePageChange(maxOffset)}
                      disabled={isLoading || currentPage === totalPages}
                    >
                      &gt;&gt;&gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editAccount ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Account"
          className="item-category-modal"
          onClick={closeEditModal}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Edit Account</div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleSaveEdit(event)}
              noValidate
            >
              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isDisplayNameDirty
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Display Name
                </span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={editDisplayName}
                  onChange={(event) => setEditDisplayName(event.target.value)}
                  placeholder="Enter display name"
                  disabled={isModalBusy}
                />
              </label>

              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isEmailDirty ? "category-mgmt-edit-modal__label--dirty" : ""
                  }`}
                >
                  Email
                </span>
                <input
                  className="item-search-page__search-input"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="Enter email"
                  disabled={isModalBusy}
                />
              </label>

              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isPhoneDirty ? "category-mgmt-edit-modal__label--dirty" : ""
                  }`}
                >
                  Phone Number
                </span>
                <input
                  className="item-search-page__search-input"
                  type="tel"
                  value={editPhone}
                  onChange={(event) =>
                    setEditPhone(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 10-digit phone number"
                  disabled={isModalBusy}
                />
              </label>

              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isRoleDirty ? "category-mgmt-edit-modal__label--dirty" : ""
                  }`}
                >
                  Role
                </span>
                <select
                  className="item-search-page__select"
                  value={editRole}
                  onChange={(event) =>
                    setEditRole(event.target.value as EditableRole)
                  }
                  disabled={isModalBusy}
                >
                  {ACCOUNT_ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </label>

              {editError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {editError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="staff-dev-pill"
                  disabled={isModalBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={openDeleteConfirmation}
                  className="staff-dev-pill staff-dev-pill--danger"
                  disabled={isModalBusy}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className={`staff-dev-pill${isAnyEditDirty ? " staff-dev-pill--ready" : ""}`}
                  disabled={isModalBusy || !isAnyEditDirty}
                >
                  {isSavingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editAccount && isDeleteConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Account"
          className="item-category-modal"
          onClick={closeDeleteConfirmation}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to delete this account?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                This permanently disables <strong>{editAccount.email}</strong>{" "}
                and cannot be undone.
              </p>
            </div>
            <label className="category-mgmt-delete-confirm">
              <input
                type="checkbox"
                checked={deleteConfirmChecked}
                onChange={(event) =>
                  setDeleteConfirmChecked(event.target.checked)
                }
                disabled={isDeletingAccount}
              />
              I understand this deletion impact.
            </label>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
