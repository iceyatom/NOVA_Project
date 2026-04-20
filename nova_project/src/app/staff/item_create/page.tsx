"use client";

import Link from "next/link";
import CategoryCombo from "@/app/components/CategoryCombo";
import CategoryCreateModal, {
  type CategoryLevel,
} from "@/app/components/CategoryCreateModal";
import { useMemo, useState, useEffect } from "react";

type CreateItemForm = {
  sku: string;
  itemName: string;
  price: string;
  category3: string;
  category2: string;
  category1: string;
  description: string;
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
  price: "0",
  category3: "",
  category2: "",
  category1: "",
  description: "",
  quantityInStock: "0",
  unitOfMeasure: "",
  storageLocation: "",
  storageConditions: "",
  expirationDate: "",
  dateAcquired: "",
  reorderLevel: "0",
  unitCost: "0",
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
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);
  const [newCategoryLevel, setNewCategoryLevel] =
    useState<CategoryLevel>("category3");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  // Dynamically loads top-level categories from the category3 table API.
  useEffect(() => {
    fetchCategories();
  }, []);

  // Dynamically loads subcategories based on the selected top-level category.
  useEffect(() => {
    fetchSubcategories(form.category3);
  }, [form.category3]);

  // Dynamically loads types based on the selected category + subcategory.
  useEffect(() => {
    fetchTypes(form.category3, form.category2);
  }, [form.category3, form.category2]);

  const canSubmit = useMemo(() => !isSaving, [isSaving]);

  const update =
    <K extends keyof CreateItemForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        key === "price" || key === "unitCost"
          ? sanitizeMoneyInput(e.target.value)
          : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

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
    setForm(INITIAL_FORM);
    setError(null);
    setSuccessMessage(null);
    setIsZeroValueConfirmationOpen(false);
    setZeroValueFields([]);
  }

  function openNewCategoryPopup(level: CategoryLevel) {
    setNewCategoryLevel(level);
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

    if (
      result.level === "category2" &&
      form.category3.trim() &&
      form.category3.trim() === (result.parentCategory3 ?? "")
    ) {
      await fetchSubcategories(form.category3.trim());
    }

    if (
      result.level === "category1" &&
      form.category3.trim() &&
      form.category2.trim() &&
      form.category3.trim() === (result.parentCategory3 ?? "") &&
      form.category2.trim() === (result.parentCategory2 ?? "")
    ) {
      await fetchTypes(form.category3.trim(), form.category2.trim());
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

    const payload = {
      sku: asNullableString(form.sku),
      itemName: form.itemName.trim(),
      price: Number(form.price),
      category3: asNullableString(form.category3),
      category2: asNullableString(form.category2),
      category1: asNullableString(form.category1),
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
      setSuccessMessage(
        createdId
          ? `Item created successfully. New item ID: ${createdId}.`
          : "Item created successfully.",
      );
      setForm(INITIAL_FORM);
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

              <label className="item-create-field">
                <span className="item-create-label">Category</span>
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

              <label className="item-create-field">
                <span className="item-create-label">Subcategory</span>
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

              <label className="item-create-field">
                <span className="item-create-label">Type</span>
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

      <CategoryCreateModal
        isOpen={showNewCategoryPopup}
        level={newCategoryLevel}
        categories={categories}
        defaultParentCategory3={
          newCategoryLevel === "category3" ? "" : form.category3.trim()
        }
        defaultParentCategory2={
          newCategoryLevel === "category1" ? form.category2.trim() : ""
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
