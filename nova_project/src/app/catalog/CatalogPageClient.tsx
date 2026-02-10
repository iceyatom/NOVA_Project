"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

type ViewState = "loading" | "ready" | "dbError";

// Fallback items to display when database connection fails
const FALLBACK_ITEMS: Item[] = [
  {
    id: null,
    sku: null,
    itemName: "Dissecting Kit 1-9 - Each",
    category1: "Specimens",
    category2: "Dissecting Kits",
    category3: "Basic",
    description:
      "Basic dissecting kit for students in grades 1-9. Currently unavailable due to connection issues.",
    price: null,
    unitOfMeasure: null,
    quantity: null,
    imageUrl: "/FillerImage.webp",
    quantityInStock: 0,
  },
  {
    id: null,
    sku: null,
    itemName: "Dissecting Kit 10+ - Each",
    category1: "Specimens",
    category2: "Dissecting Kits",
    category3: "Advanced",
    description:
      "Advanced dissecting kit for students in grades 10 and above. Currently unavailable due to connection issues.",
    price: null,
    unitOfMeasure: null,
    quantity: null,
    imageUrl: "/FillerImage.webp",
    quantityInStock: 0,
  },
  {
    id: null,
    sku: null,
    itemName: "Intermediate Dissecting Kit 1-9 - Each",
    category1: "Specimens",
    category2: "Dissecting Kits",
    category3: "Intermediate",
    description:
      "Intermediate level dissecting kit for students in grades 1-9. Currently unavailable due to connection issues.",
    price: null,
    unitOfMeasure: null,
    quantity: null,
    imageUrl: "/FillerImage.webp",
    quantityInStock: 0,
  },
];

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

function buildCatalogSearchParams(options: {
  page: number;
  pageSize: number;
  query: string;
  categories: string[];
  priceBuckets: string[];
}) {
  const params = new URLSearchParams();

  params.set("page", String(options.page));
  params.set("pageSize", String(options.pageSize));

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


type ApiGatewayProxyLike = {
  body: string;
  statusCode?: number;
  headers?: Record<string, string>;
  isBase64Encoded?: boolean;
};

function hasStringBody(value: unknown): value is ApiGatewayProxyLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "body" in value &&
    typeof (value as Record<string, unknown>).body === "string"
  );
}

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}


function normalizeCatalogPayload(
  parsed: unknown,
  pageSize: number,
  offset: number,
): CatalogResponse {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "success" in parsed &&
    "data" in parsed
  ) {
    return parsed as CatalogResponse;
  }

  if (Array.isArray(parsed)) {
    return {
      success: true,
      data: parsed as Item[],
      count: parsed.length,
      totalCount: Math.max(offset + parsed.length, parsed.length),
      limit: pageSize,
      offset,
    };
  }

  return {
    success: false,
    data: [],
    count: 0,
    totalCount: 0,
    limit: pageSize,
    offset,
    error: "Catalog request returned an unexpected response format.",
  };
}

export default function CatalogPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCategories = parseListParam(searchParams.get("categories"));
  const initialPrices = parseListParam(searchParams.get("priceBuckets"));
  const initialPage = parseNumberParam(searchParams.get("page"), 1);
  const initialPageSize = parseNumberParam(
    searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
  );

  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [selectedPrices, setSelectedPrices] = useState<string[]>(initialPrices);
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
    const nextQuery = searchParams.get("q") ?? "";
    const nextCategories = parseListParam(searchParams.get("categories"));
    const nextPrices = parseListParam(searchParams.get("priceBuckets"));
    const nextPage = parseNumberParam(searchParams.get("page"), 1);
    const nextPageSize = parseNumberParam(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
    );

    setSearchText(nextQuery);
    setSelectedCategories(nextCategories);
    setSelectedPrices(nextPrices);
    setCurrentPage(nextPage);
    setPageSize(nextPageSize);
  }, [searchParams]);

  useEffect(() => {
    const nextParams = buildCatalogSearchParams({
      page: currentPage,
      pageSize,
      query: searchText,
      categories: selectedCategories,
      priceBuckets: selectedPrices,
    });
    const nextQueryString = nextParams.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      const href = nextQueryString
        ? `${pathname}?${nextQueryString}`
        : pathname;
      router.replace(href, { scroll: false });
    }
  }, [
    currentPage,
    pageSize,
    pathname,
    router,
    searchParams,
    searchText,
    selectedCategories,
    selectedPrices,
  ]);

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

        const raw: unknown = await response.json();
        const parsed: unknown = hasStringBody(raw) ? JSON.parse(raw.body) : raw;

        const expectedOffset = (currentPage - 1) * pageSize;
        const payload = normalizeCatalogPayload(parsed, pageSize, expectedOffset);

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
        const message = error instanceof Error ? error.message : "Unknown error";
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

  const handleFiltersChange = (next: { categories: string[]; prices: string[] }) => {
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
      <SearchBar
        bgImage="/hero-lab.jpg"
        query={searchText}
        onSearch={handleSearch}
      />

      {errorMessage && (
        <APIError
          title="Failed to load catalog data."
          message="Please try again."
          apiStatus={errorMessage}
        />
      )}

      <div className="catalog-three-pane">
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

        <section
          id="catalog"
          aria-label="Catalog items"
          className="catalog-pane catalog-pane-center"
        >
          <h1 style={{ margin: "0 0 1rem 0" }}>Catalog</h1>

          {isLoading && (
            <p role="status" aria-live="polite" style={{ margin: "0 0 1rem 0" }}>
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

        <aside
          id="context"
          aria-label="Context panel"
          className="catalog-pane catalog-pane-right"
        />
      </div>
    </main>
  );
}