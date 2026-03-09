"use client";

import Link from "next/link";
import Image from "next/image";
import React, {
  useMemo,
  useRef,
  useState,
  useMemo as useMemoReact,
} from "react";

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

const getMockItemData = (idOrSku: number | string): Item => {
  // Get the item data from the database based on the ID or SKU
  return {
    id: 1,
    sku: "ABC123",
    itemName: "Sample Item",
    price: 10.0,
    category3: "Category 3",
    category2: "Category 2",
    category1: "Category 1",
    description: "This is a sample item description.",
    imageUrls: [
      "https://cdn.mos.cms.futurecdn.net/39CUYMP8vJqHAYGVzUghBX-1200-80.jpg",
      "/FillerImage.webp",
    ],
    quantityInStock: 10,
    unitOfMeasure: "Each",
    storageLocation: "Storage Location",
    storageConditions: "Storage Conditions",
    expirationDate: "2023-12-31",
    dateAcquired: "2022-01-01",
    reorderLevel: 5,
    unitCost: 5.0,
    createdAt: "2022-01-01T00:00:00.000Z",
    updatedAt: "2022-01-01T00:00:00.000Z",
  };
};

type ItemForm = {
  sku: string;
  itemName: string;
  price: string;
  category1: string;
  category2: string;
  category3: string;
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
    category1: f.category1.trim(),
    category2: f.category2.trim(),
    category3: f.category3.trim(),

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
    category1: item.category1 ?? "",
    category2: item.category2 ?? "",
    category3: item.category3 ?? "",

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
    category1: n(f.category1),
    category2: n(f.category2),
    category3: n(f.category3),

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

  if (!f.category1.trim()) return "Category 1 cannot be empty.";
  if (!f.category2.trim()) return "Category 2 cannot be empty.";
  if (!f.category3.trim()) return "Category 3 cannot be empty.";

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

export default function StaffItemEditPage() {
  const item = useMemo(() => getMockItemData(0), []);
  const id = item.id ?? 0;
  const createdAt = item.createdAt ?? "";

  const [form, setForm] = useState<ItemForm>(() => toForm(item));
  const [updatedAt, setUpdatedAt] = useState<string>(item.updatedAt ?? "");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );

  const originalRef = useRef<ItemForm>(toForm(item));

  const isDirty = useMemoReact(
    () => !sameForm(form, originalRef.current),
    [form],
  );

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
    if (!isDirty) {
      console.log("No changes detected. Nothing to save.");
      return;
    }

    const prepared = applyNA(form);

    const validationError = validateForm(prepared);
    if (validationError) {
      alert(validationError);
      return;
    }

    const currentTimestamp = new Date().toISOString();
    setUpdatedAt(currentTimestamp);

    const payload = {
      sku: prepared.sku,
      itemName: prepared.itemName,
      price: Number(prepared.price),
      category1: prepared.category1,
      category2: prepared.category2,
      category3: prepared.category3,
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
      updatedAt: currentTimestamp,
    };

    console.log("Saving payload:", payload);

    // TODO: await fetch(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(payload) })

    // keep UI + dirty state consistent with what you'd persist
    setForm(prepared);
    originalRef.current = structuredClone(prepared);
  }

  const uploadImage = () => {
    console.log("Image upload functionality is not implemented yet.");
  };

  const removeImage = () => {
    setForm((prev) => {
      if (selectedImageIndex === null) return prev;

      const next = prev.imageUrls.filter((_, i) => i !== selectedImageIndex);
      return { ...prev, imageUrls: next.length ? next : ["/FillerImage.webp"] };
    });

    setSelectedImageIndex(null);
  };

  return (
    <div className="staff-dev-page">
      <div className="staff-dev-card">
        <div className="staff-dev-back-wrapper">
          <Link href="/staff" className="staff-dev-pill">
            ← Back to Staff Dev Hub
          </Link>
        </div>

        <h1 className="staff-dev-title">Staff Item Edit</h1>

        <div className="item-edit-container">
          <div className="item-edit-box">
            <strong className="item-edit-label">Item Details</strong>
            <br />
            <strong>ID:</strong> {id}
            <br />
            <strong>Updated At:</strong> {updatedAt}
            <br />
            <strong>Created At:</strong> {createdAt}
          </div>

          <div className="item-edit-box">
            <strong className="item-edit-label">Display</strong>
            <br />
            <strong>Item Name:</strong>{" "}
            <input
              type="text"
              id="itemName"
              className="item-edit-input"
              value={form.itemName}
              onChange={update("itemName")}
            />
            <br />
            <strong>SKU:</strong>{" "}
            <input
              type="text"
              id="sku"
              className="item-edit-input"
              value={form.sku}
              onChange={update("sku")}
            />
            <br />
            <strong>Categories:</strong>&nbsp;
            <input
              type="text"
              id="category1"
              className="item-edit-input"
              value={form.category1}
              onChange={update("category1")}
            />{" "}
            &gt;&nbsp;
            <input
              type="text"
              id="category2"
              className="item-edit-input"
              value={form.category2}
              onChange={update("category2")}
            />{" "}
            &gt;&nbsp;
            <input
              type="text"
              id="category3"
              className="item-edit-input"
              value={form.category3}
              onChange={update("category3")}
            />
            <br />
            <strong>Price:</strong> $
            <input
              type="text"
              id="price"
              className="item-edit-input"
              value={form.price}
              onChange={update("price")}
            />
          </div>

          <div className="item-edit-box">
            <strong className="item-edit-label">Logistics</strong>
            <br />
            <strong>Quantity in Stock:</strong>&nbsp;
            <button
              type="button"
              onClick={() => bumpStock(-5)}
              className="item-edit-decrement-stock-button"
            >
              -5
            </button>
            &nbsp;
            <button
              type="button"
              onClick={() => bumpStock(-1)}
              className="item-edit-decrement-stock-button"
            >
              -
            </button>
            &nbsp;
            <input
              type="text"
              id="quantityInStock"
              className="item-edit-input"
              value={form.quantityInStock}
              onChange={update("quantityInStock")}
            />
            &nbsp;
            <button
              type="button"
              onClick={() => bumpStock(1)}
              className="item-edit-increment-stock-button"
            >
              +
            </button>
            &nbsp;
            <button
              type="button"
              onClick={() => bumpStock(5)}
              className="item-edit-increment-stock-button"
            >
              +5
            </button>
            <br />
            <strong>Unit of Measure:</strong>{" "}
            <input
              type="text"
              id="unitOfMeasure"
              className="item-edit-input"
              value={form.unitOfMeasure}
              onChange={update("unitOfMeasure")}
              onBlur={blurNA("unitOfMeasure")}
            />
            <br />
            <strong>Reorder Level:</strong>{" "}
            <input
              type="text"
              id="reorderLevel"
              className="item-edit-input"
              value={form.reorderLevel}
              onChange={update("reorderLevel")}
            />
            <br />
            <strong>Unit Cost:</strong> $
            <input
              type="text"
              id="unitCost"
              className="item-edit-input"
              value={form.unitCost}
              onChange={update("unitCost")}
            />
          </div>

          <div className="item-edit-box">
            <strong className="item-edit-label">Description</strong>
            <br />
            <textarea
              id="description"
              className="item-edit-textarea"
              value={form.description}
              onChange={update("description")}
              onBlur={blurNA("description")}
            />
          </div>

          <div className="item-edit-box">
            <strong className="item-edit-label">Storage</strong>
            <br />
            <strong>Storage Location:</strong>
            <br />
            <textarea
              id="storageLocation"
              className="item-edit-textarea"
              value={form.storageLocation}
              onChange={update("storageLocation")}
              onBlur={blurNA("storageLocation")}
            />
            <br />
            <strong>Storage Conditions:</strong>
            <br />
            <textarea
              id="storageConditions"
              className="item-edit-textarea"
              value={form.storageConditions}
              onChange={update("storageConditions")}
              onBlur={blurNA("storageConditions")}
            />
            <br />
            <strong>Date Acquired:</strong>{" "}
            <input
              type="text"
              id="dateAcquired"
              className="item-edit-input"
              value={form.dateAcquired}
              onChange={update("dateAcquired")}
              onBlur={blurNA("dateAcquired")}
            />
            <br />
            <strong>Expiration Date:</strong>{" "}
            <input
              type="text"
              id="expirationDate"
              className="item-edit-input"
              value={form.expirationDate}
              onChange={update("expirationDate")}
              onBlur={blurNA("expirationDate")}
            />
          </div>

          <div className="item-edit-box">
            <strong className="item-edit-label">Images:</strong>
            <br />

            <div>
              <button
                type="button"
                onClick={uploadImage}
                className="item-edit-upload-image-button"
                aria-label="Upload new image"
              >
                Upload Image
              </button>
              &nbsp;
              <button
                type="button"
                onClick={removeImage}
                className="item-edit-remove-image-button"
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
                      alt={`Image ${i + 1} of ${form.itemName}`}
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

          <div className="staff-dev-back-wrapper">
            <button
              type="button"
              onClick={saveChanges}
              className="staff-dev-pill"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
