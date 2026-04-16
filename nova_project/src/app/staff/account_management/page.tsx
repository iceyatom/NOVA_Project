"use client";

import { useEffect, useMemo, useState } from "react";

type StaffAccountListItem = {
  id: number;
  displayName: string | null;
  email: string;
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

type SortColumn = "displayName" | "email" | "role" | "createdAt" | "lastLogin";

type SortOrder = "asc" | "desc";

const PAGE_SIZE = 20;

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

export default function StaffAccountManagementPage() {
  const [accounts, setAccounts] = useState<StaffAccountListItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

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
  }, [offset, sortBy, sortOrder]);

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
                    </tr>
                  </thead>

                  <tbody className="item-search-page__tbody">
                    {isLoading && accounts.length === 0 ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={5}>
                          Loading accounts...
                        </td>
                      </tr>
                    ) : loadError ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={5}>
                          {loadError}
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr className="item-search-page__tr">
                        <td className="item-search-page__td" colSpan={5}>
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
    </div>
  );
}
