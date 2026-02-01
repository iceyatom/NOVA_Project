"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

type CatalogPaginationProps = {
  totalItems: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
};

const DEFAULT_PAGE_SIZES = [20, 50, 100];
const ELLIPSIS = "ellipsis";

function normalizePageSizes(
  initialPageSize: number,
  pageSizeOptions: number[],
) {
  const options = new Set(pageSizeOptions);
  options.add(initialPageSize);
  return Array.from(options).sort((a, b) => a - b);
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const ordered = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | typeof ELLIPSIS> = [];

  ordered.forEach((page, index) => {
    if (index === 0) {
      result.push(page);
      return;
    }

    const prevPage = ordered[index - 1];
    if (page - prevPage > 1) {
      result.push(ELLIPSIS);
    }

    result.push(page);
  });

  return result;
}

export default function CatalogPagination({
  totalItems,
  initialPageSize = 20,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: CatalogPaginationProps) {
  const resolvedPageSizes = useMemo(
    () => normalizePageSizes(initialPageSize, pageSizeOptions),
    [initialPageSize, pageSizeOptions],
  );

  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pages = useMemo(
    () => buildPagination(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  return (
    <section className="pagination" aria-label="Catalog pagination">
      <div className="pagination__meta">
        <span className="pagination__status">
          Page {currentPage} of {totalPages}
        </span>
        <label className="pagination__size">
          <span>Items per page</span>
          <select value={pageSize} onChange={handlePageSizeChange}>
            {resolvedPageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__nav"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <div className="pagination__pages" role="radiogroup" aria-label="Page">
          {pages.map((page, index) => {
            if (page === ELLIPSIS) {
              return (
                <div key={`ellipsis-${index}`} className="pagination__page">
                  <span className="pagination__ellipsis" aria-hidden="true">
                    ...
                  </span>
                </div>
              );
            }

            return (
              <div key={page} className="pagination__page">
                <input
                  id={`catalog-page-${page}`}
                  type="radio"
                  name="catalog-page"
                  className="pagination__page-input"
                  value={page}
                  checked={page === currentPage}
                  onChange={() => setCurrentPage(page)}
                />
                <label
                  htmlFor={`catalog-page-${page}`}
                  className="pagination__page-label"
                >
                  {page}
                </label>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination__nav"
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}
