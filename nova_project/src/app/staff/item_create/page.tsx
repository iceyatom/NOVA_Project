"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import CategoryCombo from "@/app/components/CategoryCombo";
import ImageUpload from "@/app/components/ImageUpload";
import CategoryCreateModal, {
  type CategoryLevel,
} from "@/app/components/CategoryCreateModal";
import { Suspense, useMemo, useState, useEffect } from "react";

type ItemImage = {
  id: number | null;
  s3Key: string | null;
  url: string;
  createdAt: string | null;
};

type CreateItemClassificationDraft = {
  localId: number;
  category3: string;
  category2: string;
  category1: string;
};

type CreateItemForm = {
  sku: string;
  itemName: string;
  price: string;
  classifications: CreateItemClassificationDraft[];
  description: string;
  quantityInStock: string;
  unitOfMeasure: string;
  storageLocation: string;
  storageConditions: string;
  expirationDate: string;
  dateAcquired: string;
  reorderLevel: string;
  unitCost: string;
  images: ItemImage[];
};

const INITIAL_FORM: CreateItemForm = {
  sku: "",
  itemName: "",
  price: "0",
  classifications: [
    {
      localId: 1,
      category3: "",
      category2: "",
      category1: "",
    },
  ],
  description: "",
  quantityInStock: "0",
  unitOfMeasure: "",
  storageLocation: "",
  storageConditions: "",
  expirationDate: "",
  dateAcquired: "",
  reorderLevel: "0",
  unitCost: "0",
  images: [
    {
      id: null,
      s3Key: null,
      url: "/FillerImage.webp",
      createdAt: null,
    },
  ],
};

const STORAGE_CONDITIONS_MAX_LENGTH = 500;

function isValidMoney(value: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return false;
  return Number(value) >= 0;
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

function asPositiveIntegerOrZero(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}

function asNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

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

function getNextClassificationDraftId(
  classifications: CreateItemClassificationDraft[],
): number {
  return (
    classifications.reduce(
      (maxId, classification) => Math.max(maxId, classification.localId),
      0,
    ) + 1
  );
}

type CreateApiResponse = {
  success?: boolean;
  data?: {
    id?: unknown;
  };
  error?: unknown;
  details?: unknown;
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

function StaffItemCreatePageContent() {
  const searchParams = useSearchParams();
  const backToItemSearchHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/staff/item_search?${query}` : "/staff/item_search";
  }, [searchParams]);

  const [form, setForm] = useState<CreateItemForm>(INITIAL_FORM);
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isZeroValueConfirmationOpen, setIsZeroValueConfirmationOpen] =
    useState(false);
  const [zeroValueFields, setZeroValueFields] = useState<string[]>([]);

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

  const fetchSubcategories = async (category: string): Promise<string[]> => {
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
  };

  const fetchTypes = async (
    category: string,
    subcategory: string,
  ): Promise<string[]> => {
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
  };

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

  // Dynamically loads top-level categories from the category3 table API.
  useEffect(() => {
    void fetchCategories();
  }, []);

  const canSubmit = useMemo(
    () => !isSaving && !isDeletingImage,
    [isSaving, isDeletingImage],
  );

  const update =
    <K extends keyof CreateItemForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        key === "price" || key === "unitCost"
          ? sanitizeMoneyInput(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
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

  function validate(): string | null {
    if (!form.itemName.trim()) return "Item name is required.";
    if (!form.sku.trim()) return "SKU is required.";
    if (!form.price.trim()) return "Price is required.";
    if (!isValidMoney(form.price)) {
      return "Price must be a non-negative number with up to 2 decimals.";
    }

    if (!/^\d+$/.test(form.quantityInStock.trim())) {
      return "Quantity in stock must be a whole number.";
    }

    if (!/^\d+$/.test(form.reorderLevel.trim())) {
      return "Reorder level must be a whole number.";
    }

    if (!form.unitCost.trim()) return "Unit cost is required.";
    if (!isValidMoney(form.unitCost)) {
      return "Unit cost must be a non-negative number with up to 2 decimals.";
    }

    if (form.classifications.length === 0) {
      return "At least one classification row is required.";
    }

    const emptyAdditionalClassifications = form.classifications
      .slice(1)
      .filter(
        (classification) =>
          !classification.category3.trim() &&
          !classification.category2.trim() &&
          !classification.category1.trim(),
      );
    if (emptyAdditionalClassifications.length > 0) {
      return "Remove empty classification rows before creating the item.";
    }

    const startedClassifications = form.classifications.filter(
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

  function getZeroValueFields(): string[] {
    const fields: string[] = [];

    if (Number(form.price) === 0) fields.push("Price");
    if (Number(form.quantityInStock) === 0) fields.push("Quantity In Stock");
    if (Number(form.reorderLevel) === 0) fields.push("Reorder Level");
    if (Number(form.unitCost) === 0) fields.push("Unit Cost");

    return fields;
  }

  function resetForm() {
    const nextForm: CreateItemForm = {
      ...INITIAL_FORM,
      classifications: INITIAL_FORM.classifications.map((classification) => ({
        ...classification,
      })),
      images: INITIAL_FORM.images.map((image) => ({ ...image })),
    };
    setForm(nextForm);
    setSubcategoryOptionsByClassificationId({});
    setTypeOptionsByClassificationId({});
    setNextClassificationDraftId(
      getNextClassificationDraftId(nextForm.classifications),
    );
    setCategoryModalTargetClassificationId(
      nextForm.classifications[0]?.localId ?? 1,
    );
    setError(null);
    setSuccessMessage(null);
    setSelectedImageIndex(null);
    setIsZeroValueConfirmationOpen(false);
    setZeroValueFields([]);
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

  async function linkUploadedImage(catalogItemId: number, fileKey: string) {
    const response = await fetch("/api/catalog/staff/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogItemId,
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

  async function removeImage() {
    if (selectedImageIndex === null || isDeletingImage) {
      return;
    }

    const selectedImage = form.images[selectedImageIndex];
    if (!selectedImage) {
      return;
    }

    if (selectedImage.id == null) {
      setForm((prev) => {
        const nextImages = prev.images.filter(
          (_, index) => index !== selectedImageIndex,
        );
        return { ...prev, images: withFallbackImage(nextImages) };
      });
      setSelectedImageIndex(null);
      return;
    }

    setIsDeletingImage(true);
    setError(null);

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
          (_, index) => index !== selectedImageIndex,
        );
        return { ...prev, images: withFallbackImage(nextImages) };
      });
      setSelectedImageIndex(null);
      setSuccessMessage("Image unlinked successfully.");
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to delete image.",
      );
    } finally {
      setIsDeletingImage(false);
    }
  }

  async function submitCreateItem(skipZeroValueConfirmation: boolean) {
    setError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const fieldsAtZero = getZeroValueFields();
    if (!skipZeroValueConfirmation && fieldsAtZero.length > 0) {
      setZeroValueFields(fieldsAtZero);
      setIsZeroValueConfirmationOpen(true);
      return;
    }

    setIsZeroValueConfirmationOpen(false);
    setZeroValueFields([]);

    const imageKeysToLink = form.images
      .filter(
        (image) => image.url !== "/FillerImage.webp" && !!image.s3Key?.trim(),
      )
      .map((image) => image.s3Key!.trim());

    const startedClassifications = form.classifications
      .map((classification) => ({
        category3: asNullableString(classification.category3),
        category2: asNullableString(classification.category2),
        category1: asNullableString(classification.category1),
      }))
      .filter(
        (classification) =>
          classification.category3 ||
          classification.category2 ||
          classification.category1,
      );
    const primaryClassification = startedClassifications[0] ?? null;

    const payload = {
      sku: form.sku.trim(),
      itemName: form.itemName.trim(),
      price: Number(form.price),
      category3: primaryClassification?.category3 ?? null,
      category2: primaryClassification?.category2 ?? null,
      category1: primaryClassification?.category1 ?? null,
      classifications: startedClassifications,
      description: asNullableString(form.description),
      quantityInStock: asPositiveIntegerOrZero(form.quantityInStock),
      unitOfMeasure: asNullableString(form.unitOfMeasure),
      storageLocation: asNullableString(form.storageLocation),
      storageConditions: asNullableString(form.storageConditions),
      expirationDate: asNullableString(form.expirationDate),
      dateAcquired: asNullableString(form.dateAcquired),
      reorderLevel: asPositiveIntegerOrZero(form.reorderLevel),
      unitCost: Number(form.unitCost),
    };

    setIsSaving(true);

    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as CreateApiResponse;

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Create failed (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      const createdId =
        typeof result?.data?.id === "number" ? result.data.id : null;

      if (createdId !== null && imageKeysToLink.length > 0) {
        const failedKeys: string[] = [];

        for (const fileKey of imageKeysToLink) {
          try {
            await linkUploadedImage(createdId, fileKey);
          } catch {
            failedKeys.push(fileKey);
          }
        }

        if (failedKeys.length > 0) {
          setError(
            `Item created (ID: ${createdId}), but ${failedKeys.length} image link${failedKeys.length === 1 ? "" : "s"} failed.`,
          );
        }
      } else if (createdId === null && imageKeysToLink.length > 0) {
        setError(
          "Item was created, but images were not linked because no item ID was returned.",
        );
      }

      setSuccessMessage(
        createdId
          ? `Item created successfully. New item ID: ${createdId}.`
          : "Item created successfully.",
      );
      const resetFormState: CreateItemForm = {
        ...INITIAL_FORM,
        classifications: INITIAL_FORM.classifications.map((classification) => ({
          ...classification,
        })),
        images: INITIAL_FORM.images.map((image) => ({ ...image })),
      };
      setForm(resetFormState);
      setSubcategoryOptionsByClassificationId({});
      setTypeOptionsByClassificationId({});
      setNextClassificationDraftId(
        getNextClassificationDraftId(resetFormState.classifications),
      );
      setCategoryModalTargetClassificationId(
        resetFormState.classifications[0]?.localId ?? 1,
      );
      setSelectedImageIndex(null);
      setIsZeroValueConfirmationOpen(false);
      setZeroValueFields([]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function closeZeroValueConfirmation() {
    if (isSaving) return;
    setIsZeroValueConfirmationOpen(false);
  }

  function confirmZeroValueCreation() {
    void submitCreateItem(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitCreateItem(false);
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
      <div className="item-create-page-header">
        <div>
          <div className="staffTitle">Create Catalog Item</div>
          <div className="staffSubtitle">
            New item form using inventory management styling. ID, created date,
            and updated date are generated automatically.
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
          <form className="item-create-form" onSubmit={handleSubmit}>
            <div className="item-create-grid">
              <label className="item-create-field">
                <span className="item-create-label">Item Name *</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={form.itemName}
                  onChange={update("itemName")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">SKU *</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={form.sku}
                  onChange={update("sku")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Price *</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={update("price")}
                  placeholder="0.00"
                  maxLength={11}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Unit Cost *</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  inputMode="decimal"
                  value={form.unitCost}
                  onChange={update("unitCost")}
                  placeholder="0.00"
                  maxLength={11}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Quantity In Stock *</span>
                <input
                  className="item-search-page__search-input"
                  type="number"
                  min={0}
                  step={1}
                  value={form.quantityInStock}
                  onChange={update("quantityInStock")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Reorder Level *</span>
                <input
                  className="item-search-page__search-input"
                  type="number"
                  min={0}
                  step={1}
                  value={form.reorderLevel}
                  onChange={update("reorderLevel")}
                />
              </label>

              <div className="item-create-field item-create-classifications item-edit-classifications-panel">
                <div className="item-edit-classifications-header">
                  <span className="item-create-label">Classifications</span>
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
                        typeOptionsByClassificationId[classification.localId] ??
                        []
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

              <label className="item-create-field">
                <span className="item-create-label">Unit Of Measure</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={form.unitOfMeasure}
                  onChange={update("unitOfMeasure")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Storage Location</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={form.storageLocation}
                  onChange={update("storageLocation")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Date Acquired</span>
                <input
                  className="item-search-page__search-input"
                  type="date"
                  value={form.dateAcquired}
                  onChange={update("dateAcquired")}
                />
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Expiration Date</span>
                <input
                  className="item-search-page__search-input"
                  type="date"
                  value={form.expirationDate}
                  onChange={update("expirationDate")}
                />
              </label>
            </div>

            <label className="item-create-field">
              <span className="item-create-label">Description</span>
              <textarea
                className="item-create-textarea"
                value={form.description}
                onChange={update("description")}
              />
            </label>

            <label className="item-create-field">
              <div className="account-management__notes-label-row">
                <span
                  className={`item-create-label ${
                    form.storageConditions.length > 0
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  Storage Conditions
                </span>
                <span
                  className={`item-create-label account-management__notes-count ${
                    form.storageConditions.length > 0
                      ? "category-mgmt-edit-modal__label--dirty"
                      : ""
                  }`}
                >
                  {form.storageConditions.length}/
                  {STORAGE_CONDITIONS_MAX_LENGTH}
                </span>
              </div>
              <textarea
                className="item-create-textarea"
                value={form.storageConditions}
                onChange={update("storageConditions")}
                maxLength={STORAGE_CONDITIONS_MAX_LENGTH}
              />
            </label>

            <div className="item-create-field">
              <span className="item-create-label">Images</span>
              <div className="item-edit-actions">
                <div style={{ width: "100%" }}>
                  <ImageUpload
                    uploadButtonText="Upload Image"
                    onUploadSuccess={async (fileUrl, fileKey) => {
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
                              id: null,
                              s3Key: fileKey,
                              url: fileUrl,
                              createdAt: null,
                            },
                          ],
                        };
                      });

                      setSuccessMessage(
                        "Image uploaded successfully. It will be linked when the item is created.",
                      );
                      setError(null);
                    }}
                    onUploadError={(message) => {
                      setError(message);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void removeImage()}
                  className="staff-dev-pill item-edit-remove-image-button"
                  aria-label="Remove selected image"
                  disabled={
                    selectedImageIndex === null || isDeletingImage || isSaving
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
                {form.images.map((image, index) => {
                  const isSelected = selectedImageIndex === index;

                  return (
                    <button
                      key={`${image.id ?? "temp"}-${image.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedImageIndex((current) =>
                          current === index ? null : index,
                        )
                      }
                      aria-pressed={isSelected}
                      aria-label={`Select image ${index + 1}`}
                      className={`item-image-thumb-button${isSelected ? " item-image-thumb-button--selected" : ""}`}
                    >
                      <Image
                        className={`product-carousel-thumb-img item-image-thumb${isSelected ? " item-image-thumb--selected" : ""}`}
                        src={image.url}
                        alt={`Image ${index + 1} of ${form.itemName || "item"}`}
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

            {error && <div className="item-create-status error">{error}</div>}
            {successMessage && (
              <div className="item-create-status success">{successMessage}</div>
            )}

            <div className="item-create-actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={resetForm}
                disabled={isSaving || isDeletingImage}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="staff-dev-pill staff-dev-pill--ready"
                disabled={!canSubmit}
              >
                {isSaving ? "Creating..." : "Create Item"}
              </button>
              <Link href={backToItemSearchHref} className="staff-dev-pill">
                Back to Item Search
              </Link>
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

      {isZeroValueConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Item Creation With Zero Values"
          className="item-category-modal"
          onClick={closeZeroValueConfirmation}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Creation</div>
            <p className="category-mgmt-confirm-modal__message">
              One or more key numeric values are set to 0. Are you sure you want
              to create this item?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                Fields at 0: <strong>{zeroValueFields.join(", ")}</strong>.
              </p>
            </div>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeZeroValueConfirmation}
                disabled={isSaving}
              >
                Go Back
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={confirmZeroValueCreation}
                disabled={isSaving}
              >
                {isSaving ? "Creating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function StaffItemCreatePage() {
  return (
    <Suspense fallback={null}>
      <StaffItemCreatePageContent />
    </Suspense>
  );
}
