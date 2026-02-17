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

  // Custom price range slider state (UI-only for now)
  const [customMin, setCustomMin] = React.useState<number>(0);
  const [customMax, setCustomMax] = React.useState<number>(500);

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

  // Custom price range slider handlers (UI-only, no backend calls)
  const handleMinChange = (value: number) => {
    // Snap to nearest $5 increment
    const snappedValue = Math.round(value / 5) * 5;
    // Ensure min doesn't exceed max
    setCustomMin(Math.min(snappedValue, customMax - 5));
  };

  const handleMaxChange = (value: number) => {
    // Snap to nearest $5 increment
    const snappedValue = Math.round(value / 5) * 5;
    // Ensure max doesn't go below min
    setCustomMax(Math.max(snappedValue, customMin + 5));
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

      {/* Custom Price Range Slider (UI-only) */}
      <fieldset className="filter-group">
        <legend className="filter-group__legend">Custom Price Range</legend>
        <div className="price-range-slider">
          <div className="price-range-inputs">
            <div className="price-range-input-group">
              <label htmlFor="price-min" className="price-range-label">
                Minimum price
              </label>
              <div className="price-range-value">${customMin}</div>
            </div>
            <input
              id="price-min"
              type="range"
              min="0"
              max="500"
              step="5"
              value={customMin}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="price-range-input"
              aria-label="Minimum price"
              aria-valuemin="0"
              aria-valuemax="500"
              aria-valuenow={customMin}
              aria-valuetext={`$${customMin}`}
            />
          </div>
          <div className="price-range-inputs">
            <div className="price-range-input-group">
              <label htmlFor="price-max" className="price-range-label">
                Maximum price
              </label>
              <div className="price-range-value">${customMax}</div>
            </div>
            <input
              id="price-max"
              type="range"
              min="0"
              max="500"
              step="5"
              value={customMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="price-range-input"
              aria-label="Maximum price"
              aria-valuemin="0"
              aria-valuemax="500"
              aria-valuenow={customMax}
              aria-valuetext={`$${customMax}`}
            />
          </div>
          <div className="price-range-display" aria-live="polite">
            Selected range: <strong>${customMin} - ${customMax}</strong>
          </div>
        </div>
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