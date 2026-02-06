// src/app/components/Filters.tsx
"use client";
import * as React from "react";

type FilterPanelProps = {
  className?: string;
  selectedCategories?: string[];
  selectedPrices?: string[];
  onChange?: (next: { categories: string[]; prices: string[] }) => void;
};

const CATEGORIES = [
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
const PRICE_BUCKETS = [
  { label: "Under $50", value: "under-50" },
  { label: "$50-$99", value: "50-99" },
  { label: "$100-$249", value: "100-249" },
  { label: "$250+", value: "250-plus" },
];
const PRICE_LABELS = Object.fromEntries(
  PRICE_BUCKETS.map((bucket) => [bucket.value, bucket.label]),
);

export default function Filters({
  className = "",
  selectedCategories,
  selectedPrices,
  onChange,
}: FilterPanelProps) {
  const [internalCategories, setInternalCategories] = React.useState<string[]>(
    [],
  );
  const [internalPrices, setInternalPrices] = React.useState<string[]>([]);

  const categories = selectedCategories ?? internalCategories;
  const prices = selectedPrices ?? internalPrices;

  const updateState = (nextCategories: string[], nextPrices: string[]) => {
    if (selectedCategories === undefined) {
      setInternalCategories(nextCategories);
    }
    if (selectedPrices === undefined) {
      setInternalPrices(nextPrices);
    }
    onChange?.({ categories: nextCategories, prices: nextPrices });
  };

  const toggleCategory = (value: string) => {
    const nextCategories = categories.includes(value)
      ? categories.filter((item) => item !== value)
      : [...categories, value];
    updateState(nextCategories, prices);
  };

  const togglePrice = (value: string) => {
    const nextPrices = prices.includes(value)
      ? prices.filter((item) => item !== value)
      : [...prices, value];
    updateState(categories, nextPrices);
  };

  const clearAll = () => {
    updateState([], []);
  };

  return (
    <section className={`filters ${className}`} aria-label="Catalog filters">
      {/* Categories */}
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Categories</legend>
        <ul className="filter-list">
          {CATEGORIES.map((cat) => {
            const id = `cat-${cat.toLowerCase().replace(/\s+/g, "-")}`;
            const checked = categories.includes(cat);
            return (
              <li key={cat}>
                <label htmlFor={id} className="filter-row">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span className="filter-label">{cat}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* Price */}
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Price</legend>
        <ul className="filter-list">
          {PRICE_BUCKETS.map((bucket) => {
            const id = `price-${bucket.value}`;
            const checked = prices.includes(bucket.value);
            return (
              <li key={bucket.value}>
                <label htmlFor={id} className="filter-row">
                  <input
                    id={id}
                    type="radio"
                    name="price"
                    checked={checked}
                    onChange={() => togglePrice(bucket.value)}
                  />
                  <span className="filter-label">{bucket.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* Active Filters summary */}
      <div className="filters__summary" aria-live="polite" aria-atomic="true">
        <strong>Active Filters:</strong>{" "}
        {categories.length === 0 && prices.length === 0
          ? "None"
          : [
              categories.length ? `Category [${categories.join(", ")}]` : null,
              prices.length
                ? `Price [${prices
                    .map((price) => PRICE_LABELS[price] ?? price)
                    .join(", ")}]`
                : null
            ]
              .filter(Boolean)
              .join("; ")}
      </div>

      <button type="button" className="filters__clear" onClick={clearAll}>
        Clear Filters
      </button>
    </section>
  );
}
