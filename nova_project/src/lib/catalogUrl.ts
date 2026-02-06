// src/lib/catalogUrl.ts
// Utilities for building catalog URLs with preserved state parameters

export type CatalogState = {
  search?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  page?: number | null;
  pageSize?: number | null;
};

/**
 * Builds a catalog URL with the given state preserved as query parameters
 * @param state The catalog state to preserve
 * @returns URL string like "/catalog?search=kit&category1=Kits&page=1"
 */
export function buildCatalogUrl(state: CatalogState): string {
  const params = new URLSearchParams();

  if (state.search) params.append("search", state.search);
  if (state.category1) params.append("category1", state.category1);
  if (state.category2) params.append("category2", state.category2);
  if (state.category3) params.append("category3", state.category3);
  if (state.page) params.append("page", String(state.page));
  if (state.pageSize) params.append("pageSize", String(state.pageSize));

  const queryString = params.toString();
  return `/catalog${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds a product page URL with catalog state preserved for back navigation
 * @param itemId The product item ID
 * @param state The catalog state to preserve for back navigation
 * @returns URL string like "/catalog/123?search=kit&category1=Kits"
 */
export function buildProductUrl(itemId: number, state: CatalogState): string {
  const params = new URLSearchParams();

  if (state.search) params.append("search", state.search);
  if (state.category1) params.append("category1", state.category1);
  if (state.category2) params.append("category2", state.category2);
  if (state.category3) params.append("category3", state.category3);
  if (state.page) params.append("page", String(state.page));
  if (state.pageSize) params.append("pageSize", String(state.pageSize));

  const queryString = params.toString();
  return `/catalog/${itemId}${queryString ? `?${queryString}` : ""}`;
}

/**
 * Parses catalog state from search parameters
 * @param searchParams The URL search parameters object
 * @returns Parsed CatalogState
 */
export function parseCatalogState(searchParams: {
  search?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  page?: string;
  pageSize?: string;
}): CatalogState {
  return {
    search: searchParams.search?.trim() || null,
    category1: searchParams.category1?.trim() || null,
    category2: searchParams.category2?.trim() || null,
    category3: searchParams.category3?.trim() || null,
    page: searchParams.page ? parseInt(searchParams.page, 10) : null,
    pageSize: searchParams.pageSize ? parseInt(searchParams.pageSize, 10) : null,
  };
}
