"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

// Mapping between UI price labels and API keys
const PRICE_LABEL_TO_KEY: Record<string, string> = {
  "Under $50": "under-50",
  "$50–$99": "50-99",
  "$100–$249": "100-249",
  "$250+": "250-plus",
};
const PRICE_KEY_TO_LABEL: Record<string, string> = {
  "under-50": "Under $50",
  "50-99": "$50–$99",
  "100-249": "$100–$249",
  "250-plus": "$250+",
};

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
  if (!value) {
    return fallback;
  }
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseListParam(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeForCompare(values: string[]) {
  const normalized = values.map((v) => v.trim()).filter(Boolean);

  return Array.from(new Set(normalized)).sort().join("|");
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

  // URL is the "single source of truth"
  const catalogState = useMemo(() => {
    const query = (searchParams.get("q") ?? "").trim();
    const categories = parseListParam(searchParams.get("categories"));

    const priceKeys = parseListParam(searchParams.get("priceBuckets"));
    const prices = priceKeys
      .map((key) => PRICE_KEY_TO_LABEL[key])
      .filter((value): value is string => Boolean(value));

    const page = Math.max(1, parseNumberParam(searchParams.get("page"), 1));
    const pageSize = Math.max(
      1,
      parseNumberParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    );

    return { query, categories, prices, page, pageSize };
  }, [searchParams]);

  const searchText = catalogState.query;
  const selectedCategories = catalogState.categories;
  const selectedPrices = catalogState.prices;
  const currentPage = catalogState.page;
  const pageSize = catalogState.pageSize;

  const navigateWithSearchParams = useCallback(
    (
      updater: (params: URLSearchParams) => void,
      options?: { replace?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      updater(next);

      // Keep URLs tidy by omitting defaults
      if (next.get("page") === "1") {
        next.delete("page");
      }
      if (next.get("pageSize") === String(DEFAULT_PAGE_SIZE)) {
        next.delete("pageSize");
      }

      const queryString = next.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;

      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / pageSize)),
    [pageSize, totalCount],
  );

  useEffect(() => {
    if (!hasLoadedOnce) {
      return;
    }
    if (isLoading) {
      return;
    }
    if (errorMessage) {
      return;
    }
    if (currentPage <= totalPages) {
      return;
    }

    navigateWithSearchParams(
      (params) => {
        params.set("page", String(totalPages));
      },
      { replace: true },
    );
  }, [
    currentPage,
    errorMessage,
    hasLoadedOnce,
    isLoading,
    navigateWithSearchParams,
    totalPages,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCatalog = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Convert selectedPrices (UI labels) to API keys for API call
        const priceBucketKeys = selectedPrices
          .map((label) => PRICE_LABEL_TO_KEY[label])
          .filter((value): value is string => Boolean(value));
        const params = buildCatalogParams({
          page: currentPage,
          pageSize,
          query: searchText,
          categories: selectedCategories,
          priceBuckets: priceBucketKeys,
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
        const payload = normalizeCatalogPayload(
          parsed,
          pageSize,
          expectedOffset,
        );

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
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setErrorMessage(message);
        setItems([]);
        setTotalCount(0);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };

    void loadCatalog();

    return () => controller.abort();
  }, [currentPage, pageSize, searchText, selectedCategories, selectedPrices]);

  const handleSearch = (query: string) => {
    const nextQuery = query.trim();

    if (nextQuery === searchText) {
      return;
    }

    navigateWithSearchParams((params) => {
      if (nextQuery) {
        params.set("q", nextQuery);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
    });
  };

  const handleFiltersChange = (next: {
    categories: string[];
    prices: string[];
  }) => {
    const sameCategories =
      normalizeForCompare(next.categories) ===
      normalizeForCompare(selectedCategories);
    const samePrices =
      normalizeForCompare(next.prices) === normalizeForCompare(selectedPrices);
    if (sameCategories && samePrices) {
      return;
    }

    navigateWithSearchParams((params) => {
      if (next.categories.length > 0) {
        params.set("categories", next.categories.join(","));
      } else {
        params.delete("categories");
      }

      const priceBucketKeys = next.prices
        .map((label) => PRICE_LABEL_TO_KEY[label])
        .filter((value): value is string => Boolean(value));

      if (priceBucketKeys.length > 0) {
        params.set("priceBuckets", priceBucketKeys.join(","));
      } else {
        params.delete("priceBuckets");
      }

      params.set("page", "1");
    });
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, page);
    if (nextPage === currentPage) {
      return;
    }
    navigateWithSearchParams((params) => {
      params.set("page", String(nextPage));
    });
  };

  const handlePageSizeChange = (size: number) => {
    if (size === pageSize) {
      return;
    }
    navigateWithSearchParams((params) => {
      params.set("pageSize", String(size));
      params.set("page", String(1));
    });
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

        <aside
          id="context"
          aria-label="Context panel"
          className="catalog-pane catalog-pane-right"
        />
      </div>
    </main>
  );
}
