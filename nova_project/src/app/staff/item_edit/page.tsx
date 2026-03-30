"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import CategoryCombo from "@/app/components/CategoryCombo";

type Item = {
  id: number | null;
  sku: string | null;
  itemName: string | null;
  price: number | null;
  category3: string | null;
  category2: string | null;
  category1: string | null;
  description: string | null;
  imageUrls: string[] | null;
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

type CategoryLevel = "category3" | "category2" | "category1";

type CreateCategoryApiResponse = {
  success?: boolean;
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

function parseCatalogItem(data: unknown): Item | null {
  if (Array.isArray(data)) {
    return parseCatalogItem(data[0]);
  }

  const raw = asRecord(data);
  if (!raw) return null;

  const parsedId = getNullableNumber(raw.id);
  if (parsedId === null) return null;

  return {
    id: parsedId,
    sku: getNullableString(raw.sku),
    itemName: getNullableString(raw.itemName),
    price: getNullableNumber(raw.price),
    category3: getNullableString(raw.category3),
    category2: getNullableString(raw.category2),
    category1: getNullableString(raw.category1),
    description: getNullableString(raw.description),
    imageUrls: getNullableString(raw.imageUrls)?.split(",") ?? [
      "/FillerImage.webp",
    ],
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

type ItemForm = {
  sku: string;
  itemName: string;
  price: string;
  category3: string;
  category2: string;
  category1: string;
  description: string;
  imageUrls: string[];
  quantityInStock: string;
  unitOfMeasure: string;
  storageLocation: string;
  storageConditions: string;
  expirationDate: string;
  dateAcquired: string;
  reorderLevel: string;
  unitCost: string;
};

const NA = "N/A";

function normalizeOptional(value: string): string {
  const t = value.trim();
  if (t === "" || t.toLowerCase() === "n/a") return NA;
  return t;
}

function initOptional(value: string | null | undefined): string {
  if (value == null) return NA;
  return normalizeOptional(value);
}

function applyNA(f: ItemForm): ItemForm {
  return {
    ...f,
    // required-ish fields: trim, but do NOT auto-fill N/A
    sku: f.sku.trim(),
    itemName: f.itemName.trim(),
    category3: f.category3.trim(),
    category2: f.category2.trim(),
    category1: f.category1.trim(),

    // optional fields: blank => N/A
    description: normalizeOptional(f.description),
    unitOfMeasure: normalizeOptional(f.unitOfMeasure),
    storageLocation: normalizeOptional(f.storageLocation),
    storageConditions: normalizeOptional(f.storageConditions),
    expirationDate: normalizeOptional(f.expirationDate),
    dateAcquired: normalizeOptional(f.dateAcquired),

    // keep imageUrls non-empty
    imageUrls: f.imageUrls.length ? f.imageUrls : ["/FillerImage.webp"],

    // numeric strings: just trim
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
    category3: item.category3 ?? "",
    category2: item.category2 ?? "",
    category1: item.category1 ?? "",

    // optional: show N/A when missing
    description: initOptional(item.description),
    imageUrls: item.imageUrls ?? ["/FillerImage.webp"],
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

function normalizeForCompare(f: ItemForm) {
  const n = (s: string) => s.trim();
  const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

  return {
    sku: n(f.sku),
    itemName: n(f.itemName),
    price: num(f.price),
    category3: n(f.category3),
    category2: n(f.category2),
    category1: n(f.category1),

    // treat blank and N/A as the same for optionals
    description: normalizeOptional(f.description),
    imageUrls: [...f.imageUrls],
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

function sameForm(a: ItemForm, b: ItemForm) {
  return (
    JSON.stringify(normalizeForCompare(a)) ===
    JSON.stringify(normalizeForCompare(b))
  );
}

type NormalizedItemForm = ReturnType<typeof normalizeForCompare>;

function validateForm(f: ItemForm): string | null {
  const currencyToCheck = ["$", "€", "£", "¥"];
  const hasCurrency = (s: string) => currencyToCheck.some((c) => s.includes(c));

  if (!f.itemName.trim()) return "Item Name cannot be empty.";
  if (!f.sku.trim()) return "SKU cannot be empty.";

  if (hasCurrency(f.price))
    return "Price must be a number (no currency signs).";
  if (f.price.trim() === "" || Number.isNaN(Number(f.price)))
    return "Price must be a valid number.";
  if (Number(f.price) < 0) return "Price cannot be negative.";
  if ((f.price.split(".")[1] ?? "").length > 2)
    return "Price must have at most 2 decimal places.";

  if (!f.category3.trim()) return "Category 3 cannot be empty.";
  if (!f.category2.trim()) return "Category 2 cannot be empty.";
  if (!f.category1.trim()) return "Category 1 cannot be empty.";

  if (
    f.quantityInStock.trim() === "" ||
    Number.isNaN(Number(f.quantityInStock))
  )
    return "Quantity in stock must be a valid number.";
  if (Number(f.quantityInStock) < 0) return "Quantity cannot be negative.";

  if (f.reorderLevel.trim() === "" || Number.isNaN(Number(f.reorderLevel)))
    return "Reorder level must be a valid number.";

  if (hasCurrency(f.unitCost))
    return "Unit cost must be a number (no currency signs).";
  if (f.unitCost.trim() === "" || Number.isNaN(Number(f.unitCost)))
    return "Unit cost must be a valid number.";
  if (Number(f.unitCost) < 0) return "Unit cost cannot be negative.";
  if ((f.unitCost.split(".")[1] ?? "").length > 2)
    return "Unit cost must have at most 2 decimal places.";

  return null;
}

function StaffItemEditPageContent() {
  const params = useParams<{ id?: string | string[] }>();
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
      description: "",
      imageUrls: ["/FillerImage.webp"],
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);
  const [newCategoryLevel, setNewCategoryLevel] =
    useState<CategoryLevel>("category3");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newParentCategory3, setNewParentCategory3] = useState("");
  const [newParentCategory2, setNewParentCategory2] = useState("");
  const [newParentCategory2Options, setNewParentCategory2Options] = useState<
    string[]
  >([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [newCategorySuccess, setNewCategorySuccess] = useState<string | null>(
    null,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const originalRef = useRef<ItemForm>(form);

  const isDirty = useMemo(() => !sameForm(form, originalRef.current), [form]);
  const normalizedForm = useMemo(() => normalizeForCompare(form), [form]);
  const normalizedOriginal = normalizeForCompare(originalRef.current);
  const isFieldDirty = (field: keyof NormalizedItemForm) =>
    JSON.stringify(normalizedForm[field]) !==
    JSON.stringify(normalizedOriginal[field]);
  const isAnyFieldDirty = (fields: (keyof NormalizedItemForm)[]) =>
    fields.some((field) => isFieldDirty(field));
  const fieldNameClass = (dirty: boolean) =>
    `item-edit-field-name${dirty ? " item-edit-field-name--dirty" : ""}`;

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

  const fetchSubcategories = async (category: string) => {
    if (!category.trim()) {
      setSubcategories([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/catalog/staff/subcategories?category=${encodeURIComponent(category)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        setSubcategories([]);
        return;
      }

      const payload = (await response.json()) as { subcategories?: unknown };
      const nextSubcategories = Array.isArray(payload?.subcategories)
        ? payload.subcategories.filter(
            (entry): entry is string => typeof entry === "string",
          )
        : [];
      setSubcategories(nextSubcategories);
    } catch {
      setSubcategories([]);
    }
  };

  const fetchTypes = async (category: string, subcategory: string) => {
    if (!category.trim() || !subcategory.trim()) {
      setTypes([]);
      return;
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
        setTypes([]);
        return;
      }

      const payload = (await response.json()) as { types?: unknown };
      const nextTypes = Array.isArray(payload?.types)
        ? payload.types.filter(
            (entry): entry is string => typeof entry === "string",
          )
        : [];
      setTypes(nextTypes);
    } catch {
      setTypes([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories(form.category3);
  }, [form.category3]);

  useEffect(() => {
    fetchTypes(form.category3, form.category2);
  }, [form.category3, form.category2]);

  useEffect(() => {
    const fetchParentCategory2Options = async () => {
      if (
        !showNewCategoryPopup ||
        newCategoryLevel !== "category1" ||
        !newParentCategory3.trim()
      ) {
        setNewParentCategory2Options([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(newParentCategory3)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          setNewParentCategory2Options([]);
          return;
        }

        const payload = (await response.json()) as { subcategories?: unknown };
        const options = Array.isArray(payload?.subcategories)
          ? payload.subcategories.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [];
        setNewParentCategory2Options(options);
      } catch {
        setNewParentCategory2Options([]);
      }
    };

    fetchParentCategory2Options();
  }, [showNewCategoryPopup, newCategoryLevel, newParentCategory3]);

  const update =
    <K extends keyof ItemForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  // For optional text fields: if user leaves it blank, convert to N/A
  const blurNA =
    <K extends keyof ItemForm>(key: K) =>
    () => {
      setForm((prev) => ({
        ...prev,
        [key]: normalizeOptional(String(prev[key] ?? "")),
      }));
    };

  const bumpStock = (delta: number) => {
    setForm((prev) => {
      const cur = Number(prev.quantityInStock || 0);
      const next = Math.max(0, Math.trunc(cur + delta));
      return { ...prev, quantityInStock: String(next) };
    });
  };

  async function saveChanges() {
    if (!isDirty || isSaving || isLoading || !!loadError) {
      console.log("No changes detected. Nothing to save.");
      return;
    }

    const prepared = applyNA(form);

    const validationError = validateForm(prepared);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    const payload = {
      sku: prepared.sku,
      itemName: prepared.itemName,
      price: Number(prepared.price),
      category3: prepared.category3,
      category2: prepared.category2,
      category1: prepared.category1,
      description: prepared.description,
      imageUrls: prepared.imageUrls,
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
          // Keep fallback message when no JSON payload is available.
        }

        throw new Error(message);
      }

      const result = (await response.json()) as CatalogApiResponse;
      const savedItem = parseCatalogItem(result?.data);

      if (savedItem) {
        const nextForm = toForm(savedItem);
        setForm(nextForm);
        originalRef.current = structuredClone(nextForm);
      } else {
        // Fallback to local normalized values if the API response body shape changes.
        setForm(prepared);
        originalRef.current = structuredClone(prepared);
      }
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
    if (!isDirty || isSaving || isLoading || !!loadError) {
      return;
    }

    const snapshot = structuredClone(originalRef.current);
    setForm(snapshot);
    setSelectedImageIndex(null);
    setSaveError(null);
  }

  function resetSuccessMessage() {
    setSuccessMessage(null);
  }

  const removeImage = () => {
    setForm((prev) => {
      if (selectedImageIndex === null) return prev;

      const next = prev.imageUrls.filter((_, i) => i !== selectedImageIndex);
      return { ...prev, imageUrls: next.length ? next : ["/FillerImage.webp"] };
    });

    setSelectedImageIndex(null);
  };

  function openNewCategoryPopup(level: CategoryLevel) {
    setNewCategoryLevel(level);
    setNewCategoryName("");
    setNewCategoryError(null);
    setNewCategorySuccess(null);

    if (level === "category3") {
      setNewParentCategory3("");
      setNewParentCategory2("");
    } else if (level === "category2") {
      setNewParentCategory3(form.category3.trim());
      setNewParentCategory2("");
    } else {
      setNewParentCategory3(form.category3.trim());
      setNewParentCategory2(form.category2.trim());
    }

    setShowNewCategoryPopup(true);
  }

  function closeNewCategoryPopup() {
    if (isCreatingCategory) return;
    setShowNewCategoryPopup(false);
    setNewCategoryError(null);
    setNewCategorySuccess(null);
  }

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewCategoryError(null);
    setNewCategorySuccess(null);

    const name = newCategoryName.trim();
    if (!name) {
      setNewCategoryError("Category name is required.");
      return;
    }

    if (newCategoryLevel !== "category3" && !newParentCategory3.trim()) {
      setNewCategoryError("Parent Category is required.");
      return;
    }

    if (newCategoryLevel === "category1" && !newParentCategory2.trim()) {
      setNewCategoryError("Parent Subcategory is required.");
      return;
    }

    const payload = {
      level: newCategoryLevel,
      name,
      parentCategory3:
        newCategoryLevel === "category3" ? null : newParentCategory3.trim(),
      parentCategory2:
        newCategoryLevel === "category1" ? newParentCategory2.trim() : null,
    };

    setIsCreatingCategory(true);

    try {
      const response = await fetch("/api/catalog/staff/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as CreateCategoryApiResponse;

      if (!response.ok || result?.success === false) {
        const message =
          typeof result?.error === "string"
            ? result.error
            : `Create category failed (HTTP ${response.status}).`;
        const details =
          typeof result?.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      setNewCategorySuccess("Category created successfully.");
      setNewCategoryName("");

      await fetchCategories();

      if (
        newCategoryLevel === "category2" &&
        form.category3.trim() &&
        form.category3.trim() === newParentCategory3.trim()
      ) {
        await fetchSubcategories(form.category3.trim());
      }

      if (
        newCategoryLevel === "category1" &&
        form.category3.trim() &&
        form.category2.trim() &&
        form.category3.trim() === newParentCategory3.trim() &&
        form.category2.trim() === newParentCategory2.trim()
      ) {
        await fetchTypes(form.category3.trim(), form.category2.trim());
      }
    } catch (createError) {
      setNewCategoryError(
        createError instanceof Error
          ? createError.message
          : "Failed to create category.",
      );
    } finally {
      setIsCreatingCategory(false);
    }
  }

  return (
    <div>
      <div className="staffTitle">Edit Catalog Item</div>
      <div className="staffSubtitle">
        Edit existing item form using inventory management styling. Created date
        and updated date are generated automatically.
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
                    SKU
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
                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("category3"))}>
                    Category *
                  </span>
                  <CategoryCombo
                    ariaLabel="Category"
                    value={form.category3}
                    placeholder="Select category"
                    options={categories}
                    onSelect={(nextCategory) =>
                      setForm((prev) => ({
                        ...prev,
                        category3: nextCategory,
                        category2: "",
                        category1: "",
                      }))
                    }
                    onNewClick={() => openNewCategoryPopup("category3")}
                  />
                </label>

                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("category2"))}>
                    Subcategory *
                  </span>
                  <CategoryCombo
                    ariaLabel="Subcategory"
                    value={form.category2}
                    placeholder="Select subcategory"
                    options={subcategories}
                    onSelect={(nextSubcategory) =>
                      setForm((prev) => ({
                        ...prev,
                        category2: nextSubcategory,
                        category1: "",
                      }))
                    }
                    onNewClick={() => openNewCategoryPopup("category2")}
                  />
                </label>

                <label className="item-edit-field">
                  <span className={fieldNameClass(isFieldDirty("category1"))}>
                    Type *
                  </span>
                  <CategoryCombo
                    ariaLabel="Type"
                    value={form.category1}
                    placeholder="Select type"
                    options={types}
                    onSelect={(nextType) =>
                      setForm((prev) => ({
                        ...prev,
                        category1: nextType,
                      }))
                    }
                    onNewClick={() => openNewCategoryPopup("category1")}
                  />
                </label>
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
                    value={form.dateAcquired.split("T")[0]}
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
                    value={form.expirationDate.split("T")[0]}
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
                <span
                  className={fieldNameClass(isFieldDirty("storageConditions"))}
                >
                  Storage Conditions
                </span>
                <textarea
                  className="item-edit-textarea"
                  value={form.storageConditions}
                  onChange={update("storageConditions")}
                  onBlur={blurNA("storageConditions")}
                />
              </label>

              <label className="item-edit-field">
                <strong
                  className={`item-edit-label ${fieldNameClass(isFieldDirty("imageUrls"))}`}
                >
                  Images:
                </strong>
                <div className="item-edit-actions">
                  <Link
                    href="/staff/image-upload-demo"
                    className="staff-dev-pill item-edit-upload-image-button"
                    aria-label="Upload new image"
                    title="Upload an image to add to this item"
                  >
                    Upload Image
                  </Link>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="staff-dev-pill item-edit-remove-image-button"
                    aria-label="Remove selected image"
                    disabled={selectedImageIndex === null}
                    title={
                      selectedImageIndex === null
                        ? "Click an image to select it first"
                        : "Delete selected image"
                    }
                    style={{ opacity: selectedImageIndex === null ? 0.6 : 1 }}
                  >
                    Delete Image
                  </button>
                </div>
                <div className="item-image-grid">
                  {form.imageUrls.map((img, i) => {
                    const isSelected = selectedImageIndex === i;

                    return (
                      <button
                        key={i}
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
                          src={img}
                          alt={`Image ${i + 1} of ${form.itemName}`}
                          width={1000}
                          height={1000}
                          priority
                        />
                      </button>
                    );
                  })}
                </div>

                {selectedImageIndex !== null && (
                  <div className="item-edit-selected-images">
                    Selected image: {selectedImageIndex + 1}
                  </div>
                )}
              </label>

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
                className="staff-dev-pill"
                onClick={resetChanges}
                disabled={isSaving}
                title="Reset all changes"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={saveChanges}
                onPointerDown={resetSuccessMessage}
                className={`staff-dev-pill${isDirty ? " staff-dev-pill--ready" : ""}`}
                disabled={isLoading || !!loadError || isSaving || !isDirty}
                title={isDirty ? "Save changes" : "No new changes to save"}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showNewCategoryPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create New Category"
          className="item-category-modal"
        >
          <div className="item-category-modal__content">
            <div className="item-category-modal__title">
              Creating New{" "}
              {newCategoryLevel === "category3"
                ? "Category"
                : newCategoryLevel === "category2"
                  ? "Subcategory"
                  : "Type"}
            </div>

            <form
              className="item-category-form"
              onSubmit={handleCreateCategory}
              noValidate
            >
              <label className="item-category-form__field">
                <span className="item-category-form__label">Name</span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter a unique name"
                />
              </label>

              {newCategoryLevel !== "category3" && (
                <label className="item-category-form__field">
                  <span className="item-category-form__label">
                    Parent Category
                  </span>
                  <select
                    className="item-search-page__select"
                    value={newParentCategory3}
                    onChange={(e) => {
                      setNewParentCategory3(e.target.value);
                      setNewParentCategory2("");
                    }}
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {newCategoryLevel === "category1" && (
                <label className="item-category-form__field">
                  <span className="item-category-form__label">
                    Parent Subcategory
                  </span>
                  <select
                    className="item-search-page__select"
                    value={newParentCategory2}
                    onChange={(e) => setNewParentCategory2(e.target.value)}
                    disabled={!newParentCategory3.trim()}
                  >
                    <option value="">None</option>
                    {newParentCategory2Options.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {newCategoryError && (
                <div className="item-category-form__status item-category-form__status--error">
                  {newCategoryError}
                </div>
              )}

              {newCategorySuccess && (
                <div className="item-category-form__status item-category-form__status--success">
                  {newCategorySuccess}
                </div>
              )}

              <div className="item-category-form__actions">
                <button
                  type="button"
                  onClick={closeNewCategoryPopup}
                  className="staff-dev-pill"
                  disabled={isCreatingCategory}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-dev-pill staff-dev-pill--ready"
                  disabled={isCreatingCategory}
                >
                  {isCreatingCategory ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
