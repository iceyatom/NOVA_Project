"use client";

import { useCallback, useState, type FormEvent } from "react";

export type BrowseImageLibraryEntry = {
  s3Key: string;
  url: string;
  usageCount: number;
  lastLinkedAt: string | null;
  linkedToCatalogItem: boolean;
};

export type BrowseImageReference = {
  imageId: number;
  catalogItemId: number;
  itemName: string;
  sku: string | null;
  sortOrder: number | null;
  linkedAt: string | null;
  itemUpdatedAt: string | null;
};

export type BrowseImageReferencesPayload = {
  s3Key: string;
  url: string;
  references: BrowseImageReference[];
};

type BrowseImageLibraryApiResponse = {
  success?: boolean;
  data?: unknown;
  error?: unknown;
  details?: unknown;
};

type BrowseImageReferencesApiResponse = {
  success?: boolean;
  data?: unknown;
  error?: unknown;
  details?: unknown;
};

type UseImageLibraryBrowserOptions = {
  catalogItemId: number | null;
  isBrowseOpenBlocked?: boolean;
  isBrowseCloseBlocked?: boolean;
  isDetailsCloseBlocked?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseBrowseImageLibrary(data: unknown): BrowseImageLibraryEntry[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry): BrowseImageLibraryEntry | null => {
      const record = asRecord(entry);
      if (!record) return null;

      const s3Key = getNullableString(record.s3Key)?.trim() ?? "";
      const url = getNullableString(record.url)?.trim() ?? "";

      if (!s3Key || !url) {
        return null;
      }

      const usageCount = getNullableNumber(record.usageCount);

      return {
        s3Key,
        url,
        usageCount:
          usageCount == null ? 0 : Math.max(0, Math.trunc(usageCount)),
        lastLinkedAt: getNullableString(record.lastLinkedAt),
        linkedToCatalogItem: record.linkedToCatalogItem === true,
      };
    })
    .filter((entry): entry is BrowseImageLibraryEntry => entry !== null);
}

function parseBrowseImageReferencesPayload(
  data: unknown,
): BrowseImageReferencesPayload | null {
  const record = asRecord(data);
  if (!record) {
    return null;
  }

  const s3Key = getNullableString(record.s3Key)?.trim() ?? "";
  const url = getNullableString(record.url)?.trim() ?? "";
  const referencesValue = record.references;

  if (!s3Key || !url || !Array.isArray(referencesValue)) {
    return null;
  }

  const references = referencesValue
    .map((entry): BrowseImageReference | null => {
      const reference = asRecord(entry);
      if (!reference) return null;

      const imageId = getNullableNumber(reference.imageId);
      const catalogItemId = getNullableNumber(reference.catalogItemId);
      const itemName = getNullableString(reference.itemName)?.trim() ?? "";
      const sku = getNullableString(reference.sku);

      if (imageId == null || catalogItemId == null || !itemName) {
        return null;
      }

      return {
        imageId,
        catalogItemId,
        itemName,
        sku,
        sortOrder: getNullableNumber(reference.sortOrder),
        linkedAt: getNullableString(reference.linkedAt),
        itemUpdatedAt: getNullableString(reference.itemUpdatedAt),
      };
    })
    .filter((entry): entry is BrowseImageReference => entry !== null);

  return {
    s3Key,
    url,
    references,
  };
}

export default function useImageLibraryBrowser({
  catalogItemId,
  isBrowseOpenBlocked = false,
  isBrowseCloseBlocked = false,
  isDetailsCloseBlocked = false,
}: UseImageLibraryBrowserOptions) {
  const [isBrowseImagesPopupOpen, setIsBrowseImagesPopupOpen] =
    useState<boolean>(false);
  const [browseImages, setBrowseImages] = useState<BrowseImageLibraryEntry[]>(
    [],
  );
  const [browseItemSearchInput, setBrowseItemSearchInput] =
    useState<string>("");
  const [browseItemSearchQuery, setBrowseItemSearchQuery] =
    useState<string>("");
  const [isLoadingBrowseImages, setIsLoadingBrowseImages] =
    useState<boolean>(false);
  const [browseImagesError, setBrowseImagesError] = useState<string | null>(
    null,
  );
  const [isBrowseImageDetailsOpen, setIsBrowseImageDetailsOpen] =
    useState<boolean>(false);
  const [browseImageDetails, setBrowseImageDetails] =
    useState<BrowseImageReferencesPayload | null>(null);
  const [isLoadingBrowseImageDetails, setIsLoadingBrowseImageDetails] =
    useState<boolean>(false);
  const [browseImageDetailsError, setBrowseImageDetailsError] = useState<
    string | null
  >(null);

  const loadBrowseImages = useCallback(
    async (nextQuery?: string) => {
      const normalizedQuery = (nextQuery ?? browseItemSearchQuery)
        .trim()
        .replace(/\s+/g, " ");

      setIsLoadingBrowseImages(true);
      setBrowseImagesError(null);

      try {
        const params = new URLSearchParams({
          limit: "180",
        });

        if (catalogItemId != null && catalogItemId > 0) {
          params.set("catalogItemId", String(catalogItemId));
        }

        if (normalizedQuery) {
          params.set("query", normalizedQuery);
        }

        const response = await fetch(`/api/catalog/staff/images?${params}`, {
          cache: "no-store",
        });

        const result = (await response.json()) as BrowseImageLibraryApiResponse;

        if (!response.ok || result?.success === false) {
          const message =
            typeof result?.error === "string"
              ? result.error
              : `Failed to load image library (HTTP ${response.status}).`;
          const details =
            typeof result?.details === "string" ? ` ${result.details}` : "";
          throw new Error(`${message}${details}`.trim());
        }

        setBrowseImages(parseBrowseImageLibrary(result.data));
      } catch (error) {
        setBrowseImages([]);
        setBrowseImagesError(
          error instanceof Error
            ? error.message
            : "Failed to load image library.",
        );
      } finally {
        setIsLoadingBrowseImages(false);
      }
    },
    [browseItemSearchQuery, catalogItemId],
  );

  const openBrowseImagesPopup = useCallback(async () => {
    if (isBrowseOpenBlocked) {
      return;
    }

    setBrowseItemSearchInput("");
    setBrowseItemSearchQuery("");
    setBrowseImagesError(null);
    setIsBrowseImagesPopupOpen(true);
    await loadBrowseImages("");
  }, [isBrowseOpenBlocked, loadBrowseImages]);

  const closeBrowseImagesPopup = useCallback(() => {
    if (isBrowseCloseBlocked) {
      return;
    }

    setIsBrowseImagesPopupOpen(false);
    setIsBrowseImageDetailsOpen(false);
    setBrowseImageDetails(null);
    setBrowseImageDetailsError(null);
    setIsLoadingBrowseImageDetails(false);
  }, [isBrowseCloseBlocked]);

  const openBrowseImageDetails = useCallback(
    async (entry: BrowseImageLibraryEntry) => {
      const key = entry.s3Key.trim();
      if (!key) {
        return;
      }

      setIsBrowseImageDetailsOpen(true);
      setBrowseImageDetailsError(null);
      setIsLoadingBrowseImageDetails(true);
      setBrowseImageDetails({
        s3Key: key,
        url: entry.url,
        references: [],
      });

      try {
        const params = new URLSearchParams({
          s3Key: key,
        });

        if (catalogItemId != null && catalogItemId > 0) {
          params.set("catalogItemId", String(catalogItemId));
        }

        const response = await fetch(`/api/catalog/staff/images?${params}`, {
          cache: "no-store",
        });
        const result =
          (await response.json()) as BrowseImageReferencesApiResponse;

        if (!response.ok || result?.success === false) {
          const message =
            typeof result?.error === "string"
              ? result.error
              : `Failed to load image references (HTTP ${response.status}).`;
          const details =
            typeof result?.details === "string" ? ` ${result.details}` : "";
          throw new Error(`${message}${details}`.trim());
        }

        const payload = parseBrowseImageReferencesPayload(result.data);
        if (!payload) {
          throw new Error(
            "Image reference response was missing required data.",
          );
        }

        setBrowseImageDetails(payload);
      } catch (error) {
        setBrowseImageDetailsError(
          error instanceof Error
            ? error.message
            : "Failed to load image references.",
        );
      } finally {
        setIsLoadingBrowseImageDetails(false);
      }
    },
    [catalogItemId],
  );

  const closeBrowseImageDetailsPopup = useCallback(() => {
    if (isDetailsCloseBlocked) {
      return;
    }

    setIsBrowseImageDetailsOpen(false);
    setBrowseImageDetailsError(null);
  }, [isDetailsCloseBlocked]);

  const handleBrowseItemSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const normalizedQuery = browseItemSearchInput.trim().replace(/\s+/g, " ");
      setBrowseItemSearchQuery(normalizedQuery);
      void loadBrowseImages(normalizedQuery);
    },
    [browseItemSearchInput, loadBrowseImages],
  );

  const handleClearBrowseItemSearch = useCallback(() => {
    setBrowseItemSearchInput("");
    setBrowseItemSearchQuery("");
    void loadBrowseImages("");
  }, [loadBrowseImages]);

  return {
    isBrowseImagesPopupOpen,
    browseImages,
    setBrowseImages,
    browseItemSearchInput,
    setBrowseItemSearchInput,
    browseItemSearchQuery,
    isLoadingBrowseImages,
    browseImagesError,
    setBrowseImagesError,
    isBrowseImageDetailsOpen,
    browseImageDetails,
    setBrowseImageDetails,
    isLoadingBrowseImageDetails,
    browseImageDetailsError,
    setBrowseImageDetailsError,
    openBrowseImagesPopup,
    closeBrowseImagesPopup,
    loadBrowseImages,
    openBrowseImageDetails,
    closeBrowseImageDetailsPopup,
    handleBrowseItemSearchSubmit,
    handleClearBrowseItemSearch,
  };
}
