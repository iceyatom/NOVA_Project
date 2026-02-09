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
const PRICE_BUCKETS = ["Under $50", "$50–$99", "$100–$249", "$250+"];

export default function Filters({
  className = "",
  selectedCategories: selectedCategoriesProp = [],
  selectedPrices: selectedPricesProp = [],
  onChange,
}: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    selectedCategoriesProp,
  );
  const [selectedPrices, setSelectedPrices] =
    React.useState<string[]>(selectedPricesProp);

  React.useEffect(() => {
    setSelectedCategories(selectedCategoriesProp);
  }, [selectedCategoriesProp]);

  React.useEffect(() => {
    setSelectedPrices(selectedPricesProp);
  }, [selectedPricesProp]);

  const toggleCategory = (val: string) => {
    const next = selectedCategories.includes(val)
      ? selectedCategories.filter((v) => v !== val)
      : [...selectedCategories, val];
    setSelectedCategories(next);
    onChange?.({ categories: next, prices: selectedPrices });
  };

  const selectPrice = (val: string) => {
    const next = [val];
    setSelectedPrices(next);
    onChange?.({ categories: selectedCategories, prices: next });
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPrices([]);
    onChange?.({ categories: [], prices: [] });
  };

  return (
    <section className={`filters ${className}`} aria-label="Catalog filters">
      {/* Categories */}
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Categories</legend>
        <ul className="filter-list">
          {CATEGORIES.map((cat) => {
            const id = `cat-${cat.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
            const checked = selectedCategories.includes(cat);
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
          {PRICE_BUCKETS.map((p) => {
            const id = `price-${p.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
            const checked = selectedPrices[0] === p;
            return (
              <li key={p}>
                <label htmlFor={id} className="filter-row">
                  <input
                    id={id}
                    type="radio"
                    name="price"
                    checked={checked}
                    onChange={() => selectPrice(p)}
                  />
                  <span className="filter-label">{p}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* Active Filters summary */}
      <div className="filters__summary" aria-live="polite" aria-atomic="true">
        <strong>Active Filters:</strong>{" "}
        {selectedCategories.length === 0 && selectedPrices.length === 0
          ? "None"
          : [
              selectedCategories.length
                ? `Category [${selectedCategories.join(", ")}]`
                : null,
              selectedPrices.length
                ? `Price [${selectedPrices.join(", ")}]`
                : null,
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