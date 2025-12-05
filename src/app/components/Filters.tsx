// src/app/components/Filters.tsx
"use client";
import * as React from "react";

type FilterPanelProps = {
  className?: string;
};

const CATEGORIES = ["Equipment", "Chemicals", "Supplies", "Kits"];
const PRICE_BUCKETS = ["Under $50", "$50–$99", "$100–$249", "$250+"];

export default function Filters({ className = "" }: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );
  const [selectedPrices, setSelectedPrices] = React.useState<string[]>([]);

  const toggle = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(
      list.includes(val) ? list.filter((v) => v !== val) : [...list, val],
    );
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPrices([]);
  };

  return (
    <section className={`filters ${className}`} aria-label="Catalog filters">
      {/* Categories */}
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Categories</legend>
        <ul className="filter-list">
          {CATEGORIES.map((cat) => {
            const id = `cat-${cat.toLowerCase().replace(/\s+/g, "-")}`;
            const checked = selectedCategories.includes(cat);
            return (
              <li key={cat}>
                <label htmlFor={id} className="filter-row">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggle(cat, selectedCategories, setSelectedCategories)
                    }
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
            const checked = selectedPrices.includes(p);
            return (
              <li key={p}>
                <label htmlFor={id} className="filter-row">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      toggle(p, selectedPrices, setSelectedPrices)
                    }
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
