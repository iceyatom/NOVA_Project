"use client";
import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type SortColumn =
  | "sku"
  | "name"
  | "category"
  | "price"
  | "stock"
  | "lastModified";

type StaffCatalogItem = {
  id: number;
  sku: string | null;
  itemName: string;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  quantityInStock: number;
  price: number | string;
  updatedAt: string | Date;
};

type StaffCatalogResponse = {
  success?: boolean;
  data?: unknown;
  totalCount?: unknown;
};

function parseCatalogItems(payload: unknown): StaffCatalogItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const id = Number(item.id);

      if (!Number.isFinite(id)) {
        return null;
      }

      return {
        id,
        sku: typeof item.sku === "string" ? item.sku : null,
        itemName: typeof item.itemName === "string" ? item.itemName : "",
        category1: typeof item.category1 === "string" ? item.category1 : null,
        category2: typeof item.category2 === "string" ? item.category2 : null,
        category3: typeof item.category3 === "string" ? item.category3 : null,
        quantityInStock:
          typeof item.quantityInStock === "number" ? item.quantityInStock : 0,
        price:
          typeof item.price === "number" || typeof item.price === "string"
            ? item.price
            : 0,
        updatedAt:
          typeof item.updatedAt === "string" || item.updatedAt instanceof Date
            ? item.updatedAt
            : "",
      } satisfies StaffCatalogItem;
    })
    .filter((item): item is StaffCatalogItem => item !== null);
}

const StaffItemSearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageSizeParam = searchParams.get("pageSize") || "20";
  const categoryParam = searchParams.get("category") || "all";
  const subcategoryParam = searchParams.get("subcategory") || "all";
  const typeParam = searchParams.get("type") || "all";
  const searchQueryParam = searchParams.get("query") || "";
  const sortByParam = searchParams.get("sortBy") || "";
  const sortOrderParam = searchParams.get("sortOrder") || "asc";
  const offset = Number(searchParams.get("offset")) || 0;
  const currentSearchQueryString = searchParams.toString();

  const [catalogItems, setCatalogItems] = React.useState<StaffCatalogItem[]>(
    [],
  );
  const [categories, setCategories] = React.useState<string[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [subcategories, setSubcategories] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);
  const [searchInput, setSearchInput] = React.useState(searchQueryParam);

  // Cache for subcategory and type selections to avoid redundant API calls
  const subcategoriesCache = React.useRef<Map<string, string[]>>(new Map());
  const typesCache = React.useRef<Map<string, string[]>>(new Map());

  React.useEffect(() => {
    setSearchInput(searchQueryParam);
  }, [searchQueryParam]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/catalog/categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          setCategories([]);
          return;
        }

        const payload = (await response.json()) as {
          categories?: unknown;
          success?: boolean;
        };

        const nextCategories = Array.isArray(payload?.categories)
          ? payload.categories.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [];

        setCategories(nextCategories);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  React.useEffect(() => {
    const fetchItems = async () => {
      const params = new URLSearchParams({
        pageSize: String(pageSizeParam),
        offset: String(offset),
      });

      if (categoryParam !== "all") {
        params.set("category", categoryParam);
      }

      if (subcategoryParam !== "all") {
        params.set("subcategory", subcategoryParam);
      }

      if (typeParam !== "all") {
        params.set("type", typeParam);
      }

      if (searchQueryParam) {
        params.set("query", searchQueryParam);
      }

      if (sortByParam) {
        params.set("sortBy", sortByParam);
        params.set("sortOrder", sortOrderParam);
      }

      const response = await fetch(`/api/catalog/staff?${params.toString()}`);
      const result = (await response.json()) as StaffCatalogResponse | unknown;

      // Handle both old array format and new paginated object format
      if (Array.isArray(result)) {
        const parsedItems = parseCatalogItems(result);
        setCatalogItems(parsedItems);
        setTotalItems(parsedItems.length);
        // Old format: need separate count request
      } else if (
        result &&
        typeof result === "object" &&
        (result as StaffCatalogResponse).success &&
        (result as StaffCatalogResponse).data
      ) {
        const responsePayload = result as StaffCatalogResponse;
        setCatalogItems(parseCatalogItems(responsePayload.data));

        const nextTotalCount = Number(responsePayload.totalCount);
        setTotalItems(Number.isFinite(nextTotalCount) ? nextTotalCount : 0);
      }
    };

    fetchItems();
  }, [
    pageSizeParam,
    offset,
    categoryParam,
    subcategoryParam,
    typeParam,
    searchQueryParam,
    sortByParam,
    sortOrderParam,
  ]);

  React.useEffect(() => {
    const fetchSubcategories = async () => {
      if (categoryParam === "all") {
        setSubcategories([]);
        return;
      }

      // Check cache first
      const cacheKey = categoryParam;
      if (subcategoriesCache.current.has(cacheKey)) {
        setSubcategories(subcategoriesCache.current.get(cacheKey)!);
        return;
      }

      const response = await fetch(
        `/api/catalog/staff/subcategories?category=${encodeURIComponent(categoryParam)}`,
      );
      const { subcategories: nextSubcategories } = await response.json();

      // Cache the result
      subcategoriesCache.current.set(cacheKey, nextSubcategories);
      setSubcategories(nextSubcategories);
    };

    fetchSubcategories();
  }, [categoryParam]);

  React.useEffect(() => {
    const fetchTypes = async () => {
      if (categoryParam === "all" || subcategoryParam === "all") {
        setTypes([]);
        return;
      }

      // Check cache first
      const cacheKey = `${categoryParam}|${subcategoryParam}`;
      if (typesCache.current.has(cacheKey)) {
        setTypes(typesCache.current.get(cacheKey)!);
        return;
      }

      const params = new URLSearchParams({
        category: categoryParam,
        subcategory: subcategoryParam,
      });

      const response = await fetch(
        `/api/catalog/staff/types?${params.toString()}`,
      );
      const { types: nextTypes } = await response.json();

      // Cache the result
      typesCache.current.set(cacheKey, nextTypes);
      setTypes(nextTypes);
    };

    fetchTypes();
  }, [categoryParam, subcategoryParam]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = e.target.value;
    const params = new URLSearchParams({
      pageSize: newPageSize,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (newCategory !== "all") {
      params.set("category", newCategory);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubcategory = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (newSubcategory !== "all") {
      params.set("subcategory", newSubcategory);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (newType !== "all") {
      params.set("type", newType);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleSortChange = (column: SortColumn) => {
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    const nextSortOrder =
      sortByParam === column && sortOrderParam === "asc" ? "desc" : "asc";

    params.set("sortBy", column);
    params.set("sortOrder", nextSortOrder);

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: String(newOffset),
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleClearSort = () => {
    const params = new URLSearchParams({
      pageSize: "20",
      offset: "0",
    });

    if (searchQueryParam) {
      params.set("query", searchQueryParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    const trimmedSearchInput = searchInput.trim().replace(/\s+/g, " ");

    if (trimmedSearchInput) {
      params.set("query", trimmedSearchInput);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchInput("");

    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    if (sortByParam) {
      params.set("sortBy", sortByParam);
      params.set("sortOrder", sortOrderParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const pageSize =
    pageSizeParam === "all"
      ? Math.max(totalItems || catalogItems.length || 1, 1)
      : Number(pageSizeParam) || 20;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;
  const maxOffset = Math.max(0, (totalPages - 1) * pageSize);

  const handleJumpByPages = (pageDelta: number) => {
    const newOffset = offset + pageDelta * pageSize;
    handlePageChange(Math.min(Math.max(newOffset, 0), maxOffset));
  };

  const formatItemName = (name: string) => {
    const maxLength = 36;

    if (name.length <= maxLength) {
      return name;
    }

    return `${name.slice(0, maxLength)}...`;
  };

  const formatCategoryName = (category: string | null) => {
    if (!category) {
      return "None";
    }

    const maxLength = 24;

    if (category.length <= maxLength) {
      return category;
    }

    return `${category.slice(0, maxLength)}...`;
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortByParam !== column) {
      return "";
    }

    return sortOrderParam === "asc" ? " \u2191" : " \u2193";
  };

  return (
    <div className="item-search-page">
      <div className="item-search-page__inner">
        <div className="item-search-page__header">
          <h1 className="item-search-page__title">Inventory Management</h1>

          <div className="staff-dev-back-wrapper">
            <Link href="/staff" className="staff-dev-pill">
              &larr; Back to Staff Hub
            </Link>
          </div>
        </div>

        <div className="item-search-page__controls">
          <div className="item-search-page__search">
            <form onSubmit={handleSearchSubmit}>
              <div className="item-search-page__search-bar">
                <div className="item-search-page__search-input-wrap">
                  <input
                    type="text"
                    placeholder="Search by SKU or Name"
                    className="item-search-page__search-input"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {(searchInput || searchQueryParam) && (
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
                onChange={handleCategoryChange}
                value={categoryParam}
              >
                <option value="all">Category: All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {categoryParam !== "all" && (
                <select
                  className="item-search-page__select"
                  onChange={handleSubcategoryChange}
                  value={subcategoryParam}
                >
                  <option value="all">Subcategory: All</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              )}

              {subcategoryParam !== "all" && (
                <select
                  className="item-search-page__select"
                  onChange={handleTypeChange}
                  value={typeParam}
                >
                  <option value="all">Type: All</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}

              <select
                className="item-search-page__select"
                onChange={handlePageSizeChange}
                value={pageSizeParam}
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="all">All</option>
              </select>

              <button
                type="button"
                className="item-search-page__filter-button"
                onClick={handleClearSort}
                disabled={
                  !sortByParam &&
                  categoryParam === "all" &&
                  pageSizeParam === "20" &&
                  subcategoryParam === "all" &&
                  typeParam === "all"
                }
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="item-search-page__table-wrap">
          <div className="item-search-page__table-scroll">
            <div className="item-search-page__table-content">
              <table className="item-search-page__table">
                <thead className="item-search-page__thead">
                  <tr>
                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "sku"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("sku")}
                      >
                        SKU
                        {getSortIndicator("sku")}
                      </button>
                    </th>

                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "name"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("name")}
                      >
                        Name
                        {getSortIndicator("name")}
                      </button>
                    </th>

                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "category"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("category")}
                      >
                        Category
                        {getSortIndicator("category")}
                      </button>
                    </th>

                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "stock"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("stock")}
                      >
                        Stock
                        {getSortIndicator("stock")}
                      </button>
                    </th>

                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "price"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("price")}
                      >
                        Price
                        {getSortIndicator("price")}
                      </button>
                    </th>

                    <th className="item-search-page__th">
                      <button
                        className={`item-search-page__th-button${
                          sortByParam === "lastModified"
                            ? " item-search-page__th-button--active"
                            : ""
                        }`}
                        onClick={() => handleSortChange("lastModified")}
                      >
                        Last Modified
                        {getSortIndicator("lastModified")}
                      </button>
                    </th>

                    <th className="item-search-page__th">Actions</th>
                  </tr>
                </thead>

                <tbody className="item-search-page__tbody">
                  {catalogItems.map((item) => (
                    <tr key={item.id} className="item-search-page__tr">
                      <td className="item-search-page__td">{item.sku}</td>

                      <td className="item-search-page__td">
                        {formatItemName(item.itemName)}
                      </td>

                      <td className="item-search-page__td">
                        {formatCategoryName(item.category1)}
                      </td>

                      <td className="item-search-page__td">
                        {item.quantityInStock}
                      </td>

                      <td className="item-search-page__td">
                        ${Number(item.price).toFixed(2)}
                      </td>

                      <td className="item-search-page__td">
                        {new Date(item.updatedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="item-search-page__td">
                        <Link
                          href={`/staff/item_edit/${item.id}${currentSearchQueryString ? `?${currentSearchQueryString}` : ""}`}
                          className="item-search-page__edit-link"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  className="item-search-page__pagination-controls"
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <button
                    className="pagination__nav"
                    onClick={() => handlePageChange(0)}
                    disabled={offset === 0}
                  >
                    &lt;&lt;&lt;
                  </button>
                  <button
                    className="pagination__nav"
                    onClick={() => handleJumpByPages(-5)}
                    disabled={offset === 0}
                  >
                    &lt;&lt;
                  </button>
                  <button
                    className="pagination__nav"
                    onClick={() => handlePageChange(offset - pageSize)}
                    disabled={offset === 0}
                  >
                    &lt;
                  </button>
                  <span className="item-search-page__page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="pagination__nav"
                    onClick={() => handlePageChange(offset + pageSize)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </button>
                  <button
                    className="pagination__nav"
                    onClick={() => handleJumpByPages(5)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;&gt;
                  </button>
                  <button
                    className="pagination__nav"
                    onClick={() => handlePageChange(maxOffset)}
                    disabled={currentPage === totalPages}
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
  );
};

const StaffItemSearchPage = () => {
  return (
    <React.Suspense fallback={null}>
      <StaffItemSearchPageContent />
    </React.Suspense>
  );
};

export default StaffItemSearchPage;
