"use client";

import { useEffect, useState } from "react";

export type CategoryLevel = "category3" | "category2" | "category1";

type CreateCategoryApiResponse = {
  success?: boolean;
  error?: unknown;
  details?: unknown;
};

type CategoryCreateResult = {
  level: CategoryLevel;
  name: string;
  parentCategory3: string | null;
  parentCategory2: string | null;
};

type CategoryCreateModalProps = {
  isOpen: boolean;
  level: CategoryLevel;
  categories: string[];
  defaultParentCategory3?: string;
  defaultParentCategory2?: string;
  closeOnSuccess?: boolean;
  closeOnBackdrop?: boolean;
  onClose: () => void;
  onCreated?: (result: CategoryCreateResult) => Promise<void> | void;
};

function getLevelLabel(level: CategoryLevel): string {
  if (level === "category3") return "Category";
  if (level === "category2") return "Subcategory";
  return "Type";
}

export default function CategoryCreateModal({
  isOpen,
  level,
  categories,
  defaultParentCategory3 = "",
  defaultParentCategory2 = "",
  closeOnSuccess = false,
  closeOnBackdrop = false,
  onClose,
  onCreated,
}: CategoryCreateModalProps) {
  const [name, setName] = useState("");
  const [parentCategory3, setParentCategory3] = useState("");
  const [parentCategory2, setParentCategory2] = useState("");
  const [parentCategory2Options, setParentCategory2Options] = useState<
    string[]
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [createConfirmChecked, setCreateConfirmChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setParentCategory3(level === "category3" ? "" : defaultParentCategory3);
    setParentCategory2(level === "category1" ? defaultParentCategory2 : "");
    setParentCategory2Options([]);
    setError(null);
    setSuccess(null);
    setShowCreateConfirmation(false);
    setCreateConfirmChecked(false);
  }, [isOpen, level, defaultParentCategory3, defaultParentCategory2]);

  useEffect(() => {
    let disposed = false;

    if (!isOpen || level !== "category1" || !parentCategory3.trim()) {
      setParentCategory2Options([]);
      if (level === "category1" && !parentCategory3.trim()) {
        setParentCategory2("");
      }
      return () => {
        disposed = true;
      };
    }

    const loadSubcategoryOptions = async () => {
      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(parentCategory3)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load subcategories.");
        }

        const payload = (await response.json()) as { subcategories?: unknown };
        const nextOptions = Array.isArray(payload.subcategories)
          ? payload.subcategories.filter(
              (entry): entry is string => typeof entry === "string",
            )
          : [];

        if (disposed) return;

        setParentCategory2Options(nextOptions);
        setParentCategory2((current) =>
          nextOptions.includes(current)
            ? current
            : nextOptions.includes(defaultParentCategory2)
              ? defaultParentCategory2
              : "",
        );
      } catch {
        if (!disposed) {
          setParentCategory2Options([]);
          setParentCategory2("");
        }
      }
    };

    void loadSubcategoryOptions();

    return () => {
      disposed = true;
    };
  }, [isOpen, level, parentCategory3, defaultParentCategory2]);

  const closeModal = () => {
    if (isCreating) return;
    onClose();
  };

  const getCreateValidationError = (): string | null => {
    if (!name.trim()) {
      return "Category name is required.";
    }
    if (level !== "category3" && !parentCategory3.trim()) {
      return "Parent Category is required.";
    }
    if (level === "category1" && !parentCategory2.trim()) {
      return "Parent Subcategory is required.";
    }
    return null;
  };

  const handleCreateCategory = async () => {
    setError(null);
    setSuccess(null);

    const validationError = getCreateValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!createConfirmChecked) {
      setError("Please confirm before creating.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedParentCategory3 = parentCategory3.trim();
    const trimmedParentCategory2 = parentCategory2.trim();

    setIsCreating(true);
    setShowCreateConfirmation(false);

    try {
      const response = await fetch("/api/catalog/staff/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level,
          name: trimmedName,
          parentCategory3:
            level === "category3" ? null : trimmedParentCategory3,
          parentCategory2:
            level === "category1" ? trimmedParentCategory2 : null,
        }),
      });

      const result = (await response.json()) as CreateCategoryApiResponse;
      if (!response.ok || result.success === false) {
        const message =
          typeof result.error === "string"
            ? result.error
            : `Create category failed (HTTP ${response.status}).`;
        const details =
          typeof result.details === "string" ? ` ${result.details}` : "";
        throw new Error(`${message}${details}`.trim());
      }

      const createdResult: CategoryCreateResult = {
        level,
        name: trimmedName,
        parentCategory3: level === "category3" ? null : trimmedParentCategory3,
        parentCategory2: level === "category1" ? trimmedParentCategory2 : null,
      };

      if (onCreated) {
        await onCreated(createdResult);
      }

      if (closeOnSuccess) {
        onClose();
      } else {
        setSuccess("Category created successfully.");
        setName("");
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create category.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create New Category"
        className="item-category-modal"
        onClick={closeOnBackdrop ? closeModal : undefined}
      >
        <div
          className="item-category-modal__content category-mgmt-edit-modal__content"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="item-category-modal__title">
            Creating New {getLevelLabel(level)}
          </div>

          <form
            className="item-category-form"
            onSubmit={(event) => {
              event.preventDefault();
              const validationError = getCreateValidationError();
              if (validationError) {
                setError(validationError);
                setSuccess(null);
                setShowCreateConfirmation(false);
                return;
              }
              setError(null);
              setSuccess(null);
              setCreateConfirmChecked(false);
              setShowCreateConfirmation(true);
            }}
            noValidate
          >
            <label className="item-category-form__field">
              <span className="item-category-form__label">Name</span>
              <input
                className="item-search-page__search-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter a unique name"
              />
            </label>

            {level !== "category3" ? (
              <label className="item-category-form__field">
                <span className="item-category-form__label">
                  Parent Category
                </span>
                <select
                  className="item-search-page__select"
                  value={parentCategory3}
                  onChange={(event) => {
                    setParentCategory3(event.target.value);
                    setParentCategory2("");
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
            ) : null}

            {level === "category1" ? (
              <label className="item-category-form__field">
                <span className="item-category-form__label">
                  Parent Subcategory
                </span>
                <select
                  className="item-search-page__select"
                  value={parentCategory2}
                  onChange={(event) => setParentCategory2(event.target.value)}
                  disabled={!parentCategory3.trim()}
                >
                  <option value="">None</option>
                  {parentCategory2Options.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {error ? (
              <div className="item-category-form__status item-category-form__status--error">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="item-category-form__status item-category-form__status--success">
                {success}
              </div>
            ) : null}

            <div className="item-category-form__actions category-mgmt-edit-modal__actions">
              <button
                type="button"
                onClick={closeModal}
                className="staff-dev-pill"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="staff-dev-pill staff-dev-pill--ready"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCreateConfirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Create Category"
          className="item-category-modal"
          onClick={() => setShowCreateConfirmation(false)}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Creation</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to create this{" "}
              {getLevelLabel(level).toLowerCase()}?
            </p>
            <div className="category-mgmt-delete-warning">
              <p>
                New entry: <strong>{name.trim() || "Unnamed"}</strong>
              </p>
            </div>
            <label className="category-mgmt-delete-confirm">
              <input
                type="checkbox"
                checked={createConfirmChecked}
                onChange={(event) =>
                  setCreateConfirmChecked(event.target.checked)
                }
              />
              Yes, I&apos;m sure.
            </label>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => setShowCreateConfirmation(false)}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={() => void handleCreateCategory()}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
