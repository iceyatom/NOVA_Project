"use client";

import Link from "next/link";
import CategoryCombo from "@/app/components/CategoryCombo";
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
  price: "",
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

type CategoryLevel = "category3" | "category2" | "category1";

type CreateCategoryApiResponse = {
  success?: boolean;
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setError(null);
    setSuccessMessage(null);
  }

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
                <span className="item-create-label">Subcategory *</span>
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
                <span className="item-create-label">Type *</span>
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
              <span className="item-create-label">Storage Conditions</span>
              <textarea
                className="item-create-textarea"
                value={form.storageConditions}
                onChange={update("storageConditions")}
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
