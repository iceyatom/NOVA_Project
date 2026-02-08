"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
}: PaginationProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / pageSize);

  // Helper to build URL with pagination parameters
  const buildPageUrl = (page: number): string => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    return `/catalog?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  return (
    <nav
      className="pagination"
      aria-label="Catalog pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        margin: "2rem 0",
        flexWrap: "wrap",
      }}
    >
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="pagination-button"
          aria-label="Previous page"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#005fa3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            border: "1px solid #005fa3",
            fontSize: "0.9rem",
          }}
        >
          ← Prev
        </Link>
      ) : (
        <button
          disabled
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#ccc",
            color: "#666",
            borderRadius: "4px",
            border: "1px solid #ccc",
            cursor: "not-allowed",
            fontSize: "0.9rem",
          }}
        >
          ← Prev
        </button>
      )}

      {/* Page indicators - responsive */}
      <div
        className="pagination-info"
        style={{
          padding: "0.5rem 0.75rem",
          margin: "0 0.25rem",
          fontSize: "0.85rem",
        }}
        aria-current="page"
      >
        <span style={{ whiteSpace: "nowrap" }}>
          <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
        </span>
      </div>

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="pagination-button"
          aria-label="Next page"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#005fa3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            border: "1px solid #005fa3",
            fontSize: "0.9rem",
          }}
        >
          Next →
        </Link>
      ) : (
        <button
          disabled
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#ccc",
            color: "#666",
            borderRadius: "4px",
            border: "1px solid #ccc",
            cursor: "not-allowed",
            fontSize: "0.9rem",
          }}
        >
          Next →
        </button>
      )}

      {/* Page size selector with responsive display */}
      <div
        className="pagination-size"
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          minWidth: "200px",
          justifyContent: "flex-end",
        }}
      >
        <label htmlFor="pageSize" style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
          Per page:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams);
            params.set("pageSize", e.target.value);
            params.set("page", "1"); // Reset to page 1 when changing page size
            window.location.href = `/catalog?${params.toString()}`;
          }}
          style={{
            padding: "0.375rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "0.85rem",
          }}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      {/* Mobile-friendly media query */}
      <style>{`
        @media (max-width: 640px) {
          .pagination {
            gap: 0.25rem !important;
          }
          .pagination-size {
            margin-left: 0 !important;
            margin-top: 0.5rem;
            width: 100%;
            justify-content: center;
          }
          .pagination-info {
            margin: 0 !important;
          }
        }
      `}</style>
    </nav>
  );
}
