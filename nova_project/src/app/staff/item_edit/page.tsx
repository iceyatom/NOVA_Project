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
import CategoryCreateModal, {
  type CategoryLevel,
} from "@/app/components/CategoryCreateModal";

type ItemImage = {
  id: number | null;
  s3Key: string | null;
  url: string;
  createdAt: string | null;
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
    createdAt?: unknown;
  };
  error?: unknown;
  details?: unknown;
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
          url,
          createdAt: getNullableString(image.createdAt),
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
        url,
        createdAt: null,
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
        url,
        createdAt: null,
      }));
    }
  }

  return [
    {
      id: null,
      s3Key: null,
      url: "/FillerImage.webp",
      createdAt: null,
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
          url: "/FillerImage.webp",
          createdAt: null,
        },
      ];
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
  const { images: _images, ...rest } = normalized;
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
          url: "/FillerImage.webp",
          createdAt: null,
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
  const [isDeletingImage, setIsDeletingImage] = useState<boolean>(false);
  const [isDeletingItem, setIsDeletingItem] = useState<boolean>(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false);
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const originalRef = useRef<ItemForm>(form);

  const isDirty = useMemo(
    () => !sameNonImageForm(form, originalRef.current),
    [form],
  );
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
        setSelectedImageIndex(null);
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

    const payload = {
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

    setIsSaving(true);
    setSaveError(null);

    try {
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

      const refreshedItem = parseCatalogItem(refreshedPayload.data);

      if (!refreshedItem) {
        throw new Error("Failed to parse refreshed item data.");
      }

      const nextForm = toForm(refreshedItem);
      setForm(nextForm);
      setNextClassificationDraftId(
        getNextClassificationDraftId(nextForm.classifications),
      );
      setCategoryModalTargetClassificationId(
        nextForm.classifications[0]?.localId ?? 1,
      );
      void hydrateClassificationOptions(nextForm.classifications);
      originalRef.current = structuredClone(nextForm);
      setSelectedImageIndex(null);
      setSuccessMessage("Item edit changes saved.");
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

    const snapshot = structuredClone(originalRef.current);
    setForm(snapshot);
    setNextClassificationDraftId(
      getNextClassificationDraftId(snapshot.classifications),
    );
    setCategoryModalTargetClassificationId(
      snapshot.classifications[0]?.localId ?? 1,
    );
    void hydrateClassificationOptions(snapshot.classifications);
    setSelectedImageIndex(null);
    setSaveError(null);
    setSuccessMessage(null);
  }

  function resetSuccessMessage() {
    setSuccessMessage(null);
  }

  async function removeImage() {
    if (selectedImageIndex === null || isDeletingImage || isDeletingItem) {
      return;
    }

    const selectedImage = form.images[selectedImageIndex];
    if (!selectedImage) {
      return;
    }

    if (selectedImage.id == null) {
      setForm((prev) => {
        const nextImages = prev.images.filter(
          (_, i) => i !== selectedImageIndex,
        );
        return { ...prev, images: withFallbackImage(nextImages) };
      });
      setSelectedImageIndex(null);
      return;
    }

    setIsDeletingImage(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/catalog/staff/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: selectedImage.id,
          deleteFromStorage: true,
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
            : `Failed to delete image (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      setForm((prev) => {
        const nextImages = prev.images.filter(
          (_, i) => i !== selectedImageIndex,
        );
        return { ...prev, images: withFallbackImage(nextImages) };
      });
      setSelectedImageIndex(null);
      setSuccessMessage("Image unlinked successfully.");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to delete image.",
      );
    } finally {
      setIsDeletingImage(false);
    }
  }

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
      createdAt: getNullableString(imageData.createdAt),
    };
  }

  const selectedImage =
    selectedImageIndex !== null
      ? (form.images[selectedImageIndex] ?? null)
      : null;
  const targetClassificationForModal =
    form.classifications.find(
      (classification) =>
        classification.localId === categoryModalTargetClassificationId,
    ) ??
    form.classifications[0] ??
    null;

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
                      onUploadSuccess={async (fileUrl, fileKey) => {
                        try {
                          const linkedImage = await linkUploadedImage(fileKey);

                          setForm((prev) => {
                            const nextImages =
                              prev.images.length === 1 &&
                              prev.images[0]?.url === "/FillerImage.webp"
                                ? []
                                : prev.images;

                            return {
                              ...prev,
                              images: [
                                ...nextImages,
                                {
                                  id: linkedImage.id,
                                  s3Key: linkedImage.s3Key,
                                  url: fileUrl,
                                  createdAt: linkedImage.createdAt,
                                },
                              ],
                            };
                          });

                          setSuccessMessage(
                            "Image uploaded and linked successfully.",
                          );
                          setSaveError(null);
                        } catch (error) {
                          setSaveError(
                            error instanceof Error
                              ? error.message
                              : "Failed to link uploaded image.",
                          );
                        }
                      }}
                      onUploadError={(message) => {
                        setSaveError(message);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeImage()}
                    className="staff-dev-pill item-edit-remove-image-button"
                    aria-label="Remove selected image"
                    disabled={
                      selectedImageIndex === null ||
                      isDeletingImage ||
                      isSaving ||
                      isDeletingItem
                    }
                    title={
                      selectedImageIndex === null
                        ? "Click an image to select it first"
                        : "Delete selected image"
                    }
                    style={{ opacity: selectedImageIndex === null ? 0.6 : 1 }}
                  >
                    {isDeletingImage ? "Deleting..." : "Delete Image"}
                  </button>
                </div>

                <div className="item-image-grid">
                  {form.images.map((img, i) => {
                    const isSelected = selectedImageIndex === i;

                    return (
                      <button
                        key={`${img.id ?? "temp"}-${img.url}-${i}`}
                        type="button"
                        onClick={() =>
                          setSelectedImageIndex((cur) => (cur === i ? null : i))
                        }
                        aria-pressed={isSelected}
                        aria-label={`Select image ${i + 1}`}
                        className={`item-image-thumb-button${isSelected ? " item-image-thumb-button--selected" : ""}`}
                      >
                        <Image
                          className={`product-carousel-thumb-img item-image-thumb${isSelected ? " item-image-thumb--selected" : ""}`}
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

                {selectedImageIndex !== null && selectedImage && (
                  <div className="item-edit-selected-images">
                    Selected image: {selectedImageIndex + 1}
                  </div>
                )}
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
