"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

const CATEGORY_OPTIONS = [
  "Laboratory Supplies",
  "Live Algae Specimens",
  "Live Bacteria & Fungi Specimens",
  "Live Invertebrates",
  "Live Plant Specimens",
  "Live Protozoa Specimens",
  "Live Vertebrates",
  "Microbiological Supplies",
  "Microscopes",
  "Owl Pellets",
  "Preserved Invertebrates",
  "Preserved Vertebrates",
];

type CreateItemForm = {
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

const INITIAL_FORM: CreateItemForm = {
  sku: "",
  itemName: "",
  price: "",
  category3: "",
  category2: "",
  category1: "",
  description: "",
  imageUrls: ["/FillerImage.webp"],
  quantityInStock: "0",
  unitOfMeasure: "",
  storageLocation: "",
  storageConditions: "",
  expirationDate: "",
  dateAcquired: "",
  reorderLevel: "0",
  unitCost: "",
};

function isValidMoney(value: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return false;
  return Number(value) >= 0;
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

type CreateApiResponse = {
  success?: boolean;
  data?: {
    id?: unknown;
  };
  error?: unknown;
  details?: unknown;
};

export default function StaffItemCreatePage() {
  const [form, setForm] = useState<CreateItemForm>(INITIAL_FORM);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.category3.trim()) {
        setSubcategories([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(form.category3)}`,
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

    fetchSubcategories();
  }, [form.category3]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!form.category3.trim() || !form.category2.trim()) {
        setTypes([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          category: form.category3,
          subcategory: form.category2,
        });

        const response = await fetch(
          `/api/catalog/staff/types?${params.toString()}`,
          { cache: "no-store" },
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

    fetchTypes();
  }, [form.category3, form.category2]);

  const canSubmit = useMemo(() => !isSaving, [isSaving]);

  const update =
    <K extends keyof CreateItemForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  function validate(): string | null {
    if (!form.itemName.trim()) return "Item name is required.";
    if (!form.price.trim()) return "Price is required.";
    if (!isValidMoney(form.price)) {
      return "Price must be a non-negative number with up to 2 decimals.";
    }

    if (!form.category3.trim()) return "Category is required.";
    if (!form.category2.trim()) return "Subcategory is required.";
    if (!form.category1.trim()) return "Type is required.";

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

    return null;
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setSelectedImageIndex(null);
    setError(null);
    setSuccessMessage(null);
  }

  function removeImage() {
    setForm((prev) => {
      if (selectedImageIndex === null) return prev;

      const next = prev.imageUrls.filter((_, i) => i !== selectedImageIndex);
      return { ...prev, imageUrls: next.length ? next : ["/FillerImage.webp"] };
    });
    setSelectedImageIndex(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      sku: asNullableString(form.sku),
      itemName: form.itemName.trim(),
      price: Number(form.price),
      category3: asNullableString(form.category3),
      category2: asNullableString(form.category2),
      category1: asNullableString(form.category1),
      description: asNullableString(form.description),
      imageUrls: form.imageUrls.length ? form.imageUrls : ["/FillerImage.webp"],
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
      setSuccessMessage(
        createdId
          ? `Item created successfully. New item ID: ${createdId}.`
          : "Item created successfully.",
      );
      setForm(INITIAL_FORM);
      setSelectedImageIndex(null);
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

  return (
    <div>
      <div className="staffTitle">Create Catalog Item</div>
      <div className="staffSubtitle">
        New item form using inventory management styling. ID, created date, and
        updated date are generated automatically.
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
                <span className="item-create-label">SKU</span>
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

              <label className="item-create-field">
                <span className="item-create-label">Category *</span>
                <select
                  className="item-search-page__select"
                  value={form.category3}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category3: e.target.value,
                      category2: "",
                      category1: "",
                    }))
                  }
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Subcategory *</span>
                <select
                  className="item-search-page__select"
                  value={form.category2}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category2: e.target.value,
                      category1: "",
                    }))
                  }
                >
                  <option value="">Select subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </label>

              <label className="item-create-field">
                <span className="item-create-label">Type *</span>
                <select
                  className="item-search-page__select"
                  value={form.category1}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category1: e.target.value,
                    }))
                  }
                >
                  <option value="">Select type</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

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
              <span className="item-create-label">Storage Conditions</span>
              <textarea
                className="item-create-textarea"
                value={form.storageConditions}
                onChange={update("storageConditions")}
              />
            </label>

            <div className="item-edit-box">
              <strong className="item-edit-label">Images:</strong>
              <br />

              <div>
                <Link
                  href="/staff/image-upload-demo"
                  className="staff-dev-pill item-edit-upload-image-button"
                  aria-label="Upload new image"
                >
                  Upload Image
                </Link>
                &nbsp;
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

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
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
                      style={{
                        border: isSelected
                          ? "3px solid #000"
                          : "1px solid rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        padding: "0",
                        cursor: "pointer",
                        background: "transparent",
                        lineHeight: 0,
                      }}
                    >
                      <Image
                        className="product-carousel-thumb-img"
                        src={img}
                        alt={`Image ${i + 1} of ${form.itemName || "new item"}`}
                        width={1000}
                        height={1000}
                        style={{
                          width: "200px",
                          height: "auto",
                          borderRadius: "6px",
                          opacity: isSelected ? 0.9 : 1,
                        }}
                        priority
                      />
                    </button>
                  );
                })}
              </div>

              {selectedImageIndex !== null && (
                <div style={{ marginTop: "8px", fontSize: "0.9rem" }}>
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
                disabled={isSaving}
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
              <Link href="/staff/item_search" className="staff-dev-pill">
                Back to Item Search
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
