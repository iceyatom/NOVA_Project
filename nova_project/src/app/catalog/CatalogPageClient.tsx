"use client";

import { useEffect, useMemo, useState } from "react";

import ItemCard from "../components/ItemCard";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";
import CatalogPagination from "../components/CatalogPagination";
import APIError from "./APIError";

type Item = {
  id: number | null;
  sku: string | null;
  itemName: string | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  description: string | null;
  price: number | null;
  unitOfMeasure: string | null;
  quantity: number | null;
  imageUrl: string | null;
  quantityInStock: number | null;
};

type CatalogResponse = {
  success: boolean;
  data: Item[];
  count: number;
  totalCount: number;
  limit: number;
  offset: number;
  error?: string;
};

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100];

function buildCatalogParams(options: {
  page: number;
  pageSize: number;
  query: string;
  categories: string[];
  priceBuckets: string[];
}) {
  const params = new URLSearchParams();
  params.set("limit", String(options.pageSize));
  params.set("offset", String((options.page - 1) * options.pageSize));

  if (options.query) {
    params.set("q", options.query);
  }

  if (options.categories.length > 0) {
    params.set("categories", options.categories.join(","));
  }

  if (options.priceBuckets.length > 0) {
    params.set("priceBuckets", options.priceBuckets.join(","));
  }

  return params;
}

export default function CatalogPageClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [totalCount, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = buildCatalogParams({
          page: currentPage,
          pageSize,
          query: searchText,
          categories: selectedCategories,
          priceBuckets: selectedPrices,
        });

        const response = await fetch(`/api/catalog?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Catalog request failed (${response.status})`);
        }

        const payload = (await response.json()) as CatalogResponse;

        if (!payload.success) {
          throw new Error(payload.error ?? "Catalog request failed");
        }

        const normalizedItems =
          payload.data?.map((item) => ({
            ...item,
            price: item.price === null ? null : Number(item.price),
          })) ?? [];

        setItems(normalizedItems);
        setTotalCount(payload.totalCount ?? 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setErrorMessage(message);
        setItems([]);
        setTotalCount(0);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadCatalog();

    return () => controller.abort();
  }, [currentPage, pageSize, searchText, selectedCategories, selectedPrices]);

  const handleSearch = (query: string) => {
    setSearchText(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (next: {
    categories: string[];
    prices: string[];
  }) => {
    setSelectedCategories(next.categories);
    setSelectedPrices(next.prices);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <main aria-label="Catalog Layout">
      {/* HERO search banner directly under the header */}
      <SearchBar bgImage="/hero-lab.jpg" onSearch={handleSearch} />

      {errorMessage && (
        <APIError
          title="Failed to load catalog data."
          message="Please try again."
          apiStatus={errorMessage}
        />
      )}

      <div className="catalog-three-pane">
        {/* Left Pane */}
        <aside
          id="filters"
          aria-label="Filter panel"
          className="catalog-pane catalog-pane-left"
        >
          <h2 className="pane-title">Filters</h2>
          <Filters
            selectedCategories={selectedCategories}
            selectedPrices={selectedPrices}
            onChange={handleFiltersChange}
          />
        </aside>

        {/* Center Pane */}
        <section
          id="catalog"
          aria-label="Catalog items"
          className="catalog-pane catalog-pane-center"
        >
          <h1 style={{ margin: "0 0 1rem 0" }}>Catalog</h1>

          {isLoading && (
            <p
              role="status"
              aria-live="polite"
              style={{ margin: "0 0 1rem 0" }}
            >
              Loading catalog items...
            </p>
          )}

          {!isLoading && items.length === 0 && (
            <p role="status" style={{ margin: "0 0 1rem 0" }}>
              No items match your current filters or search.
            </p>
          )}

          <div className="catalog-grid" aria-busy={isLoading}>
            {items.map((item, index) => (
              <ItemCard key={item.id ?? `item-${index}`} item={item} />
            ))}
          </div>

          <CatalogPagination
            totalItems={totalCount}
            initialPageSize={DEFAULT_PAGE_SIZE}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </section>

        {/* Right Pane */}
        <aside
          id="context"
          aria-label="Context panel"
          className="catalog-pane catalog-pane-right"
        />
      </div>
    </main>
  );
}
