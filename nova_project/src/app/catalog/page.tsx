// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a diagnostics panel sourced from the API.

import type React from "react";

import ItemCard from "../components/ItemCard";
import SearchBar from "../components/SearchBar";
import ItemCardSkeleton from "../components/ItemCardSkeleton";
import APIError from "./APIError";
import { prisma } from "@/lib/db"; // direct Prisma test
import Filters from "../components/Filters";

export const dynamic = "force-dynamic";

type Item = {
  id: number | null;
  sku: string | null;
  itemName: string | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  description: string | null;
  price: number | null;
  unitOfMeasure: string | null;
  quantity: number | null;
  imageUrl: string | null;
  quantityInStock: number | null;
};

function groupItemsByCategory(items: Item[]) {
  return Object.entries(
    items.reduce<Record<string, Item[]>>((acc, item) => {
      const key = item.category3?.trim() || "Uncategorized";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {}),
  ).sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB));
}

function renderGroupedTable(entries: [string, Item[]][]) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border-b border-gray-200 px-3 py-2">ID</th>
            <th className="border-b border-gray-200 px-3 py-2">SKU</th>
            <th className="border-b border-gray-200 px-3 py-2">Item Name</th>
            <th className="border-b border-gray-200 px-3 py-2 text-right">
              Price
            </th>
          </tr>
        </thead>
        {entries.map(([category, itemsInCategory]) => (
          <tbody key={category}>
            <tr>
              <th
                scope="colgroup"
                colSpan={4}
                className="bg-gray-200 border-t border-gray-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              >
                {category}
              </th>
            </tr>
            {itemsInCategory.map((it) => (
              <tr key={it.id}>
                <td className="border-t border-gray-200 px-3 py-2">{it.id}</td>
                <td className="border-t border-gray-200 px-3 py-2">
                  {it.sku ?? "N/A"}
                </td>
                <td className="border-t border-gray-200 px-3 py-2">
                  {it.itemName}
                </td>
                <td className="border-t border-gray-200 px-3 py-2 text-right">
                  {it.price !== null ? `$${it.price.toFixed(2)}` : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function DiagnosticsPanel({
  title,
  status,
  entries,
}: {
  title: string;
  status: string;
  entries: [string, Item[]][];
}) {
  return (
    <section className="diagnostics-panel">
      <details className="diagnostics-panel__details">
        <summary className="diagnostics-panel__summary">
          <span className="diagnostics-panel__title">{title}</span>
          <span className="diagnostics-panel__status">{status}</span>
        </summary>
        <div className="diagnostics-panel__content">
          {renderGroupedTable(entries) ?? (
            <p className="text-sm text-gray-600">No items to display.</p>
          )}
        </div>
      </details>
    </section>
  );
}

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  try {
    return new URL(envUrl).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const firstLine = error.message.split("\n")[0]?.trim();
    if (firstLine) {
      return firstLine;
    }
  }
  return fallback;
}

// made async so we can await Prisma queries below
export default async function CatalogPage() {
  // --- API route test block ---
  let apiStatus = "Loading catalog via API...";
  let apiItems: Item[] = [];
  let groupedApiEntries: [string, Item[]][] = [];

  // Page filters
  const page: number | null = null;
  const itemsPerPage: number | null = null;
  const skip =
    page !== null && itemsPerPage !== null ? (page - 1) * itemsPerPage : null;
  const take = itemsPerPage !== null ? itemsPerPage : null;

  // Where filters
  const itemName: string | null = null;

  const minPrice: number | null = null;
  const maxPrice: number | null = null;

  const category: string | null = null; // Used as a generic category
  const category3: string | null = null;
  const category2: string | null = null;
  const category1: string | null = null;

  const description: string | null = null;

  const inStock: boolean | null = null;

  // Order by fields
  const idOrder: "asc" | "desc" | null = null;
  const skuOrder: "asc" | "desc" | null = null;
  const itemNameOrder: "asc" | "desc" | null = null;
  const category3Order: "asc" | "desc" | null = null;
  const category2Order: "asc" | "desc" | null = null;
  const category1Order: "asc" | "desc" | null = null;
  const descriptionOrder: "asc" | "desc" | null = null;
  const priceOrder: "asc" | "desc" | null = null;
  const quantityInStockOrder: "asc" | "desc" | null = null;

  try {
    const result = await prisma.catalogItem.findMany({
      select: {
        id: true,
        sku: true,
        itemName: true,
        //imageUrl: true, // TODO
        category3: true,
        category2: true,
        category1: true,
        description: true,
        price: true,
        quantityInStock: true,
      },
      where: {
        AND: [
          itemName !== null ? { itemName: { contains: itemName } } : {},
          minPrice !== null ? { price: { gte: minPrice } } : {},
          maxPrice !== null ? { price: { lte: maxPrice } } : {},
          category !== null
            ? {
                OR: [
                  { category3: category },
                  { category2: category },
                  { category1: category },
                ],
              }
            : {
                category3: category3 ?? undefined,
                category2: category2 ?? undefined,
                category1: category1 ?? undefined,
              },
          description !== null
            ? { description: { contains: description } }
            : {},
          inStock === null
            ? {}
            : inStock
              ? { quantityInStock: { gt: 0 } }
              : { quantityInStock: { lt: 1 } },
        ],
      },
      orderBy: [
        { id: idOrder ?? undefined },
        { sku: skuOrder ?? undefined },
        { itemName: itemNameOrder ?? undefined },
        { category3: category3Order ?? undefined },
        { category2: category2Order ?? undefined },
        { category1: category1Order ?? undefined },
        { description: descriptionOrder ?? undefined },
        { price: priceOrder ?? undefined },
        { quantityInStock: quantityInStockOrder ?? undefined },
      ],
      skip: skip ?? undefined,
      take: take ?? undefined,
    });

    apiItems = result.map((item) => ({
      id: item.id,
      sku: item.sku,
      itemName: item.itemName,
      imageUrl: null, // TODO
      category3: item.category3,
      category2: item.category2,
      category1: item.category1,
      description: item.description,
      price: item.price === null ? null : Number(item.price),
      unitOfMeasure: null, // TODO
      quantity: null, // TODO
      quantityInStock: item.quantityInStock,
    }));

    apiStatus = `Catalog API reachable. ${result.length} catalog items found.`;
  } catch (err: unknown) {
    const message = getSafeErrorMessage(err, "Unknown error");
    apiStatus = `Catalog API request failed: ${message}`;
  }

  groupedApiEntries = groupItemsByCategory(apiItems);

  // Construct states (empty, error)
  let stateMsg: React.ReactNode = null;

  // Error
  if (apiStatus.startsWith("Catalog API request failed")) {
    stateMsg = (
      <APIError
        title="Failed to load CatalogItem data."
        message="The Catalog API is not reachable."
        apiStatus={apiStatus}
      />
    );
  }

  if (!apiItems.length) {
    return (
      <main className="catalog-grid">
        <p role="status">No items available.</p>

        {/* API route table mirrors the Prisma data but through /api/catalog */}
        <DiagnosticsPanel
          title="Catalog API Status"
          status={apiStatus}
          entries={groupedApiEntries}
        />
      </main>
    );
  }

  return (
    <main aria-label="Catalog Layout">
      {/* HERO search banner directly under the header */}
      <SearchBar bgImage="/hero-lab.jpg" />

      {stateMsg}

      <div className="catalog-three-pane">
        {/* Left Pane */}
        <aside
          id="filters"
          aria-label="Filter panel"
          className="catalog-pane catalog-pane-left"
        >
          <h2 className="pane-title">Filters</h2>
          <Filters />
        </aside>

        {/* Center Pane */}
        <section
          id="catalog"
          aria-label="Catalog items"
          className="catalog-pane catalog-pane-center"
        >
          <h1 style={{ margin: "0 0 1rem 0" }}>Catalog</h1>

          <div className="catalog-grid">
            {apiItems.map((item, index) => (
              <ItemCard key={item.id ?? `item-${index}`} item={item} />
            ))}
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <DiagnosticsPanel
              title="Catalog API Status"
              status={apiStatus}
              entries={groupedApiEntries}
            />
          </div>
        </section>

        {/* Right Pane */}
        <aside
          id="context"
          aria-label="Context panel"
          className="catalog-pane catalog-pane-right"
        >
          <p style={{ margin: 0, opacity: 0.6 }}></p>
        </aside>
      </div>
    </main>
  );
}
