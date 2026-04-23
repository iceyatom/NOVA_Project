"use client";

import Link from "next/link";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CategoryCombo from "@/app/components/CategoryCombo";
import ImageUpload from "@/app/components/ImageUpload";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";
import useImageLibraryBrowser, {
  type BrowseImageLibraryEntry,
  type BrowseImageReference,
} from "@/app/hooks/useImageLibraryBrowser";
import CategoryCreateModal, {
  type CategoryLevel,
} from "@/app/components/CategoryCreateModal";

type ItemImage = {
  id: number | null;
  s3Key: string | null;
  sortOrder: number | null;
  url: string;
  createdAt: string | null;
  pendingUploadId?: string | null;
};

type ItemClassification = {
  category3: string | null;
  category2: string | null;
  category1: string | null;
};

type Item = {
  id: number | null;
  sku: string | null;
  itemName: string | null;
  price: number | null;
  category3: string | null;
  category2: string | null;
  category1: string | null;
  classifications: ItemClassification[];
  description: string | null;
  images: ItemImage[];
  quantityInStock: number | null;
  unitOfMeasure: string | null;
  storageLocation: string | null;
  storageConditions: string | null;
  expirationDate: string | null;
  dateAcquired: string | null;
  reorderLevel: number | null;
  unitCost: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CatalogApiResponse = {
  success: boolean;
  data: unknown;
};

type LinkImageApiResponse = {
  success?: boolean;
  data?: {
    id?: unknown;
    catalogItemId?: unknown;
    s3Key?: unknown;
    sortOrder?: unknown;
    createdAt?: unknown;
  };
  alreadyLinked?: unknown;
  error?: unknown;
  details?: unknown;
};

type PresignedUrlResponse = {
  success?: boolean;
  presignedUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  error?: string;
};

type PendingLocalUpload = {
  file: File;
  previewUrl: string;
};

type PendingReferenceDelete = {
  reference: BrowseImageReference;
  key: string;
};

type PendingBrowseImageDelete = {
  entry: BrowseImageLibraryEntry;
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
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseCatalogImages(raw: Record<string, unknown>): ItemImage[] {
  const imagesValue = raw.images;
  if (Array.isArray(imagesValue)) {
    const parsedImages = imagesValue
      .map((entry): ItemImage | null => {
        const image = asRecord(entry);
        if (!image) return null;

        const url =
          getNullableString(image.url) ??
          getNullableString(image.fileUrl) ??
          null;

        if (!url) return null;

        return {
          id: getNullableNumber(image.id),
          s3Key: getNullableString(image.s3Key),
          sortOrder: getNullableNumber(image.sortOrder),
          url,
          createdAt: getNullableString(image.createdAt),
          pendingUploadId: null,
        };
      })
      .filter((entry): entry is ItemImage => entry !== null);

    if (parsedImages.length > 0) {
      return parsedImages;
    }
  }

  const legacyImageUrls = raw.imageUrls;

  if (Array.isArray(legacyImageUrls)) {
    const urls = legacyImageUrls.filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.trim() !== "",
    );

    if (urls.length > 0) {
      return urls.map((url) => ({
        id: null,
        s3Key: null,
        sortOrder: null,
        url,
        createdAt: null,
        pendingUploadId: null,
      }));
    }
  }

  const imageUrlsString = getNullableString(legacyImageUrls);
  if (imageUrlsString) {
    const urls = imageUrlsString
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (urls.length > 0) {
      return urls.map((url) => ({
        id: null,
        s3Key: null,
        sortOrder: null,
        url,
        createdAt: null,
        pendingUploadId: null,
      }));
    }
  }

  return [
    {
      id: null,
      s3Key: null,
      sortOrder: null,
      url: "/FillerImage.webp",
      createdAt: null,
      pendingUploadId: null,
    },
  ];
}

function parseItemClassifications(
  raw: Record<string, unknown>,
): ItemClassification[] {
  const fallback: ItemClassification[] =
    getNullableString(raw.category3) ||
    getNullableString(raw.category2) ||
    getNullableString(raw.category1)
      ? [
          {
            category3: getNullableString(raw.category3),
            category2: getNullableString(raw.category2),
            category1: getNullableString(raw.category1),
          },
        ]
      : [];

  const rawClassifications = raw.classifications;
  if (!Array.isArray(rawClassifications)) {
    return fallback;
  }

  const parsed = rawClassifications
    .map((entry): ItemClassification | null => {
      const record = asRecord(entry);
      if (!record) return null;

      const category3 = getNullableString(record.category3);
      const category2 = getNullableString(record.category2);
      const category1 = getNullableString(record.category1);
      if (!category3 && !category2 && !category1) {
        return null;
      }

      return {
        category3,
        category2,
        category1,
      };
    })
    .filter((entry): entry is ItemClassification => entry !== null);

  return parsed.length > 0 ? parsed : fallback;
}

function parseCatalogItem(data: unknown): Item | null {
  if (Array.isArray(data)) {
    return parseCatalogItem(data[0]);
  }

  const raw = asRecord(data);
  if (!raw) return null;

  const parsedId = getNullableNumber(raw.id);
  if (parsedId === null) return null;

  const category3 = getNullableString(raw.category3);
  const category2 = getNullableString(raw.category2);
  const category1 = getNullableString(raw.category1);

  return {
    id: parsedId,
    sku: getNullableString(raw.sku),
    itemName: getNullableString(raw.itemName),
    price: getNullableNumber(raw.price),
    category3,
    category2,
    category1,
    classifications: parseItemClassifications(raw),
    description: getNullableString(raw.description),
    images: parseCatalogImages(raw),
    quantityInStock: getNullableNumber(raw.quantityInStock),
    unitOfMeasure: getNullableString(raw.unitOfMeasure),
    storageLocation: getNullableString(raw.storageLocation),
    storageConditions: getNullableString(raw.storageConditions),
    expirationDate: getNullableString(raw.expirationDate),
    dateAcquired: getNullableString(raw.dateAcquired),
    reorderLevel: getNullableNumber(raw.reorderLevel),
    unitCost: getNullableNumber(raw.unitCost),
    createdAt: getNullableString(raw.createdAt),
    updatedAt: getNullableString(raw.updatedAt),
  };
}

type ItemClassificationDraft = {
  localId: number;
  category3: string;
  category2: string;
  category1: string;
};

type ItemForm = {
  sku: string;
  itemName: string;
  price: string;
  classifications: ItemClassificationDraft[];
  description: string;
  images: ItemImage[];
  quantityInStock: string;
  unitOfMeasure: string;
  storageLocation: string;
  storageConditions: string;
  expirationDate: string;
  dateAcquired: string;
  reorderLevel: string;
  unitCost: string;
};

type LinkedImageResult = {
  id: number | null;
  s3Key: string | null;
  sortOrder: number | null;
  createdAt: string | null;
  alreadyLinked: boolean;
};

type ImagePointerDragState = {
  imageIndex: number;
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  width: number;
};

const STORAGE_CONDITIONS_MAX_LENGTH = 500;

function normalizeOptional(value: string): string {
  const t = value.trim();
  return t;
}

function initOptional(value: string | null | undefined): string {
  if (value == null) return "";
  return normalizeOptional(value);
}

function toClassificationDrafts(
  classifications: ItemClassification[],
): ItemClassificationDraft[] {
  const normalized = classifications
    .map((classification, index) => ({
      localId: index + 1,
      category3: initOptional(classification.category3),
      category2: initOptional(classification.category2),
      category1: initOptional(classification.category1),
    }))
    .filter(
      (classification) =>
        classification.category3 ||
        classification.category2 ||
        classification.category1,
    );

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      localId: 1,
      category3: "",
      category2: "",
      category1: "",
    },
  ];
}

function getNextClassificationDraftId(
  classifications: ItemClassificationDraft[],
): number {
  return (
    classifications.reduce(
      (maxId, classification) => Math.max(maxId, classification.localId),
      0,
    ) + 1
  );
}

function withFallbackImage(images: ItemImage[]): ItemImage[] {
  return images.length
    ? images
    : [
        {
          id: null,
          s3Key: null,
          sortOrder: null,
          url: "/FillerImage.webp",
          createdAt: null,
          pendingUploadId: null,
        },
      ];
}

function mergeLinkedImageIntoForm(
  currentForm: ItemForm,
  linkedImage: LinkedImageResult,
  url: string,
): ItemForm {
  const targetKey = linkedImage.s3Key?.trim() ?? "";
  const targetUrl = url.trim();

  const alreadyPresent = currentForm.images.some((image) => {
    const existingKey = image.s3Key?.trim() ?? "";
    if (targetKey && existingKey === targetKey) {
      return true;
    }

    return targetUrl.length > 0 && image.url.trim() === targetUrl;
  });

  if (alreadyPresent) {
    return currentForm;
  }

  const nextImages =
    currentForm.images.length === 1 &&
    currentForm.images[0]?.url === "/FillerImage.webp"
      ? []
      : currentForm.images;

  return {
    ...currentForm,
    images: [
      ...nextImages,
      {
        id: linkedImage.id,
        s3Key: linkedImage.s3Key,
        sortOrder: linkedImage.sortOrder,
        url,
        createdAt: linkedImage.createdAt,
        pendingUploadId: null,
      },
    ],
  };
}

function getPendingImageKeys(images: ItemImage[]): string[] {
  const seen = new Set<string>();
  const pendingKeys: string[] = [];

  for (const image of images) {
    if (image.id != null) {
      continue;
    }

    const key = image.s3Key?.trim() ?? "";
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    pendingKeys.push(key);
  }

  return pendingKeys;
}

function getPendingLocalUploadIds(images: ItemImage[]): string[] {
  const seen = new Set<string>();
  const pendingIds: string[] = [];

  for (const image of images) {
    if (image.id != null || image.s3Key?.trim()) {
      continue;
    }

    const pendingUploadId = image.pendingUploadId?.trim() ?? "";
    if (!pendingUploadId || seen.has(pendingUploadId)) {
      continue;
    }

    seen.add(pendingUploadId);
    pendingIds.push(pendingUploadId);
  }

  return pendingIds;
}

function createPendingUploadId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildOrderedImageIdsForPersist(
  desiredImages: ItemImage[],
  refreshedImages: ItemImage[],
): number[] {
  const idsByKey = new Map<string, number[]>();
  const remainingIds: number[] = [];

  for (const image of refreshedImages) {
    if (image.id == null) {
      continue;
    }

    remainingIds.push(image.id);

    const key = image.s3Key?.trim() ?? "";
    if (!key) {
      continue;
    }

    const existing = idsByKey.get(key);
    if (existing) {
      existing.push(image.id);
    } else {
      idsByKey.set(key, [image.id]);
    }
  }

  const orderedIds: number[] = [];
  const usedIds = new Set<number>();

  for (const image of desiredImages) {
    const key = image.s3Key?.trim() ?? "";
    if (!key) {
      continue;
    }

    const idQueue = idsByKey.get(key);
    const imageId = idQueue?.shift();
    if (imageId == null || usedIds.has(imageId)) {
      continue;
    }

    orderedIds.push(imageId);
    usedIds.add(imageId);
  }

  for (const imageId of remainingIds) {
    if (usedIds.has(imageId)) {
      continue;
    }

    orderedIds.push(imageId);
    usedIds.add(imageId);
  }

  return orderedIds;
}

function sanitizeMoneyInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [rawWhole = "", ...rawFractionParts] = cleaned.split(".");
  const whole = rawWhole.slice(0, 8);
  const fraction = rawFractionParts.join("").slice(0, 2);
  const hasDecimal = rawFractionParts.length > 0;

  if (!hasDecimal) return whole;
  if (whole === "") return `0.${fraction}`;
  return `${whole}.${fraction}`;
}

function applyNA(f: ItemForm): ItemForm {
  return {
    ...f,
    sku: f.sku.trim(),
    itemName: f.itemName.trim(),
    classifications: f.classifications.map((classification) => ({
      ...classification,
      category3: classification.category3.trim(),
      category2: classification.category2.trim(),
      category1: classification.category1.trim(),
    })),

    description: normalizeOptional(f.description),
    unitOfMeasure: normalizeOptional(f.unitOfMeasure),
    storageLocation: normalizeOptional(f.storageLocation),
    storageConditions: normalizeOptional(f.storageConditions),
    expirationDate: normalizeOptional(f.expirationDate),
    dateAcquired: normalizeOptional(f.dateAcquired),

    images: withFallbackImage(f.images),

    price: f.price.trim(),
    quantityInStock: f.quantityInStock.trim(),
    reorderLevel: f.reorderLevel.trim(),
    unitCost: f.unitCost.trim(),
  };
}

function toForm(item: Item): ItemForm {
  return {
    sku: item.sku ?? "",
    itemName: item.itemName ?? "",
    price: item.price != null ? String(item.price) : "",
    classifications: toClassificationDrafts(item.classifications ?? []),
    description: initOptional(item.description),
    images: withFallbackImage(item.images ?? []),
    quantityInStock: String(item.quantityInStock ?? 0),
    unitOfMeasure: initOptional(item.unitOfMeasure),
    storageLocation: initOptional(item.storageLocation),
    storageConditions: initOptional(item.storageConditions),
    expirationDate: initOptional(item.expirationDate),
    dateAcquired: initOptional(item.dateAcquired),
    reorderLevel: String(item.reorderLevel ?? 0),
    unitCost: item.unitCost != null ? String(item.unitCost) : "",
  };
}

function normalizeImagesForCompare(images: ItemImage[]) {
  return images.map((image) => ({
    id: image.id ?? null,
    s3Key: image.s3Key ?? null,
    sortOrder: image.sortOrder ?? null,
    url: image.url,
  }));
}

function normalizeForCompare(f: ItemForm) {
  const n = (s: string) => s.trim();
  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

  return {
    sku: n(f.sku),
    itemName: n(f.itemName),
    price: num(f.price),
    classifications: f.classifications.map((classification) => ({
      category3: n(classification.category3),
      category2: n(classification.category2),
      category1: n(classification.category1),
    })),
    description: normalizeOptional(f.description),
    images: normalizeImagesForCompare(f.images),
    quantityInStock: Math.max(0, Math.trunc(num(f.quantityInStock))),
    unitOfMeasure: normalizeOptional(f.unitOfMeasure),
    storageLocation: normalizeOptional(f.storageLocation),
    storageConditions: normalizeOptional(f.storageConditions),
    expirationDate: normalizeOptional(f.expirationDate),
    dateAcquired: normalizeOptional(f.dateAcquired),
    reorderLevel: Math.max(0, Math.trunc(num(f.reorderLevel))),
    unitCost: num(f.unitCost),
  };
}

function normalizeForCompareWithoutImages(f: ItemForm) {
  const normalized = normalizeForCompare(f);
  const { images, ...rest } = normalized;
  void images;
  return rest;
}

function sameNonImageForm(a: ItemForm, b: ItemForm) {
  return (
    JSON.stringify(normalizeForCompareWithoutImages(a)) ===
    JSON.stringify(normalizeForCompareWithoutImages(b))
  );
}

type NormalizedItemForm = ReturnType<typeof normalizeForCompare>;

function validateForm(f: ItemForm): string | null {
  const isValidMoney = (value: string): boolean => {
    if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return false;
    return Number(value) >= 0;
  };

  if (!f.itemName.trim()) return "Item name is required.";
  if (!f.sku.trim()) return "SKU is required.";
  if (!f.price.trim()) return "Price is required.";
  if (!isValidMoney(f.price)) {
    return "Price must be a non-negative number with up to 2 decimals.";
  }

  if (!/^\d+$/.test(f.quantityInStock.trim())) {
    return "Quantity in stock must be a whole number.";
  }

  if (!/^\d+$/.test(f.reorderLevel.trim())) {
    return "Reorder level must be a whole number.";
  }

  if (!f.unitCost.trim()) return "Unit cost is required.";
  if (!isValidMoney(f.unitCost)) {
    return "Unit cost must be a non-negative number with up to 2 decimals.";
  }

  if (f.classifications.length === 0) {
    return "At least one classification row is required.";
  }

  const emptyAdditionalClassifications = f.classifications
    .slice(1)
    .filter(
      (classification) =>
        !classification.category3.trim() &&
        !classification.category2.trim() &&
        !classification.category1.trim(),
    );
  if (emptyAdditionalClassifications.length > 0) {
    return "Remove empty classification rows before saving.";
  }

  const startedClassifications = f.classifications.filter(
    (classification) =>
      classification.category3.trim() ||
      classification.category2.trim() ||
      classification.category1.trim(),
  );

  for (const classification of startedClassifications) {
    if (
      !classification.category3.trim() ||
      !classification.category2.trim() ||
      !classification.category1.trim()
    ) {
      return "Each started classification must include Category, Subcategory, and Type.";
    }
  }

  const seenClassificationKeys = new Set<string>();
  for (const classification of startedClassifications) {
    const key = `${classification.category3.trim()}|||${classification.category2.trim()}|||${classification.category1.trim()}`;
    if (seenClassificationKeys.has(key)) {
      return "Duplicate classification sets are not allowed.";
    }
    seenClassificationKeys.add(key);
  }

  return null;
}
function StaffItemEditPageContent() {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const itemId = Number.parseInt(rawId ?? "", 10) || 0;
  const id = itemId;
  const backToItemSearchHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/staff/item_search?${query}` : "/staff/item_search";
  }, [searchParams]);

  const [form, setForm] = useState<ItemForm>(() =>
    toForm({
      id: itemId,
      sku: "",
      itemName: "",
      price: null,
      category3: "",
      category2: "",
      category1: "",
      classifications: [],
      description: "",
      images: [
        {
          id: null,
          s3Key: null,
          sortOrder: null,
          url: "/FillerImage.webp",
          createdAt: null,
          pendingUploadId: null,
        },
      ],
      quantityInStock: 0,
      unitOfMeasure: "",
      storageLocation: "",
      storageConditions: "",
      expirationDate: null,
      dateAcquired: null,
      reorderLevel: 0,
      unitCost: null,
      createdAt: null,
      updatedAt: null,
    }),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeletingImage] = useState<boolean>(false);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false);
  const [isLinkingBrowseImageKey, setIsLinkingBrowseImageKey] = useState<
    string | null
  >(null);
  const [isUnlinkingBrowseImageKey, setIsUnlinkingBrowseImageKey] = useState<
    string | null
  >(null);
  const [pendingBrowseImageDelete, setPendingBrowseImageDelete] =
    useState<PendingBrowseImageDelete | null>(null);
  const [isUnlinkingReferenceImageId, setIsUnlinkingReferenceImageId] =
    useState<number | null>(null);
  const [pendingReferenceDelete, setPendingReferenceDelete] =
    useState<PendingReferenceDelete | null>(null);
  const {
    isBrowseImagesPopupOpen,
    browseImages,
    setBrowseImages,
    browseItemSearchInput,
    setBrowseItemSearchInput,
    browseItemSearchQuery,
    isLoadingBrowseImages,
    browseImagesError,
    isBrowseImageDetailsOpen,
    browseImageDetails,
    setBrowseImageDetails,
    isLoadingBrowseImageDetails,
    browseImageDetailsError,
    setBrowseImageDetailsError,
    openBrowseImagesPopup: openBrowseImagesPopupBase,
    closeBrowseImagesPopup: closeBrowseImagesPopupBase,
    loadBrowseImages: loadBrowseImagesBase,
    openBrowseImageDetails: openBrowseImageDetailsBase,
    closeBrowseImageDetailsPopup: closeBrowseImageDetailsPopupBase,
    handleBrowseItemSearchSubmit: handleBrowseItemSearchSubmitBase,
    handleClearBrowseItemSearch: handleClearBrowseItemSearchBase,
  } = useImageLibraryBrowser({
    catalogItemId: id,
    isBrowseOpenBlocked:
      isDeletingImage || isSaving || isDeletingItem || isLoading,
    isBrowseCloseBlocked:
      !!isLinkingBrowseImageKey || !!isUnlinkingBrowseImageKey,
    isDetailsCloseBlocked: isUnlinkingReferenceImageId != null,
  });
  const [imagePointerDrag, setImagePointerDrag] =
    useState<ImagePointerDragState | null>(null);
  const [imageDragOverIndex, setImageDragOverIndex] = useState<number | null>(
    null,
  );
  const [isImageOrderDirty, setIsImageOrderDirty] = useState<boolean>(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] =
    useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [
    subcategoryOptionsByClassificationId,
    setSubcategoryOptionsByClassificationId,
  ] = useState<Record<number, string[]>>({});
  const [typeOptionsByClassificationId, setTypeOptionsByClassificationId] =
    useState<Record<number, string[]>>({});
  const [nextClassificationDraftId, setNextClassificationDraftId] = useState(2);
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);
  const [newCategoryLevel, setNewCategoryLevel] =
    useState<CategoryLevel>("category3");
  const [
    categoryModalTargetClassificationId,
    setCategoryModalTargetClassificationId,
  ] = useState(1);
  const imageThumbRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const imageDragOverIndexRef = useRef<number | null>(null);
  const pendingLocalUploadsRef = useRef<Map<string, PendingLocalUpload>>(
    new Map(),
  );

  const originalRef = useRef<ItemForm>(form);

  const hasNonImageChanges = useMemo(
    () => !sameNonImageForm(form, originalRef.current),
    [form],
  );
  const pendingImageKeysToLink = useMemo(
    () => getPendingImageKeys(form.images),
    [form.images],
  );
  const pendingLocalUploadIds = useMemo(
    () => getPendingLocalUploadIds(form.images),
    [form.images],
  );
  const hasPendingImageLinks = pendingImageKeysToLink.length > 0;
  const hasPendingLocalUploads = pendingLocalUploadIds.length > 0;
  const isDirty =
    hasNonImageChanges ||
    isImageOrderDirty ||
    hasPendingImageLinks ||
    hasPendingLocalUploads;
  const normalizedForm = useMemo(() => normalizeForCompare(form), [form]);
  const normalizedOriginal = normalizeForCompare(originalRef.current);
  const isFieldDirty = (field: keyof NormalizedItemForm) =>
    JSON.stringify(normalizedForm[field]) !==
    JSON.stringify(normalizedOriginal[field]);
  const fieldNameClass = (dirty: boolean) =>
    `item-edit-field-name${dirty ? " item-edit-field-name--dirty" : ""}`;
  const deleteConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      if (isDeletingItem) {
        return;
      }

      setIsDeleteConfirmationOpen(false);
      setDeleteConfirmChecked(false);
    });
  const browseImagesBackdropHandlers = useBackdropPointerClose<HTMLDivElement>(
    () => {
      if (isLinkingBrowseImageKey || isUnlinkingBrowseImageKey) {
        return;
      }

      closeBrowseImagesPopup();
    },
  );
  const browseImageDetailsBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() => {
      if (isUnlinkingReferenceImageId != null) {
        return;
      }

      closeBrowseImageDetailsPopup();
    });

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let mounted = true;

    const fetchItem = async () => {
      if (!itemId) {
        if (!mounted) return;
        setLoadError("Invalid item ID.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/catalog?id=${itemId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load item (HTTP ${response.status}).`);
        }

        const payload = (await response.json()) as CatalogApiResponse;

        if (!payload?.success) {
          throw new Error("Catalog API returned an unsuccessful response.");
        }

        const loadedItem = parseCatalogItem(payload.data);

        if (!loadedItem) {
          throw new Error("No item data found for the requested ID.");
        }

        const nextForm = toForm(loadedItem);

        if (!mounted) return;
        setForm(nextForm);
        setNextClassificationDraftId(
          getNextClassificationDraftId(nextForm.classifications),
        );
        setCategoryModalTargetClassificationId(
          nextForm.classifications[0]?.localId ?? 1,
        );
        void hydrateClassificationOptions(nextForm.classifications);
        originalRef.current = structuredClone(nextForm);
        setIsImageOrderDirty(false);
      } catch (error) {
        if (!mounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to load item data.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      mounted = false;
    };
  }, [itemId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/catalog/categories", {
        cache: "no-store",
      });

      if (!response.ok) {
        setCategories([]);
        return;
      }

      const payload = (await response.json()) as { categories?: unknown };
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

  const fetchSubcategories = useCallback(
    async (category: string): Promise<string[]> => {
      if (!category.trim()) {
        return [];
      }

      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(category)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          return [];
        }

        const payload = (await response.json()) as { subcategories?: unknown };
        return Array.isArray(payload?.subcategories)
          ? payload.subcategories.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [];
      } catch {
        return [];
      }
    },
    [],
  );

  const fetchTypes = useCallback(
    async (category: string, subcategory: string): Promise<string[]> => {
      if (!category.trim() || !subcategory.trim()) {
        return [];
      }

      try {
        const params = new URLSearchParams({
          category,
          subcategory,
        });
        const response = await fetch(
          `/api/catalog/staff/types?${params.toString()}`,
          {
            cache: "no-store",
          },
        );
        if (!response.ok) {
          return [];
        }

        const payload = (await response.json()) as { types?: unknown };
        return Array.isArray(payload?.types)
          ? payload.types.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [];
      } catch {
        return [];
      }
    },
    [],
  );

  const refreshSubcategoryOptionsForClassification = async (
    classificationId: number,
    category: string,
  ) => {
    const options = await fetchSubcategories(category);
    setSubcategoryOptionsByClassificationId((prev) => ({
      ...prev,
      [classificationId]: options,
    }));
    return options;
  };

  const refreshTypeOptionsForClassification = async (
    classificationId: number,
    category: string,
    subcategory: string,
  ) => {
    const options = await fetchTypes(category, subcategory);
    setTypeOptionsByClassificationId((prev) => ({
      ...prev,
      [classificationId]: options,
    }));
    return options;
  };

  const hydrateClassificationOptions = useCallback(
    async (classifications: ItemClassificationDraft[]) => {
      const subcategoryOptionsEntries = await Promise.all(
        classifications.map(async (classification) => {
          const category = classification.category3.trim();
          const options = category ? await fetchSubcategories(category) : [];
          return [classification.localId, options] as const;
        }),
      );
      setSubcategoryOptionsByClassificationId(
        Object.fromEntries(subcategoryOptionsEntries),
      );

      const typeOptionsEntries = await Promise.all(
        classifications.map(async (classification) => {
          const category = classification.category3.trim();
          const subcategory = classification.category2.trim();
          const options =
            category && subcategory
              ? await fetchTypes(category, subcategory)
              : [];
          return [classification.localId, options] as const;
        }),
      );
      setTypeOptionsByClassificationId(Object.fromEntries(typeOptionsEntries));
    },
    [fetchSubcategories, fetchTypes],
  );

  useEffect(() => {
    void fetchCategories();
  }, []);

  const update =
    <K extends keyof ItemForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        key === "unitCost" || key === "price"
          ? sanitizeMoneyInput(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const blurNA =
    <K extends keyof ItemForm>(key: K) =>
    () => {
      setForm((prev) => ({
        ...prev,
        [key]: normalizeOptional(String(prev[key] ?? "")),
      }));
    };

  function handleClassificationCategoryChange(
    classificationId: number,
    nextCategory: string,
  ) {
    const trimmedCategory = nextCategory.trim();
    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.map((classification) =>
        classification.localId === classificationId
          ? {
              ...classification,
              category3: nextCategory,
              category2: "",
              category1: "",
            }
          : classification,
      ),
    }));
    setSubcategoryOptionsByClassificationId((prev) => ({
      ...prev,
      [classificationId]: [],
    }));
    setTypeOptionsByClassificationId((prev) => ({
      ...prev,
      [classificationId]: [],
    }));
    if (trimmedCategory) {
      void refreshSubcategoryOptionsForClassification(
        classificationId,
        trimmedCategory,
      );
    }
  }

  function handleClassificationSubcategoryChange(
    classificationId: number,
    nextSubcategory: string,
  ) {
    const targetClassification = form.classifications.find(
      (classification) => classification.localId === classificationId,
    );
    const category = targetClassification?.category3.trim() ?? "";
    const trimmedSubcategory = nextSubcategory.trim();

    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.map((classification) =>
        classification.localId === classificationId
          ? {
              ...classification,
              category2: nextSubcategory,
              category1: "",
            }
          : classification,
      ),
    }));
    setTypeOptionsByClassificationId((prev) => ({
      ...prev,
      [classificationId]: [],
    }));
    if (category && trimmedSubcategory) {
      void refreshTypeOptionsForClassification(
        classificationId,
        category,
        trimmedSubcategory,
      );
    }
  }

  function handleClassificationTypeChange(
    classificationId: number,
    nextType: string,
  ) {
    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.map((classification) =>
        classification.localId === classificationId
          ? {
              ...classification,
              category1: nextType,
            }
          : classification,
      ),
    }));
  }

  function addClassificationLine() {
    const nextId = nextClassificationDraftId;
    setForm((prev) => ({
      ...prev,
      classifications: [
        ...prev.classifications,
        {
          localId: nextId,
          category3: "",
          category2: "",
          category1: "",
        },
      ],
    }));
    setSubcategoryOptionsByClassificationId((prev) => ({
      ...prev,
      [nextId]: [],
    }));
    setTypeOptionsByClassificationId((prev) => ({
      ...prev,
      [nextId]: [],
    }));
    setNextClassificationDraftId((prev) => prev + 1);
  }

  function removeClassificationLine(classificationId: number) {
    if (form.classifications.length <= 1) {
      return;
    }

    const remainingClassifications = form.classifications.filter(
      (classification) => classification.localId !== classificationId,
    );

    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.filter(
        (classification) => classification.localId !== classificationId,
      ),
    }));
    setSubcategoryOptionsByClassificationId((prev) => {
      const next = { ...prev };
      delete next[classificationId];
      return next;
    });
    setTypeOptionsByClassificationId((prev) => {
      const next = { ...prev };
      delete next[classificationId];
      return next;
    });

    if (categoryModalTargetClassificationId === classificationId) {
      setCategoryModalTargetClassificationId(
        remainingClassifications[0]?.localId ?? 1,
      );
    }
  }

  async function saveChanges() {
    if (!isDirty || isSaving || isDeletingItem || isLoading || !!loadError) {
      return;
    }

    const shouldSaveItemFields = hasNonImageChanges;
    const shouldUploadLocalImages = pendingLocalUploadIds.length > 0;
    const shouldSaveImageLinks =
      pendingImageKeysToLink.length > 0 || shouldUploadLocalImages;
    const shouldSaveImageOrder = isImageOrderDirty;
    const desiredImageOrder = form.images.map((image) => ({ ...image }));

    let payload: Record<string, unknown> | null = null;

    if (shouldSaveItemFields) {
      const prepared = applyNA(form);
      const validationError = validateForm(prepared);
      if (validationError) {
        setSaveError(validationError);
        return;
      }

      const startedClassifications = prepared.classifications
        .map((classification) => ({
          category3: classification.category3.trim(),
          category2: classification.category2.trim(),
          category1: classification.category1.trim(),
        }))
        .filter(
          (classification) =>
            classification.category3 ||
            classification.category2 ||
            classification.category1,
        );
      const primaryClassification = startedClassifications[0] ?? null;

      payload = {
        sku: prepared.sku,
        itemName: prepared.itemName,
        price: Number(prepared.price),
        category3: primaryClassification?.category3 ?? null,
        category2: primaryClassification?.category2 ?? null,
        category1: primaryClassification?.category1 ?? null,
        classifications: startedClassifications,
        description: prepared.description,
        quantityInStock: Math.max(
          0,
          Math.trunc(Number(prepared.quantityInStock)),
        ),
        unitOfMeasure: prepared.unitOfMeasure,
        storageLocation: prepared.storageLocation,
        storageConditions: prepared.storageConditions,
        expirationDate: prepared.expirationDate,
        dateAcquired: prepared.dateAcquired,
        reorderLevel: Math.max(0, Math.trunc(Number(prepared.reorderLevel))),
        unitCost: Number(prepared.unitCost),
      };
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (shouldSaveItemFields && payload) {
        const response = await fetch(`/api/catalog?id=${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = `Failed to save item (HTTP ${response.status}).`;

          try {
            const errorPayload = (await response.json()) as {
              error?: unknown;
              details?: unknown;
            };
            if (typeof errorPayload?.error === "string") {
              message = errorPayload.error;
              if (typeof errorPayload.details === "string") {
                message = `${message} ${errorPayload.details}`;
              }
            }
          } catch {
            // Keep fallback message.
          }

          throw new Error(message);
        }
      }

      const keysToLink = new Set<string>(pendingImageKeysToLink);

      if (shouldUploadLocalImages) {
        const uploadedByPendingId = new Map<
          string,
          {
            fileKey: string;
            fileUrl: string;
          }
        >();

        for (const pendingUploadId of pendingLocalUploadIds) {
          const pendingUpload =
            pendingLocalUploadsRef.current.get(pendingUploadId) ?? null;
          if (!pendingUpload) {
            throw new Error(
              "One or more selected images are no longer available.",
            );
          }

          const uploadResult = await uploadFileToS3(pendingUpload.file);
          uploadedByPendingId.set(pendingUploadId, uploadResult);
          keysToLink.add(uploadResult.fileKey);
        }

        if (uploadedByPendingId.size > 0) {
          setForm((prev) => ({
            ...prev,
            images: prev.images.map((image) => {
              const pendingUploadId = image.pendingUploadId?.trim() ?? "";
              if (!pendingUploadId) {
                return image;
              }

              const uploaded = uploadedByPendingId.get(pendingUploadId);
              if (!uploaded) {
                return image;
              }

              return {
                ...image,
                s3Key: uploaded.fileKey,
                url: uploaded.fileUrl,
                pendingUploadId: null,
              };
            }),
          }));

          for (const image of desiredImageOrder) {
            const pendingUploadId = image.pendingUploadId?.trim() ?? "";
            if (!pendingUploadId) {
              continue;
            }

            const uploaded = uploadedByPendingId.get(pendingUploadId);
            if (!uploaded) {
              continue;
            }

            image.s3Key = uploaded.fileKey;
            image.url = uploaded.fileUrl;
            image.pendingUploadId = null;
            revokePendingLocalUpload(pendingUploadId);
          }
        }
      }

      if (keysToLink.size > 0) {
        const failedKeys: string[] = [];

        for (const fileKey of keysToLink) {
          try {
            await linkUploadedImage(fileKey);
          } catch {
            failedKeys.push(fileKey);
          }
        }

        if (failedKeys.length > 0) {
          throw new Error(
            `Failed to link ${failedKeys.length} pending image${failedKeys.length === 1 ? "" : "s"}.`,
          );
        }
      }

      async function fetchRefreshedItem(): Promise<Item> {
        const refreshedResponse = await fetch(`/api/catalog?id=${id}`, {
          cache: "no-store",
        });

        if (!refreshedResponse.ok) {
          throw new Error(
            `Failed to reload item after save (HTTP ${refreshedResponse.status}).`,
          );
        }

        const refreshedPayload =
          (await refreshedResponse.json()) as CatalogApiResponse;

        if (!refreshedPayload?.success) {
          throw new Error("Failed to reload saved item.");
        }

        const parsed = parseCatalogItem(refreshedPayload.data);
        if (!parsed) {
          throw new Error("Failed to parse refreshed item data.");
        }

        return parsed;
      }

      let refreshedItem = await fetchRefreshedItem();

      if (shouldSaveImageOrder) {
        const linkedImageCount = refreshedItem.images.filter(
          (image) => image.id != null,
        ).length;

        if (linkedImageCount > 1) {
          const orderedImageIds = buildOrderedImageIdsForPersist(
            desiredImageOrder,
            refreshedItem.images,
          );

          if (orderedImageIds.length !== linkedImageCount) {
            throw new Error(
              "Unable to save image order because one or more image links are missing IDs.",
            );
          }

          await persistImageOrder(orderedImageIds);
          refreshedItem = await fetchRefreshedItem();
        }
      }

      const nextForm = toForm(refreshedItem);
      clearPendingLocalUploads();
      setForm(nextForm);
      setNextClassificationDraftId(
        getNextClassificationDraftId(nextForm.classifications),
      );
      setCategoryModalTargetClassificationId(
        nextForm.classifications[0]?.localId ?? 1,
      );
      void hydrateClassificationOptions(nextForm.classifications);
      originalRef.current = structuredClone(nextForm);
      setIsImageOrderDirty(false);
      setSuccessMessage(
        shouldSaveItemFields && shouldSaveImageLinks && shouldSaveImageOrder
          ? "Item edits, image links, and image order saved."
          : shouldSaveItemFields && shouldSaveImageLinks
            ? "Item edits and image links saved."
            : shouldSaveItemFields && shouldSaveImageOrder
              ? "Item edits and image order saved."
              : shouldSaveImageLinks && shouldSaveImageOrder
                ? "Image links and image order saved."
                : shouldSaveImageLinks
                  ? "Image links saved."
                  : shouldSaveImageOrder
                    ? "Image order saved."
                    : "Item edit changes saved.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save changes.";
      setSaveError(message);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  }

  function resetChanges() {
    if (!isDirty || isSaving || isDeletingItem || isLoading || !!loadError) {
      return;
    }

    clearPendingLocalUploads();
    const snapshot = structuredClone(originalRef.current);
    setForm(snapshot);
    setNextClassificationDraftId(
      getNextClassificationDraftId(snapshot.classifications),
    );
    setCategoryModalTargetClassificationId(
      snapshot.classifications[0]?.localId ?? 1,
    );
    void hydrateClassificationOptions(snapshot.classifications);
    setIsImageOrderDirty(false);
    setSaveError(null);
    setSuccessMessage(null);
  }

  function resetSuccessMessage() {
    setSuccessMessage(null);
  }

  function revokePendingLocalUpload(pendingUploadId: string) {
    const pendingUpload = pendingLocalUploadsRef.current.get(pendingUploadId);
    if (pendingUpload?.previewUrl) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
    }
    pendingLocalUploadsRef.current.delete(pendingUploadId);
  }

  function clearPendingLocalUploads() {
    for (const pendingUpload of pendingLocalUploadsRef.current.values()) {
      if (pendingUpload.previewUrl) {
        URL.revokeObjectURL(pendingUpload.previewUrl);
      }
    }
    pendingLocalUploadsRef.current.clear();
  }

  useEffect(() => {
    const pendingUploadsRef = pendingLocalUploadsRef;
    return () => {
      for (const pendingUpload of pendingUploadsRef.current.values()) {
        if (pendingUpload.previewUrl) {
          URL.revokeObjectURL(pendingUpload.previewUrl);
        }
      }
      pendingUploadsRef.current.clear();
    };
  }, []);

  function getImageIndexAtPoint(
    clientX: number,
    clientY: number,
  ): number | null {
    for (const [index, element] of imageThumbRefs.current.entries()) {
      const rect = element.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return index;
      }
    }

    return null;
  }

  const persistImageOrder = useCallback(
    async (imageIds: number[]) => {
      const response = await fetch("/api/catalog/staff/images", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catalogItemId: id,
          imageIds,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: unknown;
        details?: unknown;
      };

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Failed to save image order (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }
    },
    [id],
  );

  const reorderImages = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        return;
      }

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= form.images.length ||
        toIndex >= form.images.length
      ) {
        return;
      }

      setForm((prev) => {
        const nextImages = [...prev.images];
        const [movedImage] = nextImages.splice(fromIndex, 1);
        if (!movedImage) {
          return prev;
        }
        nextImages.splice(toIndex, 0, movedImage);
        const reorderedImages = nextImages.map((image) => ({
          ...image,
        }));

        return {
          ...prev,
          images: reorderedImages,
        };
      });

      setIsImageOrderDirty(true);
      setSuccessMessage(null);
    },
    [form.images.length],
  );

  function handleImagePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    imageIndex: number,
  ) {
    if (event.button !== 0) {
      return;
    }

    if (
      form.images.length <= 1 ||
      isLoading ||
      isSaving ||
      isDeletingItem ||
      isDeletingImage
    ) {
      return;
    }

    const thumbButton = event.currentTarget;
    const rect = thumbButton.getBoundingClientRect();

    event.preventDefault();

    setImagePointerDrag({
      imageIndex,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
    });
    setImageDragOverIndex(imageIndex);
    imageDragOverIndexRef.current = imageIndex;
  }

  useEffect(() => {
    if (!imagePointerDrag) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      setImagePointerDrag((current) =>
        current
          ? {
              ...current,
              pointerX: event.clientX,
              pointerY: event.clientY,
            }
          : current,
      );

      const hoveredIndex = getImageIndexAtPoint(event.clientX, event.clientY);
      setImageDragOverIndex(hoveredIndex);
      imageDragOverIndexRef.current = hoveredIndex;
    };

    const handlePointerUp = (event: PointerEvent) => {
      const currentDrag = imagePointerDrag;
      const movementDistance = Math.hypot(
        event.clientX - currentDrag.startX,
        event.clientY - currentDrag.startY,
      );
      const didDrag = movementDistance > 6;

      const hoveredIndex = getImageIndexAtPoint(event.clientX, event.clientY);
      const targetIndex =
        hoveredIndex ?? imageDragOverIndexRef.current ?? currentDrag.imageIndex;

      if (didDrag && targetIndex !== currentDrag.imageIndex) {
        reorderImages(currentDrag.imageIndex, targetIndex);
      }

      setImagePointerDrag(null);
      setImageDragOverIndex(null);
      imageDragOverIndexRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [imagePointerDrag, reorderImages]);

  function openDeleteConfirmation() {
    if (
      !id ||
      isDeletingItem ||
      isSaving ||
      isDeletingImage ||
      isLoading ||
      !!loadError
    ) {
      return;
    }

    setIsDeleteConfirmationOpen(true);
    setDeleteConfirmChecked(false);
    setSaveError(null);
    setSuccessMessage(null);
  }

  function openBrowseImagesPopup() {
    setPendingBrowseImageDelete(null);
    void openBrowseImagesPopupBase();
  }

  function closeBrowseImagesPopup() {
    setPendingBrowseImageDelete(null);
    closeBrowseImagesPopupBase();
  }

  async function loadBrowseImages(nextQuery?: string) {
    setPendingBrowseImageDelete(null);
    await loadBrowseImagesBase(nextQuery);
  }

  function closeBrowseImageDetailsPopup() {
    closeBrowseImageDetailsPopupBase();
    setPendingReferenceDelete(null);
  }

  async function openBrowseImageDetails(entry: BrowseImageLibraryEntry) {
    setPendingReferenceDelete(null);
    await openBrowseImageDetailsBase(entry);
  }

  function handleBrowseItemSearchSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    setPendingBrowseImageDelete(null);
    handleBrowseItemSearchSubmitBase(event);
  }

  function handleClearBrowseItemSearch() {
    setPendingBrowseImageDelete(null);
    handleClearBrowseItemSearchBase();
  }

  function closeDeleteConfirmation() {
    if (isDeletingItem) {
      return;
    }

    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  }

  async function deleteItem() {
    if (
      !id ||
      isDeletingItem ||
      isSaving ||
      isDeletingImage ||
      isLoading ||
      !!loadError ||
      !deleteConfirmChecked
    ) {
      return;
    }

    setIsDeletingItem(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/catalog?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteImagesFromStorage: true,
        }),
      });

      let result: {
        success?: boolean;
        error?: unknown;
        details?: unknown;
      } | null = null;

      try {
        result = (await response.json()) as {
          success?: boolean;
          error?: unknown;
          details?: unknown;
        };
      } catch {
        result = null;
      }

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Failed to delete item (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      router.push(backToItemSearchHref);
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to delete item.",
      );
    } finally {
      setIsDeletingItem(false);
    }
  }

  function openNewCategoryPopup(
    level: CategoryLevel,
    classificationId: number,
  ) {
    setNewCategoryLevel(level);
    setCategoryModalTargetClassificationId(classificationId);
    setShowNewCategoryPopup(true);
  }

  function closeNewCategoryPopup() {
    setShowNewCategoryPopup(false);
  }

  async function handleCategoryCreated(result: {
    level: CategoryLevel;
    parentCategory3: string | null;
    parentCategory2: string | null;
  }) {
    await fetchCategories();

    if (result.level === "category2" && result.parentCategory3) {
      const matchingClassifications = form.classifications.filter(
        (classification) =>
          classification.category3.trim() === result.parentCategory3,
      );
      await Promise.all(
        matchingClassifications.map((classification) =>
          refreshSubcategoryOptionsForClassification(
            classification.localId,
            classification.category3.trim(),
          ),
        ),
      );
    }

    if (result.level === "category1" && result.parentCategory3) {
      const matchingClassifications = form.classifications.filter(
        (classification) =>
          classification.category3.trim() === result.parentCategory3 &&
          classification.category2.trim() === (result.parentCategory2 ?? ""),
      );
      await Promise.all(
        matchingClassifications.map((classification) =>
          refreshTypeOptionsForClassification(
            classification.localId,
            classification.category3.trim(),
            classification.category2.trim(),
          ),
        ),
      );
    }
  }

  async function uploadFileToS3(file: File): Promise<{
    fileUrl: string;
    fileKey: string;
  }> {
    const presignedResponse = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    const presignedData =
      (await presignedResponse.json()) as PresignedUrlResponse;

    if (!presignedResponse.ok || presignedData?.success !== true) {
      throw new Error(
        presignedData?.error || "Failed to get presigned upload URL.",
      );
    }

    const presignedUrl = presignedData.presignedUrl?.trim() ?? "";
    const fileUrl = presignedData.fileUrl?.trim() ?? "";
    const fileKey = presignedData.fileKey?.trim() ?? "";

    if (!presignedUrl || !fileUrl || !fileKey) {
      throw new Error("Presigned upload response was missing required fields.");
    }

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3.");
    }

    return { fileUrl, fileKey };
  }

  async function linkUploadedImage(fileKey: string) {
    const response = await fetch("/api/catalog/staff/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogItemId: id,
        fileKey,
      }),
    });

    const result = (await response.json()) as LinkImageApiResponse;

    if (!response.ok || result?.success === false) {
      const message =
        typeof result?.error === "string"
          ? result.error
          : `Failed to link image (HTTP ${response.status}).`;
      const details =
        typeof result?.details === "string" ? ` ${result.details}` : "";
      throw new Error(`${message}${details}`.trim());
    }

    const imageData = asRecord(result.data);
    if (!imageData) {
      throw new Error("Image link response did not include image data.");
    }

    return {
      id: getNullableNumber(imageData.id),
      s3Key: getNullableString(imageData.s3Key),
      sortOrder: getNullableNumber(imageData.sortOrder),
      createdAt: getNullableString(imageData.createdAt),
      alreadyLinked: result?.alreadyLinked === true,
    };
  }

  async function linkBrowseImage(entry: BrowseImageLibraryEntry) {
    if (
      isLinkingBrowseImageKey ||
      isUnlinkingBrowseImageKey ||
      isDeletingImage ||
      isSaving ||
      isDeletingItem ||
      isLoading
    ) {
      return;
    }

    const key = entry.s3Key.trim();
    if (!key) {
      return;
    }

    const alreadyOnForm = form.images.some((image) => {
      const imageKey = image.s3Key?.trim() ?? "";
      return imageKey === key || image.url.trim() === entry.url;
    });

    if (alreadyOnForm || entry.linkedToCatalogItem) {
      setSaveError(null);
      setSuccessMessage("This image is already linked to this item.");
      return;
    }

    setIsLinkingBrowseImageKey(key);
    setSaveError(null);

    try {
      const linkedImage = await linkUploadedImage(key);

      setForm((prev) => mergeLinkedImageIntoForm(prev, linkedImage, entry.url));
      setBrowseImages((prev) =>
        prev.map((image) =>
          image.s3Key === key
            ? {
                ...image,
                linkedToCatalogItem: true,
                usageCount:
                  image.usageCount + (linkedImage.alreadyLinked ? 0 : 1),
                lastLinkedAt: linkedImage.createdAt ?? image.lastLinkedAt,
              }
            : image,
        ),
      );
      setSuccessMessage(
        linkedImage.alreadyLinked
          ? "This image was already linked to this item."
          : "Image linked successfully.",
      );
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to link image.",
      );
    } finally {
      setIsLinkingBrowseImageKey(null);
    }
  }

  async function unlinkBrowseImage(
    entry: BrowseImageLibraryEntry,
    deleteFromStorage: boolean,
  ) {
    if (
      isUnlinkingBrowseImageKey ||
      isLinkingBrowseImageKey ||
      isDeletingImage ||
      isSaving ||
      isDeletingItem ||
      isLoading
    ) {
      return;
    }

    const key = entry.s3Key.trim();
    if (!key) {
      return;
    }

    const linkedImageRecord = form.images.find(
      (image) => (image.s3Key?.trim() ?? "") === key && image.id != null,
    );

    if (!linkedImageRecord?.id) {
      setSaveError(
        "Cannot unlink this image because no image link record was found.",
      );
      return;
    }

    const linkedCountForKey = form.images.filter(
      (image) => (image.s3Key?.trim() ?? "") === key,
    ).length;

    setIsUnlinkingBrowseImageKey(key);
    setSaveError(null);
    setPendingBrowseImageDelete(null);

    try {
      const response = await fetch("/api/catalog/staff/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: linkedImageRecord.id,
          deleteFromStorage,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: unknown;
        details?: unknown;
      };

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Failed to unlink image (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      setForm((prev) => {
        const nextImages = prev.images.filter(
          (image) => image.id !== linkedImageRecord.id,
        );
        return {
          ...prev,
          images: withFallbackImage(nextImages),
        };
      });
      setBrowseImages((prev) =>
        prev
          .map((image) =>
            image.s3Key === key
              ? {
                  ...image,
                  linkedToCatalogItem: linkedCountForKey > 1,
                  usageCount: Math.max(0, image.usageCount - 1),
                }
              : image,
          )
          .filter((image) =>
            image.s3Key === key
              ? deleteFromStorage
                ? false
                : image.usageCount > 0
              : true,
          ),
      );
      setSuccessMessage("Image unlinked from this item.");
      if (deleteFromStorage) {
        setSuccessMessage("Image unlinked and deleted from storage.");
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to unlink image.",
      );
    } finally {
      setIsUnlinkingBrowseImageKey(null);
    }
  }

  function requestUnlinkBrowseImage(entry: BrowseImageLibraryEntry) {
    const referenceCount = Math.max(0, entry.usageCount);
    if (referenceCount <= 1) {
      setPendingBrowseImageDelete({ entry });
      return;
    }

    void unlinkBrowseImage(entry, false);
  }

  async function unlinkImageReference(
    reference: BrowseImageReference,
    key: string,
    deleteFromStorage: boolean,
  ) {
    if (
      isUnlinkingReferenceImageId != null ||
      isUnlinkingBrowseImageKey ||
      isLinkingBrowseImageKey ||
      isDeletingImage ||
      isSaving ||
      isDeletingItem ||
      isLoading
    ) {
      return;
    }

    setIsUnlinkingReferenceImageId(reference.imageId);
    setBrowseImageDetailsError(null);
    setSaveError(null);
    setPendingReferenceDelete(null);

    try {
      const response = await fetch("/api/catalog/staff/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: reference.imageId,
          deleteFromStorage,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: unknown;
        details?: unknown;
      };

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Failed to unlink image (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      const remainingReferences = (browseImageDetails?.references ?? []).filter(
        (entry) => entry.imageId !== reference.imageId,
      );
      const usageCount = remainingReferences.length;
      const linkedToCurrentItem = remainingReferences.some(
        (entry) => entry.catalogItemId === id,
      );

      setBrowseImageDetails((prev) =>
        prev && prev.s3Key === key
          ? {
              ...prev,
              references: remainingReferences,
            }
          : prev,
      );
      setBrowseImages((current) =>
        current
          .map((image) =>
            image.s3Key === key
              ? {
                  ...image,
                  usageCount,
                  linkedToCatalogItem: linkedToCurrentItem,
                }
              : image,
          )
          .filter((image) => image.usageCount > 0),
      );

      if (reference.catalogItemId === id) {
        setForm((prev) => {
          const nextImages = prev.images.filter(
            (image) => image.id !== reference.imageId,
          );
          return {
            ...prev,
            images: withFallbackImage(nextImages),
          };
        });
      }

      setSuccessMessage(
        deleteFromStorage
          ? `Image unlinked from ${reference.itemName} (Item #${reference.catalogItemId}) and deleted from storage.`
          : `Image unlinked from ${reference.itemName} (Item #${reference.catalogItemId}).`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unlink image.";
      setBrowseImageDetailsError(message);
      setSaveError(message);
    } finally {
      setIsUnlinkingReferenceImageId(null);
    }
  }

  function requestUnlinkImageReference(
    reference: BrowseImageReference,
    key: string,
  ) {
    const referenceCount = browseImageDetails?.references.length ?? 0;

    if (referenceCount <= 1) {
      setPendingReferenceDelete({ reference, key });
      return;
    }

    void unlinkImageReference(reference, key, false);
  }

  const draggingImage =
    imagePointerDrag !== null
      ? (form.images[imagePointerDrag.imageIndex] ?? null)
      : null;
  const targetClassificationForModal =
    form.classifications.find(
      (classification) =>
        classification.localId === categoryModalTargetClassificationId,
    ) ??
    form.classifications[0] ??
    null;
  const linkedBrowseImageKeySet = useMemo(
    () =>
      new Set(
        form.images
          .map((image) => image.s3Key?.trim() ?? "")
          .filter((key) => key.length > 0),
      ),
    [form.images],
  );
  const sortedBrowseImages = useMemo(
    () =>
      [...browseImages].sort((a, b) => {
        const aLinked =
          a.linkedToCatalogItem || linkedBrowseImageKeySet.has(a.s3Key);
        const bLinked =
          b.linkedToCatalogItem || linkedBrowseImageKeySet.has(b.s3Key);

        if (aLinked === bLinked) {
          return 0;
        }

        return aLinked ? -1 : 1;
      }),
    [browseImages, linkedBrowseImageKeySet],
  );
  return (
    <div>
      <div className="item-edit-page-header">
        <div>
          <div className="staffTitle">Edit Catalog Item</div>
          <div className="staffSubtitle">
            Edit attributes of this catalog item. Created and updated dates are
            generated automatically.
          </div>
        </div>
        <div className="staff-dev-back-wrapper">
          <Link href={backToItemSearchHref} className="staff-dev-pill">
            &larr; Back to Item Search
          </Link>
        </div>
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <form className="item-edit-form">
            <div className="item-edit-grid">
              <div className="item-edit-grid-1">
                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("itemName"))}>
                    Item Name *
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    value={form.itemName}
                    onChange={update("itemName")}
                  />
                </label>

                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("sku"))}>
                    SKU *
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    value={form.sku}
                    onChange={update("sku")}
                  />
                </label>

                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("price"))}>
                    Price *
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    inputMode="decimal"
                    value={form.price}
                    onChange={update("price")}
                    placeholder="0.00"
                    pattern="^\\d{0,8}(\\.\\d{0,2})?$"
                    maxLength={11}
                  />
                </label>

                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("unitCost"))}>
                    Unit Cost *
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    inputMode="decimal"
                    value={form.unitCost}
                    onChange={update("unitCost")}
                    placeholder="0.00"
                    pattern="^\\d{0,8}(\\.\\d{0,2})?$"
                    maxLength={11}
                  />
                </label>

                <label className="item-edit-field">
                  <div>
                    <span
                      className={fieldNameClass(
                        isFieldDirty("quantityInStock"),
                      )}
                    >
                      Quantity In Stock *
                    </span>
                    <input
                      className="item-search-page__search-input"
                      type="number"
                      min={0}
                      step={1}
                      value={form.quantityInStock}
                      onChange={update("quantityInStock")}
                    />
                  </div>
                </label>

                <label className="item-edit-field">
                  <span
                    className={fieldNameClass(isFieldDirty("reorderLevel"))}
                  >
                    Reorder Level *
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="number"
                    min={0}
                    step={1}
                    value={form.reorderLevel}
                    onChange={update("reorderLevel")}
                  />
                </label>
              </div>

              <div className="item-edit-grid-2">
                <div className="item-edit-classifications-panel">
                  <div className="item-edit-classifications-header">
                    <span
                      className={fieldNameClass(
                        isFieldDirty("classifications"),
                      )}
                    >
                      Classifications
                    </span>
                    <button
                      type="button"
                      className="ticket-add-line-btn"
                      onClick={addClassificationLine}
                      aria-label="Add classification set"
                      title="Add classification set"
                    >
                      +
                    </button>
                  </div>

                  <div className="item-edit-classifications-grid item-edit-classifications-grid--header">
                    <div>Category</div>
                    <div>Subcategory</div>
                    <div>Type</div>
                    <div>Action</div>
                  </div>

                  {form.classifications.map((classification) => (
                    <div
                      key={classification.localId}
                      className="item-edit-classifications-grid"
                    >
                      <CategoryCombo
                        ariaLabel="Category"
                        value={classification.category3}
                        placeholder="Select category"
                        options={categories}
                        onSelect={(nextCategory) =>
                          handleClassificationCategoryChange(
                            classification.localId,
                            nextCategory,
                          )
                        }
                        onNewClick={() =>
                          openNewCategoryPopup(
                            "category3",
                            classification.localId,
                          )
                        }
                      />
                      <CategoryCombo
                        ariaLabel="Subcategory"
                        value={classification.category2}
                        placeholder="Select subcategory"
                        options={
                          subcategoryOptionsByClassificationId[
                            classification.localId
                          ] ?? []
                        }
                        onSelect={(nextSubcategory) =>
                          handleClassificationSubcategoryChange(
                            classification.localId,
                            nextSubcategory,
                          )
                        }
                        onNewClick={() =>
                          openNewCategoryPopup(
                            "category2",
                            classification.localId,
                          )
                        }
                      />
                      <CategoryCombo
                        ariaLabel="Type"
                        value={classification.category1}
                        placeholder="Select type"
                        options={
                          typeOptionsByClassificationId[
                            classification.localId
                          ] ?? []
                        }
                        onSelect={(nextType) =>
                          handleClassificationTypeChange(
                            classification.localId,
                            nextType,
                          )
                        }
                        onNewClick={() =>
                          openNewCategoryPopup(
                            "category1",
                            classification.localId,
                          )
                        }
                      />
                      <button
                        type="button"
                        className="ticket-line-remove-btn"
                        onClick={() =>
                          removeClassificationLine(classification.localId)
                        }
                        disabled={form.classifications.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="item-edit-grid-3">
                <label className="item-edit-field">
                  <span
                    className={fieldNameClass(isFieldDirty("unitOfMeasure"))}
                  >
                    Unit Of Measure
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    value={form.unitOfMeasure}
                    onChange={update("unitOfMeasure")}
                    onBlur={blurNA("unitOfMeasure")}
                  />
                </label>

                <label className="item-edit-field">
                  <span
                    className={fieldNameClass(isFieldDirty("storageLocation"))}
                  >
                    Storage Location
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="text"
                    value={form.storageLocation}
                    onChange={update("storageLocation")}
                    onBlur={blurNA("storageLocation")}
                  />
                </label>

                <label className="item-edit-field">
                  <span
                    className={fieldNameClass(isFieldDirty("dateAcquired"))}
                  >
                    Date Acquired
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="date"
                    value={
                      form.dateAcquired && form.dateAcquired !== "N/A"
                        ? form.dateAcquired.split("T")[0]
                        : ""
                    }
                    onChange={update("dateAcquired")}
                  />
                </label>

                <label className="item-edit-field">
                  <span
                    className={fieldNameClass(isFieldDirty("expirationDate"))}
                  >
                    Expiration Date
                  </span>
                  <input
                    className="item-search-page__search-input"
                    type="date"
                    value={
                      form.expirationDate && form.expirationDate !== "N/A"
                        ? form.expirationDate.split("T")[0]
                        : ""
                    }
                    onChange={update("expirationDate")}
                  />
                </label>
              </div>
            </div>

            <div className="item-edit-grid-4">
              <label className="item-edit-field">
                <span className={fieldNameClass(isFieldDirty("description"))}>
                  Description
                </span>
                <textarea
                  className="item-edit-textarea"
                  value={form.description}
                  onChange={update("description")}
                  onBlur={blurNA("description")}
                />
              </label>

              <label className="item-edit-field">
                <div className="account-management__notes-label-row">
                  <span
                    className={fieldNameClass(
                      isFieldDirty("storageConditions"),
                    )}
                  >
                    Storage Conditions
                  </span>
                  <span
                    className={`${fieldNameClass(
                      isFieldDirty("storageConditions"),
                    )} account-management__notes-count`}
                  >
                    {form.storageConditions.length}/
                    {STORAGE_CONDITIONS_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  className="item-edit-textarea"
                  value={form.storageConditions}
                  onChange={update("storageConditions")}
                  onBlur={blurNA("storageConditions")}
                  maxLength={STORAGE_CONDITIONS_MAX_LENGTH}
                />
              </label>

              <div className="item-edit-field">
                <strong className="item-edit-label">Images:</strong>
                <div className="item-edit-actions">
                  <div style={{ width: "100%" }}>
                    <ImageUpload
                      uploadButtonText="Upload Image"
                      autoUpload={false}
                      showManualUploadButton={false}
                      onFileSelected={(file) => {
                        const pendingUploadId = createPendingUploadId();
                        const previewUrl = URL.createObjectURL(file);
                        pendingLocalUploadsRef.current.set(pendingUploadId, {
                          file,
                          previewUrl,
                        });

                        setForm(
                          (prev) =>
                            ({
                              ...prev,
                              images: [
                                ...(prev.images.length === 1 &&
                                prev.images[0]?.url === "/FillerImage.webp"
                                  ? []
                                  : prev.images),
                                {
                                  id: null,
                                  s3Key: null,
                                  sortOrder: null,
                                  url: previewUrl,
                                  createdAt: null,
                                  pendingUploadId,
                                },
                              ],
                            }) satisfies ItemForm,
                        );
                        setSuccessMessage(
                          "Image selected. It will upload to S3 and link when you save changes.",
                        );
                        setSaveError(null);
                      }}
                      onError={(message) => {
                        setSaveError(message);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openBrowseImagesPopup}
                    className="staff-dev-pill"
                    aria-label="Browse images"
                    disabled={
                      isDeletingImage || isSaving || isDeletingItem || isLoading
                    }
                    title="Browse images"
                  >
                    Browse Images
                  </button>
                </div>

                <div className="item-image-grid">
                  {form.images.map((img, i) => {
                    const isDraggingSource = imagePointerDrag?.imageIndex === i;
                    const isDragOverTarget =
                      imagePointerDrag !== null &&
                      imageDragOverIndex === i &&
                      imagePointerDrag.imageIndex !== i;

                    return (
                      <button
                        key={`${img.id ?? "temp"}-${img.url}-${i}`}
                        type="button"
                        ref={(element) => {
                          if (element) {
                            imageThumbRefs.current.set(i, element);
                            return;
                          }

                          imageThumbRefs.current.delete(i);
                        }}
                        onPointerDown={(event) =>
                          handleImagePointerDown(event, i)
                        }
                        aria-label={`Image ${i + 1}`}
                        className={`item-image-thumb-button${isDraggingSource ? " item-image-thumb-button--dragging" : ""}${isDragOverTarget ? " item-image-thumb-button--drop-target" : ""}`}
                      >
                        <Image
                          className="product-carousel-thumb-img item-image-thumb"
                          src={img.url}
                          alt={`Image ${i + 1} of ${form.itemName || "item"}`}
                          width={1000}
                          height={1000}
                          priority
                        />
                      </button>
                    );
                  })}
                </div>

                {imagePointerDrag && draggingImage ? (
                  <div
                    className="item-image-drag-overlay"
                    style={{
                      width: `${imagePointerDrag.width}px`,
                      transform: `translate(${Math.round(imagePointerDrag.pointerX - imagePointerDrag.offsetX)}px, ${Math.round(imagePointerDrag.pointerY - imagePointerDrag.offsetY)}px)`,
                    }}
                  >
                    <div className="item-image-drag-card">
                      <Image
                        src={draggingImage.url}
                        alt={`Dragging image ${imagePointerDrag.imageIndex + 1}`}
                        width={1000}
                        height={1000}
                        className="item-image-drag-preview-img"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {saveError && (
                <div className="item-edit-status error">{saveError}</div>
              )}
              {successMessage && (
                <div className="item-edit-status success">{successMessage}</div>
              )}
            </div>

            <div className="item-edit-actions">
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={openDeleteConfirmation}
                disabled={
                  isLoading ||
                  !!loadError ||
                  isSaving ||
                  isDeletingImage ||
                  isDeletingItem
                }
                title="Delete this catalog item"
              >
                {isDeletingItem ? "Deleting..." : "Delete Item"}
              </button>
              <button
                type="button"
                className="staff-dev-pill"
                onClick={resetChanges}
                disabled={isSaving || isDeletingImage || isDeletingItem}
                title="Reset all changes"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={saveChanges}
                onPointerDown={resetSuccessMessage}
                className={`staff-dev-pill${isDirty ? " staff-dev-pill--ready" : ""}`}
                disabled={
                  isLoading ||
                  !!loadError ||
                  isSaving ||
                  isDeletingImage ||
                  isDeletingItem ||
                  !isDirty
                }
                title={isDirty ? "Save changes" : "No new changes to save"}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryCreateModal
        isOpen={showNewCategoryPopup}
        level={newCategoryLevel}
        categories={categories}
        defaultParentCategory3={
          newCategoryLevel === "category3"
            ? ""
            : (targetClassificationForModal?.category3.trim() ?? "")
        }
        defaultParentCategory2={
          newCategoryLevel === "category1"
            ? (targetClassificationForModal?.category2.trim() ?? "")
            : ""
        }
        onClose={closeNewCategoryPopup}
        onCreated={handleCategoryCreated}
      />

      {isBrowseImagesPopupOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse Images"
          className="item-category-modal"
          onPointerDown={browseImagesBackdropHandlers.onPointerDown}
          onClick={browseImagesBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Browse Images</div>

            <div className="item-category-form item-browse-images-form">
              <div className="item-browse-images-toolbar">
                <form
                  className="item-browse-images-search-form"
                  onSubmit={handleBrowseItemSearchSubmit}
                >
                  <div className="item-search-page__search-bar">
                    <div className="item-search-page__search-input-wrap">
                      <input
                        type="text"
                        className="item-search-page__search-input item-browse-images-search"
                        value={browseItemSearchInput}
                        onChange={(event) =>
                          setBrowseItemSearchInput(event.target.value)
                        }
                        placeholder="Search by SKU or Name"
                        disabled={
                          isLoadingBrowseImages ||
                          !!isLinkingBrowseImageKey ||
                          !!isUnlinkingBrowseImageKey
                        }
                      />
                      {(browseItemSearchInput || browseItemSearchQuery) && (
                        <button
                          type="button"
                          className="item-search-page__search-clear"
                          onClick={handleClearBrowseItemSearch}
                          aria-label="Clear search"
                          disabled={
                            isLoadingBrowseImages ||
                            !!isLinkingBrowseImageKey ||
                            !!isUnlinkingBrowseImageKey
                          }
                        >
                          x
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="item-search-page__search-submit"
                      aria-label="Search catalog items"
                      disabled={
                        isLoadingBrowseImages ||
                        !!isLinkingBrowseImageKey ||
                        !!isUnlinkingBrowseImageKey
                      }
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

                <button
                  type="button"
                  className="staff-dev-pill"
                  onClick={() => void loadBrowseImages()}
                  disabled={
                    isLoadingBrowseImages ||
                    !!isLinkingBrowseImageKey ||
                    !!isUnlinkingBrowseImageKey
                  }
                >
                  {isLoadingBrowseImages ? "Loading..." : "Refresh"}
                </button>
              </div>

              {pendingBrowseImageDelete ? (
                <div className="category-mgmt-delete-warning item-browse-image-delete-warning">
                  <p>
                    This is the last linked item for this image. Continuing will
                    unlink it and permanently delete the image from storage.
                  </p>
                  <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
                    <button
                      type="button"
                      className="staff-dev-pill"
                      onClick={() => setPendingBrowseImageDelete(null)}
                      disabled={!!isUnlinkingBrowseImageKey}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="staff-dev-pill staff-dev-pill--danger"
                      onClick={() =>
                        void unlinkBrowseImage(
                          pendingBrowseImageDelete.entry,
                          true,
                        )
                      }
                      disabled={!!isUnlinkingBrowseImageKey}
                    >
                      {isUnlinkingBrowseImageKey
                        ? "Deleting..."
                        : "Unlink & Delete Image"}
                    </button>
                  </div>
                </div>
              ) : null}

              {browseImagesError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {browseImagesError}
                </div>
              ) : null}

              {!browseImagesError && isLoadingBrowseImages ? (
                <div className="item-browse-images-state">
                  Loading linked image library...
                </div>
              ) : null}

              {!browseImagesError &&
              !isLoadingBrowseImages &&
              browseImages.length === 0 ? (
                <div className="item-browse-images-state">
                  {browseItemSearchQuery
                    ? "No images found for matching catalog items."
                    : "No linked images found."}
                </div>
              ) : null}

              {!browseImagesError &&
              !isLoadingBrowseImages &&
              browseImages.length > 0 ? (
                <div className="item-browse-images-grid">
                  {sortedBrowseImages.map((entry) => {
                    const linkedImageRecord =
                      form.images.find(
                        (image) =>
                          (image.s3Key?.trim() ?? "") === entry.s3Key &&
                          image.id != null,
                      ) ?? null;
                    const isAlreadyLinked =
                      entry.linkedToCatalogItem || linkedImageRecord !== null;
                    const isLinkingThisImage =
                      isLinkingBrowseImageKey === entry.s3Key;
                    const isUnlinkingThisImage =
                      isUnlinkingBrowseImageKey === entry.s3Key;
                    const isActionInProgress =
                      !!isLinkingBrowseImageKey || !!isUnlinkingBrowseImageKey;
                    const linkDisabled =
                      isAlreadyLinked ||
                      isActionInProgress ||
                      isSaving ||
                      isDeletingImage ||
                      isDeletingItem;
                    const unlinkDisabled =
                      linkedImageRecord === null ||
                      isActionInProgress ||
                      isSaving ||
                      isDeletingImage ||
                      isDeletingItem;

                    return (
                      <div
                        key={entry.s3Key}
                        className={`item-browse-images-card${isAlreadyLinked ? " item-browse-images-card--linked" : ""}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => void openBrowseImageDetails(entry)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void openBrowseImageDetails(entry);
                          }
                        }}
                      >
                        <div className="item-browse-images-preview">
                          <Image
                            src={entry.url}
                            alt={`Linked image ${entry.s3Key}`}
                            width={600}
                            height={450}
                            className="item-browse-images-preview-img"
                          />
                        </div>
                        <div className="item-browse-images-meta">
                          <div
                            className="item-browse-images-key"
                            title={entry.s3Key}
                          >
                            {entry.s3Key}
                          </div>
                          <div className="item-browse-images-usage">
                            Used by {entry.usageCount} item
                            {entry.usageCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        {isAlreadyLinked ? (
                          <button
                            type="button"
                            className="staff-dev-pill staff-dev-pill--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              requestUnlinkBrowseImage(entry);
                            }}
                            disabled={
                              unlinkDisabled || pendingBrowseImageDelete != null
                            }
                          >
                            {linkedImageRecord === null
                              ? "Linked"
                              : isUnlinkingThisImage
                                ? "Unlinking..."
                                : "Unlink"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="staff-dev-pill"
                            onClick={(event) => {
                              event.stopPropagation();
                              void linkBrowseImage(entry);
                            }}
                            disabled={linkDisabled}
                          >
                            {isLinkingThisImage ? "Linking..." : "Use Image"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="item-category-form__actions category-mgmt-edit-modal__actions">
              <button
                type="button"
                onClick={closeBrowseImagesPopup}
                className="staff-dev-pill"
                disabled={
                  !!isLinkingBrowseImageKey || !!isUnlinkingBrowseImageKey
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isBrowseImageDetailsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Reference Details"
          className="item-category-modal item-browse-image-details-modal"
          onPointerDown={browseImageDetailsBackdropHandlers.onPointerDown}
          onClick={browseImageDetailsBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content staffTaskCreateModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Image References</div>

            {browseImageDetails ? (
              <div className="item-browse-image-details-layout">
                <div className="item-browse-image-details-preview">
                  <Image
                    src={browseImageDetails.url}
                    alt={`Image preview ${browseImageDetails.s3Key}`}
                    width={960}
                    height={720}
                    className="item-browse-image-details-preview-img"
                  />
                </div>

                <div className="item-browse-image-details-key">
                  {browseImageDetails.s3Key}
                </div>

                {pendingReferenceDelete ? (
                  <div className="category-mgmt-delete-warning item-browse-image-delete-warning">
                    <p>
                      This is the last linked item for this image. Continuing
                      will unlink it and permanently delete the image from
                      storage.
                    </p>
                    <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
                      <button
                        type="button"
                        className="staff-dev-pill"
                        onClick={() => setPendingReferenceDelete(null)}
                        disabled={isUnlinkingReferenceImageId != null}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="staff-dev-pill staff-dev-pill--danger"
                        onClick={() =>
                          void unlinkImageReference(
                            pendingReferenceDelete.reference,
                            pendingReferenceDelete.key,
                            true,
                          )
                        }
                        disabled={isUnlinkingReferenceImageId != null}
                      >
                        {isUnlinkingReferenceImageId != null
                          ? "Deleting..."
                          : "Unlink & Delete Image"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {browseImageDetailsError ? (
                  <div className="item-category-form__status item-category-form__status--error">
                    {browseImageDetailsError}
                  </div>
                ) : null}

                {isLoadingBrowseImageDetails ? (
                  <div className="item-browse-images-state">
                    Loading reference list...
                  </div>
                ) : null}

                {!isLoadingBrowseImageDetails &&
                browseImageDetails.references.length === 0 ? (
                  <div className="item-browse-images-state">
                    No linked items found for this image.
                  </div>
                ) : null}

                {!isLoadingBrowseImageDetails &&
                browseImageDetails.references.length > 0 ? (
                  <div className="item-browse-image-ref-list">
                    {browseImageDetails.references.map((reference) => {
                      const isCurrentItem = reference.catalogItemId === id;
                      const isUnlinkingThisReference =
                        isUnlinkingReferenceImageId === reference.imageId;

                      return (
                        <div
                          key={reference.imageId}
                          className={`item-browse-image-ref-row${isCurrentItem ? " item-browse-image-ref-row--current" : ""}`}
                        >
                          <div className="item-browse-image-ref-text">
                            <strong>
                              {reference.itemName} (Item #
                              {reference.catalogItemId})
                            </strong>
                            <span>
                              SKU:{" "}
                              {reference.sku?.trim() ? reference.sku : "N/A"}
                              {isCurrentItem ? " - Current item" : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="staff-dev-pill staff-dev-pill--danger"
                            onClick={() =>
                              requestUnlinkImageReference(
                                reference,
                                browseImageDetails.s3Key,
                              )
                            }
                            disabled={
                              isUnlinkingReferenceImageId != null ||
                              pendingReferenceDelete != null
                            }
                          >
                            {isUnlinkingThisReference
                              ? "Unlinking..."
                              : "Unlink"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="item-category-form__actions category-mgmt-edit-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeBrowseImageDetailsPopup}
                disabled={isUnlinkingReferenceImageId != null}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Item"
          className="item-category-modal"
          onPointerDown={deleteConfirmationBackdropHandlers.onPointerDown}
          onClick={deleteConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to delete this item?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                This permanently deletes{" "}
                <strong>{form.itemName.trim() || `Item #${id}`}</strong> and
                cannot be undone.
              </p>
            </div>
            <label className="category-mgmt-delete-confirm">
              <input
                type="checkbox"
                checked={deleteConfirmChecked}
                onChange={(event) =>
                  setDeleteConfirmChecked(event.target.checked)
                }
                disabled={isDeletingItem}
              />
              I understand this deletion impact.
            </label>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingItem}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void deleteItem()}
                disabled={isDeletingItem || !deleteConfirmChecked}
              >
                {isDeletingItem ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function StaffItemEditPage() {
  return (
    <React.Suspense fallback={null}>
      <StaffItemEditPageContent />
    </React.Suspense>
  );
}
