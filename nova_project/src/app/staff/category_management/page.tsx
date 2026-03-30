"use client";

import Link from "next/link";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type CategoryApiResponse = {
  categories?: unknown;
};

type SubcategoryApiResponse = {
  subcategories?: unknown;
};

type TypeApiResponse = {
  types?: unknown;
};

type HierarchyListPayload = Partial<
  Record<"categories" | "subcategories" | "types", unknown>
>;

const PAGE_SIZE = 10;

function parseStringArray(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((entry): entry is string => typeof entry === "string");
}

function getTotalPages(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / PAGE_SIZE));
}

function changePage(
  setPage: Dispatch<SetStateAction<number>>,
  totalPages: number,
  pageDelta: number,
) {
  setPage((current) => Math.min(totalPages, Math.max(1, current + pageDelta)));
}

function fetchListKey(
  payload: HierarchyListPayload,
  key: "categories" | "subcategories" | "types",
): string[] {
  return parseStringArray(payload[key]);
}

function TablePagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="category-mgmt-pagination-controls">
      <button
        className="pagination__nav"
        onClick={() => setPage(1)}
        disabled={page === 1}
      >
        &lt;&lt;&lt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, -5)}
        disabled={page === 1}
      >
        &lt;&lt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, -1)}
        disabled={page === 1}
      >
        &lt;
      </button>
      <span className="item-search-page__page-info">
        Page {page} of {totalPages}
      </span>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, 1)}
        disabled={page === totalPages}
      >
        &gt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, 5)}
        disabled={page === totalPages}
      >
        &gt;&gt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      >
        &gt;&gt;&gt;
      </button>
    </div>
  );
}

export default function StaffCategoryManagementPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [categoryPage, setCategoryPage] = useState(1);
  const [subcategoryPage, setSubcategoryPage] = useState(1);
  const [typePage, setTypePage] = useState(1);

  useEffect(() => {
    let disposed = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/catalog/categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load categories.");
        }

        const payload = (await response.json()) as CategoryApiResponse;
        const nextCategories = fetchListKey(payload, "categories");

        if (disposed) {
          return;
        }

        setCategories(nextCategories);
      } catch {
        if (!disposed) {
          setLoadError("Failed to load category hierarchy.");
        }
      } finally {
        if (!disposed) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      setTypes([]);
      setSelectedType(null);
      setSubcategoriesLoading(false);
      return;
    }

    const loadSubcategories = async () => {
      setSubcategoriesLoading(true);
      setSelectedSubcategory(null);
      setSelectedType(null);
      setTypes([]);

      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(selectedCategory)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load subcategories.");
        }

        const payload = (await response.json()) as SubcategoryApiResponse;
        const nextSubcategories = fetchListKey(payload, "subcategories");

        if (!disposed) {
          setSubcategories(nextSubcategories);
        }
      } catch {
        if (!disposed) {
          setSubcategories([]);
        }
      } finally {
        if (!disposed) {
          setSubcategoriesLoading(false);
          setSubcategoryPage(1);
          setTypePage(1);
        }
      }
    };

    loadSubcategories();

    return () => {
      disposed = true;
    };
  }, [selectedCategory]);

  useEffect(() => {
    let disposed = false;

    if (!selectedCategory || !selectedSubcategory) {
      setTypes([]);
      setSelectedType(null);
      setTypesLoading(false);
      return;
    }

    const loadTypes = async () => {
      setTypesLoading(true);
      setSelectedType(null);

      try {
        const response = await fetch(
          `/api/catalog/staff/types?category=${encodeURIComponent(selectedCategory)}&subcategory=${encodeURIComponent(selectedSubcategory)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load types.");
        }

        const payload = (await response.json()) as TypeApiResponse;
        const nextTypes = fetchListKey(payload, "types");

        if (!disposed) {
          setTypes(nextTypes);
        }
      } catch {
        if (!disposed) {
          setTypes([]);
        }
      } finally {
        if (!disposed) {
          setTypesLoading(false);
          setTypePage(1);
        }
      }
    };

    loadTypes();

    return () => {
      disposed = true;
    };
  }, [selectedCategory, selectedSubcategory]);

  const categoryTotalPages = getTotalPages(categories.length);
  const subcategoryTotalPages = getTotalPages(subcategories.length);
  const typeTotalPages = getTotalPages(types.length);

  useEffect(() => {
    setCategoryPage((current) => Math.min(current, categoryTotalPages));
  }, [categoryTotalPages]);

  useEffect(() => {
    setSubcategoryPage((current) => Math.min(current, subcategoryTotalPages));
  }, [subcategoryTotalPages]);

  useEffect(() => {
    setTypePage((current) => Math.min(current, typeTotalPages));
  }, [typeTotalPages]);

  const pagedCategories = categories.slice(
    (categoryPage - 1) * PAGE_SIZE,
    categoryPage * PAGE_SIZE,
  );
  const pagedSubcategories = subcategories.slice(
    (subcategoryPage - 1) * PAGE_SIZE,
    subcategoryPage * PAGE_SIZE,
  );
  const pagedTypes = types.slice(
    (typePage - 1) * PAGE_SIZE,
    typePage * PAGE_SIZE,
  );

  return (
    <div>
      <div className="staffTitle">Category Management</div>
      <div className="staffSubtitle">
        Manage top-level categories, subcategories, and item types from one
        place.
      </div>
      {loadError && <div className="staffCardHint">{loadError}</div>}

      <div className="staffGrid">
        <div className="staffCard col4 category-mgmt-panel">
          <div className="staffCardLabel">Category (Level 3)</div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : categories.length ? (
                  pagedCategories.map((name) => (
                    <tr
                      key={name}
                      className={`category-mgmt-tr ${selectedCategory === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <Link
                          href={`/staff/category_management?level=category3&name=${encodeURIComponent(name)}`}
                          className="item-search-page__edit-link"
                          onClick={(event) => {
                            event.preventDefault();
                            if (selectedCategory === name) {
                              setSelectedCategory(null);
                              setSelectedSubcategory(null);
                              setSelectedType(null);
                              setSubcategoryPage(1);
                              setTypePage(1);
                              return;
                            }

                            setSelectedCategory(name);
                            setSelectedSubcategory(null);
                            setSelectedType(null);
                            setSubcategoryPage(1);
                            setTypePage(1);
                          }}
                        >
                          Select
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={categoryPage}
            totalPages={categoryTotalPages}
            setPage={setCategoryPage}
          />
        </div>

        <div className="staffCard col4 category-mgmt-panel">
          <div className="staffCardLabel">Subcategory (Level 2)</div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedCategory ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Select a category to view subcategories.
                    </td>
                  </tr>
                ) : subcategoriesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : subcategories.length ? (
                  pagedSubcategories.map((name) => (
                    <tr
                      key={`${selectedCategory}::${name}`}
                      className={`category-mgmt-tr ${selectedSubcategory === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <Link
                          href={`/staff/category_management?level=category2&category3=${encodeURIComponent(selectedCategory)}&name=${encodeURIComponent(name)}`}
                          className="item-search-page__edit-link"
                          onClick={(event) => {
                            event.preventDefault();
                            if (selectedSubcategory === name) {
                              setSelectedSubcategory(null);
                              setSelectedType(null);
                              setTypePage(1);
                              return;
                            }

                            setSelectedSubcategory(name);
                            setSelectedType(null);
                            setTypePage(1);
                          }}
                        >
                          Select
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No subcategories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={subcategoryPage}
            totalPages={subcategoryTotalPages}
            setPage={setSubcategoryPage}
          />
        </div>

        <div className="staffCard col4 category-mgmt-panel">
          <div className="staffCardLabel">Type (Level 1)</div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedCategory || !selectedSubcategory ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Select a subcategory to view types.
                    </td>
                  </tr>
                ) : typesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : types.length ? (
                  pagedTypes.map((name) => (
                    <tr
                      key={`${selectedCategory}::${selectedSubcategory}::${name}`}
                      className={`category-mgmt-tr ${selectedType === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <Link
                          href={`/staff/category_management?level=category1&category3=${encodeURIComponent(selectedCategory)}&category2=${encodeURIComponent(selectedSubcategory)}&name=${encodeURIComponent(name)}`}
                          className="item-search-page__edit-link"
                          onClick={(event) => {
                            event.preventDefault();
                            if (selectedType === name) {
                              setSelectedType(null);
                              return;
                            }

                            setSelectedType(name);
                          }}
                        >
                          Select
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={typePage}
            totalPages={typeTotalPages}
            setPage={setTypePage}
          />
        </div>
      </div>
    </div>
  );
}
