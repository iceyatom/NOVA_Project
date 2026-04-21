"use client";

import { useEffect, useMemo, useState } from "react";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";

type StaffAccountListItem = {
  id: number;
  displayName: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
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

type SortColumn =
  | "id"
  | "displayName"
  | "email"
  | "role"
  | "createdAt"
  | "lastLogin";

type SortOrder = "asc" | "desc";

type EditableRole = "ADMIN" | "STAFF" | "CUSTOMER";

type EditAccountInitial = {
  displayName: string;
  phone: string;
  notes: string;
  role: EditableRole;
};

type BulkEditInitial = {
  role: string;
  roleMixed: boolean;
};

type SessionResponse = {
  ok?: boolean;
  account?: {
    id?: unknown;
    role?: unknown;
  };
};

type AccountRoleFilter = "all" | EditableRole;

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const ACCOUNT_ROLE_OPTIONS: EditableRole[] = ["ADMIN", "STAFF", "CUSTOMER"];
const MIXED_FIELD_VALUE = "__mixed__";
const ACCOUNT_NOTES_MAX_LENGTH = 500;

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
        notes: typeof account.notes === "string" ? account.notes : null,
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

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

function getPhoneDigitsLength(value: string): number {
  return value.replace(/\D/g, "").length;
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
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

function rolePrivilegeRank(role: EditableRole): number {
  if (role === "ADMIN") return 3;
  if (role === "STAFF") return 2;
  return 1;
}

export default function StaffAccountManagementPage() {
  const [accounts, setAccounts] = useState<StaffAccountListItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [roleFilter, setRoleFilter] = useState<AccountRoleFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [editAccount, setEditAccount] = useState<StaffAccountListItem | null>(
    null,
  );
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isPasswordInfoOpen, setIsPasswordInfoOpen] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editRole, setEditRole] = useState<EditableRole>("CUSTOMER");
  const [editInitial, setEditInitial] = useState<EditAccountInitial | null>(
    null,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [viewerAccountId, setViewerAccountId] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [selectedAccountSnapshots, setSelectedAccountSnapshots] = useState<
    Record<number, StaffAccountListItem>
  >({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState("");
  const [bulkEditInitial, setBulkEditInitial] =
    useState<BulkEditInitial | null>(null);
  const [bulkEditError, setBulkEditError] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkSaveConfirmationOpen, setIsBulkSaveConfirmationOpen] =
    useState(false);
  const [showBulkDeleteConfirmation, setShowBulkDeleteConfirmation] =
    useState(false);

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
            setViewerAccountId(null);
          }
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        const nextAccountId =
          typeof payload.account?.id === "number" &&
          Number.isInteger(payload.account.id) &&
          payload.account.id > 0
            ? payload.account.id
            : null;
        const nextRole =
          typeof payload.account?.role === "string" ? payload.account.role : "";

        if (!isMounted) return;
        setViewerAccountId(nextAccountId);
        setViewerRole(nextRole);
      } catch {
        if (isMounted) {
          setViewerRole(null);
          setViewerAccountId(null);
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
          pageSize: String(pageSize),
          offset: String(offset),
        });
        if (roleFilter !== "all") {
          params.set("role", roleFilter);
        }
        if (searchQuery) {
          params.set("query", searchQuery);
        }
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
  }, [
    offset,
    pageSize,
    roleFilter,
    searchQuery,
    sortBy,
    sortOrder,
    refreshNonce,
  ]);

  const totalPages = useMemo(() => {
    if (totalAccounts <= 0) return 1;
    return Math.max(1, Math.ceil(totalAccounts / pageSize));
  }, [pageSize, totalAccounts]);

  const currentPage = useMemo(
    () => Math.floor(offset / pageSize) + 1,
    [offset, pageSize],
  );
  const maxOffset = useMemo(
    () => Math.max(0, (totalPages - 1) * pageSize),
    [pageSize, totalPages],
  );

  const normalizedDisplayNameInput = editDisplayName.trim();
  const normalizedPasswordInput = editPassword;
  const normalizedPhoneInput = editPhone.trim();
  const normalizedNotesInput = editNotes;
  const normalizedRoleInput = normalizeRole(editRole);
  const isDisplayNameDirty =
    editInitial !== null &&
    normalizedDisplayNameInput !== editInitial.displayName;
  const isPasswordDirty = normalizedPasswordInput.length > 0;
  const isPhoneDirty =
    editInitial !== null && normalizedPhoneInput !== editInitial.phone;
  const isNotesDirty =
    editInitial !== null && normalizedNotesInput !== editInitial.notes;
  const isRoleDirty =
    editInitial !== null && normalizedRoleInput !== editInitial.role;
  const isAnyEditDirty =
    isDisplayNameDirty ||
    isPasswordDirty ||
    isPhoneDirty ||
    isNotesDirty ||
    isRoleDirty;
  const isModalBusy = isSavingEdit || isDeletingAccount;
  const isViewerStaff = normalizeRole(viewerRole ?? "STAFF") === "STAFF";
  const selectedAccountIdSet = useMemo(
    () => new Set(selectedAccountIds),
    [selectedAccountIds],
  );
  useEffect(() => {
    if (selectedAccountIds.length === 0) {
      if (Object.keys(selectedAccountSnapshots).length > 0) {
        setSelectedAccountSnapshots({});
      }
      return;
    }

    let didChange = false;
    const nextSnapshots = { ...selectedAccountSnapshots };
    for (const account of accounts) {
      if (!selectedAccountIdSet.has(account.id)) continue;
      const existing = selectedAccountSnapshots[account.id];
      if (
        existing &&
        existing.displayName === account.displayName &&
        existing.email === account.email &&
        existing.phone === account.phone &&
        existing.notes === account.notes &&
        existing.role === account.role &&
        existing.createdAt === account.createdAt &&
        existing.lastLoginAt === account.lastLoginAt
      ) {
        continue;
      }

      nextSnapshots[account.id] = account;
      didChange = true;
    }

    if (didChange) {
      setSelectedAccountSnapshots(nextSnapshots);
    }
  }, [
    accounts,
    selectedAccountIdSet,
    selectedAccountIds.length,
    selectedAccountSnapshots,
  ]);
  const selectedAccounts = useMemo(
    () =>
      selectedAccountIds
        .map((accountId) => selectedAccountSnapshots[accountId])
        .filter((account): account is StaffAccountListItem => Boolean(account)),
    [selectedAccountIds, selectedAccountSnapshots],
  );
  const selectedAccountCount = selectedAccountIds.length;
  const tableColumnCount = 7 + (isSelectMode ? 1 : 0);
  const nextEditableRole = parseEditableRole(normalizedRoleInput);
  const roleChangeWarning =
    editInitial && nextEditableRole && editInitial.role !== nextEditableRole
      ? rolePrivilegeRank(nextEditableRole) >
        rolePrivilegeRank(editInitial.role)
        ? `Warning: Changing role from ${editInitial.role} to ${nextEditableRole} grants increased privileges to this account.`
        : `Warning: Changing role from ${editInitial.role} to ${nextEditableRole} removes privileges from this account.`
      : null;
  const isBulkRoleDirty =
    bulkEditInitial !== null &&
    bulkRole !== bulkEditInitial.role &&
    bulkRole !== MIXED_FIELD_VALUE;
  const isAnyBulkFieldDirty = isBulkRoleDirty;
  const showBulkRoleMixed =
    bulkEditInitial?.roleMixed === true && bulkRole === MIXED_FIELD_VALUE;
  const isBulkBusy = isBulkSaving || isBulkDeleting;
  const normalizedBulkRoleInput = normalizeRole(bulkRole);
  const bulkNextEditableRole = parseEditableRole(normalizedBulkRoleInput);
  const bulkRoleChangeWarning = useMemo(() => {
    if (!isBulkRoleDirty || !bulkNextEditableRole) {
      return null;
    }

    let increasedPrivilegeCount = 0;
    let decreasedPrivilegeCount = 0;
    let changedCount = 0;
    let firstFromRole: EditableRole | null = null;

    for (const account of selectedAccounts) {
      const currentRole = parseEditableRole(normalizeRole(account.role));
      if (!currentRole || currentRole === bulkNextEditableRole) {
        continue;
      }

      changedCount += 1;
      if (firstFromRole === null) {
        firstFromRole = currentRole;
      }

      if (
        rolePrivilegeRank(bulkNextEditableRole) > rolePrivilegeRank(currentRole)
      ) {
        increasedPrivilegeCount += 1;
      } else {
        decreasedPrivilegeCount += 1;
      }
    }

    if (changedCount === 0) {
      return null;
    }

    if (changedCount === 1 && firstFromRole) {
      return rolePrivilegeRank(bulkNextEditableRole) >
        rolePrivilegeRank(firstFromRole)
        ? `Warning: Changing role from ${firstFromRole} to ${bulkNextEditableRole} grants increased privileges to this account.`
        : `Warning: Changing role from ${firstFromRole} to ${bulkNextEditableRole} removes privileges from this account.`;
    }

    if (increasedPrivilegeCount > 0 && decreasedPrivilegeCount === 0) {
      return `Warning: Changing role to ${bulkNextEditableRole} grants increased privileges to ${increasedPrivilegeCount} selected account${increasedPrivilegeCount === 1 ? "" : "s"}.`;
    }

    if (decreasedPrivilegeCount > 0 && increasedPrivilegeCount === 0) {
      return `Warning: Changing role to ${bulkNextEditableRole} removes privileges from ${decreasedPrivilegeCount} selected account${decreasedPrivilegeCount === 1 ? "" : "s"}.`;
    }

    return `Warning: Changing roles to ${bulkNextEditableRole} adjusts privileges across selected accounts (${increasedPrivilegeCount} increased, ${decreasedPrivilegeCount} decreased).`;
  }, [bulkNextEditableRole, isBulkRoleDirty, selectedAccounts]);

  useEffect(() => {
    if (!isBulkEditOpen) return;
    if (selectedAccountCount > 0) return;
    setIsBulkEditOpen(false);
    setBulkEditInitial(null);
    setBulkEditError(null);
    setIsBulkSaveConfirmationOpen(false);
    setShowBulkDeleteConfirmation(false);
  }, [isBulkEditOpen, selectedAccountCount]);

  useEffect(() => {
    if (!isBulkEditOpen || selectedAccountCount === 0) return;

    const uniqueRoles = Array.from(
      new Set(selectedAccounts.map((account) => normalizeRole(account.role))),
    );
    const singleRole = uniqueRoles.length === 1 ? uniqueRoles[0] : null;
    const parsedSingleRole = singleRole ? parseEditableRole(singleRole) : null;
    const roleMixed = parsedSingleRole === null;
    const nextRole = roleMixed ? MIXED_FIELD_VALUE : parsedSingleRole;

    setBulkRole(nextRole);
    setBulkEditInitial({
      role: nextRole,
      roleMixed,
    });
    setBulkEditError(null);
  }, [isBulkEditOpen, selectedAccountCount, selectedAccounts]);

  function handlePageChange(nextOffset: number) {
    const clampedOffset = Math.max(0, Math.min(nextOffset, maxOffset));
    setOffset(clampedOffset);
  }

  function handleJumpByPages(pageDelta: number) {
    handlePageChange(offset + pageDelta * pageSize);
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

  function handleRoleFilterChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setRoleFilter(event.target.value as AccountRoleFilter);
    setOffset(0);
  }

  function handlePageSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const parsedPageSize = Number.parseInt(event.target.value, 10);
    const nextPageSize = PAGE_SIZE_OPTIONS.includes(
      parsedPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
    )
      ? parsedPageSize
      : DEFAULT_PAGE_SIZE;
    setPageSize(nextPageSize);
    setOffset(0);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearchQuery = searchInput.trim().replace(/\s+/g, " ");
    setSearchQuery(nextSearchQuery);
    setOffset(0);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearchQuery("");
    setOffset(0);
  }

  function handleClearFilters() {
    setRoleFilter("all");
    setPageSize(DEFAULT_PAGE_SIZE);
    setSortBy(null);
    setSortOrder("asc");
    setOffset(0);
  }

  function toggleSelectMode() {
    setIsSelectMode((currentValue) => {
      const nextValue = !currentValue;
      if (!nextValue) {
        setSelectedAccountIds([]);
        setSelectedAccountSnapshots({});
        setIsBulkEditOpen(false);
        setBulkEditInitial(null);
        setBulkEditError(null);
        setIsBulkSaveConfirmationOpen(false);
        setShowBulkDeleteConfirmation(false);
      }
      return nextValue;
    });
  }

  function toggleAccountSelection(accountId: number) {
    setSelectedAccountIds((currentIds) => {
      if (currentIds.includes(accountId)) {
        setSelectedAccountSnapshots((currentSnapshots) => {
          if (!(accountId in currentSnapshots)) {
            return currentSnapshots;
          }

          const nextSnapshots = { ...currentSnapshots };
          delete nextSnapshots[accountId];
          return nextSnapshots;
        });
        return currentIds.filter((id) => id !== accountId);
      }

      const account = accounts.find((entry) => entry.id === accountId);
      if (account) {
        setSelectedAccountSnapshots((currentSnapshots) => ({
          ...currentSnapshots,
          [accountId]: account,
        }));
      }
      return [...currentIds, accountId];
    });
  }

  function handleEditSelectedClick() {
    if (isViewerStaff || selectedAccountCount === 0) {
      return;
    }

    setIsBulkEditOpen(true);
  }

  function closeBulkEditModal() {
    if (isBulkBusy) {
      return;
    }

    setIsBulkEditOpen(false);
    setSelectedAccountSnapshots({});
    setBulkEditError(null);
    setIsBulkSaveConfirmationOpen(false);
    setShowBulkDeleteConfirmation(false);
  }

  function openBulkDeleteConfirmation() {
    if (selectedAccountCount === 0) {
      setBulkEditError("Select at least one account.");
      return;
    }

    setBulkEditError(null);
    setIsBulkSaveConfirmationOpen(false);
    setShowBulkDeleteConfirmation(true);
  }

  function closeBulkDeleteConfirmation() {
    if (isBulkBusy) {
      return;
    }

    setShowBulkDeleteConfirmation(false);
  }

  async function handleBulkAccountUpdate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isViewerStaff) {
      setBulkEditError("Only admins can edit account types.");
      return;
    }

    if (selectedAccountCount === 0) {
      setBulkEditError("Select at least one account.");
      return;
    }

    if (!isAnyBulkFieldDirty) {
      setBulkEditError("Choose at least one field to update.");
      return;
    }

    const nextRole = parseEditableRole(normalizedBulkRoleInput);
    if (!nextRole) {
      setBulkEditError("Role must be ADMIN, STAFF, or CUSTOMER.");
      return;
    }

    setBulkEditError(null);
    setShowBulkDeleteConfirmation(false);
    setIsBulkSaveConfirmationOpen(true);
  }

  function closeBulkSaveConfirmation() {
    if (isBulkSaving) {
      return;
    }

    setIsBulkSaveConfirmationOpen(false);
  }

  async function confirmBulkAccountUpdate() {
    if (isViewerStaff) {
      setBulkEditError("Only admins can edit account types.");
      setIsBulkSaveConfirmationOpen(false);
      return;
    }

    if (selectedAccountCount === 0) {
      setBulkEditError("Select at least one account.");
      setIsBulkSaveConfirmationOpen(false);
      return;
    }

    if (!isAnyBulkFieldDirty) {
      setBulkEditError("Choose at least one field to update.");
      setIsBulkSaveConfirmationOpen(false);
      return;
    }

    const nextRole = parseEditableRole(normalizedBulkRoleInput);
    if (!nextRole) {
      setBulkEditError("Role must be ADMIN, STAFF, or CUSTOMER.");
      setIsBulkSaveConfirmationOpen(false);
      return;
    }

    setBulkEditError(null);
    setIsBulkSaving(true);

    try {
      const response = await fetch("/api/accounts/staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountIds: selectedAccountIds,
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
            : `Bulk account update failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      setIsBulkSaveConfirmationOpen(false);
      setIsBulkEditOpen(false);
      setShowBulkDeleteConfirmation(false);
      setSelectedAccountIds([]);
      setSelectedAccountSnapshots({});
      setRefreshNonce((current) => current + 1);
    } catch (error) {
      setIsBulkSaveConfirmationOpen(false);
      setBulkEditError(
        error instanceof Error
          ? error.message
          : "Unable to update selected accounts.",
      );
    } finally {
      setIsBulkSaving(false);
    }
  }

  async function confirmBulkAccountDelete() {
    if (isViewerStaff) {
      setBulkEditError("Only admins can delete accounts.");
      setShowBulkDeleteConfirmation(false);
      return;
    }

    if (selectedAccountCount === 0) {
      setBulkEditError("Select at least one account.");
      setShowBulkDeleteConfirmation(false);
      return;
    }

    if (
      viewerAccountId !== null &&
      selectedAccounts.some((account) => account.id === viewerAccountId)
    ) {
      setBulkEditError("You cannot delete your own account.");
      setShowBulkDeleteConfirmation(false);
      return;
    }

    setBulkEditError(null);
    setIsBulkDeleting(true);

    try {
      for (const accountId of selectedAccountIds) {
        const response = await fetch("/api/accounts/staff", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
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
              : `Bulk account deletion failed (HTTP ${response.status}).`;
          throw new Error(message);
        }
      }

      const selectedOnCurrentPageCount = accounts.filter((account) =>
        selectedAccountIdSet.has(account.id),
      ).length;
      const shouldMoveToPreviousPage =
        selectedOnCurrentPageCount === accounts.length &&
        selectedOnCurrentPageCount === selectedAccountIds.length &&
        offset > 0;
      setShowBulkDeleteConfirmation(false);
      setIsBulkEditOpen(false);
      setSelectedAccountIds([]);
      setSelectedAccountSnapshots({});

      if (shouldMoveToPreviousPage) {
        setOffset((currentOffset) => Math.max(0, currentOffset - pageSize));
      } else {
        setRefreshNonce((current) => current + 1);
      }
    } catch (error) {
      setShowBulkDeleteConfirmation(false);
      setBulkEditError(
        error instanceof Error
          ? error.message
          : "Unable to delete selected accounts.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function resetEditModalState() {
    setEditAccount(null);
    setEditDisplayName("");
    setEditEmail("");
    setEditPassword("");
    setShowEditPassword(false);
    setIsPasswordInfoOpen(false);
    setEditPhone("");
    setEditNotes("");
    setEditRole("CUSTOMER");
    setEditInitial(null);
    setEditError(null);
    setIsSaveConfirmationOpen(false);
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
    const normalizedAccountNotes = account.notes ?? "";

    setEditAccount(account);
    setEditDisplayName(normalizedAccountDisplayName);
    setEditEmail(normalizedAccountEmail);
    setEditPassword("");
    setShowEditPassword(false);
    setIsPasswordInfoOpen(false);
    setEditPhone(normalizedAccountPhone);
    setEditNotes(normalizedAccountNotes);
    setEditRole(normalizedAccountRole);
    setEditInitial({
      displayName: normalizedAccountDisplayName,
      phone: normalizedAccountPhone,
      notes: normalizedAccountNotes,
      role: normalizedAccountRole,
    });
    setEditError(null);
    setIsSaveConfirmationOpen(false);
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
    setIsSaveConfirmationOpen(false);
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

  function clearEditChanges() {
    if (isModalBusy || !editInitial) {
      return;
    }

    setEditDisplayName(editInitial.displayName);
    setEditPassword("");
    setShowEditPassword(false);
    setIsPasswordInfoOpen(false);
    setEditPhone(editInitial.phone);
    setEditNotes(editInitial.notes);
    setEditRole(editInitial.role);
    setEditError(null);
    setIsSaveConfirmationOpen(false);
    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editAccount || !editInitial || !isAnyEditDirty) {
      return;
    }

    if (normalizedPasswordInput && !isStrongPassword(normalizedPasswordInput)) {
      setEditError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      );
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
    setIsSaveConfirmationOpen(true);
  }

  async function confirmSaveEdit() {
    if (!editAccount || !editInitial || !isAnyEditDirty) {
      return;
    }

    if (normalizedPasswordInput && !isStrongPassword(normalizedPasswordInput)) {
      setEditError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      );
      setIsSaveConfirmationOpen(false);
      return;
    }

    if (normalizedPhoneInput && !isValidPhone(normalizedPhoneInput)) {
      const phoneDigitsLength = getPhoneDigitsLength(normalizedPhoneInput);
      setEditError(
        phoneDigitsLength > 10
          ? "Phone number is too long. Use exactly 10 digits."
          : "Phone number is too short. Use exactly 10 digits.",
      );
      setIsSaveConfirmationOpen(false);
      return;
    }

    const nextRole = parseEditableRole(normalizedRoleInput);
    if (!nextRole) {
      setEditError("Role must be ADMIN, STAFF, or CUSTOMER.");
      setIsSaveConfirmationOpen(false);
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
          phone: normalizedPhoneInput,
          notes: normalizedNotesInput,
          role: nextRole,
          ...(normalizedPasswordInput
            ? { password: normalizedPasswordInput }
            : {}),
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
        setOffset((currentOffset) => Math.max(0, currentOffset - pageSize));
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

  const editModalBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeEditModal);
  const bulkEditModalBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeBulkEditModal);
  const bulkDeleteConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeBulkDeleteConfirmation);
  const bulkSaveConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeBulkSaveConfirmation);
  const deleteConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeDeleteConfirmation);
  const saveConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() =>
      setIsSaveConfirmationOpen(false),
    );

  return (
    <div>
      <div className="staffTitle">Account Management</div>
      <div className="staffSubtitle">
        Search by display name, email, or ID and filter by role or page size.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <div className="staffCardLabel">Account Directory</div>

          <div className="item-search-page__controls">
            <div className="item-search-page__search">
              <form onSubmit={handleSearchSubmit}>
                <div className="item-search-page__search-bar">
                  <div className="item-search-page__search-input-wrap">
                    <input
                      type="text"
                      placeholder="Search by Display Name, Email, or ID"
                      className="item-search-page__search-input"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                    />
                    {(searchInput || searchQuery) && (
                      <button
                        type="button"
                        className="item-search-page__search-clear"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                      >
                        x
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="item-search-page__search-submit"
                    aria-label="Search"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="item-search-page__filter-row">
                <select
                  className="item-search-page__select"
                  onChange={handleRoleFilterChange}
                  value={roleFilter}
                >
                  <option value="all">Role: All</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="CUSTOMER">Customer</option>
                </select>

                <select
                  className="item-search-page__select"
                  onChange={handlePageSizeChange}
                  value={String(pageSize)}
                >
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>

                <button
                  type="button"
                  className="item-search-page__filter-button"
                  onClick={handleClearFilters}
                  disabled={
                    roleFilter === "all" &&
                    pageSize === DEFAULT_PAGE_SIZE &&
                    !sortBy
                  }
                >
                  Clear Filters
                </button>

                <div className="account-management__filter-actions">
                  {!isViewerStaff && selectedAccountCount > 0 ? (
                    <button
                      type="button"
                      className="item-search-page__filter-button account-management__edit-selected-button"
                      onClick={handleEditSelectedClick}
                    >
                      Edit ({selectedAccountCount})
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className={`item-search-page__filter-button account-management__select-button ${
                      isSelectMode
                        ? "account-management__select-button--active"
                        : ""
                    }`}
                    onClick={toggleSelectMode}
                    disabled={
                      isLoading || (accounts.length === 0 && !isSelectMode)
                    }
                  >
                    {isSelectMode
                      ? `Select (${selectedAccountCount})`
                      : "Select"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="item-search-page__table-wrap">
            <div className="item-search-page__table-scroll">
              <div className="item-search-page__table-content">
                <table className="item-search-page__table">
                  <thead className="item-search-page__thead">
                    <tr>
                      {isSelectMode ? (
                        <th className="item-search-page__th account-management__select-col">
                          Select
                        </th>
                      ) : null}
                      <th className="item-search-page__th">
                        <button
                          className={`item-search-page__th-button${
                            sortBy === "id"
                              ? " item-search-page__th-button--active"
                              : ""
                          }`}
                          onClick={() => handleSortChange("id")}
                        >
                          ID
                          {getSortIndicator("id")}
                        </button>
                      </th>
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
                        <td
                          className="item-search-page__td"
                          colSpan={tableColumnCount}
                        >
                          Loading accounts...
                        </td>
                      </tr>
                    ) : loadError ? (
                      <tr className="item-search-page__tr">
                        <td
                          className="item-search-page__td"
                          colSpan={tableColumnCount}
                        >
                          {loadError}
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr className="item-search-page__tr">
                        <td
                          className="item-search-page__td"
                          colSpan={tableColumnCount}
                        >
                          No accounts found.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {accounts.map((account) => (
                          <tr key={account.id} className="item-search-page__tr">
                            {isSelectMode ? (
                              <td className="item-search-page__td account-management__select-col">
                                <input
                                  type="checkbox"
                                  className="account-management__select-checkbox"
                                  checked={selectedAccountIdSet.has(account.id)}
                                  onChange={() =>
                                    toggleAccountSelection(account.id)
                                  }
                                  aria-label={`Select account ${account.email}`}
                                />
                              </td>
                            ) : null}
                            <td className="item-search-page__td">
                              {account.id}
                            </td>
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
                      onClick={() => handlePageChange(offset - pageSize)}
                      disabled={isLoading || offset === 0}
                    >
                      &lt;
                    </button>
                    <span className="item-search-page__page-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="pagination__nav"
                      onClick={() => handlePageChange(offset + pageSize)}
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
          onPointerDown={editModalBackdropHandlers.onPointerDown}
          onClick={editModalBackdropHandlers.onClick}
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
                <span className="item-category-form__label">Email</span>
                <div className="account-management__readonly-value">
                  {editEmail}
                </div>
              </label>

              <label className="item-category-form__field">
                <div className="account-management__password-label-row">
                  <span
                    className={`item-category-form__label ${
                      isPasswordDirty
                        ? "category-mgmt-edit-modal__label--dirty"
                        : ""
                    }`}
                  >
                    Password
                  </span>
                  <button
                    type="button"
                    className="account-management__info-button"
                    onClick={() => setIsPasswordInfoOpen((prev) => !prev)}
                    aria-label="Password field info"
                    aria-expanded={isPasswordInfoOpen}
                    disabled={isModalBusy}
                  >
                    i
                  </button>
                </div>
                <div className="passwordInputWrap">
                  <input
                    className="item-search-page__search-input passwordInput"
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(event) => {
                      setEditPassword(event.target.value);
                      if (!event.target.value) {
                        setShowEditPassword(false);
                      }
                    }}
                    placeholder="Enter new password"
                    disabled={isModalBusy}
                  />
                  {editPassword.length > 0 && (
                    <button
                      type="button"
                      className="passwordToggle"
                      onClick={() => setShowEditPassword((prev) => !prev)}
                      aria-label={
                        showEditPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showEditPassword}
                      disabled={isModalBusy}
                    >
                      {showEditPassword ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 3l18 18" />
                          <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7a11.92 11.92 0 0 1-4.05 5.19" />
                          <path d="M6.61 6.61A11.95 11.95 0 0 0 1 12c1.73 3.89 6 7 11 7a10.94 10.94 0 0 0 5-.91" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                {isPasswordInfoOpen ? (
                  <div className="account-management__password-info-popup">
                    This field can only set a new password. The account&apos;s
                    current password cannot be viewed.
                  </div>
                ) : null}
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

              <label className="item-category-form__field">
                <div className="account-management__notes-label-row">
                  <span
                    className={`item-category-form__label ${
                      isNotesDirty
                        ? "category-mgmt-edit-modal__label--dirty"
                        : ""
                    }`}
                  >
                    Notes
                  </span>
                  <span
                    className={`item-category-form__label account-management__notes-count ${
                      isNotesDirty
                        ? "category-mgmt-edit-modal__label--dirty"
                        : ""
                    }`}
                  >
                    {editNotes.length}/{ACCOUNT_NOTES_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  className="item-search-page__search-input staffTaskCreateForm__textarea"
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Add account notes"
                  maxLength={ACCOUNT_NOTES_MAX_LENGTH}
                  disabled={isModalBusy}
                />
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
                  onClick={clearEditChanges}
                  className="staff-dev-pill"
                  disabled={isModalBusy || !isAnyEditDirty}
                >
                  Clear Changes
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

      {isBulkEditOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bulk Edit Accounts"
          className="item-category-modal"
          onPointerDown={bulkEditModalBackdropHandlers.onPointerDown}
          onClick={bulkEditModalBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">
              Edit Selected Accounts
            </div>
            <div className="staffCardHint staffBulkEditSummary">
              {selectedAccountCount} account
              {selectedAccountCount === 1 ? "" : "s"} selected.
            </div>

            <form
              className="item-category-form"
              onSubmit={(event) => void handleBulkAccountUpdate(event)}
              noValidate
            >
              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${
                    isBulkRoleDirty
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Account Type
                </span>
                <select
                  className="item-search-page__select"
                  value={bulkRole}
                  onChange={(event) => setBulkRole(event.target.value)}
                  disabled={isBulkBusy}
                >
                  {showBulkRoleMixed ? (
                    <option value={MIXED_FIELD_VALUE}>--</option>
                  ) : null}
                  {ACCOUNT_ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </label>

              {showBulkRoleMixed ? (
                <div className="staffCardHint">
                  Fields showing -- currently have mixed values.
                </div>
              ) : null}

              {bulkEditError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {bulkEditError}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeBulkEditModal}
                  className="staff-dev-pill"
                  disabled={isBulkBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="staff-dev-pill staff-dev-pill--danger"
                  onClick={openBulkDeleteConfirmation}
                  disabled={isBulkBusy || selectedAccountCount === 0}
                >
                  {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                </button>
                <button
                  type="submit"
                  className={`staff-dev-pill${isAnyBulkFieldDirty ? " staff-dev-pill--ready" : ""}`}
                  disabled={isBulkBusy || !isAnyBulkFieldDirty}
                >
                  {isBulkSaving ? "Saving..." : "Apply Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBulkEditOpen && showBulkDeleteConfirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Selected Accounts"
          className="item-category-modal"
          onPointerDown={bulkDeleteConfirmationBackdropHandlers.onPointerDown}
          onClick={bulkDeleteConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to delete {selectedAccountCount} selected
              account
              {selectedAccountCount === 1 ? "" : "s"}?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>This action cannot be undone.</p>
            </div>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeBulkDeleteConfirmation}
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void confirmBulkAccountDelete()}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isBulkEditOpen && isBulkSaveConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Save Account Role Changes"
          className="item-category-modal"
          onPointerDown={bulkSaveConfirmationBackdropHandlers.onPointerDown}
          onClick={bulkSaveConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Changes</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to save these changes?
            </p>
            {bulkRoleChangeWarning ? (
              <div className="category-mgmt-delete-warning">
                <p>{bulkRoleChangeWarning}</p>
              </div>
            ) : null}
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeBulkSaveConfirmation}
                disabled={isBulkSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={() => void confirmBulkAccountUpdate()}
                disabled={isBulkSaving}
              >
                {isBulkSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editAccount && isDeleteConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Account"
          className="item-category-modal"
          onPointerDown={deleteConfirmationBackdropHandlers.onPointerDown}
          onClick={deleteConfirmationBackdropHandlers.onClick}
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

      {editAccount && isSaveConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Save Account Changes"
          className="item-category-modal"
          onPointerDown={saveConfirmationBackdropHandlers.onPointerDown}
          onClick={saveConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Changes</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to save these changes?
            </p>
            {roleChangeWarning ? (
              <div className="category-mgmt-delete-warning">
                <p>{roleChangeWarning}</p>
              </div>
            ) : null}
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => setIsSaveConfirmationOpen(false)}
                disabled={isSavingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={() => void confirmSaveEdit()}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
