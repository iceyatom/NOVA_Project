// src/app/components/Filters.tsx
"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FilterPanelProps = {
  className?: string;
};

const CATEGORIES = ["Equipment", "Chemicals", "Supplies", "Kits"];
const PRICE_BUCKETS = ["Under $50", "$50–$99", "$100–$249", "$250+"];

export default function Filters({ className = "" }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize with current URL parameters
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    searchParams.get("categories") 
      ? searchParams.get("categories")!.split(",").filter(Boolean)
      : [],
  );
  const [selectedPrices, setSelectedPrices] = React.useState<string[]>(
    searchParams.get("prices")
      ? searchParams.get("prices")!.split(",").filter(Boolean)
      : [],
  );

  // Sync URL params to state when they change (e.g., on back button)
  React.useEffect(() => {
    const categories = searchParams.get("categories")
      ? searchParams.get("categories")!.split(",").filter(Boolean)
      : [];
    const prices = searchParams.get("prices")
      ? searchParams.get("prices")!.split(",").filter(Boolean)
      : [];
    
    setSelectedCategories(categories);
    setSelectedPrices(prices);
  }, [searchParams]);

  const buildUrlWithFilters = (categories: string[], prices: string[]) => {
    const params = new URLSearchParams();
    
    // Preserve existing search
    if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
    
    // Add categories if any selected
    if (categories.length > 0) {
      params.set("categories", categories.join(","));
    }
    
    // Add prices if any selected
    if (prices.length > 0) {
      params.set("prices", prices.join(","));
    }
    
    // Preserve pageSize if it exists
    if (searchParams.get("pageSize")) params.set("pageSize", searchParams.get("pageSize")!);
    
    // Reset to page 1 when filters change
    params.set("page", "1");
    
    return params;
  };

  const toggle = (
    val: string,
    list: string[],
    setList: (v: string[]) => void,
    isCategory: boolean = false,
  ) => {
    const newList = list.includes(val)
      ? list.filter((v) => v !== val)
      : [...list, val];
    
    setList(newList);

    // Build updated URL with new filter state
    const updatedCategories = isCategory ? newList : selectedCategories;
    const updatedPrices = isCategory ? selectedPrices : newList;
    
    const params = buildUrlWithFilters(updatedCategories, updatedPrices);

    // Navigate to catalog with updated filters (client-side navigation)
    router.push(`/catalog?${params.toString()}`);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPrices([]);
    
    // Build URL preserving only search term
    const params = new URLSearchParams();
    if (searchParams.get("search")) params.set("search", searchParams.get("search")!);
    if (searchParams.get("pageSize")) params.set("pageSize", searchParams.get("pageSize")!);
    params.set("page", "1");
    
    router.push(`/catalog?${params.toString()}`);
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
                      toggle(cat, selectedCategories, setSelectedCategories, true)
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
                      toggle(p, selectedPrices, setSelectedPrices, false)
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
