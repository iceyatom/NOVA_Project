"use client";

import React from "react";
import { useParams } from "next/navigation";

type InventoryItem = {
  id?: number;
  sku?: string | null;
  itemName: string;
  price?: number;
  unitCost?: number;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  description?: string | null;
  quantityInStock?: number;
  unitOfMeasure?: string | null;
  storageLocation?: string | null;
  storageConditions?: string | null;
  expirationDate?: string | null;
  dateAcquired?: string | null;
  reorderLevel?: number;
  createdAt?: string;
  updatedAt?: string;
};

const REQUIRED: Array<keyof InventoryItem> = ["itemName", "sku"];

// ---------- helpers ----------
function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function isBlankString(v: unknown) {
  return toText(v).trim().length === 0;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function toIntOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function toNumberOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function toDateOrNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

function cloneItem<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeForCompare(item: InventoryItem | null) {
  if (!item) return null;

  const money = (v: unknown) => {
    if (v === null || v === undefined || v === "") return "";
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return toText(v).trim();
    return String(round2(n).toFixed(2));
  };

  const intish = (v: unknown) => {
    if (v === null || v === undefined || v === "") return "";
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return toText(v).trim();
    return String(Math.trunc(n));
  };

  const text = (v: unknown) => toText(v).trim();

  return {
    id: item.id ?? "",
    sku: text(item.sku),
    itemName: text(item.itemName),

    price: money(item.price),
    unitCost: money(item.unitCost),

    category1: text(item.category1),
    category2: text(item.category2),
    category3: text(item.category3),

    description: text(item.description),

    quantityInStock: intish(item.quantityInStock),
    reorderLevel: intish(item.reorderLevel),

    unitOfMeasure: text(item.unitOfMeasure),
    storageLocation: text(item.storageLocation),
    storageConditions: text(item.storageConditions),

    expirationDate: text(item.expirationDate),
    dateAcquired: text(item.dateAcquired),
  };
}

function deepEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------- page ----------
export default function StaffInventoryItemPage() {
  const params = useParams<{ id: string }>();
  const idParam = params?.id;

  const [loading, setLoading] = React.useState(true);

  const [committed, setCommitted] = React.useState<InventoryItem | null>(null);
  const [form, setForm] = React.useState<InventoryItem | null>(null);

  React.useEffect(() => {
    const numericId = Number(idParam);
    const mockItem: InventoryItem = {
      id: Number.isFinite(numericId) ? numericId : undefined,
      sku: "SKU-123",
      itemName: "Test Inventory Item",
      price: 6.99,
      unitCost: 4.99,
      category1: "Category A",
      category2: "Category B",
      category3: "Category C",
      description: "This is placeholder data for UI testing.",
      quantityInStock: 25,
      unitOfMeasure: "ea",
      storageLocation: "Shelf A1",
      storageConditions: "Keep dry",
      expirationDate: null,
      dateAcquired: "2026-02-01",
      reorderLevel: 10,
    };

    setCommitted(cloneItem(mockItem));
    setForm(cloneItem(mockItem));
    setLoading(false);
  }, [idParam]);

  const requiredMissing = React.useMemo(() => {
    if (!form) return REQUIRED;
    return REQUIRED.filter((k) => {
      if (k === "itemName" || k === "sku") return isBlankString(form[k]);
      return false;
    });
  }, [form]);

  const isDirty = React.useMemo(() => {
    const a = normalizeForCompare(form);
    const b = normalizeForCompare(committed);
    if (!a || !b) return false;
    return !deepEqual(a, b);
  }, [form, committed]);

  const canSave = !!form && !loading && requiredMissing.length === 0;

  function setField<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function onSave(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!form) return;

    setCommitted(cloneItem(form));
  }

  function onReset() {
    if (!committed) return;
    setForm(cloneItem(committed));
  }

  return (
    <div className="inventory-page">
      <div className="inventory-container">
        {/* Header */}
        <div className="inventory-header">
          <h1 className="inventory-title">
            {form?.itemName?.trim() ? form.itemName : "Inventory Item"}
          </h1>
        </div>

        {/* Loading */}
        {loading && (
          <div className="inventory-card">
            <div className="skeleton-line" />
            <div className="skeleton-grid">
              <div className="skeleton-input" />
              <div className="skeleton-input" />
              <div className="skeleton-input" />
              <div className="skeleton-input" />
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && form && (
          <form id="staff-item-form" onSubmit={onSave} className="inventory-card">
            {/* Identification & Pricing */}
            <Section title="Identification & Pricing">
              <div className="form-grid-2">
                <Field
                  label="Item name"
                  required
                  value={toText(form.itemName)}
                  onChange={(v) => setField("itemName", v)}
                  error={requiredMissing.includes("itemName") ? "Required" : undefined}
                />
                <Field
                  label="SKU"
                  required
                  value={toText(form.sku)}
                  onChange={(v) => setField("sku", v)}
                  error={requiredMissing.includes("sku") ? "Required" : undefined}
                />

                <Field
                  label="Price"
                  inputType="number"
                  step="0.01"
                  min="0"
                  value={form.price === undefined ? "" : String(form.price)}
                  onChange={(v) => setField("price", toNumberOrUndef(v))}
                  onBlur={() =>
                    setField("price", form.price === undefined ? undefined : round2(form.price))
                  }
                />

                <Field
                  label="Unit cost"
                  inputType="number"
                  step="0.01"
                  min="0"
                  value={form.unitCost === undefined ? "" : String(form.unitCost)}
                  onChange={(v) => setField("unitCost", toNumberOrUndef(v))}
                  onBlur={() =>
                    setField("unitCost", form.unitCost === undefined ? undefined : round2(form.unitCost))
                  }
                />
              </div>
            </Section>

            {/* Categories */}
            <Section title="Categories">
              <div className="form-grid-3">
                <Field
                  label="Category 1"
                  value={toText(form.category1)}
                  onChange={(v) => setField("category1", v)}
                />
                <Field
                  label="Category 2"
                  value={toText(form.category2)}
                  onChange={(v) => setField("category2", v)}
                />
                <Field
                  label="Category 3"
                  value={toText(form.category3)}
                  onChange={(v) => setField("category3", v)}
                />
              </div>
            </Section>

            {/* Stock / Storage */}
            <Section title="Stock & Storage">
              <div className="form-grid-2">
                <Field
                  label="Quantity in stock"
                  inputType="number"
                  step="1"
                  min="0"
                  value={form.quantityInStock === undefined ? "" : String(form.quantityInStock)}
                  onChange={(v) => setField("quantityInStock", toIntOrUndef(v))}
                />

                <Field
                  label="Reorder level"
                  inputType="number"
                  step="1"
                  min="0"
                  value={form.reorderLevel === undefined ? "" : String(form.reorderLevel)}
                  onChange={(v) => setField("reorderLevel", toIntOrUndef(v))}
                />

                <Field
                  label="Unit of measure"
                  value={toText(form.unitOfMeasure)}
                  onChange={(v) => setField("unitOfMeasure", v)}
                />

                <Field
                  label="Storage location"
                  value={toText(form.storageLocation)}
                  onChange={(v) => setField("storageLocation", v)}
                />

                <Field
                  label="Storage conditions"
                  value={toText(form.storageConditions)}
                  onChange={(v) => setField("storageConditions", v)}
                />

                <Field
                  label="Expiration date"
                  inputType="date"
                  value={toText(form.expirationDate)}
                  onChange={(v) => setField("expirationDate", toDateOrNull(v))}
                />

                <Field
                  label="Date acquired"
                  inputType="date"
                  value={toText(form.dateAcquired)}
                  onChange={(v) => setField("dateAcquired", toDateOrNull(v))}
                />
              </div>
            </Section>

            {/* Description */}
            <Section title="Description">
              <TextArea
                label="Description"
                value={toText(form.description)}
                onChange={(v) => setField("description", v)}
              />
            </Section>

            <div className="form-actions">
              <button type="button" onClick={onReset} disabled={!isDirty} className="btn btn-secondary">
                Reset
              </button>

              <button type="submit" disabled={!canSave || !isDirty} className="btn btn-primary">
                Save changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-section">
      <div className="section-header">
        <h3 className="section-title">{props.title}</h3>
        <div className="section-rule" />
      </div>
      {props.children}
    </div>
  );
}

function Field(props: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  inputType?: React.HTMLInputTypeAttribute;
  step?: string;
  min?: string;
  onBlur?: () => void;
}) {
  const { label, required, value, onChange, error, hint, inputType, step, min, onBlur } = props;

  return (
    <div className="field">
      <label className="field-label">
        <span>{label}</span>
        {required && <span className="field-required">(required)</span>}
      </label>

      <input
        type={inputType ?? "text"}
        step={step}
        min={min}
        onKeyDown={(e) => {
          if (inputType === "number") {
            if (["e", "E", "+", "-"].includes(e.key)) {
              e.preventDefault();
            }
          }
        }}
        className={`field-input ${error ? "field-input-error" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />

      {error ? (
        <div className="field-error">{error}</div>
      ) : hint ? (
        <div className="field-hint">{hint}</div>
      ) : (
        <div className="field-spacer" />
      )}
    </div>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void }) {
  const { label, value, onChange } = props;
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <textarea className="field-textarea" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="field-spacer" />
    </div>
  );
}