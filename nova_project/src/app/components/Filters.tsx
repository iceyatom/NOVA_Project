"use client";
import * as React from "react";

type PriceRange = {
  min: number;
  max: number;
};

type FilterPanelProps = {
  className?: string;
  selectedCategories?: string[];
  selectedPriceRange?: PriceRange;
  onChange?: (next: { categories: string[]; priceRange: PriceRange }) => void;
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

const MIN_PRICE = 0;
const MAX_PRICE = 800;
const PRICE_STEP = 5;

function normalizeForCompare(values: string[]) {
  const normalized = values.map((v) => v.trim()).filter(Boolean);
  return Array.from(new Set(normalized)).sort().join("|");
}

export default function Filters({
  className = "",
  selectedCategories: selectedCategoriesProp = [],
  selectedPriceRange: selectedPriceRangeProp = {
    min: MIN_PRICE,
    max: MAX_PRICE,
  },
  onChange,
}: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    selectedCategoriesProp,
  );
  const [customMin, setCustomMin] = React.useState<number>(
    selectedPriceRangeProp.min,
  );
  const [customMax, setCustomMax] = React.useState<number>(
    selectedPriceRangeProp.max,
  );

  React.useEffect(() => {
    setSelectedCategories(selectedCategoriesProp);
  }, [selectedCategoriesProp]);

  React.useEffect(() => {
    setCustomMin(selectedPriceRangeProp.min);
    setCustomMax(selectedPriceRangeProp.max);
  }, [selectedPriceRangeProp]);

  const emitChange = React.useCallback(
    (next: { categories: string[]; priceRange: PriceRange }) => {
      onChange?.(next);
    },
    [onChange],
  );

  const toggleCategory = (val: string) => {
    const next = selectedCategories.includes(val)
      ? selectedCategories.filter((v) => v !== val)
      : [...selectedCategories, val];
    setSelectedCategories(next);
  };

  const clearAll = () => {
    const cleared = {
      categories: [],
      priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    };

    setSelectedCategories([]);
    setCustomMin(MIN_PRICE);
    setCustomMax(MAX_PRICE);
    emitChange(cleared);
  };

  const applyFilters = () => {
    emitChange({
      categories: selectedCategories,
      priceRange: { min: customMin, max: customMax },
    });
  };

  const handleMinChange = (value: number) => {
    const snappedValue = Math.round(value / PRICE_STEP) * PRICE_STEP;
    const nextMin = Math.min(snappedValue, customMax - PRICE_STEP);
    setCustomMin(nextMin);
  };

  const handleMaxChange = (value: number) => {
    const snappedValue = Math.round(value / PRICE_STEP) * PRICE_STEP;
    const nextMax = Math.max(snappedValue, customMin + PRICE_STEP);
    setCustomMax(nextMax);
  };

  const isPriceFilterActive = customMin > MIN_PRICE || customMax < MAX_PRICE;

  const hasPendingChanges =
    normalizeForCompare(selectedCategories) !==
      normalizeForCompare(selectedCategoriesProp) ||
    customMin !== selectedPriceRangeProp.min ||
    customMax !== selectedPriceRangeProp.max;

  return (
    <section className={`filters ${className}`} aria-label="Catalog filters">
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

      <fieldset className="filter-group">
        <legend className="filter-group__legend">Price Range</legend>
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
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={customMin}
              onChange={(e) => handleMinChange(Number(e.target.value))}
              className="price-range-input"
              aria-label="Minimum price"
              aria-valuemin={MIN_PRICE}
              aria-valuemax={MAX_PRICE}
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
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={PRICE_STEP}
              value={customMax}
              onChange={(e) => handleMaxChange(Number(e.target.value))}
              className="price-range-input"
              aria-label="Maximum price"
              aria-valuemin={MIN_PRICE}
              aria-valuemax={MAX_PRICE}
              aria-valuenow={customMax}
              aria-valuetext={`$${customMax}`}
            />
          </div>
          <div className="price-range-display" aria-live="polite">
            Selected range:{" "}
            <strong>
              ${customMin} - ${customMax}
            </strong>
          </div>
        </div>
      </fieldset>

      <div className="filters__summary" aria-live="polite" aria-atomic="true">
        <strong>Active Filters:</strong>{" "}
        {selectedCategories.length === 0 && !isPriceFilterActive
          ? "None"
          : [
              selectedCategories.length
                ? `Category [${selectedCategories.join(", ")}]`
                : null,
              isPriceFilterActive
                ? `Price [$${customMin} - $${customMax}]`
                : null,
            ]
              .filter(Boolean)
              .join("; ")}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="filters__clear"
          onClick={applyFilters}
          disabled={!hasPendingChanges}
          aria-disabled={!hasPendingChanges}
        >
          Apply Filters
        </button>

        <button type="button" className="filters__clear" onClick={clearAll}>
          Clear Filters
        </button>
      </div>
    </section>
  );
}